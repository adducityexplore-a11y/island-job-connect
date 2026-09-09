import { SignIn } from "@clerk/react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div data-testid="employer-signin-form">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/employer/dashboard`}
        signUpUrl={`${basePath}/sign-up`}
      />
      <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        By continuing, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-employer-signin-terms">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-employer-signin-privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
