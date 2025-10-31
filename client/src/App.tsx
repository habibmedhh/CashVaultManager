import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import CashRegister from "@/pages/cash-register";
import PVHistory from "@/pages/pv-history";
import OperationsDetail from "@/pages/operations-detail";
import PVAgence from "@/pages/pv-agence";
import PrintPV from "@/pages/print-pv";
import Admin from "@/pages/admin";
import PVConfiguration from "@/pages/pv-configuration";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { UserSelector } from "@/components/UserSelector";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CashRegister} />
      <Route path="/historique" component={PVHistory} />
      <Route path="/operations" component={OperationsDetail} />
      <Route path="/pv-agence" component={PVAgence} />
      <Route path="/imprimer-pv" component={PrintPV} />
      <Route path="/admin" component={Admin} />
      <Route path="/configuration" component={PVConfiguration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { selectedUserId, setSelectedUserId } = useUser();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-lg font-semibold text-foreground">
              MAD - Gestion de Caisse
            </div>
            <UserSelector selectedUserId={selectedUserId} onUserChange={setSelectedUserId} />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
