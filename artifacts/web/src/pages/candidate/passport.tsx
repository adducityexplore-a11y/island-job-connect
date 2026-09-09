import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Save, ShieldCheck, UserRound, LogIn, FileText, Download, Upload, Loader2, AlertCircle, Pencil, MapPin, BriefcaseBusiness } from "lucide-react";
import { downloadCandidateCv, getGetCandidateProfileQueryKey, useCompleteCandidateCvUpload, useGetCandidateProfile, useRequestCandidateCvUploadUrl, useUpsertCandidateProfile } from "@workspace/api-client-react";
import type { CandidateCvUploadRequestContentType, CandidateProfileUpdateRequest } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { WorkHistoryEditor, type WorkHistoryEntry } from "@/components/candidate/work-history-editor";
import { LanguageEditor, type LanguageEntry } from "@/components/candidate/language-editor";

type FormData = Record<string, string | boolean | null>;

const availabilityStatuses = [
  "Available Now",
  "Available Within 30 Days",
  "Currently Employed",
  "Not Looking",
] as const;

export default function HospitalityPassport() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileQueryKey = getGetCandidateProfileQueryKey();

  const { data: profile, isLoading, error } = useGetCandidateProfile({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: profileQueryKey,
      retry: (failureCount, queryError) => {
        const status = typeof queryError === "object" && queryError !== null && "status" in queryError
          ? queryError.status
          : undefined;
        return status !== 404 && failureCount < 2;
      },
    },
  });

  const update = useUpsertCandidateProfile();
  const isMissingProfile = typeof error === "object" && error !== null && "status" in error && error.status === 404;

  const [form, setForm] = useState<FormData>({});
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const stepNames = [
    "About You",
    "Your Experience",
    "Skills & Languages",
    "What You're Looking For",
    "Availability"
  ];

  useEffect(() => {
    if (isMissingProfile) setIsEditing(true);
  }, [isMissingProfile]);

  useEffect(() => {
    if (!profile) {
      setForm((current) => ({
        ...current,
        email: current.email || user?.primaryEmailAddress?.emailAddress || "",
        fullName: current.fullName || user?.fullName || "",
      }));
      return;
    }
    const next: FormData = {};
    Object.entries(profile).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "boolean" || value === null) {
        next[key] = value;
      }
    });
    setForm(next);

    setWorkHistory((profile.workHistory || []).map((item: any) => ({
      id: item.id || crypto.randomUUID(),
      position: item.position || "",
      employer: item.employer || "",
      country: item.country || "",
      resortHotel: item.resortHotel || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      responsibilities: item.responsibilities || ""
    })));

    setLanguages((profile.languageProficiencies || []).map((item: any) => ({
      id: item.id || crypto.randomUUID(),
      language: item.language || "",
      proficiency: item.proficiency || "Intermediate"
    })));
  }, [profile, user]);

  const change = (key: string, value: string | boolean | null) => setForm((previous) => ({ ...previous, [key]: value }));

  const hasValue = (key: string) => {
    const value = form[key] ?? profile?.[key as keyof typeof profile];
    return typeof value === "string" ? value.trim().length > 0 : value === true;
  };

  const missingProfileItems = useMemo(() => {
    const items = [
      ["headline", "a professional headline"],
      ["phone", "a phone number"],
      ["location", "your current location"],
      ["summary", "a professional summary"],
      ["availabilityStatus", "your availability"],
      ["desiredPosition", "a desired position"],
      ["education", "education or qualifications"],
    ];
    const missing = items.filter(([key]) => !hasValue(key)).map(([, item]) => item);
    if (!profile?.cvAvailable) missing.push("a CV");
    if (!workHistory.some((entry) => entry.position.trim() || entry.employer.trim())) missing.push("work history");
    if (!languages.some((entry) => entry.language.trim())) missing.push("a language");
    return missing;
  // `form` contains the editable profile fields and is intentionally the source of truth here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, profile?.cvAvailable, workHistory, languages]);

  const completionPercentage = useMemo(() => {
    const completed = 10 - missingProfileItems.length;
    return Math.round((completed / 10) * 100);
  }, [missingProfileItems]);

  const buildPayload = (): CandidateProfileUpdateRequest => {
    const payload: CandidateProfileUpdateRequest = {
      email: String(form.email || user?.primaryEmailAddress?.emailAddress || ""),
      fullName: String(form.fullName || user?.fullName || ""),
      ...Object.fromEntries(Object.entries(form).filter(([key, value]) => !["id", "email", "fullName", "cvAvailable", "jobsMvReviewed", "reviewedAt"].includes(key) && value !== null && value !== "")),
      workHistory: workHistory.map(({ id, ...rest }) => rest),
      languageProficiencies: languages.filter((entry) => entry.language.trim()).map(({ id, ...rest }) => rest),
    };
    if (!payload.email || !payload.fullName) throw new Error("Full name and email are required.");
    return payload;
  };

  const savePayload = (payload: CandidateProfileUpdateRequest, successDescription: string, closeEditor = true) => {
    update.mutate(
      { data: payload },
      {
        onSuccess: (savedProfile) => {
          queryClient.setQueryData(profileQueryKey, savedProfile);
          if (closeEditor) setIsEditing(false);
          toast({ title: "Hospitality Passport saved", description: successDescription });
        },
        onError: () => toast({ title: "Could not save your profile", description: "Please check your information and try again.", variant: "destructive" }),
      },
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = buildPayload();
      savePayload(payload, "Your candidate profile has been updated.");
    } catch (saveError) {
      toast({ title: "Please review this form", description: saveError instanceof Error ? saveError.message : "Invalid profile information.", variant: "destructive" });
    }
  };

  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-14">
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="container mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <UserRound className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Your Hospitality Passport</h1>
        <p className="mt-4 text-lg text-muted-foreground">Build a structured professional profile tailored for hospitality opportunities.</p>
        <Button asChild size="lg" className="mt-8 rounded-full px-8 shadow-sm">
          <Link href="/candidate/sign-in">
            <LogIn className="mr-2 h-4 w-4" />
            Sign in to continue
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-muted/10 pb-24 md:pb-14 pt-8 md:pt-14 min-h-[100dvh]">
      <SEO title="Hospitality Passport | The Jobs MV" description="Build and update your structured hospitality candidate profile." />

      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end mb-10">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-primary">CANDIDATE PROFILE</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Hospitality Passport</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A structured profile you control for applications and opportunity consideration.
            </p>
          </div>
          {profile?.jobsMvReviewed && (
            <span className="inline-flex h-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20">
              <ShieldCheck className="h-4 w-4" />
              The Jobs MV Reviewed
            </span>
          )}
        </div>

        {error && !isMissingProfile ? (
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>We could not load your profile. Please refresh and try again.</p>
          </div>
        ) : profile && !isEditing ? (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-primary/20 shadow-md">
                <div className="bg-primary px-6 py-8 text-primary-foreground md:px-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <UserRound className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Hospitality Passport</p>
                      <h2 className="mt-2 font-display text-3xl font-bold">{profile.fullName}</h2>
                      <p className="mt-1 text-lg text-primary-foreground/80">{profile.headline || "Hospitality professional"}</p>
                      {profile.location && <p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{profile.location}</p>}
                    </div>
                  </div>
                </div>
                <CardContent className="space-y-8 p-6 md:p-8">
                  {profile.summary && <div><h3 className="font-display text-lg font-bold">Professional Summary</h3><p className="mt-2 whitespace-pre-line text-muted-foreground">{profile.summary}</p></div>}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hospitality Experience</p><p className="mt-2 font-semibold">{profile.totalHospitalityExperience || "Not added"}</p></div>
                    <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Maldives Experience</p><p className="mt-2 font-semibold">{profile.maldivesExperience || "Not added"}</p></div>
                    <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Availability</p><p className="mt-2 font-semibold">{String(form.availabilityStatus || "Not added")}</p></div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Opportunity preference</p>
                    <p className="mt-2 font-semibold">{form.openToOpportunities ? "ON — open to opportunity consideration" : "OFF — not open to opportunity consideration"}</p>
                  </div>
                  {(form.desiredPosition || form.department) && <div><h3 className="font-display text-lg font-bold">Career Preferences</h3><div className="mt-3 flex flex-wrap gap-2">{form.desiredPosition && <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">{String(form.desiredPosition)}</span>}{form.department && <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">{String(form.department)}</span>}</div></div>}
                  {workHistory.length > 0 && <div><h3 className="font-display text-lg font-bold">Experience</h3><div className="mt-4 space-y-4">{workHistory.map((entry) => <div key={entry.id} className="flex gap-3 border-l-2 border-primary/30 pl-4"><BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{entry.position}</p><p className="text-sm text-muted-foreground">{entry.employer}{entry.country ? ` · ${entry.country}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{entry.startDate || "Start date not added"} — {entry.endDate || "Present"}</p></div></div>)}</div></div>}
                  {languages.length > 0 && <div><h3 className="font-display text-lg font-bold">Languages</h3><div className="mt-3 flex flex-wrap gap-2">{languages.filter((entry) => entry.language).map((entry) => <span key={entry.id} className="rounded-full border px-3 py-1.5 text-sm">{entry.language} · {entry.proficiency}</span>)}</div></div>}
                  <div className="flex items-center gap-2 border-t pt-5 text-sm font-medium">
                    <FileText className="h-5 w-5 text-primary" />
                    {profile.cvAvailable ? <span className="text-primary">CV available — stored privately</span> : <span className="text-muted-foreground">CV not uploaded</span>}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="shadow-sm lg:sticky lg:top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between"><h3 className="font-display font-bold">Passport Strength</h3><span className="font-bold text-primary">{completionPercentage}%</span></div>
                <Progress value={completionPercentage} className="mt-3 h-2" />
                <p className="mt-4 text-sm text-muted-foreground">{completionPercentage === 100 ? "Your Passport includes all tracked fields. Keep your availability and preference up to date." : `To strengthen it, add ${missingProfileItems.slice(0, 3).join(", ")}${missingProfileItems.length > 3 ? " and more" : ""}.`}</p>
                <Button type="button" className="mt-6 w-full rounded-full" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />{completionPercentage === 100 ? "Edit Passport" : "Complete remaining information"}
                </Button>
                {completionPercentage < 100 && <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setIsEditing(true)}>Edit Passport</Button>}
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={submit} className="relative" data-testid="candidate-passport-form">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
              {/* Sticky Sidebar */}
              <div className="sticky top-24 hidden lg:block space-y-6">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-6 space-y-2">
                      <h3 className="font-display font-bold">Profile Strength</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-bold text-primary">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2 mt-2 bg-muted" />
                    </div>
                    <nav className="flex flex-col space-y-1 text-sm font-medium">
                      {stepNames.map((name, index) => {
                        const stepNum = index + 1;
                        return (
                          <button
                            key={stepNum}
                            type="button"
                            onClick={() => setCurrentStep(stepNum)}
                            className={`px-3 py-2.5 rounded-md text-left transition-colors ${
                              currentStep === stepNum
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {stepNum}. {name}
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Areas */}
              <div className="space-y-6">

                {/* Mobile Step Indicator */}
                <div className="lg:hidden mb-6">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                    Step {currentStep} of {totalSteps}
                  </p>
                  <h2 className="text-2xl font-display font-bold">{stepNames[currentStep - 1]}</h2>
                  <Progress value={(currentStep / totalSteps) * 100} className="h-2 mt-4 bg-muted" />
                </div>

                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-1">
                      <CvSection cvAvailable={profile?.cvAvailable} />
                    </div>

                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your basic contact details and professional summary.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input id="fullName" value={String(form.fullName || "")} onChange={e => change("fullName", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={String(form.email || "")} onChange={e => change("email", e.target.value)} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" type="tel" value={String(form.phone || "")} onChange={e => change("phone", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="location">Current Location</Label>
                          <Input id="location" value={String(form.location || "")} onChange={e => change("location", e.target.value)} placeholder="e.g. Male, Maldives" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nationality">Nationality</Label>
                          <Input id="nationality" value={String(form.nationality || "")} onChange={e => change("nationality", e.target.value)} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="headline">Professional Headline</Label>
                          <Input id="headline" placeholder="e.g. Experienced Front Office Manager" value={String(form.headline || "")} onChange={e => change("headline", e.target.value)} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="summary">Professional Summary</Label>
                          <Textarea id="summary" rows={4} placeholder="A brief overview of your career and what you bring to the table..." value={String(form.summary || "")} onChange={e => change("summary", e.target.value)} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Work History</CardTitle>
                        <CardDescription>Add your relevant hospitality experience.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <WorkHistoryEditor value={workHistory} onChange={setWorkHistory} />
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Education & Qualifications</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="education">Education</Label>
                          <Textarea id="education" rows={2} value={String(form.education || "")} onChange={e => change("education", e.target.value)} placeholder="Degrees, diplomas, universities..." />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="professionalCertifications">Professional Certifications</Label>
                          <Textarea id="professionalCertifications" rows={2} value={String(form.professionalCertifications || "")} onChange={e => change("professionalCertifications", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="hospitalityCertifications">Hospitality Certifications</Label>
                          <Textarea id="hospitalityCertifications" rows={2} value={String(form.hospitalityCertifications || "")} onChange={e => change("hospitalityCertifications", e.target.value)} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Experience & Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="totalHospitalityExperience">Total Hospitality Experience</Label>
                          <Input id="totalHospitalityExperience" value={String(form.totalHospitalityExperience || "")} onChange={e => change("totalHospitalityExperience", e.target.value)} placeholder="e.g. 5 Years" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="maldivesExperience">Maldives Experience</Label>
                          <Input id="maldivesExperience" value={String(form.maldivesExperience || "")} onChange={e => change("maldivesExperience", e.target.value)} placeholder="e.g. 2 Years" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="totalResortExperience">Total Resort Experience</Label>
                          <Input id="totalResortExperience" value={String(form.totalResortExperience || "")} onChange={e => change("totalResortExperience", e.target.value)} placeholder="e.g. 4 Years" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="luxuryResortExperience">Luxury Resort Experience</Label>
                          <Input id="luxuryResortExperience" value={String(form.luxuryResortExperience || "")} onChange={e => change("luxuryResortExperience", e.target.value)} placeholder="e.g. 2 Years" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="leadershipExperience">Leadership Experience</Label>
                          <Input id="leadershipExperience" value={String(form.leadershipExperience || "")} onChange={e => change("leadershipExperience", e.target.value)} placeholder="e.g. Managed team of 15" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="technicalSkills">Technical Skills</Label>
                          <Input id="technicalSkills" value={String(form.technicalSkills || "")} onChange={e => change("technicalSkills", e.target.value)} placeholder="e.g. Microsoft Office, Excel" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="posSystems">POS / Software Systems</Label>
                          <Input id="posSystems" value={String(form.posSystems || "")} onChange={e => change("posSystems", e.target.value)} placeholder="e.g. Opera, Micros" />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="roleSpecificSkills">Role-Specific Skills</Label>
                          <Textarea id="roleSpecificSkills" rows={2} value={String(form.roleSpecificSkills || "")} onChange={e => change("roleSpecificSkills", e.target.value)} placeholder="e.g. Guest Relations, Complaint Handling..." />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Languages</CardTitle>
                        <CardDescription>What languages do you speak and to what level?</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <LanguageEditor value={languages} onChange={setLanguages} />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Career Preferences</CardTitle>
                        <CardDescription>Set the kinds of opportunities you want to pursue.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="desiredPosition">Desired Position</Label>
                          <Input id="desiredPosition" value={String(form.desiredPosition || "")} onChange={e => change("desiredPosition", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="department">Department</Label>
                          <Input id="department" value={String(form.department || "")} onChange={e => change("department", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="expectedSalary">Expected Salary</Label>
                          <Input id="expectedSalary" value={String(form.expectedSalary || "")} onChange={e => change("expectedSalary", e.target.value)} placeholder="Optional — include amount and currency" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle>Availability</CardTitle>
                        <CardDescription>Let employers know when and how you can work.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="availabilityStatus">Availability Status</Label>
                          <Select value={String(form.availabilityStatus || "")} onValueChange={val => change("availabilityStatus", val)}>
                            <SelectTrigger id="availabilityStatus">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {availabilityStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="employmentStatus">Employment Status</Label>
                          <Input id="employmentStatus" value={String(form.employmentStatus || "")} onChange={e => change("employmentStatus", e.target.value)} placeholder="e.g. Full-time, Contract" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="noticePeriod">Notice Period</Label>
                          <Input id="noticePeriod" value={String(form.noticePeriod || "")} onChange={e => change("noticePeriod", e.target.value)} placeholder="e.g. 1 Month" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="availableFrom">Available From</Label>
                          <Input id="availableFrom" type="date" value={String(form.availableFrom || "")} onChange={e => change("availableFrom", e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 sm:col-span-2 pt-2">
                          <input id="currentlyInMaldives" type="checkbox" checked={Boolean(form.currentlyInMaldives)} onChange={(event) => change("currentlyInMaldives", event.target.checked)} className="h-4 w-4 accent-primary rounded border-input" />
                          <Label htmlFor="currentlyInMaldives" className="cursor-pointer font-medium">I am currently located in the Maldives</Label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle>Opportunity Consideration</CardTitle>
                        <CardDescription>Consent to be considered for opportunities.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-4">
                          <Switch id="openToOpportunities" checked={Boolean(form.openToOpportunities)} onCheckedChange={checked => change("openToOpportunities", checked)} className="mt-1" />
                          <div className="space-y-1">
                            <Label htmlFor="openToOpportunities" className="cursor-pointer text-base font-semibold text-primary">Open to Opportunities</Label>
                            <p className="text-sm text-muted-foreground">{form.openToOpportunities ? "ON: you consent to be considered for opportunities using this Passport." : "OFF: you are not consenting to opportunity consideration through this Passport."}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        try {
                          const payload = buildPayload();
                          savePayload(payload, "Draft saved.", true);
                        } catch (saveError) {
                          toast({
                            title: "Please review this form",
                            description: saveError instanceof Error ? saveError.message : "Invalid profile information.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={update.isPending}
                      className="w-full sm:w-auto rounded-full"
                    >
                      {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save & Exit
                    </Button>
                  </div>

                  <div className="flex w-full sm:w-auto items-center gap-2">
                    {currentStep > 1 && (
                      <Button type="button" variant="secondary" onClick={() => setCurrentStep(s => s - 1)} className="w-full sm:w-auto rounded-full">
                        Back
                      </Button>
                    )}
                    {currentStep < totalSteps ? (
                      <Button type="button" onClick={() => setCurrentStep(s => s + 1)} className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white">
                        Continue
                      </Button>
                    ) : (
                      <>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          By saving your Passport, you agree to the collection and use of your candidate information described in our <Link href="/candidate-data-consent" className="font-medium text-primary hover:underline" data-testid="link-passport-candidate-data-consent">Candidate Data Consent</Link>.
                        </p>
                        <Button type="submit" disabled={update.isPending} className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-save-passport">
                          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Complete Profile
                        </Button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function CvSection({ cvAvailable }: { cvAvailable?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const requestUrl = useRequestCandidateCvUploadUrl();
  const completeUpload = useCompleteCandidateCvUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "CV must be 10MB or less." });
      event.target.value = "";
      return;
    }

    const validTypes: Record<string, CandidateCvUploadRequestContentType> = {
      "application/pdf": "application/pdf",
      "application/msword": "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const extensionTypes: Record<string, CandidateCvUploadRequestContentType> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    // Some mobile file pickers report an empty or generic MIME type even for
    // valid documents, so use the selected file's extension as a fallback.
    const contentType = validTypes[file.type.toLowerCase()] ?? extensionTypes[extension];
    if (!contentType) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Only PDF, DOC, and DOCX are supported." });
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const response = await requestUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType },
      });
      const uploadResponse = await fetch(response.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("The file upload did not complete.");

      await completeUpload.mutateAsync({ data: { uploadToken: response.uploadToken } });
      await queryClient.invalidateQueries({ queryKey: getGetCandidateProfileQueryKey() });
      toast({ title: "CV uploaded", description: "Your CV has been securely saved." });
    } catch (uploadError) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError instanceof Error ? uploadError.message : "Failed to upload CV.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadCandidateCv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "candidate-cv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Download failed", description: "Could not download your CV." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Your CV</CardTitle>
        <CardDescription>Upload a PDF or Word document up to 10MB. Your CV remains private and is shared only when you apply. Read our <Link href="/candidate-data-consent" className="font-medium text-primary hover:underline" data-testid="link-cv-candidate-data-consent">Candidate Data Consent</Link>.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">{cvAvailable ? "CV is ready" : "No CV uploaded"}</p>
            <p className="text-sm text-muted-foreground">{cvAvailable ? "Attached to your Passport" : "Required for most applications"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto mt-2 sm:mt-0">
          {cvAvailable && (
            <Button type="button" variant="ghost" disabled={isDownloading} onClick={handleDownload} className="w-full sm:w-auto">
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            data-testid="input-cv-upload"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button type="button" variant="default" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90" data-testid="button-upload-cv">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? "Uploading..." : cvAvailable ? "Replace CV" : "Upload CV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
