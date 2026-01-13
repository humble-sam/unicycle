import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SellPage from "./pages/SellPage";
import BrowsePage from "./pages/BrowsePage";
import DashboardPage from "./pages/DashboardPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EditProductPage from "./pages/EditProductPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";
import SafetyPage from "./pages/SafetyPage";
import AmbassadorsPage from "./pages/AmbassadorsPage";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";

// Admin pages
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminSellersPage from "./pages/admin/AdminSellersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminDatabasePage from "./pages/admin/AdminDatabasePage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminActivityLogsPage from "./pages/admin/AdminActivityLogsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminAdminsPage from "./pages/admin/AdminAdminsPage";
const queryClient = new QueryClient();

// Component to check maintenance mode
const MaintenanceCheck = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Allow admin routes to bypass maintenance check
        if (location.pathname.startsWith('/admin')) {
          setChecking(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')}/admin/settings/public/status`);
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.maintenance_mode === true);
        }
      } catch (error) {
        // If check fails, assume not in maintenance (fail open)
        setMaintenanceMode(false);
      } finally {
        setChecking(false);
      }
    };

    checkMaintenance();
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show maintenance page if enabled and not on admin routes
  if (maintenanceMode && !location.pathname.startsWith('/admin')) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceCheck>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/edit/:id" element={<EditProductPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/ambassadors" element={<AmbassadorsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailPage />} />
              <Route path="sellers" element={<AdminSellersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="activity-logs" element={<AdminActivityLogsPage />} />
              <Route path="admins" element={<AdminAdminsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="database" element={<AdminDatabasePage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MaintenanceCheck>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
