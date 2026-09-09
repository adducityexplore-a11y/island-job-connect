import { useState, useMemo } from "react";
import { 
  useListAdminEmployers, 
  useUpdateAdminEmployerVerification,
  getListAdminEmployersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Search,
  ShieldCheck,
  ShieldBan,
  MoreVertical,
  Filter,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminEmployers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data, isLoading } = useListAdminEmployers({ 
    offset: page * limit, 
    limit 
  });
  
  const updateVerification = useUpdateAdminEmployerVerification();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    employerId: number;
    companyName: string;
    newStatus: boolean;
  }>({
    open: false,
    employerId: 0,
    companyName: "",
    newStatus: false
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEmployers = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((emp) => {
      const matchesSearch = emp.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      if (statusFilter === "verified") return emp.verified;
      if (statusFilter === "pending") return !emp.verified;
      return true;
    });
  }, [data?.items, searchTerm, statusFilter]);

  const handleToggleVerification = (employerId: number, companyName: string, currentStatus: boolean) => {
    setConfirmDialog({
      open: true,
      employerId,
      companyName,
      newStatus: !currentStatus
    });
  };

  const confirmVerificationUpdate = () => {
    const { employerId, newStatus } = confirmDialog;
    
    updateVerification.mutate(
      { id: employerId, data: { verified: newStatus } },
      {
        onSuccess: () => {
          toast.success(newStatus ? "Employer verified" : "Employer verification revoked");
          
          // Update cache
          queryClient.setQueryData(
            getListAdminEmployersQueryKey({ offset: page * limit, limit }),
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((item: any) => 
                  item.id === employerId ? { ...item, verified: newStatus } : item
                )
              };
            }
          );
        },
        onError: () => {
          toast.error("Failed to update employer verification status");
        },
        onSettled: () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    );
  };

  const emptyState = filteredEmployers.length === 0 && !isLoading;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Employers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage employer accounts, verification and platform activity.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Employer Directory</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search employers..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Statuses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employers</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-primary">Company</TableHead>
                  <TableHead className="font-semibold text-primary">Primary Contact</TableHead>
                  <TableHead className="font-semibold text-primary">Joined Date</TableHead>
                  <TableHead className="font-semibold text-primary">Verification Status</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : emptyState ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        {statusFilter === 'pending' ? (
                          <>
                            <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="font-medium text-primary">You're all caught up.</p>
                            <p className="text-sm">No employers waiting for verification.</p>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm">No employers found matching your criteria.</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployers.map((employer) => (
                    <TableRow key={employer.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center border border-primary/10">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-primary">{employer.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{employer.contactName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(employer.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {employer.verified ? (
                          <Badge variant="default" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none font-medium gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none font-medium gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            Pending Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant={employer.verified ? "outline" : "default"}
                            size="sm"
                            className={employer.verified ? "border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 h-8 text-xs font-medium" : "h-8 text-xs font-medium bg-primary hover:bg-primary/90"}
                            onClick={() => handleToggleVerification(employer.id, employer.companyName, employer.verified)}
                            disabled={updateVerification.isPending && confirmDialog.employerId === employer.id}
                          >
                            {employer.verified ? "Revoke" : "Verify"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleVerification(employer.id, employer.companyName, employer.verified)}>
                                {employer.verified ? "Revoke Verification" : "Approve Verification"}
                              </DropdownMenuItem>
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
          
          {data && data.total > limit && (
            <div className="p-4 flex items-center justify-between border-t border-border/50 bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} employers
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={(page + 1) * limit >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !updateVerification.isPending && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {confirmDialog.newStatus ? <ShieldCheck className="w-6 h-6 text-primary" /> : <ShieldBan className="w-6 h-6 text-destructive" />}
            </div>
            <AlertDialogTitle className="text-xl">
              {confirmDialog.newStatus ? "Verify Employer" : "Revoke Verification"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {confirmDialog.newStatus 
                ? `Are you sure you want to verify ${confirmDialog.companyName}? They will be able to post verified vacancies on the platform.`
                : `Are you sure you want to revoke verification for ${confirmDialog.companyName}? They will lose their verified status.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={updateVerification.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmVerificationUpdate();
              }}
              className={confirmDialog.newStatus ? "bg-primary hover:bg-primary/90 text-white" : "bg-destructive hover:bg-destructive/90 text-white"}
              disabled={updateVerification.isPending}
            >
              {updateVerification.isPending ? "Updating..." : (confirmDialog.newStatus ? "Approve Verification" : "Revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

