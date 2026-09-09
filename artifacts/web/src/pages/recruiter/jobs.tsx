import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  useListRecruiterJobs,
  useCreateRecruiterJob,
  useUpdateRecruiterJob,
  useCloseRecruiterJob,
  useRepostRecruiterJob,
  getGetRecruiterDashboardQueryKey,
  getListPublicJobsQueryKey,
  getListRecruiterJobsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RecruiterLayout } from "@/components/recruiter/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Archive,
  RefreshCw,
  Users,
  Calendar,
  Briefcase,
  Copy,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const jobSchema = z.object({
  title: z.string().min(2, "Title is required"),
  department: z.string().min(2, "Department is required"),
  location: z.string().min(2, "Location is required"),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  salaryCurrency: z.enum(["USD", "MVR"]).optional(),
  salaryPeriod: z.literal("month").optional(),
  description: z.string().min(10, "Description needs more detail"),
  requirements: z.string().optional(),
  applyContact: z.string().min(1, "Apply contact is required"),
  applyMethod: z.enum(["email", "whatsapp"]).default("email"),
  type: z.enum(["Normal", "Featured", "Urgent"]).default("Normal"),
  status: z.enum(["active", "inactive", "closed"]).default("active").optional(),
}).superRefine((data, ctx) => {
  if ((data.salaryMin !== undefined || data.salaryMax !== undefined) && !data.salaryCurrency) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["salaryCurrency"], message: "Select a salary currency" });
  }
  if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMax < data.salaryMin) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["salaryMax"], message: "Maximum salary must be at least the minimum salary" });
  }
});

type JobFormValues = z.infer<typeof jobSchema>;

function getJobErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return "Please review the vacancy information and try again.";
  }
  const data = error.data;
  if (typeof data !== "object" || data === null || !("details" in data) || !Array.isArray(data.details)) {
    return "Please review the vacancy information and try again.";
  }
  const firstIssue = data.details.find((issue) => typeof issue === "object" && issue !== null && "message" in issue);
  return firstIssue && typeof firstIssue.message === "string"
    ? firstIssue.message
    : "Please review the vacancy information and try again.";
}

export default function RecruiterJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const { data: jobs, isLoading } = useListRecruiterJobs();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.department || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingJob(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (job: any) => {
    setEditingJob(job);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (job: any) => {
    setEditingJob({
      ...job,
      id: undefined, // ensure it acts like create
      status: "active",
      title: `${job.title} (Copy)`
    });
    setIsDialogOpen(true);
  };

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Vacancies</h1>
            <p className="text-muted-foreground mt-1">Manage your job listings and track performance.</p>
          </div>
          <Button onClick={handleOpenCreate} data-testid="button-create-job">
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card"
              data-testid="input-search-jobs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-card" data-testid="select-filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                    </div>
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredJobs && filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={() => handleOpenEdit(job)}
                onDuplicate={() => handleDuplicate(job)}
              />
            ))
          ) : (
            <div className="py-16 text-center border border-dashed rounded-xl bg-card text-muted-foreground flex flex-col items-center">
              <Briefcase className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p className="text-lg font-display font-medium text-foreground">Create your first vacancy</p>
              <p className="text-sm mt-1 max-w-sm">Post a hospitality vacancy and start receiving applications from candidates on The Jobs MV.</p>
              <Button onClick={handleOpenCreate} className="mt-6" data-testid="button-empty-state-create">
                <Plus className="w-4 h-4 mr-2" /> Post New Job
              </Button>
            </div>
          )}
        </div>

        <JobDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          job={editingJob}
        />
      </div>
    </RecruiterLayout>
  );
}

function JobCard({ job, onEdit, onDuplicate }: { job: any, onEdit: () => void, onDuplicate: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const closeJob = useCloseRecruiterJob();
  const repostJob = useRepostRecruiterJob();
  const updateJob = useUpdateRecruiterJob();

  const handleStatusChange = (status: "closed" | "repost" | "pause" | "resume") => {
    if (status === "closed") {
      closeJob.mutate({ id: job.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPublicJobsQueryKey() });
          toast({ title: "Job Closed", description: "The vacancy is no longer accepting applications." });
        },
        onError: () => toast({ title: "Error", description: "Failed to close job.", variant: "destructive" })
      });
    } else if (status === "repost" || status === "resume") {
      repostJob.mutate({ id: job.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPublicJobsQueryKey() });
          toast({ title: "Job Active", description: "The vacancy is active again." });
        },
        onError: () => toast({ title: "Error", description: "Failed to resume job.", variant: "destructive" })
      });
    } else if (status === "pause") {
      // Pause is setting it to inactive. We can use updateJob.
      updateJob.mutate({ id: job.id, data: { status: "inactive" } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPublicJobsQueryKey() });
          toast({ title: "Job Paused", description: "The vacancy is now paused." });
        },
        onError: () => toast({ title: "Error", description: "Failed to pause job.", variant: "destructive" })
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-display font-semibold text-foreground">{job.title}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                  <span className="font-medium text-foreground/80">{job.department}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <StatusBadge status={job.status} />
                <JobMenu job={job} onEdit={onEdit} onDuplicate={onDuplicate} onStatusChange={handleStatusChange} />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Published: <span className="font-medium text-foreground">{job.publishedAt ? format(new Date(job.publishedAt), "MMM d, yyyy") : "Draft"}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Closes: <span className="font-medium text-foreground">{job.expiresAt ? format(new Date(job.expiresAt), "MMM d, yyyy") : "No limit"}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  <span className="font-medium text-foreground">{job.applyCount || 0}</span> Applications
                </span>
              </div>
            </div>

            <div className="pt-2 md:hidden">
              <Button asChild className="w-full">
                <Link href={`/recruiter/applications?jobId=${job.id}`}>View Candidates</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end justify-between border-l border-border pl-6 ml-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={job.status} />
              <JobMenu job={job} onEdit={onEdit} onDuplicate={onDuplicate} onStatusChange={handleStatusChange} />
            </div>
            <Button asChild>
              <Link href={`/recruiter/applications?jobId=${job.id}`}>View Candidates</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "active":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400">Active</Badge>;
    case "closed":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400">Closed</Badge>;
    case "inactive":
    default:
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400">Paused</Badge>;
  }
}

function JobMenu({ job, onEdit, onDuplicate, onStatusChange }: { job: any, onEdit: () => void, onDuplicate: () => void, onStatusChange: (status: "closed"|"repost"|"pause"|"resume") => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8" data-testid={`button-job-menu-${job.id}`}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" /> View Public Listing
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} data-testid={`menu-edit-${job.id}`}>
          <Pencil className="w-4 h-4 mr-2" /> Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} data-testid={`menu-duplicate-${job.id}`}>
          <Copy className="w-4 h-4 mr-2" /> Duplicate Vacancy
        </DropdownMenuItem>

        {job.status === "active" ? (
          <DropdownMenuItem onClick={() => onStatusChange("pause")} data-testid={`menu-pause-${job.id}`}>
            <Archive className="w-4 h-4 mr-2" /> Pause Vacancy
          </DropdownMenuItem>
        ) : job.status === "inactive" ? (
          <DropdownMenuItem onClick={() => onStatusChange("resume")} data-testid={`menu-resume-${job.id}`}>
            <RefreshCw className="w-4 h-4 mr-2" /> Resume Vacancy
          </DropdownMenuItem>
        ) : null}

        {job.status !== "closed" && (
          <DropdownMenuItem onClick={() => onStatusChange("closed")} className="text-destructive focus:text-destructive" data-testid={`menu-close-${job.id}`}>
            <Archive className="w-4 h-4 mr-2" /> Close Vacancy
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function JobDialog({ open, onOpenChange, job }: { open: boolean, onOpenChange: (o: boolean) => void, job: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createJob = useCreateRecruiterJob();
  const updateJob = useUpdateRecruiterJob();

  const isEditing = !!job && !!job.id;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || "",
      department: job?.department || "",
      location: job?.location || "",
      salaryMin: job?.salaryMin ?? undefined,
      salaryMax: job?.salaryMax ?? undefined,
      salaryCurrency: job?.salaryCurrency ?? undefined,
      salaryPeriod: job?.salaryPeriod ?? undefined,
      description: job?.description || "",
      requirements: job?.requirements ?? undefined,
      applyContact: job?.applyContact || "",
      applyMethod: (job?.applyMethod as "email"|"whatsapp") || "email",
      type: (job?.type as "Normal"|"Featured"|"Urgent") || "Normal",
      status: (job?.status as "active"|"inactive"|"closed") || "active",
    }
  });

  useEffect(() => {
    form.reset({
      title: job?.title || "",
      department: job?.department || "",
      location: job?.location || "",
      salaryMin: job?.salaryMin ?? undefined,
      salaryMax: job?.salaryMax ?? undefined,
      salaryCurrency: job?.salaryCurrency ?? undefined,
      salaryPeriod: job?.salaryPeriod ?? undefined,
      description: job?.description || "",
      requirements: job?.requirements ?? undefined,
      applyContact: job?.applyContact || "",
      applyMethod: (job?.applyMethod as "email"|"whatsapp") || "email",
      type: (job?.type as "Normal"|"Featured"|"Urgent") || "Normal",
      status: (job?.status as "active"|"inactive"|"closed") || "active",
    });
  }, [job, form]);

  const onSubmit = (data: JobFormValues) => {
    const payload = {
      ...data,
      ...((data.salaryMin !== undefined || data.salaryMax !== undefined) ? { salaryPeriod: "month" as const } : {}),
    };
    if (isEditing) {
      updateJob.mutate({ id: job.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPublicJobsQueryKey() });
          toast({ title: "Success", description: "Job updated successfully." });
          onOpenChange(false);
        },
        onError: (error) => toast({ title: "Could not update vacancy", description: getJobErrorMessage(error), variant: "destructive" })
      });
    } else {
      createJob.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPublicJobsQueryKey() });
          toast({ title: "Success", description: "Job posted successfully." });
          onOpenChange(false);
        },
        onError: (error) => toast({ title: "Could not post vacancy", description: getJobErrorMessage(error), variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) setTimeout(() => form.reset(), 200);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEditing ? "Edit Vacancy" : "Post New Vacancy"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Executive Chef" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Culinary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select USD or MVR" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MVR">MVR</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Required when a salary amount is provided. Salaries are shown per month.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Male' City or Resort Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Featured">Featured</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 12000"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.value)}
                        data-testid="input-job-salary-min"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 18000"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.value)}
                        data-testid="input-job-salary-max"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="applyMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apply Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apply Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Email or Phone Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the role and responsibilities..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List skills and experience needed..." className="min-h-[100px]" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Paused</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-job">
                Cancel
              </Button>
              <Button type="submit" disabled={createJob.isPending || updateJob.isPending} data-testid="button-save-job">
                {createJob.isPending || updateJob.isPending ? "Saving..." : "Save Vacancy"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
