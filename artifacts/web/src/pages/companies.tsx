import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Search, BadgeCheck, ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";
import { useListPublicCompanies } from "@workspace/api-client-react";

export default function Companies() {
  const { data: companies, isLoading, isError } = useListPublicCompanies();

  return (
    <div className="w-full min-h-[calc(100dvh-5rem)] flex flex-col items-center bg-muted/10">
      <SEO 
        title="Featured Employers & Resorts" 
        description="Discover top hospitality brands and resorts hiring in the Maldives."
      />
      {/* Header */}
      <div className="w-full bg-primary pt-16 pb-24 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Resorts & Employers
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
            Discover the world-class properties shaping the future of Maldives hospitality. 
          </p>
        </div>
      </div>

      <div className="container relative z-10 mx-auto -mt-12 mb-20 w-full max-w-5xl px-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-52 rounded-3xl" />)}
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <h2 className="font-display text-2xl font-bold">Employer directory unavailable</h2>
            <p className="mt-3 text-muted-foreground">Please try again shortly.</p>
          </div>
        ) : companies?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group flex min-h-52 flex-col rounded-3xl border border-border bg-card p-6 shadow-lg transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-xl"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/5">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={`${company.companyName} logo`} className="h-full w-full object-contain p-2" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-6 flex items-start gap-2">
                  <h2 className="font-display text-xl font-bold text-primary">{company.companyName}</h2>
                  {company.verified && <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-label="Manually verified employer" />}
                </div>
                <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-secondary">
                  View company <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
            <Building2 className="mx-auto h-12 w-12 text-secondary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl font-bold">Employer directory coming soon</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Browse current opportunities while employers complete their public company pages.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="h-12 rounded-full bg-primary">
            <Link href="/jobs"><Search className="mr-2 h-5 w-5" />Browse Open Jobs</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-2">
            <Link href="/employers">I'm an Employer <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
