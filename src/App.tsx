import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import POS from "./pages/POS";
import CustomerScreen from "./pages/CustomerScreen";
import KDS from "./pages/KDS";
import Admin from "./pages/Admin";
import MenuManagement from "./pages/admin/MenuManagement";
import PromotionManagement from "./pages/admin/PromotionManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import CRMDashboard from "./pages/admin/CRMDashboard";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import ReportsDashboard from "./pages/admin/ReportsDashboard";
import AIHistoryDashboard from "./pages/admin/AIHistoryDashboard";
import BranchManagement from "./pages/admin/BranchManagement";
import ManagerDashboard from "./pages/ManagerDashboard";
import SystemHealthDashboard from "./pages/admin/SystemHealthDashboard";
import PerformanceDashboard from "./pages/admin/PerformanceDashboard";
import RateLimitMonitor from "./pages/admin/RateLimitMonitor";
import NotFound from "./pages/NotFound";
import { AppHeader } from "./components/layout/AppHeader";
import { MacDock } from "./components/navigation/MacDock";
import { useAuth } from "./contexts/AuthContext";
import { useLocation } from "react-router-dom";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { employee } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isCustomerScreen = location.pathname.startsWith('/customer/');

  return (
    <>
      {children}
      {employee && !isLoginPage && !isCustomerScreen && <MacDock />}
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000, // 1s - aggressive caching for <200ms target
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ModalProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppLayout>
                  <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/customer/:sessionId" element={<CustomerScreen />} />
              
              {/* Protected Routes with AppHeader */}
              <Route path="/" element={
                <ProtectedRoute requiredRole="cashier">
                  <AppHeader />
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/pos" element={
                <ProtectedRoute requiredRole="cashier">
                  <AppHeader />
                  <POS />
                </ProtectedRoute>
              } />
              
              <Route path="/kds" element={
                <ProtectedRoute requiredRole="cashier">
                  <AppHeader />
                  <KDS />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <Admin />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/menu" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <MenuManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/promotions" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <PromotionManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/inventory" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <InventoryManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/crm" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <CRMDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/employees" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <EmployeeManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <ReportsDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/ai-history" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <AIHistoryDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/branches" element={
                <ProtectedRoute requiredRole="admin">
                  <AppHeader />
                  <BranchManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/manager" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/system-health" element={
                <ProtectedRoute requiredRole="admin">
                  <AppHeader />
                  <SystemHealthDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/performance" element={
                <ProtectedRoute requiredRole="admin">
                  <AppHeader />
                  <PerformanceDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/rate-limits" element={
                <ProtectedRoute requiredRole="admin">
                  <AppHeader />
                  <RateLimitMonitor />
                </ProtectedRoute>
              } />
              
              {/* Catch-all redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </AppLayout>
              </BrowserRouter>
            </TooltipProvider>
          </Suspense>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
