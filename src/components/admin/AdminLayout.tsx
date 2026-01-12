import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { adminAuthApi } from '@/lib/adminApi';
import { AdminSidebar } from './AdminSidebar';
import { Toaster } from '@/components/ui/sonner';

export function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is authenticated
    if (!adminAuthApi.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    // Listen for logout events
    const handleLogout = () => {
      navigate('/admin/login');
    };

    window.addEventListener('admin:logout', handleLogout);
    return () => window.removeEventListener('admin:logout', handleLogout);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
