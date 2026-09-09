import { Link } from "wouter";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarCheck, FileText, Sparkles, UserCheck, UserPlus, UserSearch } from "lucide-react";
import { useGetRecruiterDashboard, useListRecruiterApplications } from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statMeta = [
  ["Active Vacancies", "activeJobs", BriefcaseBusiness],
  ["New Applicants", "newApplicants", UserPlus],
  ["Shortlisted", "shortlisted", UserCheck],
  ["Interviews", "interview", CalendarCheck],
] as const;

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] || "?").toUpperCase();
};

function StatusBadge({ status }: { status: string }) {
  const getStyles = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes("new") || lower.includes("received")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (lower.includes("shortlisted") || lower.includes("selected") && !lower.includes("not")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (lower.includes("interview")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (lower.includes("hired") || lower.includes("offered")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (lower.includes("not") || lower.includes("rejected")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", getStyles(status))}>
      {status}
    </span>
  );
}

export default function EmployerDashboard() {
  const dashboard = useGetRecruiterDashboard();
  const applications = useListRecruiterApplications();

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">

        {/* Header Section */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Your Hiring</h1>
          <p className="mt-1 text-muted-foreground">Everything you need to manage your hiring, in one simple place.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statMeta.map(([label, key, Icon]) => (
            <Card key={key} className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold leading-none text-foreground" data-testid={`metric-${key}`}>
                    {dashboard.isLoading ? <Skeleton className="h-6 w-10" /> : (dashboard.data?.[key] ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border-[#EAE5D9] bg-[#FCFBF7] shadow-sm">
          <CardContent className="grid gap-10 p-6 md:grid-cols-12 md:gap-12 md:p-10">
            <div className="flex flex-col justify-center md:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D9A520]">
                <Sparkles className="h-3.5 w-3.5" />
                The Jobs MV Hiring Support
              </div>
              <h2 className="font-display text-[1.75rem] font-medium leading-[1.15] tracking-tight text-primary md:text-[2.25rem]">
                Need someone for your team?
                <span className="mt-1 block text-muted-foreground">
                  Tell us who. <span className="text-primary">We'll help find them.</span>
                </span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-600">
                Tell us the role and what matters most. Our hospitality team will help search, screen and review suitable candidates for you.
              </p>

              <div className="mt-8 flex flex-col items-start gap-4">
                <Button asChild className="h-12 rounded-md bg-[#D9A520] px-8 text-sm font-semibold text-primary shadow-sm hover:bg-[#C89518]" data-testid="btn-request-support">
                  <Link href="/employer/recruitment-requests/new">
                    Find Candidates For Me
                  </Link>
                </Button>
                <p className="text-[13px] text-slate-500">
                  <strong className="font-medium text-primary">You interview. You decide.</strong> We help with the rest.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t border-[#EAE5D9] pt-8 md:col-span-5 md:border-l md:border-t-0 md:pl-10 md:pt-0">
              <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary/40">How we help</p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#EAE5D9] bg-white text-[#D9A520]">
                    <UserSearch className="h-3.5 w-3.5" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-primary">Tell us who you need</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">Position + a few important details</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F2DFB3] bg-[#FDF8EB] text-[#D9A520]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-primary">We do the searching</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">Our hospitality team screens &amp; reviews</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#EAE5D9] bg-white text-[#D9A520]">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-primary">Meet your shortlist</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">Choose who you'd like to interview</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#EAE5D9] pt-4 md:col-span-12">
              <Button asChild variant="outline" className="h-10 w-full justify-center rounded-full border-primary/25 bg-primary/[0.07] px-4 text-[13px] font-medium text-primary shadow-none hover:border-[#D9A520]/60 hover:bg-[#D9A520]/10 hover:text-primary sm:w-auto" data-testid="btn-post-job">
                <Link href="/employer/vacancies/new">
                  <BriefcaseBusiness className="mr-2 h-4 w-4 text-[#B9850B]" strokeWidth={2} />
                  Prefer to hire yourself? <span className="ml-1 font-bold text-[#9A6D00]">Post a Vacancy</span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 text-[#B9850B]" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section: Recent Applications & Progress */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Recent Applications */}
          <Card className="lg:col-span-2 border-border shadow-none flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-lg font-display">Your Hiring Activity</CardTitle>
              <Button variant="outline" size="sm" asChild data-testid="link-view-all-apps">
                <Link href="/employer/applications">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {applications.isLoading ? (
                <div className="p-6 space-y-6">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : applications.data?.length ? (
                <div className="divide-y divide-border">
                  {applications.data.slice(0, 5).map(app => (
                    <Link
                      key={app.id}
                      href={`/employer/applications/${app.id}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                      data-testid={`row-application-${app.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold font-display">
                          {getInitials(app.candidateName)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{app.candidateName}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            <span className="font-medium text-foreground/80">{app.jobTitle || "Vacancy"}</span>
                            <span className="mx-2 inline-block h-1 w-1 rounded-full bg-muted-foreground/30 align-middle" />
                            {app.candidateHeadline || "Hospitality Candidate"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center sm:justify-end">
                        <StatusBadge status={app.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No applications yet</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">Applications will appear here once candidates start applying to your active jobs.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recruitment Progress */}
          <Card className="border-border shadow-none flex flex-col">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-lg font-display">Hiring progress</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col">
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <CalendarCheck className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Interviews</p>
                  </div>
                  <span className="text-2xl font-display font-bold" data-testid="stat-interview">
                    {dashboard.isLoading ? <Skeleton className="h-8 w-8" /> : (dashboard.data?.interview ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <BadgeCheck className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Hired</p>
                  </div>
                  <span className="text-2xl font-display font-bold" data-testid="stat-hired">
                    {dashboard.isLoading ? <Skeleton className="h-8 w-8" /> : (dashboard.data?.hired ?? 0)}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </EmployerLayout>
  );
}
