/**
 * Banana Brain — API Client
 * Centralized Fetch wrapper managing sessions, automatic CSRF token acquisition, and error handling.
 */
import { eventBus, CLIENT_EVENTS } from './event-bus.js';

class ApiClient {
  constructor() {
    this.csrfToken = null;
  }

  async fetchCsrfToken() {
    try {
      const res = await fetch('/api/csrf-token', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
      }
    } catch (err) {
      console.warn('Failed to fetch initial CSRF token:', err);
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Attach CSRF token on mutating requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      if (!this.csrfToken) {
        await this.fetchCsrfToken();
      }
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }
    }

    const config = {
      ...options,
      method,
      headers,
      credentials: 'same-origin' // Ensures HttpOnly session cookies are transmitted
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(endpoint, config);

    // Parse JSON safely
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `HTTP error ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;

      // Handle unauthenticated session expiry
      if (response.status === 401 && !endpoint.includes('/api/auth/me')) {
        eventBus.emit(CLIENT_EVENTS.AUTH_STATE_CHANGED, null);
      }

      throw error;
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
