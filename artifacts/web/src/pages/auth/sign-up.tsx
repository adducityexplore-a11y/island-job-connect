import { SignUp } from "@clerk/react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SignUpPageProps {
  authPath?: string;
  signInPath?: string;
}

export default function SignUpPage({ authPath = "/sign-up", signInPath = "/sign-in" }: SignUpPageProps) {
  return (
    <div data-testid="employer-signup-form">
      <SignUp
        routing="path"
        path={`${basePath}${authPath}`}
        fallbackRedirectUrl={`${basePath}/employer/dashboard`}
        signInUrl={`${basePath}${signInPath}`}
      />
      <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        By creating an employer account, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-employer-signup-terms">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-employer-signup-privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
