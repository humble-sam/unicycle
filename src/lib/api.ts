// API Client - Replaces Supabase client
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const setStoredUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Base fetch with auth
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  return response;
};

// Auth API
export const authApi = {
  async signUp(data: {
    email: string;
    password: string;
    fullName: string;
    college: string;
    phone?: string;
  }) {
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to sign up');
    }

    setToken(result.accessToken);
    setStoredUser(result.user);

    return result;
  },

  async signIn(email: string, password: string) {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Invalid email or password');
    }

    setToken(result.accessToken);
    setStoredUser(result.user);

    return result;
  },

  async signOut() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  async getUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await apiFetch('/auth/me');
      if (!response.ok) {
        removeToken();
        return null;
      }
      const user = await response.json();
      setStoredUser(user);
      return user;
    } catch {
      return getStoredUser();
    }
  },

  getSession() {
    const token = getToken();
    const user = getStoredUser();
    return token && user ? { user, token } : null;
  },

  isAuthenticated() {
    return !!getToken();
  }
};

// Products API
export const productsApi = {
  async getAll(params?: {
    category?: string;
    college?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    userId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await apiFetch(`/products?${searchParams}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch products');
    }

    return result;
  },

  async getById(id: string) {
    const response = await apiFetch(`/products/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Product not found');
    }

    return result;
  },

  async create(data: {
    title: string;
    description?: string;
    price: number;
    category: string;
    condition: string;
    negotiable?: boolean;
    images?: string[];
    college?: string;
  }) {
    const response = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create product');
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
    images: string[];
    college: string;
    is_active: boolean;
  }>) {
    const response = await apiFetch(`/products/${id}`, {
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
    const response = await apiFetch(`/products/${id}/toggle`, {
      method: 'PATCH',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to toggle product');
    }

    return result;
  },

  async delete(id: string) {
    const response = await apiFetch(`/products/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete product');
    }

    return result;
  },

  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const token = getToken();
    const response = await fetch(`${API_URL}/products/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload images');
    }

    return result.urls;
  }
};

// Profiles API
export const profilesApi = {
  async get(userId: string) {
    const response = await apiFetch(`/profiles/${userId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Profile not found');
    }

    return result;
  },

  async update(data: {
    full_name?: string;
    college?: string;
    phone?: string;
  }) {
    const response = await apiFetch('/profiles', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update profile');
    }

    // Update stored user with new profile data
    const storedUser = getStoredUser();
    if (storedUser) {
      storedUser.profile = { ...storedUser.profile, ...result };
      setStoredUser(storedUser);
    }

    return result;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getToken();
    const response = await fetch(`${API_URL}/profiles/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload avatar');
    }

    return result.avatar_url;
  },

  async deleteAvatar() {
    const response = await apiFetch('/profiles/avatar', {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete avatar');
    }

    return result;
  }
};

// Wishlist API
export const wishlistApi = {
  async getAll() {
    const response = await apiFetch('/wishlist');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch wishlist');
    }

    return result;
  },

  async check(productId: string) {
    const response = await apiFetch(`/wishlist/check/${productId}`);
    const result = await response.json();

    if (!response.ok) {
      return { inWishlist: false };
    }

    return result;
  },

  async add(productId: string) {
    const response = await apiFetch(`/wishlist/${productId}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add to wishlist');
    }

    return result;
  },

  async remove(productId: string) {
    const response = await apiFetch(`/wishlist/${productId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to remove from wishlist');
    }

    return result;
  }
};

// Analytics API
export const analyticsApi = {
  async getDashboard(period?: number) {
    const response = await apiFetch(`/analytics/dashboard?period=${period || 30}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch analytics');
    }

    return result;
  },

  async getUserChart(period?: number) {
    const response = await apiFetch(`/analytics/chart/users?period=${period || 30}`);
    return response.json();
  },

  async getProductChart(period?: number) {
    const response = await apiFetch(`/analytics/chart/products?period=${period || 30}`);
    return response.json();
  },

  async getViewsChart(period?: number) {
    const response = await apiFetch(`/analytics/chart/views?period=${period || 30}`);
    return response.json();
  },

  async track(eventType: string, productId?: string, metadata?: Record<string, any>) {
    await apiFetch('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, product_id: productId, metadata }),
    });
  }
};

// Reports API
export const reportsApi = {
  async reportProduct(productId: string, reason: string, description?: string) {
    const token = getToken();
    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ productId, reason, description }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to report product');
    }

    return result;
  },

  async getMyReports() {
    const response = await apiFetch('/reports');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch reports');
    }

    return result;
  }
};

export default {
  auth: authApi,
  products: productsApi,
  profiles: profilesApi,
  wishlist: wishlistApi,
  analytics: analyticsApi,
};
