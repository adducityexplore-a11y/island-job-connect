import { useAuth } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { useMemo, useEffect } from "react";
import {
  useListCandidateSavedJobs,
  useListPublicJobs,
  useDeleteCandidateSavedJob,
  getListCandidateSavedJobsQueryKey,
  getListPublicJobsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";
import { Building2, MapPin, BadgeCheck, Clock, Heart } from "lucide-react";
import { getCompactOfferIndicators, formatJobFreshness } from "@/lib/job-offer";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CandidateSavedJobs() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/candidate/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  const { data: savedJobsIds, isLoading: isLoadingSaved, error: savedError } = useListCandidateSavedJobs({
    query: { enabled: isLoaded && isSignedIn, queryKey: getListCandidateSavedJobsQueryKey() },
  });

  const { data: allPublicJobs, isLoading: isLoadingPublic, error: publicError } = useListPublicJobs(undefined, {
    query: { 
      enabled: isLoaded && isSignedIn && !!savedJobsIds?.length,
      queryKey: getListPublicJobsQueryKey()
    },
  });

  const deleteSavedJob = useDeleteCandidateSavedJob();

  const handleRemove = (jobId: number) => {
    // Optimistic update
    queryClient.setQueryData(getListCandidateSavedJobsQueryKey(), (old: number[] | undefined) => {
      if (!old) return old;
      return old.filter(id => id !== jobId);
    });

    deleteSavedJob.mutate(
      { jobId },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListCandidateSavedJobsQueryKey() });
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to remove saved job. Please try again."
          });
        }
      }
    );
  };

  const savedJobs = useMemo(() => {
    if (!savedJobsIds || !allPublicJobs) return [];
    const savedSet = new Set(savedJobsIds);
    return allPublicJobs.filter(job => savedSet.has(job.id));
  }, [savedJobsIds, allPublicJobs]);

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return <div className="container mx-auto max-w-5xl px-4 py-16"><Skeleton className="h-72 w-full rounded-2xl" /></div>;
  }

  const isLoading = isLoadingSaved || (!!savedJobsIds?.length && isLoadingPublic);
  const error = savedError || publicError;
  const showEmptyState = !isLoading && !error && (!savedJobsIds?.length || savedJobs.length === 0);

  return (
    <main className="bg-muted/20 min-h-[calc(100dvh-5rem)] py-8 md:py-14 pb-24 md:pb-14">
      <SEO title="Saved Jobs | The Jobs MV" description="View your saved hospitality job opportunities." />
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary">CANDIDATE DASHBOARD</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Saved Jobs</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm md:text-base">Opportunities you've marked for later.</p>

        {isLoading ? (
          <div className="mt-8 space-y-5">
            {[1, 2, 3].map((key) => <Skeleton key={key} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">
            We could not load your saved jobs. Please try again.
          </div>
        ) : showEmptyState ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">No saved jobs</h2>
            <p className="mt-2 text-muted-foreground">You haven't saved any job opportunities yet.</p>
            <Button variant="outline" asChild className="mt-5 rounded-full">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="group p-5 md:p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-4 md:gap-6 items-start"
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/jobs/${job.id}`} className="inline-block mb-3">
                    <h3 className="text-2xl font-semibold font-display text-foreground group-hover:text-secondary transition-colors">
                      {job.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Building2 className="w-4 h-4 text-primary" />
                      {job.companyName}
                    </span>
                    {job.verifiedEmployer && (
                      <span className="flex items-center gap-1.5 font-medium text-primary">
                        <BadgeCheck className="w-4 h-4" />
                        Verified Employer
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                    )}
                  </div>

                  {getCompactOfferIndicators(job).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {getCompactOfferIndicators(job).map((indicator, i) => (
                        <span key={i} className="rounded-full bg-muted/50 border border-border px-3 py-1 text-xs font-medium text-foreground">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  )}

                  {formatJobFreshness(job) && (
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {formatJobFreshness(job)}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto shrink-0 flex items-center gap-3 md:pt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.preventDefault(); handleRemove(job.id); }}
                    className="h-12 w-12 shrink-0 rounded-full transition-colors text-red-500 bg-red-50 hover:bg-red-100 border-red-200"
                    aria-label="Unsave job"
                    title="Unsave job"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </Button>
                  <Button asChild className="flex-1 md:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-12 shadow-sm">
                    <Link href={`/jobs/${job.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
