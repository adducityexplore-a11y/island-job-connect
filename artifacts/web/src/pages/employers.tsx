import { Button } from "@/components/ui/button";
import { CheckCircle2, Building2, Users, Search, Target, Zap } from "lucide-react";
import { SEO } from "@/components/seo";
import { Link } from "wouter";

export default function Employers() {
  return (
    <div className="w-full">
      <SEO 
        title="Employer Services & Recruitment" 
        description="Post hospitality vacancies or get help screening candidates and preparing your shortlist."
      />
      {/* Hero */}
      <section className="w-full bg-primary pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary/50 via-transparent to-transparent"></div>
        <div className="container mx-auto max-w-5xl relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md mb-4">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Employer Solutions</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight">
            Find better hospitality <span className="text-secondary">candidates, faster.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Post your vacancy and manage applications yourself, or let The Jobs MV help screen candidates and build your interview-ready shortlist.
          </p>
        </div>
      </section>

      {/* Main Options */}
      <section className="w-full py-14 md:py-16 px-4 -mt-12 relative z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Full Service Card */}
            <div className="bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border flex flex-col h-full transform transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
                </div>
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold tracking-wide text-secondary">RECOMMENDED</span>
              </div>
              
              <h2 className="text-3xl font-display font-bold mb-4">Let The Jobs MV Handle It</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Tell us who you need. We'll help manage applications, screen suitable candidates and build an interview-ready shortlist.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Vacancy preparation &amp; promotion</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Expert candidate screening</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Human review of strong matches</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Candidate availability verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Interview-ready shortlist</span>
                </li>
              </ul>
              
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-14 text-lg shadow-lg shadow-primary/20">
                <Link
                  href="/employer/recruitment-requests/new"
                  data-testid="button-managed-recruitment"
                >
                  Request Candidates
                </Link>
              </Button>
            </div>

            {/* Self Service Card */}
            <div className="bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border flex flex-col h-full transform transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              
              <h2 className="text-3xl font-display font-bold mb-4">Post a Vacancy</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Prefer to manage recruitment yourself? Publish your vacancy and manage applications through your employer dashboard.
              </p>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Publish directly on The Jobs MV</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Receive applications in one dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Review Hospitality Passports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/80">Track candidates through the recruitment process</span>
                </li>
              </ul>
              
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-14 text-lg shadow-lg shadow-primary/20">
                <Link href="/employer/dashboard" data-testid="button-post-vacancy">
                  Post a Vacancy
                </Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Recruitment approach */}
      <section className="w-full py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">A clearer recruitment process</h2>
            <p className="text-lg text-muted-foreground">Support for vacancy information, candidate review and application progress.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">Clear vacancy information</h3>
              <p className="text-muted-foreground text-sm">Share the role, location, deadline and employment offer details candidates need to review a vacancy.</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
              <div className="w-14 h-14 mx-auto bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">Structured candidate profiles</h3>
              <p className="text-muted-foreground text-sm">Review experience, skills, certifications and availability through a Hospitality Passport when provided.</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
              <div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">Review with confidence</h3>
              <p className="text-muted-foreground text-sm">Recruitment experts screen relevant candidate information; hiring decisions remain with your team.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
