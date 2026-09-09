import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth, UserButton } from "@clerk/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  FileText,
  Heart,
  Search,
} from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/companies", label: "Companies", icon: Building2 },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-border shadow-sm"
          : "bg-background border-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" data-testid="nav-logo">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img src={`${import.meta.env.BASE_URL}images/logo_final.png`} alt="The Jobs MV Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-primary">
            The Jobs MV
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild className="h-11 px-3 font-display text-xs font-bold tracking-[0.12em] text-secondary hover:bg-secondary/10 hover:text-secondary" data-testid="nav-link-companies">
            <Link href="/companies" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white shadow-sm">
                <Building2 className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
              </span>
              COMPANIES
            </Link>
          </Button>
          {location !== "/my-career" && (
            <Button variant="ghost" asChild className="h-11 px-3 font-display text-xs font-bold tracking-[0.12em] text-amber-700 hover:bg-amber-50 hover:text-amber-800" data-testid="nav-button-employer">
              <Link href="/employer/dashboard" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <BriefcaseBusiness className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                </span>
                MY HIRING
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild className="h-11 px-3 font-display text-xs font-bold tracking-[0.12em] text-primary hover:bg-primary/5 hover:text-primary" data-testid="nav-button-account">
              <Link href={isSignedIn ? "/my-career" : "/candidate/sign-in"} className="flex items-center gap-2">
               <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                 <CircleUserRound className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
               </span>
               {isSignedIn ? "MY CAREER" : "SIGN IN"}
            </Link>
          </Button>
          <Button asChild className="ml-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6">
            <Link href="/jobs" data-testid="nav-button-jobs">Find Jobs</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="group relative -mr-1 flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          data-testid="nav-button-mobile-toggle"
        >
          <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
          <span className="relative block h-[18px] w-[22px]" aria-hidden="true">
            <span
              className={cn(
                "absolute left-0 top-0 h-[1.5px] rounded-full bg-current transition-all duration-300 ease-out",
                mobileMenuOpen
                  ? "top-2 w-[22px] rotate-45"
                  : "w-[22px] group-hover:w-[18px]"
              )}
            />
            <span
              className={cn(
                "absolute right-0 top-2 h-[1.5px] w-[16px] rounded-full bg-current transition-all duration-200 ease-out",
                mobileMenuOpen ? "translate-x-1 opacity-0" : "opacity-100 group-hover:w-[22px]"
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 h-[1.5px] rounded-full bg-current transition-all duration-300 ease-out",
                mobileMenuOpen
                  ? "bottom-2 w-[22px] -rotate-45"
                  : "w-[22px] group-hover:w-[18px]"
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-in slide-in-from-top-4 py-4 px-4 flex flex-col gap-4">
          <nav className="flex flex-col gap-1">
            <p className="px-3 pt-1 text-xs font-bold tracking-wider text-muted-foreground">FOR CANDIDATES</p>
            {isSignedIn ? (
              <Link
                href="/my-career"
                className={cn(
                  "flex items-center gap-2 rounded-md p-3 font-display text-base font-semibold transition-colors",
                  location === "/my-career"
                    ? "bg-primary/10 text-primary"
                    : "text-primary hover:bg-primary/5"
                )}
                data-testid="mobile-nav-link-my-career"
              >
                <CircleUserRound className="h-4 w-4" aria-hidden="true" />
                My Career
              </Link>
            ) : (
              <>
                {navLinks.slice(0, 2).map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "p-3 rounded-md text-base font-medium transition-colors",
                      location === link.href
                        ? "bg-muted text-secondary"
                        : "text-foreground hover:bg-muted/50"
                    )}
                    data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <link.icon className="mr-2 inline h-4 w-4 text-secondary" aria-hidden="true" />
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            <p className={cn("px-3 text-xs font-bold tracking-wider text-muted-foreground", !isSignedIn ? "pt-4" : "pt-1")}>FOR EMPLOYERS</p>
            <Link href="/employers" className="p-3 rounded-md text-base font-medium text-foreground hover:bg-muted/50" data-testid="mobile-nav-link-find-candidates">
              Find Candidates
            </Link>
            <Link href="/employer/dashboard" className="p-3 rounded-md text-base font-medium text-foreground hover:bg-muted/50" data-testid="mobile-nav-link-post-vacancy">
              Post a Vacancy
            </Link>
            {location !== "/my-career" && (
              <Link href="/employer/dashboard" className="flex items-center gap-2 rounded-md p-3 font-display text-base font-semibold text-amber-700 hover:bg-amber-50" data-testid="mobile-nav-link-employer-workspace">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                My Hiring
              </Link>
            )}
            <p className="px-3 pt-4 text-xs font-bold tracking-wider text-muted-foreground">GENERAL</p>
            {[
              { href: "/companies", label: "Companies" },
              { href: "/about", label: "About The Jobs MV" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "p-3 rounded-md text-base font-medium transition-colors",
                  location === link.href ? "bg-muted text-secondary" : "text-foreground hover:bg-muted/50"
                )}
                data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
            <a href="mailto:hello@thejobsmv.com" className="p-3 rounded-md text-base font-medium text-foreground hover:bg-muted/50">
              Contact
            </a>
          </nav>
          {!isSignedIn && (
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button variant="outline" asChild className="w-full rounded-full" data-testid="mobile-nav-button-account">
                <Link href="/candidate/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full">
                <Link href="/jobs" data-testid="mobile-nav-button-jobs">Find Jobs</Link>
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Mobile Bottom Nav */}
      {isSignedIn && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border flex items-center justify-around h-[4.5rem] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <Link href="/my-career" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px]", location === "/my-career" ? "text-primary font-semibold" : "text-muted-foreground")}>
            <CircleUserRound className={cn("w-5 h-5", location === "/my-career" ? "fill-primary/10" : "")} />
            <span>My Career</span>
          </Link>
          <Link href="/jobs" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px]", location.startsWith("/jobs") ? "text-primary font-semibold" : "text-muted-foreground")}>
            <Search className={cn("w-5 h-5", location.startsWith("/jobs") ? "fill-primary/10" : "")} />
            <span>Jobs</span>
          </Link>
          <Link href="/passport" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px]", location === "/passport" ? "text-primary font-semibold" : "text-muted-foreground")}>
            <FileText className={cn("w-5 h-5", location === "/passport" ? "fill-primary/10" : "")} />
            <span>Passport</span>
          </Link>
          <Link href="/saved-jobs" className={cn("flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px]", location === "/saved-jobs" ? "text-primary font-semibold" : "text-muted-foreground")}>
            <Heart className={cn("w-5 h-5", location === "/saved-jobs" ? "fill-primary/10" : "")} />
            <span>Saved</span>
          </Link>
          <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] text-muted-foreground">
            <UserButton appearance={{ elements: { rootBox: "w-6 h-6", userButtonAvatarBox: "w-6 h-6" } }} />
            <span>Profile</span>
          </div>
        </div>
      )}
    </header>
  );
}
