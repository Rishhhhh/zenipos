import { Suspense, lazy, useState, useEffect } from "react";
import { useModalManager } from "./hooks/useModalManager";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { BranchProvider } from "./contexts/BranchContext";
import { ModalProvider } from "./contexts/ModalContext";
import { WidgetRefreshProvider } from "./contexts/WidgetRefreshContext";
import { OrgProtectedRoute } from "./components/auth/OrgProtectedRoute";
import { FullyProtectedRoute } from "./components/auth/FullyProtectedRoute";
import { SuperAdminProtectedRoute } from "./components/auth/SuperAdminProtectedRoute";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import CustomerScreen from "./pages/CustomerScreen";
import Index from "./pages/Index";
import { AppHeader } from "./components/layout/AppHeader";
import { MacDock } from "./components/navigation/MacDock";
import { FloatingSimulationControl } from "./components/simulation/FloatingSimulationControl";
import { AIFloatingButton } from "./components/ai/AIFloatingButton";
import { useAuth } from "./contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useSimulationStore } from "./lib/store/simulation";
import { useRealtimeStore } from "./lib/store/realtimeStore";

// Lazy load routes for code splitting and faster initial load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const TableManagement = lazy(() => import("./pages/TableManagement"));
const KDS = lazy(() => import("./pages/KDS"));
const ExpoStation = lazy(() => import("./pages/ExpoStation"));
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
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
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
const MarketingContent = lazy(() => import("./pages/admin/MarketingContent"));
const Approvals = lazy(() => import("./pages/admin/Approvals"));
const TipReports = lazy(() => import("./pages/admin/TipReports"));
const OpenTabs = lazy(() => import("./pages/admin/OpenTabs"));
const ShiftManagement = lazy(() => import("./pages/admin/ShiftManagement"));
const EightySixManagement = lazy(() => import("./pages/admin/EightySixManagement"));
const PendingModifications = lazy(() => import("./pages/admin/PendingModifications"));
const StationKDS = lazy(() => import("./pages/StationKDS"));
const TabletPOS = lazy(() => import("./pages/TabletPOS"));
const OrganizationSettings = lazy(() => import("./pages/admin/OrganizationSettings"));
const Cashbook = lazy(() => import("./pages/admin/Cashbook"));
const GeneralLedger = lazy(() => import("./pages/admin/GeneralLedger"));
const CRMTestingDashboard = lazy(() => import("./pages/admin/CRMTestingDashboard"));
const PromotionAnalytics = lazy(() => import("./pages/admin/PromotionAnalytics"));
const RecipeManagement = lazy(() => import("./pages/admin/RecipeManagement"));
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
  const subscribeAll = useRealtimeStore(state => state.subscribeAll);
  const isLoginPage = location.pathname === '/login';
  const isCustomerScreen = location.pathname.startsWith('/customer/');

  // Initialize global realtime subscriptions when user logs in
  useEffect(() => {
    if (employee && !isLoginPage && !isCustomerScreen) {
      console.log('[App] Initializing global realtime subscriptions');
      const cleanup = subscribeAll();
      return cleanup;
    }
  }, [employee, isLoginPage, isCustomerScreen, subscribeAll]);

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <BranchProvider>
          <WidgetRefreshProvider>
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  {(() => {
                    const Register = lazy(() => import("./pages/Register"));
                    return <Register />;
                  })()}
                </Suspense>
              } />
              <Route path="/customer/:sessionId" element={<CustomerScreen />} />
              
              {/* Organization-Protected Routes (org auth only) */}
              <Route path="/login" element={
                <OrgProtectedRoute>
                  <Login />
                </OrgProtectedRoute>
              } />
              
              {/* Super Admin Route */}
              <Route path="/super-admin" element={
                <SuperAdminProtectedRoute>
                  <>
                    <AppHeader />
                    <SuperAdmin />
                  </>
                </SuperAdminProtectedRoute>
              } />
              
              {/* Dashboard at home route */}
              <Route path="/" element={
                <FullyProtectedRoute requiredRole="staff">
                  <AppHeader />
                  <Dashboard />
                </FullyProtectedRoute>
              } />
              
              <Route path="/pos" element={
                <FullyProtectedRoute requiredRole="staff">
                  <POSWithHeader />
                </FullyProtectedRoute>
              } />
              
              <Route path="/tables" element={
                <FullyProtectedRoute requiredRole="staff">
                  <AppHeader />
                  <TableManagement />
                </FullyProtectedRoute>
              } />
              
              <Route path="/kds" element={
                <FullyProtectedRoute requiredRole="staff">
                  <AppHeader />
                  <KDS />
                </FullyProtectedRoute>
              } />
              
              <Route path="/expo-station" element={
                <FullyProtectedRoute requiredRole="staff">
                  <ExpoStation />
                </FullyProtectedRoute>
              } />
              
              {/* Admin Routes - No Auth Required */}
              <Route path="/admin" element={
                <>
                  <AppHeader />
                  <Admin />
                </>
              } />
              
              <Route path="/admin/menu" element={
                <>
                  <AppHeader />
                  <MenuManagement />
                </>
              } />
              
              <Route path="/admin/promotions" element={
                <>
                  <AppHeader />
                  <PromotionManagement />
                </>
              } />
              
              <Route path="/admin/inventory" element={
                <>
                  <AppHeader />
                  <InventoryManagement />
                </>
              } />
              
              <Route path="/admin/crm" element={
                <>
                  <AppHeader />
                  <CRMDashboard />
                </>
              } />
              
              <Route path="/admin/employees" element={
                <>
                  <AppHeader />
                  <EmployeeManagement />
                </>
              } />
              
              <Route path="/admin/reports" element={
                <>
                  <AppHeader />
                  <ReportsDashboard />
                </>
              } />
              
              <Route path="/admin/ai-history" element={
                <>
                  <AppHeader />
                  <AIHistoryDashboard />
                </>
              } />
              
              <Route path="/admin/branches" element={
                <>
                  <AppHeader />
                  <BranchManagement />
                </>
              } />
              
              <Route path="/admin/organization-settings" element={
                <>
                  <AppHeader />
                  <OrganizationSettings />
                </>
              } />
              
              <Route path="/admin/manager" element={
                <>
                  <AppHeader />
                  <ManagerDashboard />
                </>
              } />
              
              <Route path="/admin/system-health" element={
                <>
                  <AppHeader />
                  <SystemHealthDashboard />
                </>
              } />
              
              <Route path="/admin/performance" element={
                <>
                  <AppHeader />
                  <PerformanceDashboard />
                </>
              } />
              
              <Route path="/admin/rate-limits" element={
                <>
                  <AppHeader />
                  <RateLimitMonitor />
                </>
              } />
              
              <Route path="/admin/suppliers" element={
                <>
                  <AppHeader />
                  <SupplierManagement />
                </>
              } />
              
              <Route path="/admin/purchase-orders" element={
                <>
                  <AppHeader />
                  <PurchaseOrders />
                </>
              } />
              
              <Route path="/admin/cashbook" element={
                <>
                  <AppHeader />
                  <Cashbook />
                </>
              } />
              
              <Route path="/admin/general-ledger" element={
                <>
                  <AppHeader />
                  <GeneralLedger />
                </>
              } />
              
              <Route path="/admin/receipt-templates" element={
                <>
                  <AppHeader />
                  <ReceiptTemplates />
                </>
              } />
              
              <Route path="/admin/tables" element={
                <>
                  <AppHeader />
                  <TableLayout />
                </>
              } />
              
              <Route path="/admin/modifiers" element={
                <>
                  <AppHeader />
                  <ModifierManagement />
                </>
              } />
              
              <Route path="/admin/stations" element={
                <>
                  <AppHeader />
                  <StationManagement />
                </>
              } />
              
              <Route path="/admin/devices" element={
                <>
                  <AppHeader />
                  <DeviceManagement />
                </>
              } />
              
              <Route path="/admin/station-routing/:stationId" element={
                <>
                  <AppHeader />
                  <StationRoutingConfig />
                </>
              } />
              
              <Route path="/admin/nfc-cards" element={
                <>
                  <AppHeader />
                  <NFCCardManagement />
                </>
              } />
              
              <Route path="/admin/marketing-content" element={
                <>
                  <AppHeader />
                  <MarketingContent />
                </>
              } />
              
              <Route path="/admin/approvals" element={
                <>
                  <Approvals />
                </>
              } />
              
              <Route path="/admin/tip-reports" element={
                <>
                  <TipReports />
                </>
              } />
              
              <Route path="/admin/open-tabs" element={
                <>
                  <OpenTabs />
                </>
              } />
              
              <Route path="/admin/shift-management" element={
                <>
                  <AppHeader />
                  <ShiftManagement />
                </>
              } />
              
              <Route path="/admin/eighty-six" element={
                <>
                  <AppHeader />
                  <EightySixManagement />
                </>
              } />
              
              <Route path="/admin/pending-modifications" element={
                <>
                  <AppHeader />
                  <PendingModifications />
                </>
              } />
              
              <Route path="/admin/crm-testing" element={
                <>
                  <AppHeader />
                  <CRMTestingDashboard />
                </>
              } />
              
              <Route path="/admin/promotion-analytics" element={
                <>
                  <AppHeader />
                  <PromotionAnalytics />
                </>
              } />
              
              <Route path="/admin/recipes" element={
                <>
                  <AppHeader />
                  <RecipeManagement />
                </>
              } />
              
              {/* Keep KDS and Station Routes Protected */}
              <Route path="/kds/:stationId" element={
                <FullyProtectedRoute>
                  <StationKDS />
                </FullyProtectedRoute>
              } />
              
              <Route path="/tablet-pos" element={
                <FullyProtectedRoute>
                  <TabletPOS />
                </FullyProtectedRoute>
              } />
              
              {/* Changelog & Documentation */}
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/documentation/:slug" element={<Documentation />} />
              
              {/* Catch-all redirect to auth */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
                  </Routes>
                </AppLayout>
              </BrowserRouter>
            </Suspense>
            </TooltipProvider>
          </ModalProvider>
        </WidgetRefreshProvider>
      </BranchProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
