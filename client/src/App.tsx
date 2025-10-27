import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LayoutDashboard, Globe, FlaskConical } from "lucide-react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Web3Provider } from "./providers/Web3Provider";
import { ThemeToggle } from "./components/ThemeToggle";
import { Button } from "./components/ui/button";
import Dashboard from "./pages/Dashboard";
import Origins from "./pages/Origins";
import Integration from "./pages/Integration";
import LiveDemo from "./pages/LiveDemo";
import Demo from "./pages/Demo";
import NotFound from "./pages/not-found";
import { cn } from "./lib/utils";
import Footer from "./components/Footer";

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/origins", label: "Origins", icon: Globe },
    { path: "/integration", label: "Integration", icon: FlaskConical },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate rounded-lg px-3 py-2 transition-all cursor-pointer" data-testid="link-logo">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg font-bold text-lg text-white" 
                   style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #8b5cf6 100%)' }}>
                Z
              </div>
              <span className="font-semibold text-lg hidden sm:inline">FHE Analytics</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 hover-elevate",
                      isActive && "bg-muted"
                    )}
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/origins" component={Origins} />
          <Route path="/integration" component={Integration} />
          <Route path="/demo" component={Demo} />
          <Route path="/live-demo" component={LiveDemo} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Web3Provider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </Web3Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
