import { Suspense, lazy, useState, useEffect } from "react";
import { useModalManager } from "./hooks/useModalManager";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import CustomerScreen from "./pages/CustomerScreen";
import { AppHeader } from "./components/layout/AppHeader";
import { MacDock } from "./components/navigation/MacDock";
import { FloatingSimulationControl } from "./components/simulation/FloatingSimulationControl";
import { AIFloatingButton } from "./components/ai/AIFloatingButton";
import { useAuth } from "./contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useSimulationStore } from "./lib/store/simulation";

// Lazy load routes for code splitting and faster initial load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const KDS = lazy(() => import("./pages/KDS"));
const Admin = lazy(() => import("./pages/Admin"));
const MenuManagement = lazy(() => import("./pages/admin/MenuManagement"));
const PromotionManagement = lazy(() => import("./pages/admin/PromotionManagement"));
const InventoryManagement = lazy(() => import("./pages/admin/InventoryManagement"));
const CRMDashboard = lazy(() => import("./pages/admin/CRMDashboard"));
const EmployeeManagement = lazy(() => import("./pages/admin/EmployeeManagement"));
const ReportsDashboard = lazy(() => import("./pages/admin/ReportsDashboard"));
const AIHistoryDashboard = lazy(() => import("./pages/admin/AIHistoryDashboard"));
const BranchManagement = lazy(() => import("./pages/admin/BranchManagement"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Documentation = lazy(() => import("./pages/Documentation"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const SystemHealthDashboard = lazy(() => import("./pages/admin/SystemHealthDashboard"));
const PerformanceDashboard = lazy(() => import("./pages/admin/PerformanceDashboard"));
const RateLimitMonitor = lazy(() => import("./pages/admin/RateLimitMonitor"));
const SupplierManagement = lazy(() => import("./pages/admin/SupplierManagement"));
const PurchaseOrders = lazy(() => import("./pages/admin/PurchaseOrders"));
const ReceiptTemplates = lazy(() => import("./pages/admin/ReceiptTemplates"));
const TableLayout = lazy(() => import("./pages/admin/TableLayout"));
const ModifierManagement = lazy(() => import("./pages/admin/ModifierManagement"));
const StationManagement = lazy(() => import("./pages/admin/StationManagement"));
const DeviceManagement = lazy(() => import("./pages/admin/DeviceManagement"));
const StationRoutingConfig = lazy(() => import("./pages/admin/StationRoutingConfig"));
const NFCCardManagement = lazy(() => import("./pages/admin/NFCCardManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

// POS with integrated clock in/out
function POSWithHeader() {
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [shiftElapsed, setShiftElapsed] = useState<string>('00:00');
  const { openModal } = useModalManager();

  return (
    <>
      <AppHeader
        currentShiftId={currentShiftId}
        shiftElapsed={shiftElapsed}
        onClockIn={() => openModal('employeeClockIn', {
          onSuccess: (employee: any, shiftId: string) => {
            setCurrentEmployee(employee);
            setCurrentShiftId(shiftId);
          },
        })}
        onClockOut={() => openModal('employeeClockOut', {
          shiftId: currentShiftId,
          onSuccess: () => {
            setCurrentEmployee(null);
            setCurrentShiftId(null);
            setShiftElapsed('00:00');
          },
        })}
      />
      <POS />
    </>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { employee } = useAuth();
  const location = useLocation();
  const stopSimulation = useSimulationStore(state => state.stopSimulation);
  const isLoginPage = location.pathname === '/login';
  const isCustomerScreen = location.pathname.startsWith('/customer/');

  // Stop simulation on logout
  useEffect(() => {
    if (!employee) {
      stopSimulation();
    }
  }, [employee, stopSimulation]);

  return (
    <>
      {children}
      {employee && !isLoginPage && !isCustomerScreen && (
        <>
          <MacDock />
          <FloatingSimulationControl />
        </>
      )}
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
          <TooltipProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            }>
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
                  <POSWithHeader />
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
              
              <Route path="/admin/suppliers" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <SupplierManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/purchase-orders" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <PurchaseOrders />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/receipt-templates" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <ReceiptTemplates />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/tables" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <TableLayout />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/modifiers" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <ModifierManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/stations" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <StationManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/devices" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <DeviceManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/station-routing/:stationId" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <StationRoutingConfig />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/nfc-cards" element={
                <ProtectedRoute requiredRole="manager">
                  <AppHeader />
                  <NFCCardManagement />
                </ProtectedRoute>
              } />
              
              {/* Changelog & Documentation */}
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/documentation/:slug" element={<Documentation />} />
              
              {/* Catch-all redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </AppLayout>
              </BrowserRouter>
            </Suspense>
            </TooltipProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
