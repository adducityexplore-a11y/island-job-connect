import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, Briefcase, Users, Building2, Menu, X, Home, LogOut, Settings, HelpCircle, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCompanyProfile } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Vacancies", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Applications", href: "/recruiter/applications", icon: Users },
  { label: "Company Profile", href: "/recruiter/company", icon: Building2 },
];

export function RecruiterLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: companyProfile } = useGetCompanyProfile();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-accent shrink-0 fixed inset-y-0 z-20 text-sidebar-foreground shadow-lg">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-accent shrink-0">
          <Link href="/" className="font-display font-bold text-xl text-white flex items-center gap-2">
            The Jobs MV
          </Link>
        </div>

        <div className="px-6 py-4">
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 font-semibold">
            Recruiter Portal
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href + "/") && item.href !== "/recruiter");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-white font-medium shadow-sm relative overflow-hidden"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                )}
                <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "opacity-80"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-sidebar-accent space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <Settings className="w-4 h-4 opacity-80" />
            Settings
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <HelpCircle className="w-4 h-4 opacity-80" />
            Help
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 opacity-80" />
            Logout
          </button>

          <div className="pt-4 mt-2 border-t border-sidebar-accent/50 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-accent border border-sidebar-accent">
              {(user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "R").toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">
                {companyProfile?.companyName || "Your Company"}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user?.fullName || 'Recruiter'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-sidebar border-b border-sidebar-accent flex items-center justify-between px-4 fixed top-0 inset-x-0 z-30 shadow-md">
        <Link href="/" className="font-display font-bold text-lg text-white">
          The Jobs MV <span className="text-xs font-normal text-sidebar-foreground/70 ml-1 uppercase tracking-wider">Recruiter</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            data-testid="button-mobile-logout"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-sidebar shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-accent">
              <span className="font-display font-bold text-white text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="px-6 py-4 flex items-center gap-3 border-b border-sidebar-accent/50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-accent">
                {(user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "R").toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">
                  {companyProfile?.companyName || "Your Company"}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.fullName || 'Recruiter'}
                </span>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location === item.href || (location.startsWith(item.href + "/") && item.href !== "/recruiter");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-white font-medium"
                        : "text-sidebar-foreground/80 active:bg-sidebar-accent/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "opacity-80"}`} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-4 border-t border-sidebar-accent/50"></div>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-sidebar-foreground/80 active:bg-sidebar-accent/50"
              >
                <Home className="w-5 h-5 opacity-80" />
                Back to Public Site
              </Link>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left text-destructive/90 active:bg-sidebar-accent/50 font-medium"
                data-testid="button-menu-logout"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-[100dvh] pt-16 md:pt-0">
        {/* Desktop Top Header inside workspace */}
        <div className="hidden md:flex h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-8 items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {location === "/recruiter" && "Dashboard"}
            {location.startsWith("/recruiter/jobs") && "Vacancies"}
            {location.startsWith("/recruiter/applications") && "Candidate Pipeline"}
            {location === "/recruiter/company" && "Company Profile"}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 md:pt-6 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
