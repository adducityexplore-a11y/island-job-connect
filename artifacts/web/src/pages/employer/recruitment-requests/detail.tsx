import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import {
  ChevronLeft, Loader2, Building2, BadgeCheck,
  Users, Briefcase, Calendar, CalendarCheck, FileDown,
  X, Sparkles, UserRoundSearch, UserCheck, Check
} from "lucide-react";
import {
  useGetEmployerRecruitmentRequest,
  useEmployerRecruitmentCandidateAction,
  useRespondToUrgentServiceTerms,
  type EmployerRecruitmentAction,
  type EmployerShortlistCandidate
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetEmployerRecruitmentRequestQueryKey } from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "Vacancy": return { label: "Request Received", color: "bg-slate-100 text-slate-700 border-slate-200", step: 1 };
    case "Applications": return { label: "Sourcing", color: "bg-blue-100 text-blue-800 border-blue-200", step: 2 };
    case "Screening": return { label: "Screening", color: "bg-purple-100 text-purple-800 border-purple-200", step: 2 };
    case "Expert Review": return { label: "Expert Review", color: "bg-amber-100 text-amber-800 border-amber-200", step: 2 };
    case "Interview-Ready Shortlist": return { label: "Shortlist Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200", step: 3 };
    case "Employer Interview": return { label: "Interview", color: "bg-orange-100 text-orange-800 border-orange-200", step: 4 };
    case "Position Filled": return { label: "Filled", color: "bg-slate-100 text-slate-800 border-slate-200", step: 5 };
    case "Closed": return { label: "Closed", color: "bg-muted text-muted-foreground border-border", step: 5 };
    default: return { label: status, color: "bg-muted text-muted-foreground border-border", step: 1 };
  }
};

const getUrgentServiceLabel = (status?: string) => ({
  "Not Requested": "Standard",
  Requested: "Details pending",
  "Terms Ready": "Terms ready",
  Accepted: "Terms accepted",
  Active: "Priority handling active",
  Fulfilled: "Completed",
  Declined: "Closed",
}[status || ""] || status);

const getStepState = (currentStep: number, targetStep: number) => {
  if (currentStep > targetStep) return "completed";
  if (currentStep === targetStep) return "current";
  return "upcoming";
};

export default function EmployerRecruitmentRequestDetail() {
  const [, params] = useRoute("/employer/recruitment-requests/:id");
  const requestId = Number(params?.id);
  const { data: request, isLoading } = useGetEmployerRecruitmentRequest(requestId, {
    query: { enabled: !!requestId, queryKey: getGetEmployerRecruitmentRequestQueryKey(requestId) }
  });

  const shortlist: EmployerShortlistCandidate[] = request?.shortlist || [];
  const updateAction = useEmployerRecruitmentCandidateAction();
  const respondToUrgentTerms = useRespondToUrgentServiceTerms();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (candidateId: number, action: string) => {
    updateAction.mutate(
      { id: requestId, candidateId, data: { action: action as EmployerRecruitmentAction["action"] } },
      {
        onSuccess: () => {
          toast({ title: "Action saved", description: `Candidate marked as "${action}".` });
          queryClient.invalidateQueries({ queryKey: getGetEmployerRecruitmentRequestQueryKey(requestId) });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Could not save your action. Please try again." });
        }
      }
    );
  };

  const handleUrgentResponse = (response: "Accepted" | "Declined") => {
    respondToUrgentTerms.mutate({ id: requestId, data: { response } }, {
      onSuccess: () => {
        trackEvent("urgent_service_terms_responded", { response: response.toLowerCase() });
        toast({ title: `Service details ${response.toLowerCase()}`, description: response === "Accepted" ? "The team can now activate priority handling." : "Your Standard Hiring request remains available." });
        queryClient.invalidateQueries({ queryKey: getGetEmployerRecruitmentRequestQueryKey(requestId) });
      },
      onError: () => toast({ variant: "destructive", title: "Could not update service details", description: "Please refresh and try again." }),
    });
  };

  if (isLoading || !request) {
    return (
      <EmployerLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </EmployerLayout>
    );
  }

  const statusDisplay = getStatusDisplay(request.status);
  const currentStep = statusDisplay.step;

  const steps = [
    { num: 1, label: "Received", icon: Calendar, desc: "Requirements confirmed" },
    { num: 2, label: "Sourcing", icon: UserRoundSearch, desc: "Screening & reviewing" },
    { num: 3, label: "Shortlist", icon: UserCheck, desc: "Ready for review" },
    { num: 4, label: "Interviews", icon: CalendarCheck, desc: "Employer feedback" },
    { num: 5, label: "Filled", icon: BadgeCheck, desc: "Hiring complete" }
  ];

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-8 mb-20">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4 text-muted-foreground">
            <Link href="/employer/recruitment-requests">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to requests
            </Link>
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">{request.positionTitle}</h1>
                <Badge variant="outline" className={statusDisplay.color}>{statusDisplay.label}</Badge>
                {request.urgency === "Urgent" && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {request.companyPropertyName}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {request.department}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {request.employeesRequired} hires</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(request.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        {request.urgency === "Urgent" && (
          <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">Urgent Hiring service</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Priority handling starts only after you accept the written service terms.</p>
                </div>
                <Badge variant="outline">{getUrgentServiceLabel(request.urgentServiceStatus)}</Badge>
              </div>
              {request.urgentServiceTerms && <p className="whitespace-pre-wrap text-sm">{request.urgentServiceTerms}</p>}
              <p className="text-xs text-muted-foreground">Priority handling does not guarantee interviews, a hire, or a specific completion time.</p>
              {request.urgentServiceStatus === "Terms Ready" && (
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleUrgentResponse("Accepted")} disabled={respondToUrgentTerms.isPending}>Accept service terms</Button>
                  <Button variant="outline" onClick={() => handleUrgentResponse("Declined")} disabled={respondToUrgentTerms.isPending}>Decline</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visual Progress Tracker */}
        <Card className="border shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row w-full divide-y md:divide-y-0 md:divide-x border-b border-border/50">
              {steps.map((step) => {
                const state = getStepState(currentStep, step.num);
                const Icon = step.icon;
                return (
                  <div key={step.num} className={cn("flex-1 p-4 md:p-5 flex items-center gap-4 transition-colors",
                    state === "current" ? "bg-primary/5" : "bg-transparent",
                    state === "upcoming" ? "opacity-50" : "opacity-100"
                  )}>
                    <div className={cn("shrink-0 h-10 w-10 rounded-full flex items-center justify-center border-2",
                      state === "completed" ? "bg-primary border-primary text-primary-foreground" :
                      state === "current" ? "bg-background border-primary text-primary" :
                      "bg-background border-muted text-muted-foreground"
                    )}>
                      {state === "completed" ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className={cn("font-semibold text-sm font-display", state === "current" ? "text-primary" : "text-foreground")}>{step.label}</p>
                      <p className="text-xs text-muted-foreground hidden md:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={currentStep >= 3 && shortlist.length > 0 ? "shortlist" : "details"} className="mt-8">
          <TabsList className="mb-6 h-auto p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="details" className="py-2.5 px-6 rounded-md data-[state=active]:shadow-sm">Request Details</TabsTrigger>
            <TabsTrigger value="shortlist" className="py-2.5 px-6 rounded-md data-[state=active]:shadow-sm relative">
              Shortlist
              {shortlist.length > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {shortlist.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-display text-xl font-semibold">Role Requirements</h3>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Hiring Scope</p>
                      <p className="font-medium">{request.hiringScope}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Min. Experience</p>
                      <p className="font-medium">{request.minimumExperience || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Education</p>
                      <p className="font-medium">{request.educationRequirement || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">English Level</p>
                      <p className="font-medium">{request.englishLevel || "Not specified"}</p>
                    </div>
                  </div>

                  {request.jobDescription && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Job Description</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{request.jobDescription}</p>
                    </div>
                  )}
                  {request.additionalRequirements && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Additional Requirements</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{request.additionalRequirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-sm border-border/50">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="font-display text-xl font-semibold">Package & Logistics</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Basic Salary</p>
                        <p className="font-medium">{request.salary || "TBD"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Service Charge</p>
                        <p className="font-medium">{request.serviceCharge || "None"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Joining Date</p>
                        <p className="font-medium">{request.joiningDate || "Flexible"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                      <div className={cn("px-3 py-1.5 rounded-md text-sm flex items-center gap-2 border", request.accommodationProvided ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground")}>
                        {request.accommodationProvided ? <BadgeCheck className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        Accommodation
                      </div>
                      <div className={cn("px-3 py-1.5 rounded-md text-sm flex items-center gap-2 border", request.foodProvided ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground")}>
                        {request.foodProvided ? <BadgeCheck className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        Meals
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/50 bg-primary/5">
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg font-semibold mb-4">Contact Info</h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-base">{request.contactPerson}</p>
                      <p className="text-muted-foreground">{request.contactEmail}</p>
                      <p className="text-muted-foreground">{request.contactNumber}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shortlist" className="space-y-6">
            {!shortlist.length ? (
              <Card className="border-dashed shadow-none bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="rounded-full bg-primary/10 p-5 mb-5 shadow-sm">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground">Sourcing in progress</h3>
                  <p className="mt-3 max-w-md text-muted-foreground text-base">
                    Our recruitment team is currently screening candidates for this position. We'll curate the top matches and notify you when they're ready for review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {shortlist.map((candidate) => (
                  <Card key={candidate.id} className={cn("transition-all", candidate.employerAction ? "border-primary/20 bg-primary/5" : "border-border shadow-sm")}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h3 className="font-display text-xl font-bold">{candidate.fullName}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              {candidate.employerAction && (
                                <Badge variant="outline" className={cn(
                                  candidate.employerAction === "Invite for Interview" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                                  candidate.employerAction === "Keep for Review" ? "bg-blue-100 text-blue-800 border-blue-200" :
                                  candidate.employerAction === "Mark Hired" ? "bg-purple-100 text-purple-800 border-purple-200" :
                                  "bg-slate-100 text-slate-800 border-slate-200"
                                )}>
                                  {candidate.employerAction}
                                </Badge>
                              )}
                              {candidate.match.score != null && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                  {candidate.match.score}% Match
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-sm bg-background/50 rounded-lg p-4 border border-border/50">
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Position</p>
                              <p className="font-medium line-clamp-2">{candidate.desiredPosition || candidate.headline || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Experience</p>
                              <p className="font-medium">{candidate.yearsExperience ? `${candidate.yearsExperience} yrs` : "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Nationality</p>
                              <p className="font-medium">{candidate.nationality || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Availability</p>
                              <p className="font-medium">{candidate.availabilityStatus || "Not specified"}</p>
                            </div>
                          </div>

                          {candidate.match.strengths.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2 font-semibold">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Top Strengths
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {candidate.match.strengths.map((strength, i) => (
                                  <Badge key={i} variant="outline" className="bg-amber-50/50 text-amber-900 border-amber-200/60 font-normal">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch gap-3 shrink-0 sm:min-w-[200px] bg-background/50 p-4 rounded-lg border border-border/50">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Actions</p>
                          <Button variant="outline" asChild className="w-full bg-white">
                            <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer">
                              <FileDown className="mr-2 h-4 w-4" />
                              View CV
                            </a>
                          </Button>

                          <Select
                            value={candidate.employerAction || "pending"}
                            onValueChange={(val: any) => val !== "pending" && handleAction(candidate.id, val)}
                            disabled={updateAction.isPending}
                          >
                            <SelectTrigger className={cn("w-full", candidate.employerAction ? "bg-white" : "bg-primary text-primary-foreground")}>
                              <SelectValue placeholder="Update status..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending" disabled className="hidden">Update status...</SelectItem>
                              <SelectItem value="Invite for Interview">Invite for Interview</SelectItem>
                              <SelectItem value="Keep for Review">Keep for Review</SelectItem>
                              <SelectItem value="Mark Hired">Mark Hired</SelectItem>
                              <SelectItem value="Reject">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EmployerLayout>
  );
}
