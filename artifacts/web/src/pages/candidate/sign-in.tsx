import { SignIn } from "@clerk/react";
import { Link, useSearch } from "wouter";
import { SEO } from "@/components/seo";

export default function CandidateSignIn() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const rawRedirect = searchParams.get("redirect_url");

  let safeRedirectPath = "/my-career";
  if (rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")) {
    safeRedirectPath = rawRedirect;
  }

  let wouterPath = safeRedirectPath;
  if (basePath && wouterPath.startsWith(basePath)) {
    wouterPath = wouterPath.slice(basePath.length) || "/";
  }

  const forceRedirectUrl = `${basePath}${wouterPath}`;
  const nextRedirectQuery = encodeURIComponent(wouterPath);

  return (
    <div className="min-h-[100dvh] bg-muted/30 flex items-center justify-center p-4">
      <SEO title="Candidate Sign In | The Jobs MV" description="Sign in to build your Hospitality Passport and manage your applications." />
      <div className="w-full max-w-[440px] space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex h-14 w-14 rounded-full bg-primary items-center justify-center overflow-hidden shadow-md">
            <img src={`${basePath}/images/logo_final.png`} alt="The Jobs MV" className="h-full w-full object-cover" />
          </Link>
          <p className="text-xs font-bold tracking-[0.16em] text-secondary">MORE THAN A JOB SEARCH</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Your experience deserves to be seen.</h1>
          <p className="text-muted-foreground">Sign in to manage your Hospitality Passport, opportunities and applications.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-2 shadow-sm flex justify-center" data-testid="candidate-signin-form">
          <SignIn
            routing="path"
            path={`${basePath}/candidate/sign-in`}
            forceRedirectUrl={forceRedirectUrl}
            signUpUrl={`${basePath}/candidate/sign-up?redirect_url=${nextRedirectQuery}`}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Forgot your password? Enter your email in the sign-in form and continue to access secure password recovery.
        </p>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to our <Link href="/terms-and-conditions" className="font-medium text-primary hover:underline" data-testid="link-candidate-signin-terms">Terms and Conditions</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-candidate-signin-privacy">Privacy Policy</Link>.
        </p>
        <p className="text-center text-sm">
          <Link href="/" className="text-muted-foreground hover:text-primary">&larr; Back to The Jobs MV</Link>
        </p>
      </div>
    </div>
  );
}