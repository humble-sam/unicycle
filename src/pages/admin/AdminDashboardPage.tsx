import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, Store, Eye, Heart, DollarSign,
  AlertTriangle, Ban, TrendingUp, ArrowRight, Settings, Wrench
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { adminDashboardApi, adminSettingsApi } from '@/lib/adminApi';
import { StatCard, MetricCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [usersChart, setUsersChart] = useState<any[]>([]);
  const [productsChart, setProductsChart] = useState<any[]>([]);
  const [categoriesChart, setCategoriesChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [overviewData, usersData, productsData, categoriesData, topProductsData, recentUsersData, engagementData, settingsData] = await Promise.all([
        adminDashboardApi.getOverview(period),
        adminDashboardApi.getUsersChart(period),
        adminDashboardApi.getProductsChart(period),
        adminDashboardApi.getCategoriesChart(),
        adminDashboardApi.getTopProducts(5),
        adminDashboardApi.getRecentUsers(5),
        adminDashboardApi.getEngagement(period),
        adminSettingsApi.getAll().catch(() => ({ settings: {} }))
      ]);

      setOverview(overviewData);
      setUsersChart(usersData);
      setProductsChart(productsData);
      setCategoriesChart(categoriesData);
      setTopProducts(topProductsData);
      setRecentUsers(recentUsersData);
      setEngagement(engagementData);
      
      // Extract system status from settings
      if (settingsData.settings) {
        const system = settingsData.settings.system || [];
        const features = settingsData.settings.features || [];
        setSystemStatus({
          maintenanceMode: system.find((s: any) => s.key === 'maintenance_mode')?.value || false,
          apiEnabled: system.find((s: any) => s.key === 'api_enabled')?.value !== false,
          registrationEnabled: features.find((s: any) => s.key === 'registration_enabled')?.value !== false,
          loginEnabled: features.find((s: any) => s.key === 'login_enabled')?.value !== false,
          productCreationEnabled: features.find((s: any) => s.key === 'product_creation_enabled')?.value !== false,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your marketplace</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Tabs value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
            <TabsList>
              <TabsTrigger value="7">7 days</TabsTrigger>
              <TabsTrigger value="30">30 days</TabsTrigger>
              <TabsTrigger value="90">90 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* System Status Widget */}
      {systemStatus && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-sm">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.apiEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">API</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.registrationEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">Registration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.loginEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">Login</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.productCreationEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">Products</span>
              </div>
              <Link to="/admin/settings" className="text-sm text-primary hover:underline flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {systemStatus.maintenanceMode && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Maintenance Mode Active</AlertTitle>
                <AlertDescription>
                  The website is currently in maintenance mode. All public access is disabled.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview?.summary?.totalUsers || 0}
          icon={Users}
          trend={overview?.growth?.usersChange}
          trendLabel={`vs prev ${period}d`}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Total Products"
          value={overview?.summary?.totalProducts || 0}
          icon={Package}
          trend={overview?.growth?.productsChange}
          trendLabel={`vs prev ${period}d`}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
        />
        <StatCard
          title="Active Sellers"
          value={overview?.summary?.totalSellers || 0}
          icon={Store}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Total Views"
          value={overview?.summary?.totalViews || 0}
          icon={Eye}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        <StatCard
          title="Wishlist Items"
          value={overview?.summary?.totalWishlist || 0}
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
        />
        <StatCard
          title="Revenue Potential"
          value={formatCurrency(overview?.summary?.revenuePotential || 0)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Suspended Users"
          value={overview?.summary?.suspendedUsers || 0}
          icon={Ban}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatCard
          title="Flagged Products"
          value={overview?.summary?.flaggedProducts || 0}
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value as string)}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Products</CardTitle>
            <CardDescription>Products listed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value as string)}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Engagement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
            <CardDescription>Product distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesChart}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoriesChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Engagement Metrics</CardTitle>
            <CardDescription>User activity and engagement statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Active Users"
                value={engagement?.activeUsers || 0}
                subtext={`${engagement?.activeUserRate || 0}% of total`}
              />
              <MetricCard
                label="Seller Conversion"
                value={`${engagement?.conversionRate || 0}%`}
                subtext="Users who sell"
              />
              <MetricCard
                label="Avg Products/Seller"
                value={(engagement?.avgProductsPerSeller || 0).toFixed(1)}
              />
              <MetricCard
                label="Avg Views/Product"
                value={(engagement?.avgViewsPerProduct || 0).toFixed(1)}
              />
              <MetricCard
                label="Wishlist Rate"
                value={`${engagement?.wishlistRate || 0}%`}
                subtext="Products wishlisted"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Top Products</CardTitle>
              <CardDescription>Most viewed products</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/products">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-400 w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{product.category}</span>
                      <span>·</span>
                      <span>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.view_count.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">No products yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Users</CardTitle>
              <CardDescription>Latest registrations</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    {user.is_suspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : user.products_count > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {user.products_count} products
                      </Badge>
                    ) : (
                      <Badge variant="secondary">New user</Badge>
                    )}
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
