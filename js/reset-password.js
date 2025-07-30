import { resetPassword } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const resetPasswordForm = document.getElementById('reset-password-form');

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('reset-password-input').value;
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      const errorElement = document.getElementById('reset-error');
      const successElement = document.getElementById('reset-success');

      errorElement.classList.add('hidden');
      successElement.classList.add('hidden');

      if (!token) {
        errorElement.textContent = 'Invalid reset link.';
        errorElement.classList.remove('hidden');
        return;
      }

      try {
        await resetPassword(token, password);
        successElement.textContent = 'Password reset successfully!';
        successElement.classList.remove('hidden');
        resetPasswordForm.reset();
      } catch (error) {
        errorElement.textContent = error.message;
        errorElement.classList.remove('hidden');
      }
    });
  }
});
