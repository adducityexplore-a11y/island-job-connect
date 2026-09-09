import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6" data-testid="footer-logo">
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center">
                <img src={`${import.meta.env.BASE_URL}images/logo_final.png`} alt="The Jobs MV" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="font-display font-bold text-xl text-white">The Jobs MV</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-sm">
              Connecting hospitality professionals with resort opportunities across the Maldives. Discover roles, build your profile, and apply with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">For Candidates</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/jobs" className="hover:text-secondary transition-colors" data-testid="footer-link-jobs">Browse Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-secondary transition-colors" data-testid="footer-link-companies">Featured Employers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">For Employers</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/employers" className="hover:text-secondary transition-colors" data-testid="footer-link-services">Recruitment Services</Link></li>
              <li><Link href="/employers" className="hover:text-secondary transition-colors" data-testid="footer-link-post">Post a Job</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/about" className="hover:text-secondary transition-colors" data-testid="footer-link-about">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors" data-testid="footer-link-contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            &copy; {currentYear} The Jobs MV. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">Terms and Conditions</Link>
            <Link href="/employer-terms" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">Employer Terms</Link>
            <Link href="/candidate-data-consent" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">Candidate Data Consent</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
