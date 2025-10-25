import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";
import { AppHeader } from "./components/layout/AppHeader";

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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppHeader />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/customer/:sessionId" element={<CustomerScreen />} />
          <Route path="/kds" element={<KDS />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/promotions" element={<PromotionManagement />} />
          <Route path="/admin/inventory" element={<InventoryManagement />} />
          <Route path="/admin/crm" element={<CRMDashboard />} />
          <Route path="/admin/employees" element={<EmployeeManagement />} />
          <Route path="/admin/reports" element={<ReportsDashboard />} />
          <Route path="/admin/ai-history" element={<AIHistoryDashboard />} />
          <Route path="/admin/branches" element={<BranchManagement />} />
          <Route path="/admin/manager" element={<ManagerDashboard />} />
          <Route path="/admin/system-health" element={<SystemHealthDashboard />} />
          <Route path="/admin/performance" element={<PerformanceDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
