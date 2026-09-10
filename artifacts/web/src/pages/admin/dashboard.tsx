import {
  useGetAdminOverview,
  useListAdminEmployers,
  useListAdminJobs,
  useListAdminCandidates,
  useListAdminApplications,
  useListAdminRecruitmentRequests,
  useListAdminAuditEvents,
  ApplicationStage,
} from "@workspace/api-client-react";
import {
  Building2,
  Briefcase,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  UserSearch,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow, differenceInDays, isToday } from "date-fns";

export default function AdminDashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetAdminOverview();

  // These lists are also used to compute "needs attention" counts client-side.
  // There's no backend aggregate endpoint yet for this, so we cap the fetch size
  // to keep this reasonable rather than pulling the whole table.
  const { data: employersData } = useListAdminEmployers({ limit: 200 });
  const { data: jobsData } = useListAdminJobs({ limit: 200 });
  const { data: candidatesData } = useListAdminCandidates({ limit: 200 });
  const { data: applicationsData } = useListAdminApplications({ limit: 200 });
  const { data: recruitmentData } = useListAdminRecruitmentRequests();
  const { data: auditData } = useListAdminAuditEvents({ limit: 10 });

  const pendingEmployers = employersData?.items?.filter((e) => !e.verified) || [];
  const pendingJobs = jobsData?.items?.filter((j) => j.verificationStatus === "needs_review") || [];
  const pendingCandidates = candidatesData?.items?.filter((c) => !c.jobsMvReviewed) || [];
  const activeRecruitment = recruitmentData?.filter((r) => r.status !== "Closed") || [];
  const slowApplications = applicationsData?.items?.filter(
    (app) =>
      (app.status === ApplicationStage.Application_Received || app.status === ApplicationStage.New_Applicant) &&
      differenceInDays(new Date(), new Date(app.createdAt)) >= 7,
  ) || [];

  const attentionItems = [
    {
      key: "employers",
      count: pendingEmployers.length,
      label: "Employer Verification",
      description: "Review new employer accounts",
      href: "/admin/employers",
      action: "Review",
    },
    {
      key: "jobs",
      count: pendingJobs.length,
      label: "Vacancies Pending Review",
      description: "Check details before they go live",
      href: "/admin/jobs",
      action: "Review",
    },
    {
      key: "candidates",
      count: pendingCandidates.length,
      label: "Candidates Awaiting Review",
      description: "Mark as The Jobs MV Reviewed",
      href: "/admin/candidates",
      action: "Review",
    },
    {
      key: "applications",
      count: slowApplications.length,
      label: "Slow Applications",
      description: "Waiting 7+ days with no movement",
      href: "/admin/applications",
      action: "Open",
    },
    {
      key: "recruitment",
      count: activeRecruitment.length,
      label: "Active Hiring Requests",
      description: "Managed recruitment in progress",
      href: "/admin/recruitment-requests",
      action: "Open",
    },
  ].filter((item) => item.count > 0);

  const totalsLoading = overviewLoading;
  const totals = [
    { title: "Employers", value: overview?.employers, icon: Building2, href: "/admin/employers" },
    { title: "Vacancies", value: overview?.jobs, icon: Briefcase, href: "/admin/jobs" },
    { title: "Candidates", value: overview?.candidates, icon: Users, href: "/admin/candidates" },
    { title: "Applications", value: overview?.applications, icon: FileText, href: "/admin/applications" },
  ];

  const newCandidatesToday = candidatesData?.items?.filter((c) => isToday(new Date(c.createdAt))).length ?? 0;
  const newEmployersToday = employersData?.items?.filter((e) => isToday(new Date(e.createdAt))).length ?? 0;
  const newApplicationsToday = applicationsData?.items?.filter((a) => isToday(new Date(a.createdAt))).length ?? 0;
  const todayItems = [
    { label: "New Candidates", value: newCandidatesToday },
    { label: "New Employers", value: newEmployersToday },
    { label: "New Applications", value: newApplicationsToday },
  ];

  const quickActions = [
    { label: "Review Employers", icon: Building2, href: "/admin/employers" },
    { label: "Review Candidates", icon: Users, href: "/admin/candidates" },
    { label: "View Vacancies", icon: Briefcase, href: "/admin/jobs" },
    { label: "Hiring Requests", icon: UserSearch, href: "/admin/recruitment-requests" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-primary">Admin Control Center</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything that needs your attention, in one place.
        </p>
      </div>

      {/* Needs Your Attention */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display tracking-tight text-primary flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-accent" />
          Needs Your Attention
        </h2>
        {overviewLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : attentionItems.length === 0 ? (
          <Card className="border-border/50 shadow-sm bg-white">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
              <p className="font-medium text-primary">You're all caught up.</p>
              <p className="text-sm">No admin actions require your attention right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attentionItems.map((item) => (
              <Link key={item.key} href={item.href} data-testid={`attention-card-${item.key}`}>
                <Card className="border-accent/30 shadow-sm bg-white hover:shadow-md hover:border-accent/60 transition-all h-full">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-display font-bold text-primary">{item.count}</span>
                        <span className="text-sm font-semibold text-foreground truncate">{item.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-accent">
                      {item.action}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display tracking-tight text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="border-border/50 shadow-sm bg-white hover:shadow-md hover:border-primary/30 transition-all h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Today */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-display tracking-tight text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Today
        </h2>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 grid grid-cols-3 divide-x divide-border/50">
            {todayItems.map((item) => (
              <div key={item.label} className="text-center px-2">
                <div className="text-xl font-display font-bold text-primary">{item.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Platform Totals (secondary — not the headline) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Platform Totals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {totalsLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
            ) : (
              totals.map((stat) => (
                <Link key={stat.title} href={stat.href}>
                  <Card className="shadow-sm hover:shadow-md transition-all border-border/50 bg-white h-full">
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                        <stat.icon className="w-4 h-4 text-primary/60" />
                      </div>
                      <div className="text-xl font-bold font-display text-primary">{stat.value ?? 0}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="divide-y divide-border/50">
              {!auditData?.items?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent activity found.</div>
              ) : (
                auditData.items.slice(0, 5).map((event) => (
                  <div key={event.id} className="p-4 flex flex-col gap-1">
                    <p className="text-sm font-medium text-primary line-clamp-1">{event.action}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {event.entityType} {event.entityId ? `#${event.entityId}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <CardFooter className="p-0 border-t border-border/50 bg-muted/10">
              <Link href="/admin/audit" className="w-full text-center text-xs font-medium py-3 text-primary hover:text-accent transition-colors">
                View Audit Log
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
