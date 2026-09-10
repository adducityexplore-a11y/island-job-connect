import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ClipboardList,
  Handshake,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { SEO } from "@/components/seo";

const seekerProblems = [
  "Job openings scattered across social media groups and word of mouth",
  "Unclear salary, benefits, and job details before you apply",
  "Long waits with little or no response after applying",
];

const employerProblems = [
  "Hundreds of unqualified applications to sort through manually",
  "Recruitment agencies that are slow, costly, or hard to reach",
  "Strong candidates lost to faster-moving competitors",
];

const howWeHelp = [
  {
    icon: ShieldCheck,
    title: "Verified Opportunities",
    description: "Every job listed is checked and kept current, so you're never applying to something outdated.",
  },
  {
    icon: Search,
    title: "Expert Screening",
    description: "Our team reviews applications and shortlists candidates who genuinely fit the role.",
  },
  {
    icon: Clock,
    title: "Faster Connections",
    description: "Job seekers and employers connect directly, without weeks of back and forth.",
  },
];

const steps = [
  {
    number: "01",
    icon: Send,
    title: "Post or Apply",
    description: "Employers post a vacancy. Job seekers apply in minutes with their JobsMV profile.",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Screen & Review",
    description: "Our team screens applications and reviews candidates before they're shortlisted.",
  },
  {
    number: "03",
    icon: Handshake,
    title: "Connect & Hire",
    description: "Employers interview a ready shortlist and hire with confidence.",
  },
];

const seekerBenefits = [
  { icon: CheckCircle2, label: "Verified hospitality jobs only" },
  { icon: Wallet, label: "Clear salary and benefits upfront" },
  { icon: MessageCircle, label: "Apply directly via WhatsApp or your profile" },
  { icon: ShieldCheck, label: "Free to use, always" },
];

const employerBenefits = [
  { icon: ClipboardList, label: "Pre-screened, interview-ready shortlists" },
  { icon: Clock, label: "Faster time-to-hire" },
  { icon: Users, label: "Access to Maldives hospitality talent" },
  { icon: CheckCircle2, label: "Simple, transparent process" },
];

export default function About() {
  return (
    <div className="w-full">
      <SEO
        title="Why JobsMV"
        description="Why JobsMV exists, the hiring and job-search problems it solves, and how the platform connects the right hospitality talent with the right opportunity in the Maldives."
      />

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-5">Why JobsMV</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
            The faster way to hire and get hired in Maldives hospitality.
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto mb-10">
            JobsMV connects verified resorts and hotels with screened, work-ready hospitality talent — so good people and good jobs don't have to wait.
          </p>
          <Button size="lg" asChild className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground h-14 px-8 text-base font-semibold shadow-lg w-full sm:w-auto">
            <Link href="/jobs" data-testid="button-why-hero-jobs">
              Browse Jobs <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-5 text-sm text-primary-foreground/70">
            Hiring instead?{" "}
            <Link href="/employers" className="underline underline-offset-4 hover:text-white" data-testid="link-why-hero-employers">
              See employer services
            </Link>
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 md:py-20 px-4 bg-muted/30" aria-labelledby="why-problem-heading">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="why-problem-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-4">The Problem</h2>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              Hospitality hiring in the Maldives has been slow and disconnected for too long.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                  <Users className="w-5 h-5 text-secondary" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-display font-bold text-foreground">For Job Seekers</h3>
              </div>
              <ul className="space-y-3">
                {seekerProblems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-secondary/60 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Building2 className="w-5 h-5 text-accent" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-display font-bold text-foreground">For Employers</h3>
              </div>
              <ul className="space-y-3">
                {employerProblems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How JobsMV Helps */}
      <section className="py-16 md:py-20 px-4" aria-labelledby="why-helps-heading">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 id="why-helps-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-4">How JobsMV Helps</h2>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              We connect the right talent with the right opportunity, at the right time.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            {howWeHelp.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-4 bg-muted/30" aria-labelledby="why-steps-heading">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 id="why-steps-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-4">How It Works</h2>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              Three simple steps, for job seekers and employers alike.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-display text-xl font-bold text-accent">{number}</span>
                  <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 px-4" aria-labelledby="why-benefits-heading">
        <div className="container mx-auto max-w-5xl">
          <h2 id="why-benefits-heading" className="sr-only">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-6">For Job Seekers</h3>
              <ul className="space-y-4">
                {seekerBenefits.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                      <Icon className="w-5 h-5 text-secondary" aria-hidden="true" />
                    </span>
                    <span className="text-foreground font-medium">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-6">For Employers</h3>
              <ul className="space-y-4">
                {employerBenefits.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
                    </span>
                    <span className="text-foreground font-medium">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section className="py-16 md:py-20 px-4 bg-muted/30" aria-labelledby="why-mission-heading">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-6">
            <div>
              <h2 id="why-mission-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-3">Our Mission</h2>
              <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
                Great talent should never be lost to a slow hiring process.
              </p>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">Our Vision</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                A future where every employer can reach the people they need, and every job seeker has a fair chance to be discovered.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border shadow-sm rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">People First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Behind every CV is a person looking for an opportunity. Behind every vacancy is a team looking for the right person.
              </p>
            </div>
            <div className="bg-card border border-border shadow-sm rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-display font-bold mb-3">Time Matters</h3>
              <p className="text-muted-foreground leading-relaxed">
                Great talent doesn't wait forever. We help employers and job seekers connect before opportunities are lost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-6">Get Started</h2>
            <p className="text-3xl md:text-5xl font-display font-bold mb-10">
              Right Talent. Right Opportunity. Right Time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-full bg-secondary hover:bg-secondary/90 text-white h-14 px-8 shadow-lg shadow-secondary/20 w-full sm:w-auto">
                <Link href="/jobs" data-testid="button-why-cta-jobs">
                  Find Jobs <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-8 border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm w-full sm:w-auto">
                <Link href="/employers" data-testid="button-why-cta-employers">
                  For Employers
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
