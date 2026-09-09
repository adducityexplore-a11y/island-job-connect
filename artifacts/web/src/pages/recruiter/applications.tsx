import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useListRecruiterApplications, useListRecruiterJobs } from "@workspace/api-client-react";
import { RecruiterLayout } from "@/components/recruiter/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserCircle, Briefcase, Calendar, ChevronRight, Inbox, MapPin, Building, Clock, CheckCircle } from "lucide-react";
import { ApplicationStage } from "@workspace/api-client-react";

export default function RecruiterApplications() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialJobId = searchParams.get("jobId");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>(initialJobId || "all");
  const [jobsMvReviewedFilter, setJobsMvReviewedFilter] = useState<string>("all");

  const { data: applications, isLoading } = useListRecruiterApplications();
  const { data: jobs } = useListRecruiterJobs();

  const filteredApps = useMemo(() => {
    return applications?.filter(app => {
      const matchesSearch =
        app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.jobTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.candidateHeadline || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.candidateCurrentEmployer || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesJob = jobFilter === "all" || app.jobId.toString() === jobFilter;
      const matchesReviewed = jobsMvReviewedFilter === "all" ||
                             (jobsMvReviewedFilter === "reviewed" && app.candidateJobsMvReviewed);

      return matchesSearch && matchesStatus && matchesJob && matchesReviewed;
    });
  }, [applications, searchTerm, statusFilter, jobFilter, jobsMvReviewedFilter]);

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Applications Pipeline</h1>
          <p className="text-muted-foreground mt-1">Review candidates and manage hiring stages.</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, position, employer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
                data-testid="input-search-applications"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="bg-background" data-testid="select-filter-app-job">
                <SelectValue placeholder="Filter by Vacancy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vacancies</SelectItem>
                {jobs?.map(job => (
                  <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background" data-testid="select-filter-app-status">
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {(Object.values(ApplicationStage) as string[])
                  .filter((stage) => stage !== ApplicationStage.AI_Reviewed)
                  .map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={jobsMvReviewedFilter} onValueChange={setJobsMvReviewedFilter}>
              <SelectTrigger className="bg-background" data-testid="select-filter-app-reviewed">
                <SelectValue placeholder="The Jobs MV Reviewed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="reviewed">Reviewed Candidates Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                  <div className="space-y-3 w-full">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredApps && filteredApps.length > 0 ? (
            filteredApps.map((app) => (
              <Link key={app.id} href={`/recruiter/applications/${app.id}`}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <UserCircle className="w-8 h-8 text-primary/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-1">
                          <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {app.candidateName}
                          </h3>
                          <StageBadge stage={app.status} />
                        </div>

                        <p className="text-sm font-medium text-foreground/90 truncate mb-3">
                          {app.candidateHeadline || "Hospitality Professional"}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
                          {app.candidateCurrentEmployer && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{app.candidateCurrentEmployer}</span>
                            </div>
                          )}
                          {app.candidateTotalHospitalityExperience && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{app.candidateTotalHospitalityExperience} exp</span>
                            </div>
                          )}
                          {app.candidateMaldivesExperience && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{app.candidateMaldivesExperience} in Maldives</span>
                            </div>
                          )}
                          {app.candidateNoticePeriod && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Notice: {app.candidateNoticePeriod}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col items-end justify-between border-l border-border pl-6 shrink-0 w-48">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Applied for</p>
                        <p className="text-sm font-medium text-foreground truncate max-w-full" title={app.jobTitle}>
                          {app.jobTitle}
                        </p>
                        {app.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(app.createdAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>

                      {app.candidateJobsMvReviewed && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-xs mt-4">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          The Jobs MV Reviewed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="py-24 text-center border border-dashed rounded-xl bg-card text-muted-foreground flex flex-col items-center shadow-sm">
              <Inbox className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p className="text-lg font-display font-medium text-foreground">No applications yet</p>
              <p className="text-sm mt-1 max-w-sm">New candidates will appear here when they apply to your vacancies.</p>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400";

  switch (stage) {
    case ApplicationStage.New_Applicant:
      colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400";
      break;
    case ApplicationStage.AI_Reviewed:
    case ApplicationStage.Reviewed:
      colorClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400";
      break;
    case ApplicationStage.Shortlisted:
      colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400";
      break;
    case ApplicationStage.Interview:
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400";
      break;
    case ApplicationStage.Selected:
    case ApplicationStage.Offered:
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400";
      break;
    case ApplicationStage.Hired:
      colorClass = "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 font-bold";
      break;
    case ApplicationStage.Not_Selected:
    case ApplicationStage.Rejected:
      colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400";
      break;
  }

  let label = stage;
  if (stage === ApplicationStage.AI_Reviewed) label = "Reviewed";
  else if (stage === ApplicationStage.Rejected) label = "Not Selected";
  else if (stage === ApplicationStage.Selected) label = "Offered";

  return <Badge variant="outline" className={`${colorClass} font-medium`}>{label}</Badge>;
}
