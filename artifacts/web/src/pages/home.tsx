import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListPublicJobs } from "@workspace/api-client-react";
import { ArrowRight, Briefcase, MapPin, Search, ArrowUpRight, CalendarCheck, ClipboardList, UserCheck, Send, Users, ChevronRight, Clock, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/react";
import { SEO } from "@/components/seo";
import { formatDeadline, getOfferIndicators } from "@/lib/job-offer";

export default function Home() {
  const { data: jobs, isLoading } = useListPublicJobs();
  const { isSignedIn } = useAuth();

  const featuredJobs = jobs?.slice(0, 4) || [];

  return (
    <div className="flex w-full flex-col bg-[#f2f9f9]">
      <SEO
        title="Maldives Hospitality Jobs & Recruitment | The Jobs MV"
        description="Find verified hospitality jobs, clearer employment offers and smarter connections in the Maldives."
        ogImage={`${import.meta.env.BASE_URL}images/maldives_hero.png`}
      />

      {/* Hero Section */}
      <section className="relative w-full h-[100svh] min-h-[600px] max-h-[900px] flex flex-col justify-end pb-24 md:pb-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={`${import.meta.env.BASE_URL}images/maldives_hero.png`}
            alt="Maldives Resort"
            className="w-full h-full object-cover object-[center_30%] animate-slow-pan"
          />
          {/* Elegant gradient overlay for maximum readability and cinematic contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-black/20"></div>
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto">
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-sm bg-white/10 backdrop-blur-md border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-xs font-semibold tracking-[0.2em] text-white uppercase">The Premium Network</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-semibold text-white leading-[1.05] tracking-tight">
              Elevating Maldives <br className="hidden md:block"/>
              <span className="text-accent italic font-light pr-2">hospitality</span> careers.
            </h1>

            <p className="text-lg md:text-2xl text-white/80 max-w-2xl font-light leading-relaxed">
              We bridge the gap between world-class resorts and the professionals who bring them to life. Right Talent. Right Opportunity. Right Time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-sm h-14 px-8 text-base font-semibold shadow-2xl transition-transform hover:-translate-y-1 w-full sm:w-auto">
                <Link href="/jobs" data-testid="button-hero-find-job">
                  Explore Opportunities <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-sm h-14 px-8 text-base font-medium backdrop-blur-sm transition-transform hover:-translate-y-1 w-full sm:w-auto">
                <Link href="/employers" data-testid="button-hero-hire">
                  Hire with Confidence
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="relative w-full overflow-hidden bg-[#e8f4f4] py-24 md:py-32">
        <div className="pointer-events-none absolute -right-28 top-16 h-72 w-72 rounded-full border border-accent/25" />
        <div className="pointer-events-none absolute -right-12 top-32 h-44 w-44 rounded-full border border-accent/25" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-20">
            <div className="max-w-3xl">
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                <Clock className="w-4 h-4" /> Active Vacancies
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-foreground tracking-tight">
                Current <span className="font-serif font-normal italic text-amber-700">Opportunities</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Explore current hospitality roles across the Maldives, with clearer offers and the details you need to take your next step.
              </p>
            </div>
            <Button variant="ghost" asChild className="group hidden rounded-none border-b border-amber-700/30 px-0 pb-2 text-base font-semibold text-amber-800 hover:bg-transparent hover:text-primary sm:flex">
              <Link href="/jobs">
                View all positions
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-h-[330px] rounded-[1.75rem] border border-primary/10 bg-white p-7 md:p-9">
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="mt-12 space-y-4">
                      <Skeleton className="h-9 w-4/5" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2 pt-3">
                        <Skeleton className="h-7 w-24 rounded-full" />
                        <Skeleton className="h-7 w-32 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="mt-auto h-5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {featuredJobs.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-7 shadow-[0_12px_40px_rgba(9,24,54,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-700/30 hover:shadow-[0_24px_60px_rgba(9,24,54,0.13)] md:p-9"
                  data-testid={`card-job-${job.id}`}
                >
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[5rem] bg-accent/[0.08] transition-transform duration-500 group-hover:scale-125" />
                  <div className="relative flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-700">
                        Opportunity {String(index + 1).padStart(2, "0")}
                      </p>
                      <div className="mt-2 font-semibold text-foreground">{job.companyName}</div>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-[#e8f4f4] text-primary transition-all duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-primary">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="relative mt-10 text-2xl font-display font-semibold leading-tight text-foreground transition-colors group-hover:text-primary/75 md:text-3xl">
                    {job.title}
                  </h3>
                  {job.description && (
                    <p className="relative mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {job.description}
                    </p>
                  )}
                  {getOfferIndicators(job).length > 0 && (
                    <div className="relative mt-5 flex flex-wrap gap-2">
                      {getOfferIndicators(job).map((indicator) => (
                        <span key={indicator.label} className="rounded-full border border-primary/10 bg-[#e8f4f4] px-3 py-1.5 text-xs font-medium text-foreground/80">
                          {indicator.label}: {indicator.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/10 pt-5 text-xs font-medium text-muted-foreground">
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary" /> {job.location}
                      </span>
                    )}
                    {job.verifiedEmployer && (
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Verified Employer
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1.5">
                      {formatDeadline(job.applicationDeadline) ? (
                        <>
                          <CalendarCheck className="h-3.5 w-3.5 text-amber-700" />
                          Closes {formatDeadline(job.applicationDeadline)}
                        </>
                      ) : (
                        "Ongoing"
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-y border-primary/10 bg-white/50 py-24 text-center">
              <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-3">No Active Vacancies</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                There are currently no public opportunities listed. Please check back soon or ensure your Hospitality Passport is up to date.
              </p>
            </div>
          )}

          <div className="mt-12 flex justify-center sm:hidden">
            <Button variant="outline" size="lg" asChild className="w-full rounded-sm h-14 group">
              <Link href="/jobs">
                View All Opportunities
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hospitality Passport */}
      <section className="w-full bg-primary py-24 md:py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full border-[1px] border-white/5 opacity-50 pointer-events-none"></div>
        <div className="absolute top-10 right-10 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full border-[1px] border-white/5 opacity-50 pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-5 space-y-8">
              <div>
                <p className="text-accent font-semibold uppercase tracking-[0.2em] text-sm mb-4">Hospitality Passport</p>
                <h2 className="text-4xl md:text-5xl font-display font-semibold text-white leading-[1.1]">
                  One Profile.<br />
                  <span className="text-white/60 italic font-light">Every Opportunity.</span>
                </h2>
              </div>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-lg font-light">
                Build a single, comprehensive professional identity. Highlight your experience, skills, and availability once. Apply instantly and help employers understand your true value beyond a traditional CV.
              </p>
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 rounded-sm h-14 px-8 text-base font-semibold transition-transform hover:-translate-y-1">
                <Link href={isSignedIn ? "/passport" : "/candidate/sign-in"} data-testid="button-hospitality-passport">
                  {isSignedIn ? "Access Passport" : "Create Passport"} <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="lg:col-span-6 lg:col-start-7 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  "Experience", "Maldives Experience", "Resort Experience",
                  "Skills", "Certifications", "Languages",
                  "Availability", "Notice Period"
                ].map((item) => (
                  <div key={item} className="bg-white/5 border border-white/10 p-5 backdrop-blur-sm transition-colors hover:bg-white/10 flex items-center justify-between group rounded-sm">
                    <span className="text-sm md:text-base font-medium text-white/90">{item}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Jobs MV Reviewed */}
      <section className="w-full border-y border-primary/10 bg-[#f2f9f9] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-700">The Jobs MV Reviewed</p>
            <h2 className="text-3xl md:text-5xl font-display font-semibold text-foreground leading-[1.1] mb-6 tracking-tight">
              Expert screening. <br className="hidden md:block" /> Human review.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Our experts help identify strong matches. We manually review shortlisted candidates before presenting them to employers, ensuring credibility on both sides. Reviewed status only appears after an authorized manual review.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-[1px] bg-border -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-10 relative z-10">
              {[
                [Briefcase, "Vacancy Posted"],
                [Send, "Applications"],
                [Search, "Expert Screening"],
                [UserCheck, "Manual Review"],
                [ClipboardList, "Shortlist Built"],
                [Users, "Employer Interview"],
              ].map(([Icon, label], index) => (
                <div key={label as string} className="flex flex-col items-center group">
                  <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/10 bg-white shadow-sm transition-all group-hover:-translate-y-1 group-hover:border-amber-700/35 group-hover:shadow-md">
                    <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-amber-700" />
                  </div>
                  <p className="text-sm font-semibold text-center text-foreground leading-tight">
                    <span className="block text-xs text-muted-foreground mb-1.5 font-mono">{String(index + 1).padStart(2, '0')}</span>
                    {label as string}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="w-full bg-[#f7fbfb] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              [ShieldCheck, "Verified & Fresh Jobs", "Clearer vacancy sources, deadlines and employer information, with expired opportunities kept off the active jobs list."],
              [ClipboardList, "Clearer Offers", "See salary, service charge, accommodation and other employment benefits when provided by the employer."],
              [CalendarCheck, "Application Tracking", "Follow applications from received and reviewed through shortlist, interview and final outcome when recruitment is managed through The Jobs MV."],
            ].map(([Icon, title, description]) => (
              <div key={title as string} className="space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-700/15 bg-accent/10 text-primary">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-semibold text-2xl text-foreground tracking-tight">{title as string}</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {description as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer Services */}
      <section id="employer-services" className="w-full bg-[#e8f4f4] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div className="space-y-9 lg:sticky lg:top-28">
              <div>
                <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                  <span className="h-px w-8 bg-amber-600" />
                  Employer Services
                </p>
                <h2 className="mb-7 text-4xl font-display font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                  Don't lose great talent because hiring takes too long.
                </h2>
                <p className="mb-7 text-lg leading-relaxed text-muted-foreground md:text-xl">
                  Tell us who you need. We screen and review suitable candidates, then deliver an interview-ready shortlist so you can hire faster.
                </p>
                <div className="flex items-start gap-4 border-y border-primary/10 py-5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground/80 md:text-base">
                    Built for resorts, hotels, guesthouses and hospitality businesses that need a faster, simpler way to recruit.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Need our help?</p>
                  <Button size="lg" asChild className="h-14 w-full rounded-full bg-primary px-7 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-xl">
                    <Link href="/employers" data-testid="button-home-request-candidates">
                      Request Candidates <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manage hiring yourself?</p>
                  <Button size="lg" variant="outline" asChild className="h-14 w-full rounded-full border-primary/25 bg-transparent px-7 text-base font-medium text-primary transition-all hover:-translate-y-1 hover:border-primary hover:bg-white">
                    <Link href="/employer/dashboard" data-testid="button-home-post-vacancy">
                      Post a Vacancy
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_70px_rgba(9,24,54,0.16)] md:aspect-[5/4]">
                <img
                  src={`${import.meta.env.BASE_URL}images/employer-services-team.jpg`}
                  alt="Hospitality professionals working together in a Maldives resort"
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.025]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-primary/65 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md md:left-7 md:top-7">
                  Maldives Hospitality Recruitment
                </div>
              </div>

              <div className="relative z-10 -mt-8 grid gap-3 px-3 md:-mt-10 md:grid-cols-3 md:px-5">
                {[
                  {
                    number: "01",
                    icon: ClipboardList,
                    title: "Tell Us Who You Need",
                    description: "Share the position and key requirements.",
                  },
                  {
                    number: "02",
                    icon: UserCheck,
                    title: "We Screen & Review",
                    description: "Our hospitality team identifies and reviews suitable candidates.",
                  },
                  {
                    number: "03",
                    icon: Send,
                    title: "You Interview & Hire",
                    description: "Receive an interview-ready shortlist and make your hiring decision.",
                  },
                ].map(({ number, icon: Icon, title, description }) => (
                  <div key={number} className="rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_12px_32px_rgba(9,24,54,0.1)]">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="font-display text-xl font-semibold text-amber-600">{number}</span>
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-tight text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why JobsMV */}
      <section className="w-full py-24 md:py-32 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-foreground/5 via-primary to-primary"></div>

        <div className="container mx-auto px-4 md:px-6 max-w-3xl relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-8">Why JobsMV</p>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold mb-8 leading-[1.05] tracking-tight">
            Great talent should never be lost to a slow hiring process.
          </h2>

          <p className="text-lg md:text-xl text-white/70 leading-relaxed font-light mb-10 max-w-2xl mx-auto">
            We make hospitality recruitment faster and simpler, helping employers find the right people and job seekers reach the right opportunities when they matter most.
          </p>

          <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-8 border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
            <Link href="/about" data-testid="button-home-why-jobsmv">
              See Why JobsMV <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          <div className="mt-16 pt-10 border-t border-white/10">
            <p className="text-xl md:text-3xl font-display font-semibold italic text-accent/90 tracking-tight">
              Right Talent. Right Opportunity. Right Time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}