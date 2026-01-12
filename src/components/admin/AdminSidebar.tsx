import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Database,
  LogOut,
  Shield,
  ChevronRight,
  Settings,
  FileText,
  Flag,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminAuthApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Sellers', href: '/admin/sellers', icon: Store },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: FileText },
  { name: 'Admins', href: '/admin/admins', icon: UserCog, role: 'super_admin' },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Database', href: '/admin/database', icon: Database, role: 'super_admin' },
];

export function AdminSidebar() {
  const location = useLocation();
  const admin = adminAuthApi.getSession()?.admin;

  const handleLogout = async () => {
    await adminAuthApi.logout();
    window.dispatchEvent(new CustomEvent('admin:logout'));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">UniCycle</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          // Hide database link for non-super_admin
          if (item.role === 'super_admin' && admin?.role !== 'super_admin') {
            return null;
          }

          const isActive = location.pathname === item.href ||
            (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-emerald-600 text-white">
              {admin?.fullName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.fullName || 'Admin'}</p>
            <Badge variant="outline" className={cn('text-xs', getRoleBadgeColor(admin?.role || 'admin'))}>
              {formatRole(admin?.role || 'admin')}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full mt-3 justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
