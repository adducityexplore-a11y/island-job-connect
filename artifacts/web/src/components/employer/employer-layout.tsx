import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useClerk } from "@clerk/react";
import { BriefcaseBusiness, LayoutDashboard, Menu, UsersRound, X, LogOut, ShieldAlert, Sparkles, Building2, House } from "lucide-react";
import { getGetRecruiterDashboardQueryKey, useGetRecruiterDashboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const links = [
  { href: "/employer/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/employer/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
  { href: "/employer/applications", label: "Candidates", icon: UsersRound },
  { href: "/employer/recruitment-requests", label: "Hiring Support", icon: Sparkles, assisted: true },
  { href: "/employer/company", label: "Company Profile", icon: Building2 },
];

export function EmployerLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const access = useGetRecruiterDashboard({ query: { enabled: isLoaded && isSignedIn, retry: false, queryKey: getGetRecruiterDashboardQueryKey() } });

  if (!isLoaded || (isSignedIn && access.isLoading)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
           <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    window.location.href = `${basePath}/employer/login`;
    return null;
  }

  if (access.error) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/20">
        <header className="flex h-16 shrink-0 items-center border-b bg-background px-6">
          <img src={`${basePath}/images/logo_final.png`} alt="The Jobs MV Logo" className="h-8 w-8 object-contain" />
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md w-full shadow-lg border-border">
            <CardContent className="flex flex-col items-center p-10 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Employer Access Required</h1>
              <p className="text-muted-foreground mb-8">
                Your account is not currently connected to an approved employer workspace.
              </p>
              <Button variant="default" className="w-full shadow-sm" asChild data-testid="btn-return-options">
                <Link href="/employers">Return to Employer Options</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {links.map(({ href, label, icon: Icon, assisted }) => {
        const isReallyActive = href === "/employer/dashboard"
          ? location === href
          : location === href || location.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isReallyActive
                ? "bg-white/10 text-white"
                : "text-primary-foreground/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon
              strokeWidth={1.9}
              className={cn(
                "h-[19px] w-[19px] shrink-0",
                assisted ? "text-[#D9A520]" : isReallyActive ? "text-accent" : "text-primary-foreground/70 group-hover:text-white"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-muted/20 md:flex">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 shadow-sm md:hidden">
        <Link href="/employer/dashboard" className="flex items-center gap-2">
          <img src={`${basePath}/images/logo_final.png`} alt="The Jobs MV Logo" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold text-primary tracking-tight">The Jobs MV</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="btn-mobile-menu">
          {open ? <X className="h-[21px] w-[21px]" strokeWidth={1.9} /> : <Menu className="h-[21px] w-[21px]" strokeWidth={1.9} />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary text-primary-foreground transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-primary-foreground/10 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white p-1">
            <img src={`${basePath}/images/logo_final.png`} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">The Jobs MV</span>
        </div>

        {/* Navigation */}
        {nav}

        <div className="mt-auto flex shrink-0 flex-col gap-1 border-t border-primary-foreground/10 p-3">
          <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:bg-white/10 hover:text-white" asChild data-testid="btn-back-to-website">
            <Link href="/" onClick={() => setOpen(false)}>
              <House className="mr-3 h-4 w-4 shrink-0" />
              Back to website
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:bg-white/10 hover:text-white" onClick={() => signOut({ redirectUrl: `${basePath}/employer/login` })} data-testid="btn-signout">
            <LogOut className="mr-3 h-4 w-4 shrink-0" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
