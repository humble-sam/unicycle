// Admin API Client - Separate from user API
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Admin token management (separate from user tokens)
const getAdminToken = (): string | null => {
  return localStorage.getItem('admin_access_token');
};

const setAdminToken = (token: string): void => {
  localStorage.setItem('admin_access_token', token);
};

const removeAdminToken = (): void => {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_user');
};

const getStoredAdmin = () => {
  const admin = localStorage.getItem('admin_user');
  return admin ? JSON.parse(admin) : null;
};

const setStoredAdmin = (admin: any) => {
  localStorage.setItem('admin_user', JSON.stringify(admin));
};

// Base fetch with admin auth
const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAdminToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/admin${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAdminToken();
    window.dispatchEvent(new CustomEvent('admin:logout'));
  }

  return response;
};

// Admin Auth API
export const adminAuthApi = {
  async login(email: string, password: string) {
    const response = await adminFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Invalid email or password');
    }

    setAdminToken(result.accessToken);
    setStoredAdmin(result.admin);

    return result;
  },

  async logout() {
    try {
      await adminFetch('/auth/logout', { method: 'POST' });
    } finally {
      removeAdminToken();
    }
  },

  async getMe() {
    const token = getAdminToken();
    if (!token) return null;

    try {
      const response = await adminFetch('/auth/me');
      if (!response.ok) {
        removeAdminToken();
        return null;
      }
      const admin = await response.json();
      setStoredAdmin(admin);
      return admin;
    } catch {
      return getStoredAdmin();
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await adminFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to change password');
    }

    return result;
  },

  getSession() {
    const token = getAdminToken();
    const admin = getStoredAdmin();
    return token && admin ? { admin, token } : null;
  },

  isAuthenticated() {
    return !!getAdminToken();
  }
};

// Dashboard API
export const adminDashboardApi = {
  async getOverview(period: number = 30) {
    const response = await adminFetch(`/dashboard/overview?period=${period}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch dashboard');
    }

    return result;
  },

  async getUsersChart(period: number = 30) {
    const response = await adminFetch(`/dashboard/charts/users?period=${period}`);
    return response.json();
  },

  async getProductsChart(period: number = 30) {
    const response = await adminFetch(`/dashboard/charts/products?period=${period}`);
    return response.json();
  },

  async getCategoriesChart() {
    const response = await adminFetch('/dashboard/charts/categories');
    return response.json();
  },

  async getCollegesChart() {
    const response = await adminFetch('/dashboard/charts/colleges');
    return response.json();
  },

  async getTopProducts(limit: number = 10) {
    const response = await adminFetch(`/dashboard/top-products?limit=${limit}`);
    return response.json();
  },

  async getRecentUsers(limit: number = 10) {
    const response = await adminFetch(`/dashboard/recent-users?limit=${limit}`);
    return response.json();
  },

  async getEngagement(period: number = 30) {
    const response = await adminFetch(`/dashboard/engagement?period=${period}`);
    return response.json();
  },

  async getActivityLogs(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
      if (params.offset !== undefined) searchParams.append('offset', String(params.offset));
    }
    const response = await adminFetch(`/dashboard/activity-logs?${searchParams}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch activity logs');
    }
    return result;
  }
};

// Users API
export const adminUsersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    college?: string;
    status?: string;
    sort?: string;
    order?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/users?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch users');
    }

    return result;
  },

  async getById(id: string) {
    const response = await adminFetch(`/users/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'User not found');
    }

    return result;
  },

  async getProducts(id: string, limit: number = 50, offset: number = 0) {
    const response = await adminFetch(`/users/${id}/products?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async update(id: string, data: { full_name?: string; college?: string; phone?: string }) {
    const response = await adminFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update user');
    }

    return result;
  },

  async suspend(id: string, reason?: string) {
    const response = await adminFetch(`/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to suspend user');
    }

    return result;
  },

  async activate(id: string) {
    const response = await adminFetch(`/users/${id}/activate`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to activate user');
    }

    return result;
  },

  async delete(id: string) {
    const response = await adminFetch(`/users/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete user');
    }

    return result;
  },

  async getColleges() {
    const response = await adminFetch('/users/meta/colleges');
    return response.json();
  }
};

// Products API
export const adminProductsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    order?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/products?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch products');
    }

    return result;
  },

  async getById(id: string) {
    const response = await adminFetch(`/products/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Product not found');
    }

    return result;
  },

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    negotiable: boolean;
    is_active: boolean;
  }>) {
    const response = await adminFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update product');
    }

    return result;
  },

  async toggle(id: string) {
    const response = await adminFetch(`/products/${id}/toggle`, {
      method: 'PATCH',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to toggle product');
    }

    return result;
  },

  async flag(id: string, reason: string) {
    const response = await adminFetch(`/products/${id}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to flag product');
    }

    return result;
  },

  async unflag(id: string) {
    const response = await adminFetch(`/products/${id}/unflag`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to unflag product');
    }

    return result;
  },

  async delete(id: string) {
    const response = await adminFetch(`/products/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete product');
    }

    return result;
  },

  async getCategories() {
    const response = await adminFetch('/products/meta/categories');
    return response.json();
  }
};

// Sellers API
export const adminSellersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    college?: string;
    sort?: string;
    order?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/sellers?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch sellers');
    }

    return result;
  },

  async getById(id: string) {
    const response = await adminFetch(`/sellers/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Seller not found');
    }

    return result;
  },

  async getProducts(id: string, params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/sellers/${id}/products?${searchParams}`);
    return response.json();
  },

  async getMetrics(id: string, period: number = 30) {
    const response = await adminFetch(`/sellers/${id}/metrics?period=${period}`);
    return response.json();
  }
};

// Settings API
export const adminSettingsApi = {
  async getAll() {
    const response = await adminFetch('/settings');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch settings');
    }

    return result;
  },

  async getByKey(key: string) {
    const response = await adminFetch(`/settings/${key}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch setting');
    }

    return result;
  },

  async update(key: string, value: any) {
    const response = await adminFetch(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update setting');
    }

    return result;
  },

  async updateBulk(settings: Array<{ key: string; value: any }>) {
    const response = await adminFetch('/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update settings');
    }

    return result;
  },

  async toggleMaintenanceMode() {
    const response = await adminFetch('/settings/maintenance/toggle', {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to toggle maintenance mode');
    }

    return result;
  },

  async emergencyShutdown() {
    const response = await adminFetch('/settings/emergency/shutdown', {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to activate emergency shutdown');
    }

    return result;
  }
};

// Database API
export const adminDatabaseApi = {
  async getTables() {
    const response = await adminFetch('/database/tables');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch tables');
    }

    return result;
  },

  async getTableSchema(name: string) {
    const response = await adminFetch(`/database/tables/${name}/schema`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch table schema');
    }

    return result;
  },

  async getTableData(name: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/database/tables/${name}?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch table data');
    }

    return result;
  },

  async getStats() {
    const response = await adminFetch('/database/stats');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch database stats');
    }

    return result;
  }
};

// Reports API
export const adminReportsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    reason?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(`/reports?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch reports');
    }

    return result;
  },

  async getById(id: string) {
    const response = await adminFetch(`/reports/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Report not found');
    }

    return result;
  },

  async getStats() {
    const response = await adminFetch('/reports/stats/summary');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch report statistics');
    }

    return result;
  },

  async updateStatus(reportId: string, status: string) {
    const response = await adminFetch(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update report status');
    }

    return result;
  }
};

// Admins API
export const adminAdminsApi = {
  async getAll() {
    const response = await adminFetch('/admins');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch admins');
    }

    return result;
  },

  async getById(id: string) {
    const response = await adminFetch(`/admins/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Admin not found');
    }

    return result;
  },

  async create(data: {
    email: string;
    password: string;
    full_name: string;
    role?: 'super_admin' | 'admin' | 'moderator';
  }) {
    const response = await adminFetch('/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create admin');
    }

    return result;
  },

  async update(id: string, data: {
    full_name?: string;
    role?: 'super_admin' | 'admin' | 'moderator';
    is_active?: boolean;
  }) {
    const response = await adminFetch(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update admin');
    }

    return result;
  },

  async changePassword(id: string, password: string) {
    const response = await adminFetch(`/admins/${id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to change password');
    }

    return result;
  },

  async delete(id: string) {
    const response = await adminFetch(`/admins/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete admin');
    }

    return result;
  }
};

export default {
  auth: adminAuthApi,
  dashboard: adminDashboardApi,
  users: adminUsersApi,
  products: adminProductsApi,
  sellers: adminSellersApi,
  database: adminDatabaseApi,
  settings: adminSettingsApi,
  reports: adminReportsApi,
  admins: adminAdminsApi,
};
