import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useCreateEmployerRecruitmentRequest, useGetCompanyProfile } from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

const DEPARTMENTS = [
  "Front Office", "Food & Beverage", "Housekeeping", "Culinary / Kitchen",
  "Spa & Wellness", "Engineering", "Human Resources", "Finance",
  "Sales & Marketing", "Management / Executive", "Marine & Recreation", "Other"
];

const EXPERIENCE_LEVELS = [
  "Entry Level (0-1 years)",
  "Junior (1-3 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Department Head (8+ years)",
  "Executive Level"
];

const ENGLISH_LEVELS = [
  "Basic (Can understand simple instructions)",
  "Conversational (Can interact with guests)",
  "Fluent (Professional working proficiency)",
  "Native / Bilingual"
];

const requestSchema = z.object({
  companyPropertyName: z.string().min(1, "Company/Property name is required"),
  positionTitle: z.string().min(1, "Position title is required"),
  department: z.string().min(1, "Department is required"),
  employeesRequired: z.coerce.number().min(1, "At least 1 employee is required"),
  hiringScope: z.enum(["Local", "International", "Both"]),
  urgency: z.enum(["Normal", "Urgent"]),

  minimumExperience: z.string().optional(),
  preferredExperience: z.string().optional(),
  educationRequirement: z.string().optional(),
  englishLevel: z.string().optional(),
  additionalRequirements: z.string().optional(),
  jobDescription: z.string().optional(),

  salaryCurrency: z.string().default("USD"),
  salaryAmount: z.string().optional(),
  serviceChargeAmount: z.string().optional(),
  accommodationProvided: z.boolean().default(false),
  foodProvided: z.boolean().default(false),
  joiningDate: z.string().optional(),

  contactPerson: z.string().min(1, "Contact person is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

type FormValues = z.infer<typeof requestSchema>;

export default function NewRecruitmentRequest() {
  const createRequest = useCreateEmployerRecruitmentRequest();
  const { data: profile } = useGetCompanyProfile();
  const { toast } = useToast();

  const [submittedRequestId, setSubmittedRequest] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      companyPropertyName: "",
      positionTitle: "",
      department: "",
      employeesRequired: 1,
      hiringScope: "Local",
      urgency: "Normal",
      minimumExperience: "",
      preferredExperience: "",
      educationRequirement: "",
      englishLevel: "",
      additionalRequirements: "",
      jobDescription: "",
      salaryCurrency: "USD",
      salaryAmount: "",
      serviceChargeAmount: "",
      accommodationProvided: false,
      foodProvided: false,
      joiningDate: "",
      contactPerson: "",
      contactEmail: "",
      contactNumber: "",
    },
  });

  useEffect(() => {
    if (profile) {
      if (profile.companyName && !form.getValues("companyPropertyName")) form.setValue("companyPropertyName", profile.companyName);
      if (profile.contactName && !form.getValues("contactPerson")) form.setValue("contactPerson", profile.contactName);
      if (profile.email && !form.getValues("contactEmail")) form.setValue("contactEmail", profile.email);
      if (profile.phone && !form.getValues("contactNumber")) form.setValue("contactNumber", profile.phone);
    }
  }, [profile, form]);

  const onSubmit = (data: FormValues) => {
    // Serialize salary and service charge
    const salary = data.salaryAmount ? `${data.salaryCurrency} ${data.salaryAmount}` : undefined;
    const serviceCharge = data.serviceChargeAmount ? `${data.salaryCurrency} ${data.serviceChargeAmount}` : undefined;

    const payload = {
      companyPropertyName: data.companyPropertyName,
      positionTitle: data.positionTitle,
      department: data.department,
      employeesRequired: data.employeesRequired,
      hiringScope: data.hiringScope,
      urgency: data.urgency,
      minimumExperience: data.minimumExperience,
      preferredExperience: data.preferredExperience,
      educationRequirement: data.educationRequirement,
      englishLevel: data.englishLevel,
      additionalRequirements: data.additionalRequirements,
      jobDescription: data.jobDescription,
      salary,
      serviceCharge,
      accommodationProvided: data.accommodationProvided,
      foodProvided: data.foodProvided,
      joiningDate: data.joiningDate,
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      contactNumber: data.contactNumber,
    };

    createRequest.mutate({ data: payload }, {
      onSuccess: (res) => {
        trackEvent("recruitment_request_submitted", {
          service: data.urgency === "Urgent" ? "urgent" : "standard",
          hiring_scope: data.hiringScope,
          employees_required: data.employeesRequired,
        });
        setSubmittedRequest(res.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Submission failed", description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again." });
      }
    });
  };

  if (submittedRequestId) {
    return (
      <EmployerLayout>
        <div className="mx-auto max-w-2xl p-4 md:p-8 space-y-6 pt-12">
          <Card className="border-0 shadow-lg bg-card overflow-hidden">
            <div className="bg-primary/5 p-8 text-center border-b">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Request Received</h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {form.getValues("urgency") === "Urgent"
                  ? "Our team will review your Urgent Hiring request and confirm the service details before priority handling begins."
                  : "Our hospitality experts will review your request and begin the standard hiring process."}
              </p>
            </div>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-6 flex flex-col items-center text-center">
                  <h3 className="font-medium text-foreground mb-1">What happens next?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    We will review your requirements, screen potential matches, and notify you when your curated shortlist is ready to review.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/employer/recruitment-requests/${submittedRequestId}`}>Track Recruitment</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href="/employer/dashboard">Back to Workspace</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </EmployerLayout>
    );
  }

  // Live preview for the summary
  const watchAllFields = form.watch();

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-6xl p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* Form Column */}
        <div className="flex-1 space-y-8 min-w-0 w-full">
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground hover:text-foreground">
              <Link href="/employer/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to workspace
              </Link>
            </Button>
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Who Do You Need?</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Tell us about the role and the hiring support you need.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-20">

              {/* Section 1: Position */}
              <section className="space-y-6">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary w-6 h-6 rounded-full text-sm">1</span>
                    Position Details
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="companyPropertyName" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Company / Property Name</FormLabel>
                      <FormControl><Input placeholder="e.g. The Grand Resort" className="bg-background" data-testid="input-recruitment-company-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="positionTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title</FormLabel>
                      <FormControl><Input placeholder="e.g. Front Office Manager" className="bg-background" data-testid="input-recruitment-position-title" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select department" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="employeesRequired" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Hires</FormLabel>
                      <FormControl><Input type="number" min="1" className="bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="hiringScope" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hiring Scope</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select scope" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Local">Local Candidates Only</SelectItem>
                          <SelectItem value="International">Expatriates Only</SelectItem>
                          <SelectItem value="Both">Both Local & Expatriate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="urgency" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Hiring Speed</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        trackEvent("hiring_service_selected", {
                          service: value === "Urgent" ? "urgent" : "standard",
                          location: "recruitment_request_form",
                        });
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Standard Hiring</SelectItem>
                          <SelectItem value="Urgent">Urgent Hiring (Time-sensitive)</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.value === "Urgent" && (
                        <FormDescription className="text-amber-600 font-medium mt-1">
                          Requests receive prioritized handling after you accept the written service terms. Interviews, hires, and a specific completion time are not guaranteed.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="jobDescription" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Job Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Paste full job description or key responsibilities here..." className="min-h-[120px] bg-background resize-y" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* Section 2: What Matters Most */}
              <section className="space-y-6">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary w-6 h-6 rounded-full text-sm">2</span>
                    What Matters Most
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="minimumExperience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Experience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select experience" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="englishLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Proficiency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select level" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ENGLISH_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="preferredExperience" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Preferred Experience / Bonus Skills</FormLabel>
                      <FormControl><Input placeholder="e.g. Pre-opening experience, specific POS software..." className="bg-background" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="educationRequirement" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Education Requirement (If strict)</FormLabel>
                      <FormControl><Input placeholder="e.g. Degree in Hospitality" className="bg-background" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="additionalRequirements" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Additional Requirements</FormLabel>
                      <FormControl><Textarea placeholder="Any other hard requirements we should screen for?" className="bg-background resize-y" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* Section 3: Package & Joining */}
              <section className="space-y-6">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary w-6 h-6 rounded-full text-sm">3</span>
                    Package & Joining
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="salaryCurrency" render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="MVR">MVR</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="salaryAmount" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Basic Salary (Amount)</FormLabel>
                        <FormControl><Input placeholder="e.g. 1500" type="number" className="bg-background" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="serviceChargeAmount" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Avg. Service Charge (Amount)</FormLabel>
                      <FormControl><Input placeholder="e.g. 500" type="number" className="bg-background" {...field} value={field.value || ""} /></FormControl>
                      <FormDescription>Leave empty if not applicable.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex flex-col gap-4 sm:flex-row sm:col-span-2">
                    <FormField control={form.control} name="accommodationProvided" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-4 sm:w-1/2">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base cursor-pointer">Accommodation</FormLabel>
                          <FormDescription>Provided by employer</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="foodProvided" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-4 sm:w-1/2">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base cursor-pointer">Meals / Food</FormLabel>
                          <FormDescription>Provided by employer</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="joiningDate" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Expected Joining Date</FormLabel>
                      <FormControl><Input type="date" className="bg-background" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* Section 4: Contact */}
              <section className="space-y-6">
                <div className="border-b pb-2">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary w-6 h-6 rounded-full text-sm">4</span>
                    Contact
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="contactPerson" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Contact Person Name</FormLabel>
                      <FormControl><Input className="bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" className="bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input type="tel" className="bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              {/* Mobile Submit Button (hidden on desktop where sticky card is used) */}
              <div className="lg:hidden mt-10">
                <p className="mb-3 text-center text-xs leading-relaxed text-muted-foreground">
                  By submitting, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-recruitment-employer-terms-mobile">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-recruitment-privacy-mobile">Privacy Policy</Link>.
                </p>
                <Button type="submit" size="lg" className="w-full text-base" disabled={createRequest.isPending} data-testid="button-submit-recruitment-request-mobile">
                  {createRequest.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </div>

        {/* Live Summary Card (Sticky Desktop, Optional summary for Mobile) */}
        <div className="hidden lg:block w-96 shrink-0 sticky top-24">
          <Card className="border shadow-sm bg-card overflow-hidden">
            <div className="bg-primary p-4 text-primary-foreground">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Request Summary
              </h3>
            </div>
            <CardContent className="p-5 space-y-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Role</p>
                <p className="font-medium text-lg leading-tight">{watchAllFields.positionTitle || "Position not set"}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{watchAllFields.department || "Department not set"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hiring Needs</p>
                <div className="text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Vacancies:</span>
                    <span className="font-medium">{watchAllFields.employeesRequired}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Scope:</span>
                    <span className="font-medium">{watchAllFields.hiringScope}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Urgency:</span>
                    <span className="font-medium">{watchAllFields.urgency}</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Package</p>
                <div className="text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary:</span>
                    <span className="font-medium">
                      {watchAllFields.salaryAmount ? `${watchAllFields.salaryCurrency} ${watchAllFields.salaryAmount}` : "TBD"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Service Charge:</span>
                    <span className="font-medium">
                      {watchAllFields.serviceChargeAmount ? `${watchAllFields.salaryCurrency} ${watchAllFields.serviceChargeAmount}` : "None"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${watchAllFields.accommodationProvided ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>Accommodation</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${watchAllFields.foodProvided ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>Meals</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  size="lg"
                  className="w-full text-base shadow-sm"
                  disabled={createRequest.isPending}
                  data-testid="button-submit-recruitment-request"
                >
                  {createRequest.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Our experts will review this and contact {watchAllFields.contactPerson || "you"} to confirm.
                </p>
                <p className="text-xs text-center leading-relaxed text-muted-foreground mt-3">
                  By submitting, you agree to the <Link href="/employer-terms" className="font-medium text-primary hover:underline" data-testid="link-recruitment-employer-terms">Employer Terms</Link> and <Link href="/privacy-policy" className="font-medium text-primary hover:underline" data-testid="link-recruitment-privacy">Privacy Policy</Link>.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </EmployerLayout>
  );
}
