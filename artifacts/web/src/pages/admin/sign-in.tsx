import { SignIn } from '@clerk/react';
import { Link } from 'wouter';

export default function AdminSignIn() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[440px] space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden mb-2">
              <img 
                src={`${basePath}/images/logo_final.png`} 
                alt="The Jobs MV Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage The Jobs MV platform.
            </p>
          </div>
          
          <div className="flex justify-center">
            <SignIn 
              routing="path" 
              path={`${basePath}/admin/sign-in`}
              fallbackRedirectUrl={`${basePath}/admin`}
              signUpUrl={`${basePath}/admin/sign-in`} // No sign up for admins, redirect back to sign in
            />
          </div>
          
          <div className="text-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
              &larr; Back to public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
