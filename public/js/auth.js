/**
 * Banana Brain — Client Authentication Module
 * Manages virtual identity forms, input verification, and session bootstrap.
 */
import { api } from './api-client.js';
import { showToast, setupNavigation } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  await setupNavigation();
  setupPasswordToggles();

  // Login Form Handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;

      if (!identifier || !password) {
        showToast('Please enter both username/email and password', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      try {
        const res = await api.post('/api/auth/login', { identifier, password });
        showToast(`Welcome back, ${res.user.displayName || res.user.username}!`, 'success');
        setTimeout(() => {
          window.location.href = '/game.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    });
  }

  // Register Form Handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const displayName = document.getElementById('displayName').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const avatarColor = document.querySelector('input[name="avatarColor"]:checked')?.value || '#F59E0B';

      // Validation
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (password.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Virtual Identity...';

      try {
        const res = await api.post('/api/auth/register', {
          username,
          email,
          displayName,
          password,
          confirmPassword,
          avatarColor
        });

        showToast(`Identity created! Welcome, ${res.user.displayName}!`, 'success');
        setTimeout(() => {
          window.location.href = '/game.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });
}
