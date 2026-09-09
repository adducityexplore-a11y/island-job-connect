import { Link } from "wouter";
import { useGetRecruiterDashboard, useListRecruiterApplications, ApplicationStage, useListRecruiterJobs } from "@workspace/api-client-react";
import { RecruiterLayout } from "@/components/recruiter/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, CheckCircle2, ChevronRight, Bell, Calendar, MapPin, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecruiterOnboarding } from "@/components/recruiter/onboarding";
import { Button } from "@/components/ui/button";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useUser } from "@clerk/react";
import { StageBadge } from "./applications";

export default function RecruiterDashboard() {
  const { data: dashboard, isLoading, error } = useGetRecruiterDashboard();
  const { data: applications } = useListRecruiterApplications();
  const { data: jobs } = useListRecruiterJobs();
  const { user } = useUser();

  if ((error as { status?: number } | null)?.status === 403) {
    return (
      <RecruiterLayout>
        <RecruiterOnboarding />
      </RecruiterLayout>
    );
  }

  const newApps = applications?.filter(app => app.status === ApplicationStage.New_Applicant) || [];
  const interviewingApps = applications?.filter(app => app.status === ApplicationStage.Interview) || [];

  const now = new Date();
  const closingSoonJobs = jobs?.filter(job =>
    job.status === "active" &&
    job.applicationDeadline &&
    isAfter(new Date(job.applicationDeadline), now) &&
    isBefore(new Date(job.applicationDeadline), addDays(now, 7))
  ) || [];

  const hasActions = newApps.length > 0 || interviewingApps.length > 0 || closingSoonJobs.length > 0;

  // Recent Candidates
  const recentCandidates = applications
    ?.slice()
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
    .slice(0, 3) || [];

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary text-primary-foreground p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Briefcase className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-display font-semibold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'Recruiter'}
            </h1>
            <p className="text-primary-foreground/80 text-lg">Here's what is happening with your recruitment today.</p>
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 relative z-10 shrink-0 shadow-sm font-semibold">
            <Link href="/recruiter/jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Post New Vacancy
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ACTIVE VACANCIES"
            value={dashboard?.activeJobs}
            icon={Briefcase}
            isLoading={isLoading}
            highlight
          />
          <StatCard
            title="NEW APPLICANTS"
            value={dashboard?.newApplicants}
            icon={Users}
            isLoading={isLoading}
            highlight
          />
          <StatCard
            title="SHORTLISTED"
            value={dashboard?.shortlisted}
            icon={CheckCircle2}
            isLoading={isLoading}
          />
          <StatCard
            title="INTERVIEWS"
            value={dashboard?.interview}
            icon={Calendar}
            isLoading={isLoading}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">Recruitment Pipeline</h2>
          <Card className="shadow-sm border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                <PipelineStage name="New" value={dashboard?.newApplicants} icon={Users} color="text-blue-600" bg="bg-blue-50" isLoading={isLoading} />
                <PipelineStage name="Screening" value={applications?.filter(a => a.status === ApplicationStage.Reviewed).length} icon={Search} color="text-purple-600" bg="bg-purple-50" isLoading={isLoading} />
                <PipelineStage name="Shortlisted" value={dashboard?.shortlisted} icon={CheckCircle2} color="text-amber-600" bg="bg-amber-50" isLoading={isLoading} />
                <PipelineStage name="Interview" value={dashboard?.interview} icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" isLoading={isLoading} />
                <PipelineStage name="Offered" value={applications?.filter(a => a.status === ApplicationStage.Selected).length} icon={Briefcase} color="text-emerald-600" bg="bg-emerald-50" isLoading={isLoading} />
                <PipelineStage name="Hired" value={dashboard?.hired} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" isLoading={isLoading} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2 items-start">
          <div className="lg:col-span-1 space-y-4 order-last lg:order-first">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Needs Your Attention
            </h2>
            <Card className="shadow-sm border-border">
              <CardContent className="p-0">
                {!hasActions ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-muted/20">
                    <CheckCircle2 className="w-10 h-10 text-green-500/50 mb-3" />
                    <h3 className="text-base font-medium">You're all caught up.</h3>
                    <p className="text-muted-foreground text-xs mt-1">No recruitment actions need your attention.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {newApps.length > 0 && (
                      <Link href="/recruiter/applications" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{newApps.length} New Application{newApps.length !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Review candidates</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </Link>
                    )}
                    {interviewingApps.length > 0 && (
                      <Link href="/recruiter/applications" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{interviewingApps.length} Interview{interviewingApps.length !== 1 ? 's' : ''} in Progress</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Update interview statuses</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </Link>
                    )}
                    {closingSoonJobs.length > 0 && (
                      <Link href="/recruiter/jobs" className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{closingSoonJobs.length} Vacanc{closingSoonJobs.length !== 1 ? 'ies' : 'y'} Closing Soon</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Review vacancies</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold">Recent Candidates</h2>
              <Button variant="link" asChild className="text-primary h-auto p-0">
                <Link href="/recruiter/applications">View All Applications</Link>
              </Button>
            </div>

            {recentCandidates.length === 0 ? (
              <Card className="shadow-sm border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <p className="text-muted-foreground text-sm">No candidates have applied yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentCandidates.map((app) => (
                  <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <Users className="w-6 h-6 text-primary/40" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-lg">{app.candidateName}</h3>
                            <p className="text-sm font-medium text-foreground/90">{app.candidateHeadline || "Hospitality Professional"}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                              <span className="font-medium text-foreground/70">Applied for:</span>
                              <span className="truncate">{app.jobTitle}</span>
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mt-3">
                              {app.candidateTotalHospitalityExperience && <span>{app.candidateTotalHospitalityExperience} Exp</span>}
                              {app.candidateMaldivesExperience && <span>{app.candidateMaldivesExperience} Maldives</span>}
                              {app.candidateAvailability && <span>Available {app.candidateAvailability.toLowerCase()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4 min-w-[120px]">
                          <StageBadge stage={app.status} />
                          <Button variant="outline" size="sm" asChild className="sm:mt-4 w-full sm:w-auto">
                            <Link href={`/recruiter/applications/${app.id}`}>View Candidate</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  highlight = false
}: {
  title: string;
  value?: number;
  icon: any;
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className="shadow-sm border-border hover:shadow-md transition-shadow relative overflow-hidden group">
      {highlight && <div className="absolute top-0 inset-x-0 h-1 bg-accent"></div>}
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <div className="text-4xl font-display font-semibold text-foreground">
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineStage({ name, value, icon: Icon, color, bg, isLoading }: { name: string; value?: number; icon: any; color: string; bg: string; isLoading: boolean }) {
  return (
    <Link href="/recruiter/applications" className="flex-1 p-4 hover:bg-muted/20 transition-colors flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 cursor-pointer group">
      <div className="flex items-center gap-3 md:w-full">
        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{name}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-12 md:mt-2" />
      ) : (
        <span className="text-2xl font-display font-semibold text-foreground md:mt-2">{value ?? 0}</span>
      )}
    </Link>
  );
}
