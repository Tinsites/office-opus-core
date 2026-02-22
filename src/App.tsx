import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Invoices from "./pages/Invoices";
import Onboarding from "./pages/Onboarding";
import SubmitForm from "./pages/SubmitForm";
import Documents from "./pages/Documents";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Prospecting from "./pages/Prospecting";
import PublicInvoice from "./pages/PublicInvoice";
import Messages from "./pages/Messages";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/submit/:formId" element={<SubmitForm />} />
            <Route path="/invoice/:token" element={<PublicInvoice />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/prospecting" element={<Prospecting />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
