async function fetchAllUsersAdmin() {
  const token = localStorage.getItem("jwt");
  const res = await fetch(API_BASE + "/api/admin/users", {
    headers: { "Authorization": "Bearer " + token }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to fetch users");
  }
  return res.json();
}


async function fetchAllUsersAdmin() {
  const token = localStorage.getItem("jwt");
  const res = await fetch(API_BASE + "/api/admin/users", {
    headers: { "Authorization": "Bearer " + token }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to fetch users");
  }
  return res.json();
}
