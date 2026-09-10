import { useState, useEffect, useMemo } from "react";
import { 
  useListAdminApplications,
  useGetAdminApplication,
  useUpdateAdminApplicationStatus,
  getListAdminApplicationsQueryKey,
  getGetAdminApplicationQueryKey,
  ApplicationStage,
  useListAdminCandidates,
  useListAdminJobs,
  useListAdminEmployers
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  FileText,
  Search,
  ChevronRight,
  User,
  Briefcase,
  History,
  AlertCircle,
  Filter,
  Building2,
  Clock,
  Mail,
  Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminApplications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data, isLoading } = useListAdminApplications({ 
    offset: page * limit, 
    limit 
  });
  
  // Fetch related data to show names instead of IDs
  const { data: candidatesData } = useListAdminCandidates({ limit: 500 });
  const { data: jobsData } = useListAdminJobs({ limit: 500 });
  const { data: employersData } = useListAdminEmployers({ limit: 500 });

  const getCandidateName = (id: number) => candidatesData?.items?.find(c => c.id === id)?.fullName || `Candidate #${id}`;
  const getJobTitle = (id: number) => jobsData?.items?.find(j => j.id === id)?.title || `Job #${id}`;
  const getEmployerNameForJob = (jobId: number) => {
    const job = jobsData?.items?.find(j => j.id === jobId);
    if (!job) return "Unknown Employer";
    return employersData?.items?.find(e => e.id === job.employerId)?.companyName || `Employer #${job.employerId}`;
  };
  
  const updateStatus = useUpdateAdminApplicationStatus();
  
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  
  const { data: appDetail, isLoading: appDetailLoading } = useGetAdminApplication(
    selectedAppId ?? 0,
    {
      query: {
        enabled: selectedAppId !== null,
        queryKey: getGetAdminApplicationQueryKey(selectedAppId ?? 0)
      }
    }
  );

  const [newStatus, setNewStatus] = useState<ApplicationStage | "">("");
  const [note, setNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reset form when detail loads
  useEffect(() => {
    if (appDetail?.application) {
      setNewStatus(appDetail.application.status as ApplicationStage);
      setNote("");
    }
  }, [appDetail]);

  const filteredApplications = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(app => {
      const candidateName = getCandidateName(app.candidateId).toLowerCase();
      const jobTitle = getJobTitle(app.jobId).toLowerCase();
      const employerName = getEmployerNameForJob(app.jobId).toLowerCase();
      
      const matchesSearch = candidateName.includes(searchTerm.toLowerCase()) || 
                            jobTitle.includes(searchTerm.toLowerCase()) ||
                            employerName.includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (statusFilter === "needs_attention") {
        const daysOld = differenceInDays(new Date(), new Date(app.createdAt));
        return (app.status === ApplicationStage.Application_Received || app.status === ApplicationStage.New_Applicant) && daysOld >= 7;
      }
      
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      
      return true;
    });
  }, [data?.items, searchTerm, statusFilter, candidatesData, jobsData, employersData]);

  const handleUpdateStatus = () => {
    if (!selectedAppId || !newStatus) return;
    
    updateStatus.mutate(
      { 
        id: selectedAppId, 
        data: { 
          status: newStatus as ApplicationStage, 
          note: note || undefined 
        } 
      },
      {
        onSuccess: () => {
          toast.success("Application status updated");
          
          queryClient.setQueryData(
            getListAdminApplicationsQueryKey({ offset: page * limit, limit }),
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((item: any) => 
                  item.id === selectedAppId ? { ...item, status: newStatus } : item
                )
              };
            }
          );
          
          queryClient.invalidateQueries({
            queryKey: getGetAdminApplicationQueryKey(selectedAppId)
          });
          
          setNote("");
        },
        onError: () => toast.error("Failed to update status")
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ApplicationStage.New_Applicant: 
      case ApplicationStage.Application_Received:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case ApplicationStage.AI_Reviewed: 
      case ApplicationStage.Reviewed:
        return "bg-violet-50 text-violet-700 border-violet-200";
      case ApplicationStage.Shortlisted: 
        return "bg-[#e9c46a]/20 text-[#b58e24] border-[#e9c46a]/30";
      case ApplicationStage.Interview: 
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
      case ApplicationStage.Selected: 
      case ApplicationStage.Offered:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case ApplicationStage.Hired: 
        return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
      case ApplicationStage.Rejected: 
      case ApplicationStage.Not_Selected:
        return "bg-destructive/10 text-destructive border-transparent";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const emptyState = filteredApplications.length === 0 && !isLoading;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor candidate movement through employer hiring pipelines.
          </p>
        </div>
      </div>

      {/* Slow Application Alerts */}
      {data?.items && data.items.some(app => 
        (app.status === ApplicationStage.Application_Received || app.status === ApplicationStage.New_Applicant) && 
        differenceInDays(new Date(), new Date(app.createdAt)) >= 7
      ) && (
        <Card className="border-accent/50 bg-accent/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Slow Applications Detected</h3>
                <p className="text-sm text-muted-foreground">Some candidates have been waiting over 7 days without an employer response.</p>
              </div>
            </div>
            <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent hover:text-white" onClick={() => setStatusFilter("needs_attention")}>
              View Delayed Apps
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Application Directory</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search candidate, job, employer..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Stages" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="needs_attention" className="text-accent font-medium">Needs Attention (7+ days)</SelectItem>
                  {Object.values(ApplicationStage).map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        {/* Mobile cards */}
        <CardContent className="p-0 md:hidden">
          {isLoading ? (
            <div className="divide-y divide-border/50">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : emptyState ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">No applications found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredApplications.map((app) => {
                const daysWaiting = differenceInDays(new Date(), new Date(app.createdAt));
                const isDelayed = (app.status === ApplicationStage.Application_Received || app.status === ApplicationStage.New_Applicant) && daysWaiting >= 7;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className="w-full text-left p-4 space-y-2 active:bg-muted/30 min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-primary truncate">{getCandidateName(app.candidateId)}</p>
                        <p className="text-sm text-foreground truncate">{getJobTitle(app.jobId)}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{getEmployerNameForJob(app.jobId)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`gap-1.5 shadow-none font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </Badge>
                      {isDelayed ? (
                        <span className="text-[11px] font-medium text-accent flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Waiting {daysWaiting}d
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">{format(new Date(app.createdAt), "MMM d")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Desktop table */}
        <CardContent className="p-0 hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-primary w-[250px]">Candidate</TableHead>
                  <TableHead className="font-semibold text-primary w-[300px]">Vacancy</TableHead>
                  <TableHead className="font-semibold text-primary">Applied Date</TableHead>
                  <TableHead className="font-semibold text-primary">Current Stage</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : emptyState ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm">No applications found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => {
                    const daysWaiting = differenceInDays(new Date(), new Date(app.createdAt));
                    const isDelayed = (app.status === ApplicationStage.Application_Received || app.status === ApplicationStage.New_Applicant) && daysWaiting >= 7;
                    
                    return (
                      <TableRow 
                        key={app.id} 
                        className="cursor-pointer group hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedAppId(app.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-primary line-clamp-1">{getCandidateName(app.candidateId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground line-clamp-1">{getJobTitle(app.jobId)}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              <span className="line-clamp-1">{getEmployerNameForJob(app.jobId)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground">{format(new Date(app.createdAt), "MMM d, yyyy")}</span>
                            {isDelayed && (
                              <span className="text-[10px] font-medium text-accent flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Waiting {daysWaiting} days
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1.5 shadow-none font-medium ${getStatusColor(app.status)}`}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {data && data.total > limit && (
          <div className="p-4 flex items-center justify-between border-t border-border/50 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} applications
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="h-9 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= data.total}
                onClick={() => setPage(p => p + 1)}
                className="h-9 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={selectedAppId !== null} onOpenChange={(open) => !open && setSelectedAppId(null)}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto p-0 gap-0">
          <div className="p-6 border-b border-border/50 bg-muted/10 flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-primary font-display font-bold">Application Details</DialogTitle>
              <DialogDescription className="mt-1">
                Manage candidate application journey
              </DialogDescription>
            </div>
            <Badge variant="outline" className="font-mono bg-white shadow-sm">APP-{selectedAppId}</Badge>
          </div>

          {appDetailLoading ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ) : appDetail ? (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate Info */}
                <Card className="shadow-sm border-border/50">
                  <CardHeader className="p-4 pb-2 border-b border-border/50 bg-muted/10">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary font-semibold">
                      <User className="w-4 h-4 text-accent" />
                      Candidate Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="font-semibold text-base text-primary">{appDetail.candidate.fullName}</div>
                    <div className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {appDetail.candidate.email}
                    </div>
                    {appDetail.candidate.phone && (
                      <div className="text-sm flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {appDetail.candidate.phone}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Job Info */}
                <Card className="shadow-sm border-border/50">
                  <CardHeader className="p-4 pb-2 border-b border-border/50 bg-muted/10">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary font-semibold">
                      <Briefcase className="w-4 h-4 text-accent" />
                      Position Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="font-semibold text-base text-primary line-clamp-1" title={appDetail.job.title}>{appDetail.job.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shadow-none">{appDetail.job.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted inline-flex px-2 py-1 rounded">
                      Job #{appDetail.job.id} • Emp #{appDetail.job.employerId}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Status Update Form */}
                <div className="lg:col-span-3 space-y-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Update Status</h3>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Recruitment Stage</Label>
                        <Select 
                          value={newStatus} 
                          onValueChange={(val: ApplicationStage) => setNewStatus(val)}
                        >
                          <SelectTrigger id="status" className="w-full font-medium">
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ApplicationStage).map(stage => (
                              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="note">Update Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Textarea 
                          id="note"
                          placeholder="Add an internal note about this status change..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="resize-none h-24"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleUpdateStatus} 
                        disabled={updateStatus.isPending || newStatus === appDetail.application.status}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        {updateStatus.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* History Timeline */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Timeline
                  </h3>
                  
                  {appDetail.history && appDetail.history.length > 0 ? (
                    <div className="relative border-l border-primary/20 pl-4 ml-2 space-y-6 py-2">
                      {appDetail.history.map((evt, idx) => (
                        <div key={evt.id ?? idx} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />
                          <div className="flex flex-col">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-sm text-primary">{evt.status}</span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {evt.createdAt ? format(new Date(evt.createdAt), "MMM d, yyyy • h:mm a") : ""}
                              </span>
                            </div>
                            {evt.note && (
                              <p className="text-xs text-foreground mt-2 bg-muted/50 p-2.5 rounded-md border border-border/50 leading-relaxed">
                                {evt.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4 px-2 bg-muted/30 rounded border border-border/50 text-center">
                      No history recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p>Application not found or access denied.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
