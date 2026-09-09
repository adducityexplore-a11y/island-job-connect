import { Link, useParams } from "wouter";
import { ArrowLeft, BadgeCheck, Building2, Search } from "lucide-react";
import {
  getGetPublicCompanyQueryKey,
  getListPublicJobsQueryKey,
  useGetPublicCompany,
  useListPublicJobs,
} from "@workspace/api-client-react";
import { SEO } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const companyId = Number.parseInt(id || "0", 10);
  const companyQuery = useGetPublicCompany(companyId, {
    query: {
      enabled: Number.isInteger(companyId) && companyId > 0,
      queryKey: getGetPublicCompanyQueryKey(companyId),
      retry: false,
    },
  });
  const company = companyQuery.data;
  const jobsQuery = useListPublicJobs(company ? { q: company.companyName } : {}, {
    query: {
      enabled: Boolean(company),
      queryKey: getListPublicJobsQueryKey(company ? { q: company.companyName } : {}),
    },
  });
  const jobs = (jobsQuery.data ?? []).filter((job) => job.companyName === company?.companyName);

  if (companyQuery.isLoading) {
    return <main className="container mx-auto max-w-5xl px-4 py-14"><Skeleton className="h-80 rounded-3xl" /></main>;
  }

  if (!company) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-5 font-display text-3xl font-bold">Company not found</h1>
        <Button asChild className="mt-7 rounded-full"><Link href="/companies">Browse companies</Link></Button>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-muted/10 pb-20">
      <SEO
        title={`${company.companyName} Careers`}
        description={`Explore active hospitality opportunities from ${company.companyName} on The Jobs MV.`}
        canonicalPath={`/companies/${company.id}`}
      />
      <section className="bg-primary px-4 py-14 text-white md:py-20">
        <div className="container mx-auto max-w-5xl">
          <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/75 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All companies
          </Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={`${company.companyName} logo`} className="h-full w-full object-contain p-3" />
              ) : (
                <Building2 className="h-11 w-11 text-primary" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-4xl font-bold md:text-5xl">{company.companyName}</h1>
                {company.verified && <BadgeCheck className="h-7 w-7 shrink-0 text-accent" aria-label="Manually verified employer" />}
              </div>
              <p className="mt-3 text-primary-foreground/75">Hospitality employer on The Jobs MV</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-primary">Active opportunities</h2>
          <Button asChild variant="outline" className="rounded-full"><Link href="/jobs"><Search className="mr-2 h-4 w-4" />All jobs</Link></Button>
        </div>
        {jobsQuery.isLoading ? (
          <div className="grid gap-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : jobs.length ? (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-secondary/40">
                <h3 className="font-display text-lg font-bold text-primary">{job.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{job.location}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            This company has no active vacancies right now.
          </div>
        )}
      </section>
    </main>
  );
}