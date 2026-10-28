/**
 * Banana Brain — UI Utilities & Notification Component
 */
import { eventBus, CLIENT_EVENTS } from './event-bus.js';
import { api } from './api-client.js';

let toastContainer = null;

export function showToast(message, type = 'info', duration = 4000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem;">${iconMap[type] || 'ℹ'}</span>
    <span style="flex: 1;">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutRight 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Global Toast Listener via Event Bus
eventBus.on(CLIENT_EVENTS.TOAST_TRIGGERED, ({ message, type }) => {
  showToast(message, type);
});

/**
 * Initializes and syncs Navbar authentication state across all pages.
 */
export async function setupNavigation() {
  const navAuthContainer = document.getElementById('navAuthContainer');
  if (!navAuthContainer) return;

  try {
    const res = await api.get('/api/auth/me');
    if (res.success && res.user) {
      const user = res.user;
      navAuthContainer.innerHTML = `
        <a href="/profile.html" class="nav-user-badge" id="navProfileLink">
          <div class="avatar" style="background-color: ${user.avatar_color || user.avatarColor || '#F59E0B'};">
            ${(user.displayName || user.username).substring(0, 2).toUpperCase()}
          </div>
          <span style="font-weight: 600;">${escapeHtml(user.displayName || user.username)}</span>
        </a>
        <button id="navLogoutBtn" class="btn btn-secondary btn-sm">Log Out</button>
      `;

      document.getElementById('navLogoutBtn')?.addEventListener('click', async () => {
        try {
          await api.post('/api/auth/logout');
          showToast('Logged out successfully', 'info');
          setTimeout(() => window.location.href = '/login.html', 500);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
      return user;
    }
  } catch (err) {
    // Unauthenticated user state
    navAuthContainer.innerHTML = `
      <a href="/login.html" class="btn btn-secondary btn-sm" id="navLoginBtn">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm" id="navRegisterBtn">Register</a>
    `;
  }
  return null;
}
