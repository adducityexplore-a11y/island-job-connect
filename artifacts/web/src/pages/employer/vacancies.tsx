import { Link, useRoute } from "wouter";
import { CircleX, Pencil, Plus } from "lucide-react";
import { useListRecruiterJobs, useUpdateVacancyStatus, VacancyStatusUpdateRequestStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { VacancyForm } from "@/components/employer/vacancy-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EmployerVacancies() {
  const [, params] = useRoute("/employer/vacancies/:id");
  const jobs = useListRecruiterJobs();
  const queryClient = useQueryClient();
  const status = useUpdateVacancyStatus();
  const id = params?.id;
  const selected = id && id !== "new" ? jobs.data?.find(job => job.id === Number(id)) : undefined;
  const saveStatus = (jobId: number, value: VacancyStatusUpdateRequestStatus) => status.mutate({ id: jobId, data: { status: value } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: jobs.queryKey }); toast.success("Vacancy status updated"); }, onError: () => toast.error("Unable to update vacancy status") });
  const content = id ? <Card><CardContent className="p-5 md:p-7"><h2 className="mb-6 font-display text-xl font-bold">{id === "new" ? "Post a vacancy" : selected ? `Edit ${selected.title}` : "Vacancy not found"}</h2>{id === "new" || selected ? <VacancyForm job={selected} /> : <Button asChild><Link href="/employer/vacancies">Back to vacancies</Link></Button>}</CardContent></Card> : <div className="space-y-4">{jobs.isLoading ? <Skeleton className="h-48 w-full" /> : jobs.data?.length ? jobs.data.map(job => <Card key={job.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold">{job.title}</h2><Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{job.department || "Department not provided"} · {job.location || "Location not provided"} · {job.applyCount ?? 0} applications</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><Link href={`/employer/vacancies/${job.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.9} />Edit</Link></Button>{job.status !== "closed" && <Button size="sm" variant="outline" disabled={status.isPending} onClick={() => saveStatus(job.id, "closed")}><CircleX className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.9} />Close</Button>}</div></CardContent></Card>) : <Card><CardContent className="p-10 text-center text-muted-foreground">You have not posted a vacancy yet.</CardContent></Card>}</div>;
  return <EmployerLayout><div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vacancies</p><h1 className="font-display text-3xl font-bold">{id ? "Vacancy editor" : "Your vacancies"}</h1></div>{!id && <Button asChild><Link href="/employer/vacancies/new"><Plus className="mr-2 h-4 w-4" />Post a vacancy</Link></Button>}</div>{content}</div></EmployerLayout>;
}