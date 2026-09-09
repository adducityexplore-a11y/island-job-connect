import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetAdminRecruitmentRequest,
  useUpdateAdminRecruitmentRequestStatus,
  useSearchRecruitmentCandidatePool,
  useAssignRecruitmentCandidate,
  useDecideRecruitmentCandidate,
  useAddRecruitmentAdminNote,
  useUpdateAdminUrgentService,
  useListAdminJobs,
  getGetAdminRecruitmentRequestQueryKey,
  getSearchRecruitmentCandidatePoolQueryKey,
  type AdminCandidatePoolItem,
  type AdminRecruitmentRequestDetailAssignmentsItem,
  type AdminRecruitmentRequestDetailNotesItem,
  type AdminJob,
  type RecruitmentStatusUpdateStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Building2,
  Calendar,
  Briefcase,
  AlertCircle,
  FileText,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  UserPlus,
  Info,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getUrgentServiceLabel = (status?: string) => ({
  "Not Requested": "Standard",
  Requested: "Details pending",
  "Terms Ready": "Terms ready",
  Accepted: "Terms accepted",
  Active: "Priority handling active",
  Fulfilled: "Completed",
  Declined: "Closed",
}[status || ""] || status);

export default function AdminRecruitmentRequestDetail() {
  const [, params] = useRoute("/admin/recruitment-requests/:id");
  const requestId = Number(params?.id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetAdminRecruitmentRequest(requestId, {
    query: { enabled: !!requestId, queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) }
  });
  
  const employerId = data?.employerId;

  const { data: jobsData } = useListAdminJobs({ limit: 100 }, {
    query: { enabled: !!employerId, queryKey: [`/api/admin/jobs`, { limit: 100 }] as const }
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const { data: poolData, isLoading: poolLoading } = useSearchRecruitmentCandidatePool(requestId, {
    query: { enabled: !!requestId, queryKey: getSearchRecruitmentCandidatePoolQueryKey(requestId) }
  });
  
  const [note, setNote] = useState("");
  const [urgentTerms, setUrgentTerms] = useState("Priority handling begins after the employer accepts these service terms. We will prioritize sourcing, screening, and shortlist preparation. Interviews, successful hires, and a specific completion time are not guaranteed.");

  const updateStatusMutation = useUpdateAdminRecruitmentRequestStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) });
        toast.success("Status updated");
      },
      onError: () => toast.error("Failed to update status")
    }
  });

  const assignMutation = useAssignRecruitmentCandidate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) });
        toast.success("Candidate added to assignment pool");
      },
      onError: () => toast.error("Failed to assign candidate")
    }
  });

  const decideMutation = useDecideRecruitmentCandidate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) });
        toast.success("Decision updated");
      },
      onError: () => toast.error("Failed to update decision")
    }
  });

  const addNoteMutation = useAddRecruitmentAdminNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) });
        toast.success("Note added");
        setNote("");
      },
      onError: () => toast.error("Failed to add note")
    }
  });
  const urgentServiceMutation = useUpdateAdminUrgentService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminRecruitmentRequestQueryKey(requestId) });
        toast.success("Urgent Hiring service updated");
      },
      onError: () => toast.error("Failed to update Urgent Hiring service"),
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const reqData = data as NonNullable<typeof data> & { jobId?: number | null };
  if (!reqData) {
    return <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
      <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p>Request not found.</p>
    </div>;
  }

  const { counters, history, assignments = [], notes = [] } = reqData;
  const pool = poolData || [];
  
  // Filter pool locally if needed, though backend filters too (we can just filter the returned data)
  const filteredPool = pool.filter((p) => p.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({ id: requestId, data: { status: newStatus as RecruitmentStatusUpdateStatus, jobId: reqData.jobId } });
  };

  const handleLinkJob = (newJobId: number) => {
    updateStatusMutation.mutate({ id: requestId, data: { status: reqData.status as RecruitmentStatusUpdateStatus, jobId: newJobId } });
  };

  const decisionColors: Record<string, string> = {
    "Suitable": "bg-blue-50 text-blue-700 font-medium shadow-none border-transparent",
    "Not Suitable": "bg-red-50 text-red-700 font-medium shadow-none border-transparent",
    "Shortlisted": "bg-emerald-50 text-emerald-700 font-bold shadow-none border-transparent",
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-colors">
          <Link href="/admin/recruitment-requests">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Requests
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-primary">{reqData.positionTitle}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {reqData.companyPropertyName}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {reqData.department}</span>
              {reqData.urgency === "Urgent" && (
                <Badge variant="destructive" className="h-5 px-2 py-0 text-[10px] uppercase tracking-wider font-bold shadow-none"><AlertCircle className="w-3 h-3 mr-1" /> Urgent Hiring</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={reqData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[240px] h-10 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacancy">Vacancy Setup</SelectItem>
                <SelectItem value="Applications">Applications</SelectItem>
                <SelectItem value="Screening">Screening</SelectItem>
                <SelectItem value="Expert Review">Expert Review</SelectItem>
                <SelectItem value="Interview-Ready Shortlist">Shortlist Ready</SelectItem>
                <SelectItem value="Employer Interview">Employer Interview</SelectItem>
                <SelectItem value="Position Filled">Position Filled</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {reqData.urgency === "Urgent" && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Urgent Hiring service</CardTitle>
                <CardDescription>Confirm service terms before priority handling begins.</CardDescription>
              </div>
              <Badge variant="outline">{getUrgentServiceLabel(reqData.urgentServiceStatus)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {reqData.urgentServiceStatus === "Requested" && (
              <>
                <Textarea value={urgentTerms} onChange={(event) => setUrgentTerms(event.target.value)} className="min-h-28" />
                <Button
                  disabled={urgentTerms.trim().length < 10 || urgentServiceMutation.isPending}
                  onClick={() => urgentServiceMutation.mutate({ id: requestId, data: { status: "Terms Ready", terms: urgentTerms } })}
                >
                  Send service terms
                </Button>
              </>
            )}
            {reqData.urgentServiceTerms && (
              <div className="rounded-md border bg-white p-4 text-sm">
                <p className="whitespace-pre-wrap text-muted-foreground">{reqData.urgentServiceTerms}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {reqData.urgentServiceStatus === "Accepted" && <Button onClick={() => urgentServiceMutation.mutate({ id: requestId, data: { status: "Active" } })}>Start priority handling</Button>}
              {reqData.urgentServiceStatus === "Active" && <Button onClick={() => urgentServiceMutation.mutate({ id: requestId, data: { status: "Fulfilled" } })}>Mark fulfilled</Button>}
              {["Requested", "Terms Ready", "Accepted"].includes(reqData.urgentServiceStatus || "") && <Button variant="outline" onClick={() => urgentServiceMutation.mutate({ id: requestId, data: { status: "Declined" } })}>Close urgent request</Button>}
            </div>
            <p className="text-xs text-muted-foreground">Fulfillment time is measured from activation to fulfillment. Interviews and successful hires are counted from employer candidate actions.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-primary border-primary shadow-sm text-primary-foreground">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display">{reqData.employeesRequired}</div>
            <div className="text-[10px] font-semibold text-primary-foreground/80 uppercase tracking-wider mt-1">Required</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-primary">{counters?.applicationsReceived || 0}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Applications</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-orange-600">{counters?.assignedCandidates || 0}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Assigned</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-blue-600">{counters?.suitableCandidates || 0}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Suitable</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-emerald-600">{counters?.shortlistedCandidates || 0}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Shortlisted</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-indigo-600">{counters?.hiredCandidates || 0}</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Hired</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pool" className="w-full">
        <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="pool" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-primary text-muted-foreground bg-transparent px-6 py-3 font-medium transition-colors">
            Candidate Pool
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-primary text-muted-foreground bg-transparent px-6 py-3 font-medium transition-colors">
            Assigned Candidates ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-primary text-muted-foreground bg-transparent px-6 py-3 font-medium transition-colors">
            Employer Requirements
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-primary text-muted-foreground bg-transparent px-6 py-3 font-medium transition-colors">
            Private Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pool" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search potential candidates..." 
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Showing candidates matching requirements.
            </p>
          </div>

          <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="font-semibold text-primary">Candidate</TableHead>
                    <TableHead className="font-semibold text-primary">Experience</TableHead>
                    <TableHead className="font-semibold text-primary">Match Score</TableHead>
                    <TableHead className="text-right font-semibold text-primary">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poolLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Skeleton className="h-6 w-32 mx-auto" /></TableCell></TableRow>
                  ) : filteredPool.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                          <p className="text-sm">No candidates match criteria or search term.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPool.map((c: AdminCandidatePoolItem) => (
                      <TableRow key={c.profile?.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-primary">{c.profile?.fullName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.profile?.headline || "No title"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{c.profile?.yearsExperience || "0"} years total</div>
                          <div className="text-xs text-muted-foreground">Resort: {c.profile?.maldivesExperience || "None"}</div>
                        </TableCell>
                        <TableCell>
                          {c.match?.score != null ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-3 cursor-help w-40 group">
                                    <div className="flex-1 bg-muted rounded-full overflow-hidden h-2">
                                      <div 
                                        className="h-full bg-accent transition-all group-hover:bg-accent/80" 
                                        style={{ width: `${c.match.score}%` }} 
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-primary">{c.match.score}%</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 w-[250px] space-y-2">
                                  <p className="font-semibold text-xs mb-1 border-b pb-1">Match Explanation</p>
                                  <div className="space-y-1.5">
                                    {c.match.criteria?.filter((crit) => crit.matched).map((crit, i: number) => (
                                      <div key={`y-${i}`} className="flex items-center gap-1.5 text-xs text-emerald-600">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span className="capitalize">{crit.criterion}</span>
                                      </div>
                                    ))}
                                    {c.match.criteria?.filter((crit) => !crit.matched).map((crit, i: number) => (
                                      <div key={`n-${i}`} className="flex items-center gap-1.5 text-xs text-red-500/80">
                                        <XCircle className="w-3 h-3" />
                                        <span className="capitalize">Missing {crit.criterion}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={((assignments || []).some((a) => a.candidate?.id === c.profile?.id)) ? "secondary" : "default"}
                            className={((assignments || []).some((a) => a.candidate?.id === c.profile?.id)) ? "font-medium opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-white font-medium"}
                            onClick={() => !((assignments || []).some((a) => a.candidate?.id === c.profile?.id)) && assignMutation.mutate({ id: requestId, candidateId: c.profile?.id || 0, data: {} })}
                            disabled={assignMutation.isPending || (assignments || []).some((a) => a.candidate?.id === c.profile?.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1.5" />
                            {(assignments || []).some((a) => a.candidate?.id === c.profile?.id) ? "Assigned" : "Assign"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="font-semibold text-primary">Candidate</TableHead>
                    <TableHead className="font-semibold text-primary">Match</TableHead>
                    <TableHead className="font-semibold text-primary">Admin Decision</TableHead>
                    <TableHead className="font-semibold text-primary">Employer Action</TableHead>
                    <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                          <p className="text-sm">No candidates assigned yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((a: AdminRecruitmentRequestDetailAssignmentsItem) => (
                      <TableRow key={a.candidate?.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-primary">{a.candidate?.fullName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{a.candidate?.email}</div>
                        </TableCell>
                        <TableCell>
                          {a.assignment?.matchScore != null ? (
                            <div className="flex items-center gap-3 w-32">
                              <div className="flex-1 bg-muted rounded-full overflow-hidden h-2">
                                <div 
                                  className="h-full bg-accent" 
                                  style={{ width: `${a.assignment.matchScore}%` }} 
                                />
                              </div>
                              <span className="text-sm font-bold text-primary">{a.assignment.matchScore}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 items-start">
                            {a.assignment?.decision ? (
                              <Badge variant="outline" className={`${decisionColors[a.assignment.decision] || ""}`}>
                                {a.assignment.decision}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Pending Review</span>
                            )}
                            <span className="text-[10px] text-muted-foreground leading-tight max-w-[150px]">
                              {a.assignment?.decision === "Suitable" && "Approved internally."}
                              {a.assignment?.decision === "Not Suitable" && "Rejected internally."}
                              {a.assignment?.decision === "Shortlisted" && "Sent to employer."}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.assignment?.employerAction ? (
                            <Badge variant="secondary" className="shadow-none font-medium bg-muted text-muted-foreground">{a.assignment.employerAction}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-9 border-border/50 text-muted-foreground hover:text-primary" asChild>
                              <a href={`/api/storage/recruitment-cv/${a.candidate?.id}`} target="_blank" rel="noreferrer">
                                <FileText className="w-4 h-4 mr-1.5" /> CV
                              </a>
                            </Button>
                            <Select 
                              value={a.assignment?.decision || ""} 
                              onValueChange={(val) => decideMutation.mutate({ id: requestId, candidateId: a.candidate?.id || 0, data: { decision: val } })}
                              disabled={decideMutation.isPending}
                            >
                              <SelectTrigger className="w-[140px] h-9 font-medium">
                                <SelectValue placeholder="Set Decision..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Suitable" className="text-blue-700">Suitable</SelectItem>
                                <SelectItem value="Not Suitable" className="text-red-700">Not Suitable</SelectItem>
                                <SelectItem value="Shortlisted" className="text-emerald-700 font-bold">Shortlisted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card className="border-border/50 shadow-sm bg-white">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent" /> Role Requirements
                  </h3>
                  <dl className="space-y-4 text-sm">
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <dt className="text-muted-foreground font-medium">Scope</dt>
                      <dd className="font-semibold text-primary">{reqData.hiringScope}</dd>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <dt className="text-muted-foreground font-medium">Min Experience</dt>
                      <dd className="font-semibold text-primary">{reqData.minimumExperience || "Not specified"}</dd>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <dt className="text-muted-foreground font-medium">Salary</dt>
                      <dd className="font-semibold text-primary">{reqData.salary || "Negotiable"}</dd>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <dt className="text-muted-foreground font-medium">Service Charge</dt>
                      <dd className="font-semibold text-primary">{reqData.serviceCharge || "-"}</dd>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <dt className="text-muted-foreground font-medium">English Level</dt>
                      <dd className="font-semibold text-primary">{reqData.englishLevel || "-"}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Provisions
                  </h3>
                  <div className="flex gap-2">
                    {reqData.accommodationProvided ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-medium">Accommodation Provided</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50 shadow-none">No Accommodation</Badge>
                    )}
                    {reqData.foodProvided ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-medium">Meals Provided</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50 shadow-none">No Meals</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" /> Contact Info
                  </h3>
                  <dl className="space-y-4 text-sm bg-muted/10 p-4 rounded-lg border border-border/50">
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs text-muted-foreground font-medium">Contact Person</dt>
                      <dd className="font-semibold text-primary text-base">{reqData.contactPerson}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs text-muted-foreground font-medium">Email Address</dt>
                      <dd className="font-medium text-foreground">{reqData.contactEmail}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs text-muted-foreground font-medium">Phone Number</dt>
                      <dd className="font-medium text-foreground">{reqData.contactNumber}</dd>
                    </div>
                  </dl>
                </div>
                
                {reqData.jobDescription && (
                  <div>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" /> Description
                    </h3>
                    <div className="text-sm whitespace-pre-wrap bg-muted/20 p-5 rounded-lg border border-border/50 leading-relaxed text-foreground/80">
                      {reqData.jobDescription}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Linked Public Vacancy</h3>
                  {reqData.jobId ? (
                    <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <div>
                        <p className="text-sm font-bold text-primary">Job #{reqData.jobId}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Applications from candidates flow here.</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-muted" asChild>
                        <Link href={`/admin/jobs`}>View Vacancies</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground font-medium">No public vacancy linked yet.</p>
                      <Select onValueChange={(val) => handleLinkJob(Number(val))} disabled={updateStatusMutation.isPending}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select a vacancy to link..." />
                        </SelectTrigger>
                        <SelectContent>
                          {jobsData?.items
                            ?.filter((j: AdminJob) => j.employerId === reqData.employerId)
                            .map((job: AdminJob) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.title} ({job.status})
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {notes.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-lg bg-white text-muted-foreground flex flex-col items-center">
                  <MessageSquare className="w-12 h-12 mb-4 text-muted-foreground/20" />
                  <p className="font-medium text-primary">No private notes yet.</p>
                  <p className="text-sm">Add internal context about this recruitment request.</p>
                </div>
              ) : (
                notes.map((n: AdminRecruitmentRequestDetailNotesItem) => (
                  <Card key={n.id} className="bg-white border-border/50 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                    <CardContent className="p-5 pl-6">
                      <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{n.note}</div>
                      <div className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admin Note</span>
                        <span>{n.createdAt ? format(new Date(n.createdAt), "MMM d, yyyy • h:mm a") : ""}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div>
              <Card className="sticky top-6 border-border/50 shadow-sm bg-white">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <CardTitle className="text-base text-primary">Add Private Note</CardTitle>
                  <CardDescription>Internal team notes</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <Textarea 
                    placeholder="Write a private note..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[160px] resize-none border-border/50 focus-visible:ring-accent"
                  />
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium" 
                    disabled={!note.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate({ id: requestId, data: { note } })}
                  >
                    Save Note
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
