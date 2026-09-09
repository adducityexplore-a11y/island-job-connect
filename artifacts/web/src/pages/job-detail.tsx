import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useListPublicJobs,
  useRecordJobView,
  useCreateApplication,
  useGetCandidateJobApplicationStatus,
  getGetCandidateJobApplicationStatusQueryKey,
  useGetCandidateProfile,
  getGetCandidateProfileQueryKey,
  getListCandidateApplicationsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, MapPin, Calendar, Share2, CheckCircle2, BadgeCheck, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { offerValue, salaryValue } from "@/lib/job-offer";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useListPublicJobs();
  const recordView = useRecordJobView();
  const createApplication = useCreateApplication();

  const { data: appStatus } = useGetCandidateJobApplicationStatus(jobId, {
    query: {
      enabled: isLoaded && isSignedIn && jobId > 0,
      queryKey: getGetCandidateJobApplicationStatusQueryKey(jobId)
    }
  });

  const { data: profile, isLoading: isProfileLoading } = useGetCandidateProfile({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getGetCandidateProfileQueryKey(),
      retry: false
    }
  });

  const [viewRecorded, setViewRecorded] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  const job = jobs?.find((j) => j.id === jobId);
  const isApplying = createApplication.isPending;
  const hasApplied = appStatus?.applied === true;
  const packageDetails = job ? [
    ["Basic Salary", salaryValue(job)],
    ["Service Charge", offerValue({ label: "Service Charge", value: job.serviceCharge, disclosure: job.serviceChargeDisclosure })],
    ["Other Allowances", offerValue({ label: "Other Allowances", value: job.otherAllowances, disclosure: job.otherAllowancesDisclosure })],
    ["Overtime", offerValue({ label: "Overtime", value: job.overtime, disclosure: job.overtimeDisclosure })],
    ["Accommodation", offerValue({ label: "Accommodation", value: job.accommodation, disclosure: job.accommodationDisclosure })],
    ["Meals", offerValue({ label: "Meals", value: job.meals, disclosure: job.mealsDisclosure })],
    ["Health Insurance", offerValue({ label: "Health Insurance", value: job.healthInsurance, disclosure: job.healthInsuranceDisclosure })],
    ["Annual Leave", offerValue({ label: "Annual Leave", value: job.annualLeave, disclosure: job.annualLeaveDisclosure })],
    ["Air Ticket", offerValue({ label: "Air Ticket", value: job.airTicket, disclosure: job.airTicketDisclosure })],
    ["Working Hours", offerValue({ label: "Working Hours", value: job.workingHours, disclosure: job.workingHoursDisclosure })],
    ["Weekly Off", offerValue({ label: "Weekly Off", value: job.weeklyOff, disclosure: job.weeklyOffDisclosure })],
    ["Probation", offerValue({ label: "Probation", value: job.probation, disclosure: job.probationDisclosure })],
    ["Contract Length", offerValue({ label: "Contract Length", value: job.contractLength, disclosure: job.contractLengthDisclosure })],
  ].filter(([, value]) => value !== "Information not published") : [];

  useEffect(() => {
    if (jobId && !viewRecorded && job) {
      recordView.mutate({ id: jobId });
      setViewRecorded(true);
    }
  }, [jobId, viewRecorded, job, recordView]);

  const handleApply = () => {
    if (!isSignedIn) {
      setLocation(`/candidate/sign-in?redirect_url=/jobs/${jobId}`);
      return;
    }

    if (hasApplied || isApplying) return;

    if (!profile) {
      toast({
        variant: "destructive",
        title: "Profile required",
        description: "Please complete your Hospitality Passport before applying.",
      });
      setLocation('/passport');
      return;
    }

    if (!showApplyForm) {
      setShowApplyForm(true);
      setTimeout(() => {
        document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    createApplication.mutate({
      id: jobId,
      data: { coverLetter: coverLetter.trim() || undefined }
    }, {
      onSuccess: () => {
        toast({
          title: "Application submitted",
          description: "Your application has been recorded.",
        });
        queryClient.invalidateQueries({ queryKey: getGetCandidateJobApplicationStatusQueryKey(jobId) });
        queryClient.invalidateQueries({ queryKey: getListCandidateApplicationsQueryKey() });
        setShowApplyForm(false);
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Unable to apply",
          description: err?.data?.error || err?.message || "Please try again later.",
        });
      }
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title || "Job Opportunity",
        text: `Check out this ${job?.title} role at ${job?.companyName} on The Jobs MV`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Job link has been copied to your clipboard.",
      });
    }
  };

  if (isLoading || (isLoaded && isSignedIn && isProfileLoading)) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="pt-8 border-t border-border">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <SEO title="Job Not Found" />
        <h1 className="text-4xl font-display font-bold mb-4">Job Not Found</h1>
        <p className="text-muted-foreground mb-8">The opportunity you're looking for may have been filled or removed.</p>
        <Button asChild className="rounded-full">
          <Link href="/jobs">Browse Available Roles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/20 min-h-[calc(100dvh-5rem)] pb-32 md:pb-20 relative">
      <SEO
        title={`${job.title} at ${job.companyName}`}
        description={`Apply for the ${job.title} role at ${job.companyName} in ${job.location || 'Maldives'}. View requirements and apply via The Jobs MV.`}
        canonicalPath={`/jobs/${job.id}`}
      />
      {/* Top Banner */}
      <div className="bg-primary pt-12 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/jobs" className="inline-flex items-center text-primary-foreground/70 hover:text-white mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Find Jobs
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-white space-y-4 max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-primary-foreground/90">
                <span className="flex items-center gap-2 text-lg font-medium text-white">
                  <Building2 className="w-5 h-5" />
                  {job.companyName}
                </span>
                {job.verifiedEmployer && (
                  <span className="flex items-center gap-2 font-medium text-white">
                    <BadgeCheck className="w-5 h-5" />
                    Verified Employer
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {job.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-full h-12 w-12"
                title="Share Job"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl -mt-10 relative z-10">
        <div className="bg-card rounded-2xl md:rounded-3xl shadow-xl border border-border p-6 md:p-10 space-y-10">

          {job.applicationDeadline && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 text-accent-foreground border border-accent/20">
              <Calendar className="w-5 h-5 text-accent" />
              <p className="font-medium">
                Applications close on {format(new Date(job.applicationDeadline), "MMMM d, yyyy")}
                <span className="text-muted-foreground ml-2 font-normal">
                  ({formatDistanceToNow(new Date(job.applicationDeadline), { addSuffix: true })})
                </span>
              </p>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-display font-semibold mb-6">About the Role</h2>
            {job.description ? (
              <div className="prose prose-gray max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No detailed description provided by the employer.</p>
            )}
          </div>

          {packageDetails.length > 0 && <div className="pt-10 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-secondary mb-2">Employment Package</p>
                <h2 className="text-2xl font-display font-semibold">Employment Package</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                 Offer information: <span className="font-semibold text-foreground">{job.offerInformationCompleteness}% published</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Information is shown only when published by the employer. “Not disclosed” means the employer chose not to reveal it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packageDetails.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-sm text-muted-foreground text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>}

          <div id="apply-section" className="pt-10 border-t border-border flex flex-col items-center justify-center space-y-6">
            <h3 className="text-xl font-display font-semibold hidden md:block">Interested in this position?</h3>

            {hasApplied ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 w-full text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-display text-2xl font-bold">Application Successful</h4>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Your Hospitality Passport and CV have been securely sent to the employer. You can track its status in your candidate dashboard.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild className="rounded-full px-8 h-12">
                    <Link href="/jobs">Find More Jobs</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-primary/20 px-8 h-12">
                    <Link href="/applications">Track Application</Link>
                  </Button>
                </div>
              </div>
            ) : showApplyForm ? (
              <div className="w-full max-w-2xl bg-muted/30 rounded-2xl p-6 border border-border space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Hospitality Passport
                      </p>
                      <p className="text-sm text-muted-foreground">Your profile {profile?.cvAvailable ? "and CV" : ""} will be shared with the employer.</p>
                    </div>
                    {profile ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive mt-1" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="coverLetter" className="text-sm font-medium text-foreground">
                      Cover Letter (Optional)
                    </label>
                    <Textarea
                      id="coverLetter"
                      data-testid="input-application-cover-letter"
                      placeholder="Why are you a great fit for this role?"
                      rows={5}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      Max 5000 characters
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      By applying, you agree to the sharing and processing of your candidate information described in our <Link href="/candidate-data-consent" className="font-medium text-primary hover:underline" data-testid="link-application-candidate-data-consent">Candidate Data Consent</Link>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowApplyForm(false)}
                    className="rounded-full"
                    disabled={isApplying}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-primary/20 px-8"
                    data-testid="button-submit-application"
                  >
                    {isApplying ? "Submitting..." : "Apply with Hospitality Passport"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full max-w-lg">
                <Button
                  size="lg"
                  onClick={handleApply}
                  className="hidden md:flex rounded-full h-14 px-10 text-lg shadow-lg w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                  data-testid="button-start-application"
                >
                    {isSignedIn ? "Apply with Hospitality Passport" : "Sign in to Apply"}
                </Button>
                <p className="hidden md:block text-sm text-muted-foreground mt-4 text-center">
                  {isSignedIn
                    ? "You'll have a chance to review your application before submitting."
                    : "Create a trackable application using your Hospitality Passport."}
                </p>

                {/* Mobile Sticky Apply Bar */}
                <div className={`md:hidden fixed inset-x-0 z-40 bg-background border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] ${isSignedIn ? "bottom-[4.5rem]" : "bottom-0"}`}>
                  <Button
                    size="lg"
                    onClick={handleApply}
                    className="w-full rounded-full h-14 text-base font-semibold shadow-lg bg-primary hover:bg-primary/90 text-white"
                    data-testid="button-start-application-mobile"
                  >
                    {isSignedIn ? "Apply Now" : "Sign in to Apply"}
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
