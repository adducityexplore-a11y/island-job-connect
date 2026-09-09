import { 
  useGetAdminOverview, 
  useGetAdminFunctionCheck,
  useListAdminEmployers,
  useListAdminJobs,
  useListAdminCandidates,
  useListAdminRecruitmentRequests,
  useListAdminAuditEvents
} from "@workspace/api-client-react";
import { 
  Building2, 
  Briefcase, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Database,
  Server,
  AlertCircle,
  Clock,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetAdminOverview();
  const { data: health, isLoading: healthLoading } = useGetAdminFunctionCheck();

  // Fetch lists to get pending counts
  const { data: employersData } = useListAdminEmployers({ limit: 100 });
  const { data: jobsData } = useListAdminJobs({ limit: 100 });
  const { data: candidatesData } = useListAdminCandidates({ limit: 100 });
  const { data: recruitmentData } = useListAdminRecruitmentRequests();
  const { data: auditData } = useListAdminAuditEvents({ limit: 10 });

  const pendingEmployers = employersData?.items?.filter(e => !e.verified) || [];
  const pendingJobs = jobsData?.items?.filter(j => j.verificationStatus === 'needs_review') || [];
  const pendingCandidates = candidatesData?.items?.filter(c => !c.jobsMvReviewed) || [];
  const activeRecruitment = recruitmentData?.filter(r => r.status !== 'Closed') || [];

  const statCards = [
    { 
      title: "Employers", 
      value: overview?.employers, 
      icon: Building2, 
      href: "/admin/employers",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Vacancies", 
      value: overview?.jobs, 
      icon: Briefcase, 
      href: "/admin/jobs",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Candidates", 
      value: overview?.candidates, 
      icon: Users, 
      href: "/admin/candidates",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Applications", 
      value: overview?.applications, 
      icon: FileText, 
      href: "/admin/applications",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
  ];

  const pendingCards = [
    {
      title: "Pending Employer Verification",
      value: pendingEmployers.length,
      href: "/admin/employers",
    },
    {
      title: "Vacancies Pending Review",
      value: pendingJobs.length,
      href: "/admin/jobs",
    },
    {
      title: "Candidates Awaiting Review",
      value: pendingCandidates.length,
      href: "/admin/candidates",
    },
    {
      title: "Active Recruitment Requests",
      value: activeRecruitment.length,
      href: "/admin/recruitment-requests",
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Admin Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor platform activity, verification, recruitment and actions requiring attention.
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md hover:border-accent/50 transition-all border-border/50 bg-white">
              <Link href={stat.href} className="block group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-display text-primary">{stat.value ?? 0}</div>
                </CardContent>
              </Link>
            </Card>
          ))
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pendingCards.map((card) => (
          <Card key={card.title} className="shadow-sm hover:shadow-md border-border/50 bg-white">
            <Link href={card.href} className="block group">
              <CardHeader className="pb-2 space-y-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-display text-primary">{card.value}</div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Needs Attention */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold font-display tracking-tight text-primary flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Needs Your Attention
          </h2>
          <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="divide-y divide-border/50">
              {pendingEmployers.length > 0 && (
                <Link href="/admin/employers" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-primary">{pendingEmployers.length} Employers Waiting for Verification</span>
                    <span className="text-xs text-muted-foreground">Review employer profiles</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              )}
              {pendingJobs.length > 0 && (
                <Link href="/admin/jobs" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-primary">{pendingJobs.length} Vacancies Waiting for Verification</span>
                    <span className="text-xs text-muted-foreground">Review vacancy details</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              )}
              {pendingCandidates.length > 0 && (
                <Link href="/admin/candidates" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-primary">{pendingCandidates.length} Candidates Awaiting The Jobs MV Review</span>
                    <span className="text-xs text-muted-foreground">Review candidates</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              )}
              {activeRecruitment.length > 0 && (
                <Link href="/admin/recruitment-requests" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-primary">{activeRecruitment.length} Recruitment Requests Active</span>
                    <span className="text-xs text-muted-foreground">Open recruitment workspace</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              )}

              {pendingEmployers.length === 0 && pendingJobs.length === 0 && pendingCandidates.length === 0 && activeRecruitment.length === 0 && (
                <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-primary">You're all caught up.</p>
                  <p className="text-sm">No admin actions require your attention right now.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Platform Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-display tracking-tight text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Recent Platform Activity
          </h2>
          <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="divide-y divide-border/50">
              {!auditData?.items?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent activity found.
                </div>
              ) : (
                auditData.items.slice(0, 5).map(event => (
                  <div key={event.id} className="p-4 flex flex-col gap-1">
                    <p className="text-sm font-medium text-primary line-clamp-1">
                      {event.action}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {event.entityType} {event.entityId ? `#${event.entityId}` : ''}
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

