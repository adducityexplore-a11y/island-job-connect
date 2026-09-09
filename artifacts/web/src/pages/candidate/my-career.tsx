import { useMemo } from "react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Heart,
  LogIn,
  Search,
  Sparkles,
  UsersRound,
  ArrowRight,
  Clock,
  Building2,
  MapPin,
  ChevronRight
} from "lucide-react";
import {
  getGetCandidateProfileQueryKey,
  getListCandidateApplicationsQueryKey,
  getListCandidateSavedJobsQueryKey,
  useGetCandidateProfile,
  useListCandidateApplications,
  useListCandidateSavedJobs,
  useListPublicJobs,
  getListPublicJobsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { formatJobFreshness } from "@/lib/job-offer";

function getPassportCompletion(profile: Record<string, unknown> | undefined) {
  if (!profile) return 0;

  const fields = [
    "headline",
    "phone",
    "location",
    "summary",
    "cvAvailable",
    "currentEmployer",
    "nationality",
    "totalHospitalityExperience",
    "availabilityStatus",
    "education",
  ];
  const filledFields = fields.filter((field) => Boolean(profile[field])).length;
  const hasWorkHistory = Array.isArray(profile.workHistory) && profile.workHistory.length > 0;
  const hasLanguages = Array.isArray(profile.languageProficiencies) && profile.languageProficiencies.length > 0;

  return Math.round(((filledFields + Number(hasWorkHistory) + Number(hasLanguages)) / 12) * 100);
}

export default function MyCareer() {
  const { isLoaded, isSignedIn } = useAuth();

  const profileQuery = useGetCandidateProfile({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getGetCandidateProfileQueryKey(),
      retry: (failureCount, error) => {
        const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
        return status !== 404 && failureCount < 2;
      },
    },
  });

  const applicationsQuery = useListCandidateApplications({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getListCandidateApplicationsQueryKey(),
    },
  });

  const savedJobsQuery = useListCandidateSavedJobs({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getListCandidateSavedJobsQueryKey(),
    },
  });

  const latestJobsQuery = useListPublicJobs({}, {
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getListPublicJobsQueryKey({}),
    }
  });

  const profile = profileQuery.data;
  const completion = useMemo(
    () => getPassportCompletion(profile as unknown as Record<string, unknown> | undefined),
    [profile],
  );

  const applications = applicationsQuery.data ?? [];
  const latestJobs = latestJobsQuery.data?.slice(0, 3) ?? [];

  const profileUnavailable = typeof profileQuery.error === "object" && profileQuery.error !== null && "status" in profileQuery.error && profileQuery.error.status === 404;
  const cvAvailable = Boolean((profile as unknown as Record<string, unknown> | undefined)?.cvAvailable);

  if (!isLoaded) {
    return <div className="container mx-auto max-w-6xl px-4 py-14"><Skeleton className="h-[540px] w-full rounded-3xl" /></div>;
  }

  if (!isSignedIn) {
    return (
      <main className="overflow-hidden bg-muted/20 pb-20 md:pb-0">
        <SEO title="My Career | The Jobs MV" description="Build your Hospitality Passport, discover opportunities, and track your applications." />
        <section className="container mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary px-6 py-12 text-primary-foreground shadow-xl md:px-12 md:py-16">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold tracking-[0.18em] text-accent">MORE THAN A JOB SEARCH</p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">Your experience deserves to be seen.</h1>
              <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80">Create your Hospitality Passport, discover hospitality opportunities, apply faster, and make it easier for employers to understand what you can bring to their team.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-accent px-7 font-semibold text-accent-foreground hover:bg-accent/90">
                  <Link href="/jobs"><Search className="mr-2 h-4 w-4" />Find Opportunities</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 px-7 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                  <Link href="/candidate/sign-in?redirect_url=%2Fpassport">Build My Hospitality Passport</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const name = profile?.fullName?.trim().split(" ")[0];

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-muted/20 py-8 md:py-14 pb-24 md:pb-14">
      <SEO title="My Career | The Jobs MV" description="Keep your Hospitality Passport current and track your hospitality career with The Jobs MV." />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl text-primary">
              {name ? `Welcome back, ${name}.` : "Your Career Home"}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm md:text-base">
              Manage your Hospitality Passport and discover your next role in the Maldives.
            </p>
          </div>
        </div>

        <section aria-labelledby="career-tools-heading">
          <h2 id="career-tools-heading" className="mb-3 font-display text-lg font-bold text-primary">
            Career Tools
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/passport" className="group flex min-h-24 items-center gap-4 rounded-2xl border border-secondary/25 bg-secondary/10 p-4 shadow-sm transition-all hover:border-secondary/50 hover:bg-secondary/15 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-primary">Hospitality Passport</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{completion}% complete</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href="/saved-jobs" className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-primary">Saved Jobs</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {savedJobsQuery.isLoading ? "Loading…" : `${savedJobsQuery.data?.length ?? 0} saved`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>

            <Link href="/applications" className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-primary">My Applications</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {applicationsQuery.isLoading ? "Loading…" : `${applications.length} submitted`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </div>
        </section>

        {/* Action / Passport Section */}
        <Card className="border-secondary/20 shadow-sm overflow-hidden bg-gradient-to-br from-primary to-secondary text-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-[0.16em] uppercase">Hospitality Passport</span>
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  {profile ? `${completion}% Complete` : "Build your Passport"}
                </h2>
                <p className="text-primary-foreground/80 text-sm max-w-xl">
                  {completion === 100
                    ? "Your Passport is fully complete. Keep your availability updated."
                    : cvAvailable
                      ? "Add more details to your Passport to stand out to top employers."
                      : "Upload your CV to securely store it and apply to jobs faster."}
                </p>
                <div className="mt-5 max-w-md">
                  <Progress value={completion} className="h-2 bg-white/20" />
                </div>
              </div>
              <div className="shrink-0 flex flex-col w-full md:w-auto gap-3">
                <Button asChild size="lg" className="w-full rounded-full bg-white text-primary hover:bg-white/90">
                  <Link href="/passport">
                    {completion < 100 ? "Complete Passport" : "Update Passport"}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Opportunities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Latest Opportunities</h2>
            <Link href="/jobs" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            {latestJobsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))
            ) : latestJobs.length > 0 ? (
              latestJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block group p-5 rounded-2xl bg-card border border-border hover:border-secondary/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-secondary transition-colors truncate">
                        {job.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-y-1 gap-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          {job.companyName}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                        {formatJobFreshness(job) && (
                          <span className="flex items-center gap-1 text-primary">
                            <Clock className="w-3.5 h-3.5" />
                            {formatJobFreshness(job)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No recent opportunities found.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
