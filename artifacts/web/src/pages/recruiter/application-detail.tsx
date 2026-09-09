import { useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetRecruiterApplication,
  useUpdateApplicationStatus,
  getGetRecruiterApplicationQueryKey,
  getListRecruiterApplicationsQueryKey,
  getGetRecruiterDashboardQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RecruiterLayout } from "@/components/recruiter/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  Globe,
  FileText,
  Calendar,
  MessageSquare,
  Building,
  CheckCircle,
  Award
} from "lucide-react";
import { ApplicationStage } from "@workspace/api-client-react";
import { StageBadge } from "./applications";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const updateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStage),
  note: z.string().optional(),
});

export default function RecruiterApplicationDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const appId = parseInt(id, 10);

  const { data: detail, isLoading, error } = useGetRecruiterApplication(appId, {
    query: {
      enabled: !isNaN(appId),
      queryKey: getGetRecruiterApplicationQueryKey(appId)
    }
  });

  const updateStatus = useUpdateApplicationStatus();

  const form = useForm<z.infer<typeof updateStatusSchema>>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: ApplicationStage.New_Applicant,
      note: ""
    }
  });

  useEffect(() => {
    if (detail?.application) {
      form.reset({ status: detail.application.status, note: "" });
    }
  }, [detail?.application, form]);

  const onSubmit = (data: z.infer<typeof updateStatusSchema>) => {
    updateStatus.mutate({ id: appId, data }, {
      onSuccess: () => {
        toast({ title: "Status Updated", description: "The application stage has been updated." });
        queryClient.invalidateQueries({ queryKey: getGetRecruiterApplicationQueryKey(appId) });
        queryClient.invalidateQueries({ queryKey: getListRecruiterApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() });
        form.setValue("note", ""); // clear note after submit
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
      }
    });
  };

  if (error) {
    return (
      <RecruiterLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Application not found or you do not have access.</p>
          <Button variant="link" asChild className="mt-4">
            <Link href="/recruiter/applications"><ArrowLeft className="w-4 h-4 mr-2" /> Back to pipeline</Link>
          </Button>
        </div>
      </RecruiterLayout>
    );
  }

  const c = detail?.candidate;

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link href="/recruiter/applications"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground truncate">
                {isLoading ? <Skeleton className="h-8 w-48" /> : c?.fullName}
              </h1>
              {c?.jobsMvReviewed && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0 self-start sm:self-auto">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  The Jobs MV Reviewed
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 truncate">
              {isLoading ? <Skeleton className="h-4 w-32" /> : (
                <>
                  Applying for <span className="font-medium text-foreground truncate">{detail?.jobTitle}</span>
                </>
              )}
            </p>
          </div>
          <div className="ml-auto shrink-0 pl-2">
            {detail?.application?.status && <StageBadge stage={detail.application.status} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-display">Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 space-y-4">
                        {c?.headline && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Headline</h4>
                            <p className="text-foreground font-medium text-lg">{c.headline}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-foreground">{c?.email}</span>
                          </div>
                          {c?.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4 shrink-0" />
                              <span className="text-foreground">{c.phone}</span>
                            </div>
                          )}
                          {c?.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="text-foreground">{c.location}</span>
                            </div>
                          )}
                          {c?.nationality && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="w-4 h-4 shrink-0" />
                              <span className="text-foreground">{c.nationality}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {c?.summary && (
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
                          <DetailRow label="Current Employer" value={c?.currentEmployer} />
                          <DetailRow label="Total Hospitality Experience" value={c?.totalHospitalityExperience || c?.yearsExperience} />
                          <DetailRow label="Maldives Experience" value={c?.maldivesExperience} />
                          <DetailRow label="Resort Experience" value={c?.totalResortExperience} />
                          <DetailRow label="Luxury Resort Experience" value={c?.luxuryResortExperience} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-display font-semibold flex items-center gap-2 border-b border-border pb-2">
                          <Award className="w-4 h-4 text-muted-foreground" /> Skills & Certifications
                        </h4>
                        <div className="space-y-3">
                          <DetailRow label="Hospitality Specialties" value={c?.hospitalitySpecialties} />
                          <DetailRow label="Role Specific Skills" value={c?.roleSpecificSkills} />
                          <DetailRow label="Technical / POS Systems" value={c?.posSystems} />
                          <DetailRow label="Languages" value={c?.languages} />
                          <DetailRow label="Certifications" value={c?.professionalCertifications || c?.hospitalityCertifications} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-display font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" /> Availability
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailRow label="Employment Status" value={c?.employmentStatus} />
                        <DetailRow label="Notice Period" value={c?.noticePeriod} />
                        <DetailRow label="Available From" value={c?.availableFrom} />
                        <DetailRow label="Currently in Maldives" value={c?.currentlyInMaldives !== undefined ? (c?.currentlyInMaldives ? "Yes" : "No") : undefined} />
                      </div>
                    </div>

                    {c?.cvAvailable && (
                      <div className="pt-6 border-t border-border">
                        <Button variant="outline" asChild>
                          <a
                            href={`/api/recruiter/candidates/${c.id}/cv`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="link-candidate-cv"
                          >
                            <FileText className="w-4 h-4 mr-2" /> View Resume / CV
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <CardHeader className="pb-4 border-b border-border bg-muted/20">
                <CardTitle className="text-lg font-display">Update Stage</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Move to</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-app-status">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.values(ApplicationStage) as string[])
                                .filter(s => s !== ApplicationStage.AI_Reviewed) // Hide AI Reviewed manually
                                .map(stage => {
                                  let label = stage;
                                  if (stage === ApplicationStage.Reviewed) label = "Screening / Reviewed";
                                  else if (stage === ApplicationStage.Rejected) label = "Not Selected";
                                  else if (stage === ApplicationStage.Selected) label = "Offered";
                                  return <SelectItem key={stage} value={stage}>{label}</SelectItem>;
                                })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Reason for decision, interview notes..."
                              className="resize-none h-24"
                              {...field}
                              data-testid="textarea-app-note"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updateStatus.isPending || isLoading}
                      data-testid="button-update-stage"
                    >
                      {updateStatus.isPending ? "Updating..." : "Update Application"}
                    </Button>
                  </form>
                </Form>
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
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : detail?.history && detail.history.length > 0 ? (
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
                          {item.note && (
                            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded flex gap-2">
                              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                              <p className="leading-tight">{item.note}</p>
                            </div>
                          )}
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
    </RecruiterLayout>
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
