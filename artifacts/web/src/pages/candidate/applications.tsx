import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { format } from "date-fns";
import { BriefcaseBusiness, Check, Circle, Clock3, FileText, LogIn } from "lucide-react";
import { useListCandidateApplications, getListCandidateApplicationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo";

const stages = [
  ["Application Received", "Received", "receivedAt"],
  ["Reviewed", "Under Review", "reviewedAt"],
  ["Shortlisted", "Shortlisted", "shortlistedAt"],
  ["Interview", "Interview", "interviewAt"],
  ["decision", "Decision", ""],
] as const;

const order = [
  "Application Received",
  "New Applicant", // treating as equivalent to received
  "AI Reviewed", // treating as reviewed
  "Reviewed",
  "Shortlisted",
  "Interview",
  "Selected", // equivalent to offered
  "Offered",
  "Hired",
  "Rejected",
  "Not Selected"
];

function stageIndex(status: string) {
  if (["Application Received", "New Applicant"].includes(status)) return 0;
  if (["Reviewed", "AI Reviewed"].includes(status)) return 1;
  if (status === "Shortlisted") return 2;
  if (status === "Interview") return 3;
  if (["Offered", "Hired", "Selected", "Not Selected", "Rejected"].includes(status)) return 4;
  return -1;
}

function stageTime(application: Record<string, unknown>, stage: string) {
  if (stage === "decision") {
    return application.hiredAt || application.offeredAt || application.notSelectedAt || application.rejectedAt;
  }
  if (stage === "Application Received") return application.receivedAt || application.createdAt;
  if (stage === "Reviewed") return application.reviewedAt;
  if (stage === "Shortlisted") return application.shortlistedAt;
  if (stage === "Interview") return application.interviewAt;
  return null;
}

function label(status: string) {
  const labels: Record<string, string> = {
    "Application Received": "Application received",
    "New Applicant": "Application received",
    "AI Reviewed": "Under review",
    "Reviewed": "Under review",
    "Shortlisted": "Shortlisted",
    "Interview": "Interview stage",
    "Selected": "Selected",
    "Offered": "Offer made",
    "Hired": "Hired",
    "Rejected": "Not selected",
    "Not Selected": "Not selected",
  };
  return labels[status] || "Application update";
}

export default function CandidateApplications() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data, isLoading, error } = useListCandidateApplications({
    query: { enabled: isLoaded && isSignedIn, queryKey: getListCandidateApplicationsQueryKey() },
  });

  if (!isLoaded) return <div className="container mx-auto max-w-5xl px-4 py-16"><Skeleton className="h-72 w-full rounded-2xl" /></div>;
  if (!isSignedIn) return (
    <main className="container mx-auto max-w-xl px-4 py-16 text-center">
      <FileText className="mx-auto mb-5 h-12 w-12 text-primary" />
      <h1 className="font-display text-3xl font-bold">Your applications, in one place</h1>
      <p className="mt-3 text-muted-foreground">Sign in to see the recruitment updates shared with you.</p>
      <Button asChild className="mt-6 rounded-full"><Link href="/candidate/sign-in"><LogIn className="mr-2 h-4 w-4" />Sign in</Link></Button>
    </main>
  );

  return (
    <main className="bg-muted/20 py-8 md:py-14 pb-24 md:pb-14 min-h-[calc(100dvh-5rem)]">
      <SEO title="My Applications | The Jobs MV" description="Track your job applications with The Jobs MV." />
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary">CANDIDATE DASHBOARD</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">My Applications</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm md:text-base">Track your application status and updates.</p>
        {isLoading ? <div className="mt-8 space-y-5">{[1, 2].map((key) => <Skeleton key={key} className="h-56 w-full rounded-2xl" />)}</div>
          : error ? <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">We could not load your applications. Please try again.</div>
          : !data?.length ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-display text-xl font-bold">No applications yet</h2>
              <p className="mt-2 text-muted-foreground">Explore current hospitality opportunities when you are ready.</p>
              <Button variant="outline" asChild className="mt-5 rounded-full"><Link href="/jobs">Find Jobs</Link></Button>
            </div>
          ) : <div className="mt-8 space-y-4">{data.map((application) => {
            const current = stageIndex(application.status);
            return <article key={application.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div><p className="font-display text-xl font-bold">{application.jobTitle}</p><p className="mt-1 text-sm text-muted-foreground">{application.companyName}</p></div>
                <span className="h-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary text-center">{label(application.status)}</span>
              </div>
               {(application.receivedAt || application.createdAt) && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />Applied {format(new Date(application.receivedAt || application.createdAt), "d MMM yyyy")}</p>}
              <ol className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-5 sm:gap-2">{stages.map(([key, title], index) => {
                const time = stageTime(application as unknown as Record<string, unknown>, key);
                const formattedTime = time ? format(new Date(String(time)), "d MMM") : null;
                const complete = Boolean(time) || current > index || (key === "decision" && current === 4);
                const active = !complete && current === index;
                return <li key={key} className="flex min-w-0 items-center gap-2 sm:flex-col sm:items-start">
                  {complete ? <Check className="h-5 w-5 shrink-0 rounded-full bg-primary p-1 text-primary-foreground" /> : active ? <Circle className="h-5 w-5 shrink-0 fill-primary text-primary" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />}
                  <div><p className="text-sm font-medium">{title}</p>{formattedTime && <p className="text-xs text-muted-foreground">{formattedTime}</p>}</div>
                </li>;
              })}</ol>
            </article>;
          })}</div>}
      </div>
    </main>
  );
}