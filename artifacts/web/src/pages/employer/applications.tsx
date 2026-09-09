import { useEffect, useState, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApplicationDetail,
  ApplicationStage,
  getGetRecruiterApplicationQueryKey,
  getListRecruiterApplicationsQueryKey,
  RecruiterApplication,
  useGetRecruiterApplication,
  useListRecruiterApplications,
  useUpdateApplicationStatus,
  useListRecruiterJobs
} from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  UserRound,
  Briefcase,
  CalendarClock,
  Inbox,
  MapPin,
  Building2,
  Clock,
  BadgeCheck,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  FileText,
  Award
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const stages = [
  ApplicationStage.Application_Received,
  ApplicationStage.Reviewed,
  ApplicationStage.Shortlisted,
  ApplicationStage.Interview,
  ApplicationStage.Offered,
  ApplicationStage.Hired,
  ApplicationStage.Not_Selected,
];

export default function EmployerApplications() {
  const [, params] = useRoute("/employer/applications/:id");
  const applicationId = params?.id ? Number(params.id) : 0;
  const list = useListRecruiterApplications();
  const jobs = useListRecruiterJobs();

  const detail = useGetRecruiterApplication(applicationId, {
    query: {
      enabled: Boolean(applicationId),
      queryKey: getGetRecruiterApplicationQueryKey(applicationId)
    }
  });

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8 animate-in fade-in duration-500">
        {!applicationId && (
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Candidates</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Your Candidates</h1>
            <p className="mt-2 text-muted-foreground">Review applicants and move the right people forward.</p>
          </div>
        )}

        {applicationId ? (
          <ApplicationReview loading={detail.isLoading} detail={detail.data} id={applicationId} />
        ) : (
          <ApplicationList
            loading={list.isLoading}
            applications={list.data || []}
            jobs={jobs.data || []}
          />
        )}
      </div>
    </EmployerLayout>
  );
}

function ApplicationList({ loading, applications, jobs }: { loading: boolean; applications: RecruiterApplication[]; jobs: any[] }) {
  const searchParams = new URLSearchParams(window.location.search);
  const initialJobId = searchParams.get("jobId");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>(initialJobId || "all");
  const [jobsMvReviewedFilter, setJobsMvReviewedFilter] = useState<string>("all");

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
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

  if (loading) {
    return (
      <div className="space-y-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
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
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, position, employer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by Vacancy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vacancies</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map(stage => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={jobsMvReviewedFilter} onValueChange={setJobsMvReviewedFilter}>
            <SelectTrigger className="bg-background">
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
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <Link key={app.id} href={`/employer/applications/${app.id}`}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-5 flex flex-col md:flex-row gap-6">
                  <div className="flex gap-4 flex-1">
                    <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                       <UserRound className="w-8 h-8 text-primary/40" strokeWidth={1.9} />
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
                             <Building2 className="w-3.5 h-3.5 shrink-0" />
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
                             <CalendarClock className="w-3.5 h-3.5 shrink-0" />
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
                      <Badge variant="secondary" className="border-[#D9A520]/30 bg-[#D9A520]/10 text-amber-800 hover:bg-[#D9A520]/10 text-xs mt-4">
                        <BadgeCheck className="w-3 h-3 mr-1 text-[#D9A520]" />
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
            <p className="text-lg font-display font-medium text-foreground">No applications found</p>
            <p className="text-sm mt-1 max-w-sm">Try adjusting your filters or wait for candidates to apply.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationReview({ loading, detail, id }: { loading: boolean; detail: ApplicationDetail | undefined; id: number }) {
  const queryClient = useQueryClient();
  const update = useUpdateApplicationStatus();
  const [status, setStatus] = useState<ApplicationStage>(ApplicationStage.Application_Received);

  useEffect(() => {
    if (detail?.application?.status) {
      setStatus(detail.application.status);
    }
  }, [detail?.application?.status]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!detail?.application || !detail.candidate) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">This application could not be found.</p>
          <Button variant="outline" asChild>
            <Link href="/employer/applications">Back to applications</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const c = detail.candidate;

  const save = () => {
    update.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast.success("Application status updated");
          queryClient.invalidateQueries({ queryKey: getGetRecruiterApplicationQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListRecruiterApplicationsQueryKey() });
        },
        onError: () => toast.error("Unable to update application status")
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
          <Link href="/employer/applications"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground truncate">
              {c.fullName}
            </h1>
            {c.jobsMvReviewed && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0 self-start sm:self-auto">
                <BadgeCheck className="w-3.5 h-3.5 mr-1.5 text-[#D9A520]" />
                The Jobs MV Reviewed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 truncate">
            Applying for <span className="font-medium text-foreground truncate">{detail.jobTitle}</span>
          </p>
        </div>
        <div className="ml-auto shrink-0 pl-2">
          {detail.application.status && <StageBadge stage={detail.application.status} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserRound className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div className="flex-1 space-y-4">
                  {c.headline && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Headline</h4>
                      <p className="text-foreground font-medium text-lg">{c.headline}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    {c.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{c.phone}</span>
                      </div>
                    )}
                    {c.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{c.location}</span>
                      </div>
                    )}
                    {c.nationality && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-4 h-4 shrink-0" />
                        <span className="text-foreground">{c.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {c.summary && (
                <div>
                  <h4 className="text-sm font-display font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" /> Professional Summary
                  </h4>
                  <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {c.summary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-display font-semibold flex items-center gap-2 border-b border-border pb-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" /> Professional Experience
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Current Employer" value={c.currentEmployer} />
                    <DetailRow label="Total Hospitality Experience" value={c.totalHospitalityExperience || c.yearsExperience} />
                    <DetailRow label="Maldives Experience" value={c.maldivesExperience} />
                    <DetailRow label="Resort Experience" value={c.totalResortExperience} />
                    <DetailRow label="Luxury Resort Experience" value={c.luxuryResortExperience} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-display font-semibold flex items-center gap-2 border-b border-border pb-2">
                    <Award className="w-4 h-4 text-muted-foreground" /> Skills & Certifications
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Hospitality Specialties" value={c.hospitalitySpecialties} />
                    <DetailRow label="Role Specific Skills" value={c.roleSpecificSkills} />
                    <DetailRow label="Technical / POS Systems" value={c.posSystems} />
                    <DetailRow label="Languages" value={c.languages} />
                    <DetailRow label="Certifications" value={c.professionalCertifications || c.hospitalityCertifications} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-display font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <CalendarClock className="w-4 h-4 text-muted-foreground" /> Availability
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow label="Employment Status" value={c.employmentStatus} />
                  <DetailRow label="Notice Period" value={c.noticePeriod} />
                  <DetailRow label="Available From" value={c.availableFrom} />
                  <DetailRow label="Currently in Maldives" value={c.currentlyInMaldives !== undefined ? (c.currentlyInMaldives ? "Yes" : "No") : undefined} />
                </div>
              </div>

              {c.cvAvailable && (
                <div className="pt-6 border-t border-border">
                  <Button variant="outline" asChild>
                    <a
                      href={`/api/recruiter/candidates/${c.id}/cv`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-2" /> View Resume / CV
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-4 border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-display">Update Stage</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Move to stage</Label>
                <Select value={status} onValueChange={value => setStatus(value as ApplicationStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => {
                      let label: string = stage;
                      if (stage === ApplicationStage.Reviewed) label = "Screening / Reviewed";
                      return <SelectItem key={stage} value={stage}>{label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={save}
                disabled={update.isPending || status === detail.application.status}
              >
                {update.isPending ? "Updating…" : "Update application"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detail.history && detail.history.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {detail.history.map((item, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-muted-foreground/20 text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-0 md:ml-0 z-10" />
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 md:pl-0 border border-border bg-card p-3 rounded shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                          <span className="font-semibold text-sm">
                            {item.status === ApplicationStage.AI_Reviewed ? "Reviewed" :
                             item.status === ApplicationStage.Rejected ? "Not Selected" :
                             item.status === ApplicationStage.Selected ? "Offered" : item.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.createdAt ? format(new Date(item.createdAt), "MMM d, h:mm a") : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No history recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "Not provided"}</span>
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400";

  switch (stage) {
    case ApplicationStage.New_Applicant:
    case ApplicationStage.Application_Received:
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
