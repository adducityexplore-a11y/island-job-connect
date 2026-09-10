import { useState, useMemo } from "react";
import { 
  useListAdminJobs, 
  useCloseAdminJob,
  useRepostAdminJob,
  useUpdateAdminJobVerification,
  getListAdminJobsQueryKey,
  useListAdminEmployers
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Briefcase,
  MapPin,
  Clock,
  Ban,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Building2,
  Users
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function AdminJobs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data, isLoading } = useListAdminJobs({ 
    offset: page * limit, 
    limit 
  });

  const { data: employersData } = useListAdminEmployers({ limit: 500 });
  const getEmployerName = (id: number) => {
    return employersData?.items?.find(e => e.id === id)?.companyName || `Employer ID #${id}`;
  };
  
  const closeJob = useCloseAdminJob();
  const repostJob = useRepostAdminJob();
  const updateVerification = useUpdateAdminJobVerification();
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    jobId: number;
    title: string;
    action: "close" | "repost";
  }>({
    open: false,
    jobId: 0,
    title: "",
    action: "close"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredJobs = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((job) => {
      const employerName = getEmployerName(job.employerId).toLowerCase();
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            employerName.includes(searchTerm.toLowerCase()) ||
                            (job.department || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === "pending") return job.verificationStatus === "needs_review";
      if (filter === "verified") return job.verificationStatus === "verified";
      if (filter === "active") return job.status === "active";
      if (filter === "closed") return job.status === "closed";
      if (filter === "expired") return job.expiresAt && isPast(new Date(job.expiresAt));
      
      return true;
    });
  }, [data?.items, searchTerm, filter, employersData]);

  const handleActionClick = (jobId: number, title: string, action: "close" | "repost") => {
    setActionDialog({
      open: true,
      jobId,
      title,
      action
    });
  };

  const confirmAction = () => {
    const { jobId, action } = actionDialog;
    
    if (action === "close") {
      closeJob.mutate(
        { id: jobId },
        {
          onSuccess: () => {
            toast.success("Vacancy closed successfully");
            updateJobStatusInCache(jobId, "closed");
          },
          onError: () => toast.error("Failed to close vacancy"),
          onSettled: () => setActionDialog(prev => ({ ...prev, open: false }))
        }
      );
    } else {
      repostJob.mutate(
        { id: jobId },
        {
          onSuccess: () => {
            toast.success("Vacancy reposted successfully");
            updateJobStatusInCache(jobId, "active");
          },
          onError: () => toast.error("Failed to repost vacancy"),
          onSettled: () => setActionDialog(prev => ({ ...prev, open: false }))
        }
      );
    }
  };

  const updateJobStatusInCache = (jobId: number, status: "active" | "closed") => {
    queryClient.setQueryData(
      getListAdminJobsQueryKey({ offset: page * limit, limit }),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: any) => 
            item.id === jobId ? { 
              ...item, 
              status, 
              expiresAt: status === "active" ? null : item.expiresAt 
            } : item
          )
        };
      }
    );
  };

  const handleVerificationChange = (
    jobId: number,
    verificationStatus: "unverified" | "verified" | "needs_review",
  ) => {
    updateVerification.mutate(
      { id: jobId, data: { verificationStatus } },
      {
        onSuccess: () => {
          toast.success("Vacancy verification status updated");
          queryClient.invalidateQueries({
            queryKey: getListAdminJobsQueryKey(),
          });
        },
        onError: () => toast.error("Failed to update verification status"),
      },
    );
  };

  const getVerificationBadge = (verificationStatus: string) => {
    if (verificationStatus === "verified") {
      return (
        <Badge className="gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </Badge>
      );
    }
    if (verificationStatus === "needs_review") {
      return (
        <Badge className="gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none font-medium">
          <AlertCircle className="w-3 h-3" />
          Pending Review
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1.5 shadow-none font-medium bg-muted text-muted-foreground">
        <XCircle className="w-3 h-3" />
        Unverified
      </Badge>
    );
  };

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === "closed") {
      return (
        <Badge variant="secondary" className="gap-1.5 bg-muted text-muted-foreground shadow-none">
          <Ban className="w-3 h-3" />
          Closed
        </Badge>
      );
    }
    if (expiresAt && isPast(new Date(expiresAt))) {
      return (
        <Badge variant="secondary" className="gap-1.5 bg-destructive/10 text-destructive border-transparent shadow-none">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }
    if (status === "inactive") {
      return (
        <Badge variant="outline" className="gap-1.5 text-muted-foreground shadow-none">
          <Clock className="w-3 h-3" />
          Draft
        </Badge>
      );
    }
    return (
      <Badge className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </Badge>
    );
  };

  const emptyState = filteredJobs.length === 0 && !isLoading;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Vacancies</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review, verify and manage all vacancies on The Jobs MV.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Vacancy Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title, employer..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Statuses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vacancies</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : emptyState ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">No vacancies found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-primary" title={job.title}>{job.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{getEmployerName(job.employerId)}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(job.status, job.expiresAt || null)}
                    {getVerificationBadge(job.verificationStatus)}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={job.verificationStatus}
                      onValueChange={(value) => handleVerificationChange(job.id, value as "unverified" | "verified" | "needs_review")}
                      disabled={updateVerification.isPending}
                    >
                      <SelectTrigger className="h-10 flex-1 text-xs font-medium border-border/50">
                        <SelectValue placeholder="Set Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified" className="text-emerald-700">Verify Vacancy</SelectItem>
                        <SelectItem value="needs_review" className="text-amber-700">Needs Review</SelectItem>
                        <SelectItem value="unverified" className="text-muted-foreground">Unverify</SelectItem>
                      </SelectContent>
                    </Select>
                    {(job.status === "closed" || (job.expiresAt && isPast(new Date(job.expiresAt)))) ? (
                      <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={() => handleActionClick(job.id, job.title, "repost")}>
                        <RefreshCcw className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-10 shrink-0 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleActionClick(job.id, job.title, "close")}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Desktop table */}
        <CardContent className="p-0 hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-primary">Job Title</TableHead>
                  <TableHead className="font-semibold text-primary">Employer</TableHead>
                  <TableHead className="font-semibold text-primary">Location</TableHead>
                  <TableHead className="font-semibold text-primary">Dates</TableHead>
                  <TableHead className="font-semibold text-primary">Status</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : emptyState ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm">No vacancies found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-primary line-clamp-1" title={job.title}>{job.title}</span>
                          <div className="flex items-center gap-3">
                            {job.department && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{job.department}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground font-medium line-clamp-1">{getEmployerName(job.employerId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.location ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]" title={job.location}>{job.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            Pub: {format(new Date(job.createdAt), "MMM d, yyyy")}
                          </span>
                          {job.expiresAt && (
                            <span className={cn("text-xs", isPast(new Date(job.expiresAt)) ? "text-destructive font-medium" : "text-muted-foreground")}>
                              Closes: {format(new Date(job.expiresAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-start">
                          {getStatusBadge(job.status, job.expiresAt || null)}
                          {getVerificationBadge(job.verificationStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <Select
                            value={job.verificationStatus}
                            onValueChange={(value) => handleVerificationChange(
                              job.id,
                              value as "unverified" | "verified" | "needs_review",
                            )}
                            disabled={updateVerification.isPending}
                          >
                            <SelectTrigger
                              className="h-8 w-[130px] text-xs font-medium border-border/50"
                            >
                              <SelectValue placeholder="Set Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verified" className="text-emerald-700">Verify Vacancy</SelectItem>
                              <SelectItem value="needs_review" className="text-amber-700">Needs Review</SelectItem>
                              <SelectItem value="unverified" className="text-muted-foreground">Unverify</SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(job.status === "closed" || (job.expiresAt && isPast(new Date(job.expiresAt)))) ? (
                                <DropdownMenuItem onClick={() => handleActionClick(job.id, job.title, "repost")}>
                                  <RefreshCcw className="w-4 h-4 mr-2" />
                                  Restore Vacancy
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleActionClick(job.id, job.title, "close")} className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Close Vacancy
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {data && data.total > limit && (
          <div className="p-4 flex items-center justify-between border-t border-border/50 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} vacancies
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

      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !closeJob.isPending && !repostJob.isPending && setActionDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {actionDialog.action === "close" ? <Ban className="w-6 h-6 text-destructive" /> : <RefreshCcw className="w-6 h-6 text-primary" />}
            </div>
            <AlertDialogTitle className="text-xl">
              {actionDialog.action === "close" ? "Close Vacancy" : "Restore Vacancy"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {actionDialog.action === "close" 
                ? `Are you sure you want to close "${actionDialog.title}"? It will no longer be visible to candidates.`
                : `Are you sure you want to restore "${actionDialog.title}"? It will become active and visible again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={closeJob.isPending || repostJob.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmAction();
              }}
              className={actionDialog.action === "close" ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-primary hover:bg-primary/90 text-white"}
              disabled={closeJob.isPending || repostJob.isPending}
            >
              {(closeJob.isPending || repostJob.isPending) ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

