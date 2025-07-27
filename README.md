# PickMi-Backend Web App API Specification

This document defines the API contract between the frontend (HTML/CSS/JS) and the backend (Node.js/Express) for the anonymous note-throwing web application PickMi.

---

### General Best Practices

- **Base URL**: All API routes should be prefixed, for example: `/api`.
- **Authentication**: After a user signs in, the backend will provide a JSON Web Token (JWT). The frontend must send this JWT in the `Authorization` header for all protected requests (like creating or viewing notes).
  - **Header Format**: `Authorization: Bearer <your_jwt_here>`
  - **Role-Based Access**: The JWT also includes a `role` field, which can be `"user"` or `"admin"`. Some routes require an admin role; attempting to access them as a regular user will result in a `403 Forbidden error`.
- **Standard Error Response**: Use a consistent error format for all failed requests. This helps the frontend handle errors gracefully.
  [View domain error definitions](./src/Shared/Errors.ts)
  **EXAMPLE**:

    ```json
    {
        "error": {
            "type": "VALIDATION_ERROR",
            "message": "Validation failed",
            "details": [
                { "path": "email", "message": "Invalid email format" },
                { "path": "password", "message": "Password too weak" }
            ]
        }
    }
    ```

    | Error Type                | HTTP Code | Class                        | Typical Use                                |
    | ------------------------- | --------- | ---------------------------- | ------------------------------------------ |
    | `VALIDATION_ERROR`        | 400       | `ValidationError`            | Invalid input (e.g., from Zod)             |
    | `AUTHENTICATION_ERROR`    | 401       | `AuthenticationError`        | Missing or bad JWT                         |
    | `FORBIDDEN_ERROR`         | 403       | `ForbiddenError`             | Unauthorized action (e.g., wrong location) |
    | `NOT_FOUND`               | 404       | `NotFoundError`              | Missing notes, users, etc.                 |
    | `CONFLICT_ERROR`          | 409       | `ConflictError`              | Resource already exists                    |
    | `BUSINESS_RULE_VIOLATION` | 422       | `BusinessRuleViolationError` | Domain logic failures (e.g. duplicates)    |
    | `REPOSITORY_ERROR`        | 500       | `RepositoryError`            | Database/persistence failures              |
    | `UNEXPECTED_ERROR`        | 500       | `UnexpectedError`            | Server or uncaught issues                  |

    **FORMAT**:

    ```json
    {
        "error": {
            "type": "VALIDATION_ERROR", // One of: NOT_FOUND, VALIDATION_ERROR, AUTHENTICATION_ERROR, FORBIDDEN_ERROR, CONFLICT_ERROR, BUSINESS_RULE_VIOLATION, REPOSITORY_ERROR, UNEXPECTED_ERROR
            "message": "A human-readable summary",
            "details": {} // Optional field depending on error type
        }
    }
    ```

- **Authentication**: For every place where authentication is required, note that an authentication error may be thrown.
- **Data Format**: All request and response bodies should be in `JSON` format.

---

## 🔐 Authentication Endpoints

These endpoints handle user sign-up, sign-in, and password recovery.

### 1. User Sign Up

- **Endpoint**: `POST /api/auth/signup`
- **Description**: Creates a new user account.
- **Request Body**:

    ```json
    {
        "email": "user@example.com",
        "password": "A_Strong_Password123!"
    }
    ```

- **Success Response** (`201 Created`):

    ```json
    {
        "message": "User created successfully. Please sign in."
    }
    ```

- **Error Responses**:
  - `409 Conflict`: If the email address is already in use. -> BusinessRuleViolationError

                                ```json
                                {
                                    "error": {
                                        "type": "BUSINESS_RULE_VIOLATION",
                                        "message": "Email already exists."
                                    }
                                }
                                ```

  - `400 Bad Request`: If the email is invalid or the password doesn't meet strength requirements. -> ValidationError

### 2. User Sign In

- **Endpoint**: `POST /api/auth/signin`
- **Description**: Authenticates a user and returns a JWT.
- **Request Body**:

    ```json
    {
        "email": "user@example.com",
        "password": "user_password"
    }
    ```

- **Success Response** (`200 OK`):

    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

- **Error Response** (`401 Unauthorized`) -> AuthenticationError
  - For incorrect email or password.

                                ```json
                                {
                                    "error": {
                                        "type": "AUTHENTICATION_ERROR",
                                        "message": "Invalid credentials."
                                    }
                                }
                                ```

### 3. Forgot Password

- **Endpoint**: `POST /api/auth/forgot-password`
- **Description**: Initiates the password reset process by sending an email.
- **Request Body**:

    ```json
    {
        "email": "user@example.com"
    }
    ```

- **Success Response** (`200 OK`):
  - Confirms the email was sent.

                            ```json
                            {
                                "message": "If an account with that email exists, a password reset link has been sent."
                            }
                            ```

### 4. Reset Password

- **Endpoint**: `POST /api/auth/reset-password`
- **Description**: Sets a new password using a token from the reset email.
- **Request Body**:

    ```json
    {
        "token": "the_unique_reset_token_from_email_link",
        "newPassword": "MyNewSecurePassword123!"
    }
    ```

- **Success Response** (`200 OK`):

    ```json
    {
        "message": "Password has been reset successfully. Please sign in."
    }
    ```

- **Error Response** (`400 Bad Request`):
  - If the token is invalid/expired or the new password is too weak. -> ValidationError

                                ```json
                                {
                                    "error": {
                                        "type": "VALIDATION_ERROR",
                                        "message": "Invalid token or weak password."
                                    }
                                }
                                ```

### 5. Delete Account

- **Endpoint**: `DELETE /api/auth/me`
- **Description**: Permanently deletes the authenticated user's account and all their associated data. For security, this action requires the user to re-enter their current password.
- **Authentication**: **Required**. The backend identifies the user to be deleted via their JWT.
- **Request Body**:

    ```json
    {
        "password": "user_current_password"
    }
    ```

- **Success Response** (`200 OK`):

    ```json
    {
        "message": "Account deleted successfully."
    }
    ```

- **Error Response** (`401 Unauthorized`) -> AuthenticationError
  - Returned if the provided password does not match the one on record for the user, or if the JWT is invalid/expired.

                            ```json
                            {
                                "error": {
                                    "type": "AUTHENTICATION_ERROR",
                                    "message": "Invalid password."
                                }
                            }
                            ```

---

## 📝 Note & Location Endpoints

These endpoints are for the core functionality of the app.

### 1. Throw a Note

- **Endpoint**: `POST /api/notes`
- **Description**: Creates a new note, but only if the user is physically at the specified location.
- **Authentication**: **Required**.
- **Request Body**:

    ```json
    {
        "content": {
            "text": "Never gonna give you up...",
            "drawingData": "/* SVG data, base64 image, or another format */"
        },
        "location": {
            "latitude": 40.7128,
            "longitude": -74.006,
            "placeId": "ChIJ..."
        }
    }
    ```

- **Success Response** (`201 Created`):

    ```json
    {
        "id": "mongo_object_id_123",
        "message": "Note thrown successfully!"
    }
    ```

- **Error Responses**:
  - `401 Unauthorized` Returned if the provided password does not match the one on record for the user, or if the JWT is invalid/expired -> AuthenticationError

                                ```json
                                {
                                    "error": {
                                        "type": "AUTHENTICATION_ERROR",
                                        "message": "Invalid password."
                                    }
                                }
                                ```

  - `403 Forbidden`: If the user's coordinates are too far from the `placeId` location -> ForbiddenError

                                ```json
                                {
                                    "error": {
                                        "type": "FORBIDDEN_ERROR",
                                        "message": "You are not at this location."
                                    }
                                }
                                ```

  - `400 Bad Request`: If content is missing or location data is invalid -> ValidationError

                                ```json
                                {
                                    "error": {
                                        "type": "VALIDATION_ERROR",
                                        "message": "Invalid note data.",
                                        "details": [
                                            { "path": "content.text", "message": "Text is required." },
                                            { "path": "location", "message": "Invalid coordinates." }
                                        ]
                                    }
                                }
                                ```

### 2. Get Nearby Notes (for the Map)

- **Endpoint**: `GET /api/notes/nearby`
- **Description**: Fetches the locations of all notes within a certain radius of the user.
- **Authentication**: **Required**.
- **Query Parameters**:
  - `lat`: User's current latitude.
  - `lon`: User's current longitude.
  - `radius`: (Optional) Search radius in meters.
  - **Example**: `/api/notes/nearby?lat=40.7128&lon=-74.0060&radius=5000`
- **Success Response** (`200 OK`):
  - Returns a lightweight array of note locations for map display.

                            ```json
                            [
                                {
                                    "id": "mongo_object_id_123",
                                    "location": { "lat": 40.7129, "lon": -74.0061 }
                                },
                                {
                                    "id": "mongo_object_id_456",
                                    "location": { "lat": 40.7135, "lon": -74.0055 }
                                }
                            ]
                            ```

- **Error Responses**:
  - `401 Unauthorized` Returned if the provided password does not match the one on record for the user, or if the JWT is invalid/expired -> AuthenticationError

                                ```json
                                {
                                    "error": {
                                        "type": "AUTHENTICATION_ERROR",
                                        "message": "Invalid password."
                                    }
                                }
                                ```

### 3. Get a Specific Note's Content

- **Endpoint**: `GET /api/notes/:id`
- **Description**: Retrieves the full content of a single note. The user must be within 1000 meters of the note's location to access it.
- **Authentication**: **Required**.
- **Request Parameters**:
  - `:id`: The ID of the note.
- **Query Parameters**:
  - `lat`: User's current latitude (required).
  - `lon`: User's current longitude (required).
  - **Example**: `/api/notes/mongo_object_id_123?lat=40.7128&lon=-74.0060`
- **Success Response** (`200 OK`):

    ```json
    {
        "id": "mongo_object_id_123",
        "title": "Rock Ashley",
        "content": {
            "text": "Never gonna give you up...",
            "drawingData": "/* SVG data... */"
        }
    }
    ```

- **Error Response**
  - `404 Not Found` -> NotFoundError

                            ```json
                            {
                                "error": {
                                    "type": "NOT_FOUND",
                                    "message": "Note not found."
                                }
                            }
                            ```

  - `401 Unauthorized` Returned if the provided password does not match the one on record for the user, or if the JWT is invalid/expired -> AuthenticationError

                                ```json
                                {
                                    "error": {
                                        "type": "AUTHENTICATION_ERROR",
                                        "message": "Invalid password."
                                    }
                                }
                                ```

### 4. Delete a Note

- **Endpoint**: `DELETE /api/notes/:id`
- **Description**: Deletes a specific note. The user must be within 100 meters of the note's location to delete it.
- **Authentication**: **Required**.
- **Request Parameters**:
  - `:id`: The ID of the note.
- **Request Body**:

    ```json
    {
        "latitude": 40.7128,
        "longitude": -74.006
    }
    ```

- **Success Response** (`200 OK`):

    ```json
    {
        "message": "Note deleted successfully."
    }
    ```

- **Error Responses**:
  - `422 Unprocessable Entity` → BusinessRuleViolationError

                            ```json
                            {
                                "error": {
                                    "type": "BUSINESS_RULE_VIOLATION",
                                    "message": "You must be at the note location to delete it."
                                }
                            }
                            ```

  - `401 Unauthorized` Returned if the JWT is invalid/expired → AuthenticationError

                                ```json
                                {
                                    "error": {
                                        "type": "AUTHENTICATION_ERROR",
                                        "message": "Authentication required."
                                    }
                                }
                                ```

---

## 📝 Admin Endpoints

### 1. Get All Users

- **Endpoint**: `GET /api/admin/users`
- **Description**: Retrieves a list of all registered users.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- **Success Response** (`200 OK`):

    ```json
    [
        {
            "id": "user123",
            "email": "user@example.com",
            "role": "user"
        },
        {
            "id": "user456",
            "email": "another@example.com",
            "role": "admin"
        }
    ]
    ```

- **Error Response**: If attempted by a non-admin. 403 Forbidden → ForbiddenError

    ```json
    {
        "error": {
            "type": "FORBIDDEN_ERROR",
            "message": "Admin access required."
        }
    }
    ```

### 2. Get All notes

- **Endpoint**: `GET /api/admin/notes`
- **Description**: Retrieves all notes in the system regardless of location or ownership.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- **Success Response** (`200 OK`):

    ```json
    [
        {
            "id": "mongo_object_id_123",
            "userId": "user123",
            "content": {
                "text": "Admin can see this.",
                "drawingData": null
            },
            "location": {
                "latitude": 40.7128,
                "longitude": -74.006,
                "placeId": "ChIJ..."
            }
        }
    ]
    ```

- **Error Response**: If attempted by a non-admin. 403 Forbidden → ForbiddenError

    ```json
    {
        "error": {
            "type": "FORBIDDEN_ERROR",
            "message": "Admin access required."
        }
    }
    ```

### 2. Get a Specific User's Info

- **Endpoint**: `GET /api/admin/users/:id`
- **Description**: Retrieves basic information about a specific user.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- Request Parameter: -`:id`: The ID of the user.
- **Success Response** (`200 OK`):

    ```json
    {
        "id": "user123",
        "email": "user@example.com",
        "role": "user"
    }
    ```

- **Error Response**:
- If the user ID does not exist. (`404 Not Found`) -> NotFoundError

    ```json
    {
        "error": {
            "type": "NOT_FOUND",
            "message": "User not found."
        }
    }
    ```

- If attempted by a non-admin. (`403 Forbidden`) → ForbiddenError

    ```json
    {
        "error": {
            "type": "FORBIDDEN_ERROR",
            "message": "Admin access required."
        }
    }
    ```

### 3. Get a Specific Note's Info

- **Endpoint**: `GET /api/admin/notes/:id`
- **Description**: Retrieves the content of a specific note by ID.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- **Request Parameter**:
  - `:id`: The ID of the note.
- **Success Response** (`200 OK`):

    ```json
    {
        "id": "mongo_object_id_123",
        "content": {
            "text": "This is the note content",
            "drawingData": null
        }
    }
    ```

- **Error Response**:
  - If the note ID does not exist. (`404 Not Found`) → NotFoundError

                    ```json
                    {
                        "error": {
                            "type": "NOT_FOUND",
                            "message": "Note not found."
                        }
                    }
                    ```

  - If attempted by a non-admin. (`403 Forbidden`) → ForbiddenError

                    ```json
                    {
                        "error": {
                            "type": "FORBIDDEN_ERROR",
                            "message": "Admin access required."
                        }
                    }
                    ```

### 4. View a User's Notes

- **Endpoint**: `GET /api/admin/users/:id/notes`
- **Description**: Retrieves all notes thrown by a specific user.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- Request Parameter: -`:id`: The ID of the user.
- **Success Response** (`200 OK`):

    ```json
    [
        {
            "id": "note123",
            "content": {
                "text": "This user's note",
                "drawingData": null
            },
            "location": {
                "latitude": 40.7128,
                "longitude": -74.006
            }
        }
    ]
    ```

- **Error Response**:
- If the user ID or their notes do not exist. (`404 Not Found`) -> NotFoundError

    ```json
    {
        "error": {
            "type": "NOT_FOUND",
            "message": "User not found."
        }
    }
    ```

- If attempted by a non-admin. (`403 Forbidden`) → ForbiddenError

    ```json
    {
        "error": {
            "type": "FORBIDDEN_ERROR",
            "message": "Admin access required."
        }
    }
    ```

### 5. Delete a User

- **Endpoint**: `DELETE /api/admin/users/:id`
- **Description**: Permanently deletes the specified user and all associated notes.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- Request Parameter: -`:id`: The ID of the user.
- **Success Response** (`200 OK`):

    ```json
    {
        "message": "User and all associated data deleted successfully."
    }
    ```

- **Error Response**:
- If the user ID does not exist. (`404 Not Found`) -> NotFoundError

    ```json
    {
        "error": {
            "type": "NOT_FOUND",
            "message": "User not found."
        }
    }
    ```

- If attempted by a non-admin. (`403 Forbidden`) → ForbiddenError

    ```json
    {
        "error": {
            "type": "FORBIDDEN_ERROR",
            "message": "Admin access required."
        }
    }
    ```

### 6. Delete a Note

- **Endpoint**: `DELETE /api/admin/notes/:id`
- **Description**: Deletes a specific note, regardless of who created it.
- **Authentication**: **Required**. Must have role: "admin" in JWT.
- **Request Parameter**:
  - `:id`: The ID of the note.
- **Success Response** (`200 OK`):

    ```json
    {
        "message": "Note deleted successfully."
    }
    ```

- **Error Response**:
  - If the note ID does not exist. (`404 Not Found`) → NotFoundError

                    ```json
                    {
                        "error": {
                            "type": "NOT_FOUND",
                            "message": "Note not found."
                        }
                    }
                    ```

  - If attempted by a non-admin. (`403 Forbidden`) → ForbiddenError

                    ```json
                    {
                        "error": {
                            "type": "FORBIDDEN_ERROR",
                            "message": "Admin access required."
                        }
                    }
                    ```
