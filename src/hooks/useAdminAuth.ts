import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '@/lib/adminApi';

interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const session = adminAuthApi.getSession();
      if (!session) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      const adminData = await adminAuthApi.getMe();
      setAdmin(adminData);
    } catch (error) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for admin logout events
    const handleLogout = () => {
      setAdmin(null);
      navigate('/admin/login');
    };

    window.addEventListener('admin:logout', handleLogout);
    return () => window.removeEventListener('admin:logout', handleLogout);
  }, [checkAuth, navigate]);

  const login = async (email: string, password: string) => {
    const result = await adminAuthApi.login(email, password);
    setAdmin(result.admin);
    return result;
  };

  const logout = async () => {
    await adminAuthApi.logout();
    setAdmin(null);
    navigate('/admin/login');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return adminAuthApi.changePassword(currentPassword, newPassword);
  };

  return {
    admin,
    loading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
    isAdmin: admin?.role === 'super_admin' || admin?.role === 'admin',
    isModerator: !!admin,
    login,
    logout,
    changePassword,
    checkAuth
  };
}

// Hook for protecting admin routes
export function useRequireAdmin(redirectTo: string = '/admin/login') {
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [loading, isAuthenticated, navigate, redirectTo]);

  return { admin, loading, isAuthenticated };
}

// Hook for requiring specific roles
export function useRequireRole(
  allowedRoles: ('super_admin' | 'admin' | 'moderator')[],
  redirectTo: string = '/admin/dashboard'
) {
  const { admin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && admin && !allowedRoles.includes(admin.role)) {
      navigate(redirectTo);
    }
  }, [loading, admin, allowedRoles, navigate, redirectTo]);

  return { admin, loading, hasAccess: admin ? allowedRoles.includes(admin.role) : false };
}
