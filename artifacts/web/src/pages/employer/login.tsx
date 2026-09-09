import { SignIn } from '@clerk/react';
import { Link } from 'wouter';
import { ArrowRight, Building2 } from 'lucide-react';
import { SEO } from '@/components/seo';

function EmployerIntroduction({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-5" : "space-y-7"}>
      <div>
        <div className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-500">
          <span className="h-px w-7 bg-amber-500" />
          More Than a Job Board
        </div>
        <h1
          className={`${compact ? "text-3xl" : "text-4xl lg:text-5xl"} max-w-lg font-display font-bold leading-[1.1] text-white`}
          data-testid="text-hero-title"
        >
          You need the right people.
          <span className="mt-1 block font-medium italic text-amber-400">We help you find them.</span>
        </h1>
      </div>

      <p className={`${compact ? "text-sm" : "text-base lg:text-lg"} max-w-lg leading-relaxed text-primary-foreground/80`} data-testid="text-hero-subtitle">
        Our hospitality experts screen and review suitable candidates, then build an interview-ready shortlist for you, saving you valuable time in the hiring process.
      </p>

      <p className="max-w-md border-l-2 border-amber-400 pl-4 text-sm font-semibold leading-relaxed text-white/90">
        You focus on your operation.
        <span className="block">We help you find the talent.</span>
      </p>

      <div className={`grid max-w-lg gap-4 ${compact ? "" : "lg:grid-cols-2"}`}>
        <div>
          <Link
            href="/employer/recruitment-requests/new"
            className="flex h-12 w-full items-center justify-center rounded-full bg-amber-400 px-5 text-sm font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-amber-300"
            data-testid="button-login-request-candidates"
          >
            Hire with The Jobs MV <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-2 px-2 text-xs leading-relaxed text-white/60">
            Get help with sourcing, Expert Screening, and shortlisting.
          </p>
        </div>
        <div>
          <Link
            href="/employer/dashboard"
            className="flex h-12 w-full items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
            data-testid="button-login-post-vacancy"
          >
            Post and Manage Jobs
          </Link>
          <p className="mt-2 px-2 text-xs leading-relaxed text-white/60">
            Publish jobs and manage incoming applications directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmployerLogin() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row bg-background">
      <SEO title="Employer Login | The Jobs MV" description="Sign in to your employer account to manage job listings." />
      
      {/* Left side - Branding & Vibe */}
      <div className="hidden md:flex flex-1 flex-col bg-primary text-white p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary/50 via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block" data-testid="link-brand-home">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden mb-8 shadow-xl">
              <img 
                src={`${basePath}/images/logo_final.png`} 
                alt="The Jobs MV Logo" 
                className="w-12 h-12 object-contain" 
              />
            </div>
          </Link>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white backdrop-blur-md">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider" data-testid="text-employer-portal-badge">Employer Portal</span>
          </div>
          <EmployerIntroduction />
        </div>
        
        <div className="relative z-10 text-primary-foreground/60 text-sm" data-testid="text-copyright">
          &copy; {new Date().getFullYear()} The Jobs MV. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <Link href="/" data-testid="link-mobile-home">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden shadow-md">
              <img 
                src={`${basePath}/images/logo_final.png`} 
                alt="The Jobs MV Logo" 
                className="w-8 h-8 object-contain" 
              />
            </div>
          </Link>
        </div>
        
        <div className="mt-20 w-full max-w-[440px] space-y-8 md:mt-0">
          <div className="rounded-3xl bg-primary p-6 text-white shadow-xl md:hidden">
            <EmployerIntroduction compact />
          </div>

          <div className="flex flex-col space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground" data-testid="text-welcome-back">Welcome back</h2>
            <p className="text-muted-foreground text-lg" data-testid="text-signin-instruction">
              Sign in to your employer account.
            </p>
          </div>
          
          <div className="flex justify-center md:justify-start w-full" data-testid="clerk-signin-container">
            <SignIn 
              routing="path" 
              path={`${basePath}/employer/login`}
              fallbackRedirectUrl={`${basePath}/employer/dashboard`}
              signUpUrl={`${basePath}/employer/sign-up`}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            New to The Jobs MV?{" "}
            <Link href="/employer/sign-up" className="font-semibold text-primary hover:underline" data-testid="link-employer-register">
              Create an employer account
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground md:text-left">
            Forgot your password? Enter your email in the sign-in form and continue to access Clerk's secure password recovery.
          </p>
          <p className="text-center text-xs leading-relaxed text-muted-foreground md:text-left">
            By continuing, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-employer-login-terms">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-employer-login-privacy">Privacy Policy</Link>.
          </p>
          
          <div className="pt-4 text-center md:text-left text-sm">
            <Link href="/employers" className="text-muted-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-2" data-testid="link-back-employers">
              &larr; Back to Employer Options
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
