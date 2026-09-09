import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Disclosure, JobCreateRequest, JobUpdateRequest, RecruiterJob, useCreateRecruiterJob, useUpdateRecruiterJob } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const packageFields = [
  ["serviceCharge", "Service charge"], ["otherAllowances", "Other allowances"], ["overtime", "Overtime"],
  ["accommodation", "Accommodation"], ["meals", "Meals"], ["healthInsurance", "Health insurance"],
  ["annualLeave", "Annual leave"], ["airTicket", "Air ticket"], ["workingHours", "Working hours"],
  ["weeklyOff", "Weekly off"], ["probation", "Probation"], ["contractLength", "Contract length"],
] as const;
type PackageKey = typeof packageFields[number][0];
type FormState = Record<"title" | "department" | "location" | "experienceLevel" | "candidateScope" | "description" | "requirements" | "applyContact" | "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryPeriod" | "source" | "originalSourceUrl" | "publishedAt" | "applicationDeadline" | "expiresAt" | PackageKey, string> & Record<"salaryDisclosure" | `${PackageKey}Disclosure`, Disclosure>;

const blankForm = (): FormState => ({
  title: "", department: "", location: "", experienceLevel: "", candidateScope: "", description: "", requirements: "", applyContact: "", salaryMin: "", salaryMax: "", salaryCurrency: "USD", salaryPeriod: "month",
  source: "", originalSourceUrl: "", publishedAt: "", applicationDeadline: "", expiresAt: "", salaryDisclosure: Disclosure.not_provided,
  ...Object.fromEntries(packageFields.flatMap(([key]) => [[key, ""], [`${key}Disclosure`, Disclosure.not_provided]])),
}) as FormState;
const dateValue = (value?: string | null) => value ? value.slice(0, 10) : "";

type Props = { job?: RecruiterJob };
export function VacancyForm({ job }: Props) {
  const [, navigate] = useLocation();
  const create = useCreateRecruiterJob();
  const update = useUpdateRecruiterJob();
  const [form, setForm] = useState<FormState>(blankForm);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!job) return;
    const packageValues = Object.fromEntries(packageFields.flatMap(([key]) => {
      const disclosureKey = `${key}Disclosure` as keyof RecruiterJob;
      return [
        [key, job[key] ?? ""],
        [`${key}Disclosure`, (job[disclosureKey] as Disclosure | undefined) ?? Disclosure.not_provided],
      ];
    }));
    setForm({
      ...blankForm(),
      ...packageValues,
      title: job.title,
      department: job.department || "",
      location: job.location || "",
      experienceLevel: job.experienceLevel || "",
      candidateScope: job.candidateScope || "",
      description: job.description || "",
      requirements: job.requirements || "",
      applyContact: job.applyContact || "",
      salaryMin: job.salaryMin?.toString() || "",
      salaryMax: job.salaryMax?.toString() || "",
      salaryCurrency: job.salaryCurrency ?? "",
      salaryPeriod: job.salaryPeriod ?? "",
      salaryDisclosure: job.salaryDisclosure ?? Disclosure.not_provided,
      source: job.source || "",
      originalSourceUrl: job.originalSourceUrl || "",
      publishedAt: dateValue(job.publishedAt),
      applicationDeadline: dateValue(job.applicationDeadline),
      expiresAt: dateValue(job.expiresAt),
    } as FormState);
    setTouched(new Set());
  }, [job]);
  const set = (key: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [key]: value } as FormState));
    setTouched(current => new Set(current).add(key));
  };
  const optionalPayload = (): Partial<JobCreateRequest> => {
    // Optional values are only sent after user interaction. This lets PATCH
    // preserve existing values, while a deliberate clear of a nullable field
    // is represented as null.
    const include = (key: keyof FormState) => touched.has(key);
    const payload: Record<string, string | number | null | undefined> = {};
    const optionalTextFields: (keyof FormState)[] = ["requirements", "source", "publishedAt"];
    optionalTextFields.forEach(key => { if (include(key)) payload[key] = form[key] || undefined; });
    const nullableFields: (keyof FormState)[] = ["originalSourceUrl", "applicationDeadline", "expiresAt", "experienceLevel", "candidateScope"];
    nullableFields.forEach(key => { if (include(key)) payload[key] = form[key] || null; });
    (["salaryMin", "salaryMax"] as const).forEach(key => { if (include(key)) payload[key] = form[key] === "" ? undefined : Number(form[key]); });
    if (include("salaryMin") || include("salaryMax")) {
      payload.salaryCurrency = form.salaryCurrency || undefined;
      payload.salaryPeriod = form.salaryPeriod || undefined;
    }
    if (include("salaryDisclosure")) payload.salaryDisclosure = form.salaryDisclosure;
    packageFields.forEach(([key]) => {
      if (include(key)) payload[key] = form[key] || undefined;
      const disclosure = `${key}Disclosure` as keyof FormState;
      if (include(disclosure)) payload[disclosure] = form[disclosure];
    });
    return payload as Partial<JobCreateRequest>;
  };
  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const min = form.salaryMin === "" ? undefined : Number(form.salaryMin);
    const max = form.salaryMax === "" ? undefined : Number(form.salaryMax);
    if (min !== undefined && max !== undefined && min > max) { toast.error("Minimum salary cannot exceed maximum salary."); return; }
    const core = { title: form.title, department: form.department, location: form.location, description: form.description, requirements: form.requirements || undefined, applyContact: form.applyContact };
    const options = { onSuccess: () => { toast.success(job ? "Vacancy updated" : "Vacancy created"); navigate("/employer/vacancies"); }, onError: () => toast.error("Unable to save vacancy. Please review the details and try again.") };
    if (job) update.mutate({ id: job.id, data: { ...core, ...optionalPayload() } as JobUpdateRequest }, options);
    else create.mutate({ data: { ...core, applyMethod: "email", ...optionalPayload() } as JobCreateRequest }, options);
  };
  const saving = create.isPending || update.isPending;
  return <form onSubmit={submit} className="space-y-7">
    <section className="grid gap-5 md:grid-cols-2">
      <Field label="Vacancy title"><Input value={form.title} onChange={e => set("title", e.target.value)} required data-testid="input-vacancy-title" /></Field>
      <Field label="Department"><Input value={form.department} onChange={e => set("department", e.target.value)} required /></Field>
      <Field label="Location / atoll"><Input value={form.location} onChange={e => set("location", e.target.value)} required /></Field>
      <OptionalSelectField label="Experience level" value={form.experienceLevel} onChange={value => set("experienceLevel", value)} options={["Entry Level", "1-2 Years", "3-5 Years", "5+ Years"]} />
      <OptionalSelectField label="Candidate scope" value={form.candidateScope} onChange={value => set("candidateScope", value)} options={["Local", "International", "Both"]} />
      <Field label="Application contact"><Input type="email" value={form.applyContact} onChange={e => set("applyContact", e.target.value)} required data-testid="input-vacancy-application-contact" /></Field>
      <Field label="Vacancy source"><Input value={form.source} onChange={e => set("source", e.target.value)} placeholder="Optional" /></Field>
      <Field label="Original source URL"><Input type="url" value={form.originalSourceUrl} onChange={e => set("originalSourceUrl", e.target.value)} placeholder="Optional" /></Field>
      <Field label="Published date"><Input type="date" value={form.publishedAt} onChange={e => set("publishedAt", e.target.value)} /></Field>
      <Field label="Application deadline"><Input type="date" value={form.applicationDeadline} onChange={e => set("applicationDeadline", e.target.value)} /></Field>
      <Field label="Expiry date"><Input type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} /></Field>
    </section>
    <Field label="Role description"><Textarea value={form.description} onChange={e => set("description", e.target.value)} required className="min-h-36" /></Field>
    <Field label="Requirements"><Textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} className="min-h-28" /></Field>
    <section className="space-y-4 border-t pt-6"><div><p className="font-display text-lg font-bold">Employment package</p><p className="text-sm text-muted-foreground">Choose a disclosure status for every package item you want to communicate.</p></div>
      <div className="grid gap-5 md:grid-cols-2"><PackageField label="Basic salary" field="salary" form={form} set={set} /><>{packageFields.map(([field, label]) => <PackageField key={field} label={label} field={field} form={form} set={set} />)}</></div>
    </section>
    <div className="space-y-3 border-t pt-5">
      <p className="text-xs leading-relaxed text-muted-foreground">
        By publishing or updating this vacancy, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-vacancy-employer-terms">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-vacancy-privacy">Privacy Policy</Link>.
      </p>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={saving} data-testid="button-submit-vacancy">{saving ? "Saving…" : job ? "Save changes" : "Publish vacancy"}</Button><Button type="button" variant="outline" onClick={() => navigate("/employer/vacancies")} data-testid="button-cancel-vacancy">Cancel</Button></div>
    </div>
  </form>;
}
function PackageField({ label, field, form, set }: { label: string; field: PackageKey | "salary"; form: FormState; set: (key: keyof FormState, value: string) => void }) {
  const isSalary = field === "salary";
  const disclosureKey = (isSalary ? "salaryDisclosure" : `${field}Disclosure`) as keyof FormState;
  const disclosure = form[disclosureKey] as Disclosure;
  return <div className="rounded-lg border p-4 space-y-3"><Label>{label}</Label>{isSalary ? <><div className="grid grid-cols-2 gap-2"><Input type="number" min="0" value={form.salaryMin} onChange={e => set("salaryMin", e.target.value)} placeholder="From" disabled={disclosure !== Disclosure.provided} /><Input type="number" min="0" value={form.salaryMax} onChange={e => set("salaryMax", e.target.value)} placeholder="To" disabled={disclosure !== Disclosure.provided} /></div><div className="grid grid-cols-2 gap-2"><Select value={form.salaryCurrency} onValueChange={value => set("salaryCurrency", value)} disabled={disclosure !== Disclosure.provided}><SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="MVR">MVR</SelectItem></SelectContent></Select><Select value={form.salaryPeriod} onValueChange={value => set("salaryPeriod", value)} disabled={disclosure !== Disclosure.provided}><SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger><SelectContent><SelectItem value="month">Per month</SelectItem></SelectContent></Select></div></> : <Input value={form[field]} onChange={e => set(field, e.target.value)} disabled={disclosure !== Disclosure.provided} placeholder="Details when provided" />}<Select value={disclosure} onValueChange={value => set(disclosureKey, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={Disclosure.provided}>Provided</SelectItem><SelectItem value={Disclosure.not_disclosed}>Not disclosed</SelectItem><SelectItem value={Disclosure.not_provided}>Not provided</SelectItem></SelectContent></Select></div>;
}
function OptionalSelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <Field label={label}><div className="flex gap-2"><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>{value && <Button type="button" variant="outline" onClick={() => onChange("")}>Clear</Button>}</div></Field>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }