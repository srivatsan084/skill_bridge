/**
 * SkillBridge Central API Service
 * Connects frontend React components to Express.js backend & MongoDB
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal JSON fetch helper with HttpOnly cookie support
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include', // Crucial for HttpOnly cookies
    headers: {
      ...(options.headers || {})
    }
  };

  // Only set Content-Type to JSON if not sending FormData
  if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network or server offline error
    const netErr = new Error(
      'Unable to connect to SkillBridge server. Please ensure the backend is running on http://localhost:5000'
    );
    netErr.status = 0;
    throw netErr;
  }
}

export const apiService = {
  // Authentication Endpoints
  auth: {
    async register(userData) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async login(credentials) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },

    async logout() {
      return request('/auth/logout', {
        method: 'POST'
      });
    },

    async getMe() {
      return request('/auth/me', {
        method: 'GET'
      });
    }
  },

  // Student Profile Endpoints
  profile: {
    async get() {
      return request('/profile', {
        method: 'GET'
      });
    },

    async update(profileData) {
      return request('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    },

    async getStatus() {
      return request('/profile/status', {
        method: 'GET'
      });
    }
  },

  // Resume Management Endpoints
  resume: {
    async upload(file, targetRole) {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetRole', targetRole);

      return request('/resume/upload', {
        method: 'POST',
        body: formData
      });
    },

    async getAll() {
      return request('/resume', {
        method: 'GET'
      });
    },

    async getById(id) {
      return request(`/resume/${id}`, {
        method: 'GET'
      });
    },

    async delete(id) {
      return request(`/resume/${id}`, {
        method: 'DELETE'
      });
    },

    async extractSkills(id) {
      return request(`/resume/${id}/extract-skills`, {
        method: 'POST'
      });
    },

    async analyzeGap(id, targetRole) {
      return request(`/resume/${id}/analyze-gap`, {
        method: 'POST',
        body: targetRole ? JSON.stringify({ targetRole }) : undefined
      });
    },

    async rewrite(id, targetRole) {
      return request(`/resume/${id}/rewrite`, {
        method: 'POST',
        body: targetRole ? JSON.stringify({ targetRole }) : undefined
      });
    }
  },

  // Industry Skills Intelligence Endpoints
  industry: {
    async getRoles() {
      return request('/industry/roles', {
        method: 'GET'
      });
    },

    async getRoleSkills(role) {
      return request(`/industry/roles/${encodeURIComponent(role)}/skills`, {
        method: 'GET'
      });
    }
  }
};

export default apiService;
