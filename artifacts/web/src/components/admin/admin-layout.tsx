import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  FileText,
  Activity,
  LogOut,
  ShieldAlert,
  ClipboardList,
  ArrowLeft,
  House,
  UsersRound,
  UserSearch,
  Ellipsis,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetAdminOverview, getGetAdminOverviewQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [moreOpen, setMoreOpen] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Fetch overview to check admin access (will 403 if not admin)
  const { error: overviewError, isLoading: overviewLoading } = useGetAdminOverview({
    query: {
      enabled: isLoaded && isSignedIn,
      retry: false,
      queryKey: getGetAdminOverviewQueryKey()
    }
  });

  if (!isLoaded || (isSignedIn && overviewLoading)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    window.location.href = `${basePath}/admin/sign-in`;
    return null;
  }

  // Handle non-admin signed-in users (403 or other errors)
  if (overviewError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">
              Your account ({user?.primaryEmailAddress?.emailAddress}) does not have administrator privileges for The Jobs MV platform.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Return to Public Site</Link>
            </Button>
            <Button 
              variant="default" 
              onClick={() => signOut({ redirectUrl: `${basePath}/` })}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/employers", icon: Building2, label: "Employers" },
    { href: "/admin/jobs", icon: Briefcase, label: "Vacancies" },
    { href: "/admin/candidates", icon: Users, label: "Candidates" },
    { href: "/admin/applications", icon: FileText, label: "Applications" },
    { href: "/admin/recruitment-requests", icon: ClipboardList, label: "Recruitment" },
    { href: "/admin/outreach", icon: Mail, label: "Outreach" },
    { href: "/admin/audit", icon: Activity, label: "Audit Log" },
  ];

  // Bottom nav keeps only the highest-frequency sections reachable with one hand;
  // everything else lives behind "More" so the bar never overflows on small phones.
  const bottomNavItems = [
    { href: "/admin", icon: House, label: "Home" },
    { href: "/admin/employers", icon: Building2, label: "Employers" },
    { href: "/admin/candidates", icon: UsersRound, label: "Candidates" },
    { href: "/admin/recruitment-requests", icon: UserSearch, label: "Hiring" },
  ];
  const moreNavItems = [
    { href: "/admin/jobs", icon: Briefcase, label: "Vacancies" },
    { href: "/admin/applications", icon: FileText, label: "Applications" },
    { href: "/admin/outreach", icon: Mail, label: "Outreach" },
    { href: "/admin/audit", icon: Activity, label: "Audit Log" },
  ];
  const isNavActive = (href: string) => location === href || (location.startsWith(href) && href !== "/admin");

  const handleLogout = () => {
    signOut({ redirectUrl: `${basePath}/admin/sign-in` });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-[#f8f9fa]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground sticky top-0 z-30 shadow-sm">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
            <img src={`${basePath}/images/logo_final.png`} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold tracking-tight text-white">ADMIN CONSOLE</span>
        </Link>
      </div>

      {/* Sidebar (Desktop only — mobile uses the bottom nav below) */}
      <aside className="hidden md:flex md:static w-64 bg-primary text-primary-foreground flex-col shadow-xl">
        <div className="p-6 flex flex-col gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={`${basePath}/images/logo_final.png`} alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-display font-bold text-white tracking-tight truncate">The Jobs MV</h2>
            </div>
          </div>
          <div className="px-2 py-1 bg-white/10 rounded border border-white/5 inline-flex items-center justify-center w-fit">
            <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-md" />}
                <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "group-hover:text-white/80")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10 mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-xs text-white/50 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <Button
            variant="ghost"
            asChild
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 border-white/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary border-t border-white/10 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.3)]"
        aria-label="Admin navigation"
      >
        {bottomNavItems.map((item) => {
          const isActive = isNavActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] text-[10px] font-medium transition-colors",
                isActive ? "text-accent" : "text-white/60"
              )}
              data-testid={`admin-bottom-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] text-[10px] font-medium transition-colors",
            moreOpen || moreNavItems.some((item) => isNavActive(item.href)) ? "text-accent" : "text-white/60"
          )}
          aria-label="More admin sections"
          data-testid="admin-bottom-nav-more"
        >
          <Ellipsis className="w-5 h-5" aria-hidden="true" />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <SheetHeader>
            <SheetTitle className="text-left font-display text-primary">More</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {moreNavItems.map((item) => {
              const isActive = isNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium min-h-[44px] transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 mt-3 border-t border-border space-y-1">
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium min-h-[44px] text-foreground hover:bg-muted/50"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                Back to Website
              </Link>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium min-h-[44px] text-destructive hover:bg-destructive/5"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
