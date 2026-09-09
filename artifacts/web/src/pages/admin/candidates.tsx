import { useState, useMemo } from "react";
import { 
  useListAdminCandidates,
  useUpdateAdminCandidateReview,
  getListAdminCandidatesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldBan,
  Search,
  Filter,
  MoreVertical,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

export default function AdminCandidates() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data, isLoading } = useListAdminCandidates({ 
    offset: page * limit, 
    limit 
  });
  
  const updateReview = useUpdateAdminCandidateReview();
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    candidateId: 0,
    candidateName: "",
    jobsMvReviewed: false,
    reviewNotes: "",
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCandidates = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((c) => {
      const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.headline || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === "reviewed") return c.jobsMvReviewed;
      if (filter === "not_reviewed") return !c.jobsMvReviewed;
      return true;
    });
  }, [data?.items, searchTerm, filter]);

  const emptyState = filteredCandidates.length === 0 && !isLoading;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const openReviewDialog = (
    candidateId: number,
    candidateName: string,
    jobsMvReviewed: boolean,
  ) => {
    setReviewDialog({
      open: true,
      candidateId,
      candidateName,
      jobsMvReviewed,
      reviewNotes: "",
    });
  };

  const confirmReviewUpdate = () => {
    const { candidateId, jobsMvReviewed, reviewNotes } = reviewDialog;
    const nextReviewed = !jobsMvReviewed;

    updateReview.mutate(
      {
        id: candidateId,
        data: {
          jobsMvReviewed: nextReviewed,
          reviewNotes: nextReviewed && reviewNotes.trim() ? reviewNotes.trim() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(nextReviewed ? "Candidate marked as reviewed" : "Candidate review cleared");
          queryClient.invalidateQueries({
            queryKey: getListAdminCandidatesQueryKey(),
          });
        },
        onError: () => toast.error("Failed to update candidate review"),
        onSettled: () => setReviewDialog((current) => ({ ...current, open: false })),
      },
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Candidates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage candidate profiles, Hospitality Passports and review status.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Candidate Directory</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, role..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Candidates" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="reviewed">The Jobs MV Reviewed</SelectItem>
                  <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
                  <SelectItem value="passport_complete">Hospitality Passport Complete</SelectItem>
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
                  <TableHead className="font-semibold text-primary w-[300px]">Candidate</TableHead>
                  <TableHead className="font-semibold text-primary">Contact & Location</TableHead>
                  <TableHead className="font-semibold text-primary">Passport</TableHead>
                  <TableHead className="font-semibold text-primary">Review Status</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : emptyState ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm">No candidates found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/10">
                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                              {getInitials(candidate.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">{candidate.fullName}</span>
                            {candidate.headline ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Briefcase className="w-3 h-3" />
                                <span className="line-clamp-1">{candidate.headline}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic mt-0.5">No role specified</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[180px] font-medium">{candidate.email}</span>
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{candidate.phone}</span>
                            </div>
                          )}
                          {candidate.location && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]" title={candidate.location}>{candidate.location}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1.5 text-primary border-primary/20 bg-primary/5 font-medium shadow-none">
                          <CheckCircle2 className="w-3 h-3" />
                          Profile created
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.jobsMvReviewed ? (
                          <div className="space-y-1.5">
                            <Badge className="gap-1.5 bg-[#e9c46a]/20 text-[#b58e24] hover:bg-[#e9c46a]/30 border-[#e9c46a]/30 shadow-none font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              The Jobs MV Reviewed
                            </Badge>
                            {candidate.reviewedAt && (
                              <p className="text-[10px] text-muted-foreground font-medium">
                                Reviewed {format(new Date(candidate.reviewedAt), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="gap-1.5 shadow-none font-medium bg-muted text-muted-foreground">
                            <AlertCircle className="w-3 h-3" />
                            Awaiting Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant={candidate.jobsMvReviewed ? "outline" : "default"}
                            size="sm"
                            className={candidate.jobsMvReviewed ? "h-8 text-xs font-medium border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20" : "h-8 text-xs font-medium bg-primary hover:bg-primary/90"}
                            onClick={() => openReviewDialog(
                              candidate.id,
                              candidate.fullName,
                              candidate.jobsMvReviewed,
                            )}
                            disabled={updateReview.isPending}
                          >
                            {candidate.jobsMvReviewed ? "Clear Review" : "Review Candidate"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openReviewDialog(candidate.id, candidate.fullName, candidate.jobsMvReviewed)}>
                                {candidate.jobsMvReviewed ? "Update Review Notes" : "Complete Review"}
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
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} candidates
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

      <AlertDialog
        open={reviewDialog.open}
        onOpenChange={(open) => !updateReview.isPending && setReviewDialog((current) => ({ ...current, open }))}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {reviewDialog.jobsMvReviewed ? <ShieldBan className="w-6 h-6 text-destructive" /> : <ShieldCheck className="w-6 h-6 text-[#e9c46a]" />}
            </div>
            <AlertDialogTitle className="text-xl">
              {reviewDialog.jobsMvReviewed ? "Clear candidate review" : "Mark candidate as reviewed"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {reviewDialog.jobsMvReviewed
                ? `Clear The Jobs MV Reviewed status for ${reviewDialog.candidateName}?`
                : `Mark ${reviewDialog.candidateName} as reviewed by The Jobs MV. This will give them a verified badge.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!reviewDialog.jobsMvReviewed && (
            <div className="space-y-3 mt-2">
              <label htmlFor="candidate-review-notes" className="text-sm font-semibold text-primary">
                Expert Review Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="candidate-review-notes"
                value={reviewDialog.reviewNotes}
                onChange={(event) => setReviewDialog((current) => ({
                  ...current,
                  reviewNotes: event.target.value,
                }))}
                maxLength={5000}
                placeholder="Add internal context about this candidate's suitability..."
                className="min-h-[120px] resize-none"
              />
            </div>
          )}
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={updateReview.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmReviewUpdate();
              }}
              className={reviewDialog.jobsMvReviewed ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-primary hover:bg-primary/90 text-white"}
              disabled={updateReview.isPending}
            >
              {updateReview.isPending
                ? "Updating..."
                : reviewDialog.jobsMvReviewed
                  ? "Clear review"
                  : "Mark reviewed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
