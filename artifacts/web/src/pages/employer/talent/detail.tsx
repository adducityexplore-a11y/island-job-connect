import { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetRecruiterTalent, 
  getGetRecruiterTalentQueryKey,
  getSearchRecruiterTalentQueryKey,
  useSaveRecruiterTalent,
  useDeleteRecruiterTalentSaved
} from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { InviteTalentDialog } from "@/components/employer/invite-talent-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Bookmark, MapPin, Briefcase, Clock, ChevronLeft, Send, 
  GraduationCap, Award, Languages, ShieldCheck, UserX, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployerTalentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: talent, isLoading, isError } = useGetRecruiterTalent(id, {
    query: { enabled: !!id, queryKey: getGetRecruiterTalentQueryKey(id) }
  });

  const saveTalent = useSaveRecruiterTalent();
  const unsaveTalent = useDeleteRecruiterTalentSaved();

  const handleSaveToggle = useCallback(() => {
    if (!talent) return;
    
    const currentSavedState = talent.saved;
    const mutation = currentSavedState ? unsaveTalent : saveTalent;
    const action = currentSavedState ? "removed from" : "saved to";
    
    // Optimistic update
    const queryKey = getGetRecruiterTalentQueryKey(id);
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return { ...old, saved: !currentSavedState };
    });

    mutation.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: currentSavedState ? "Candidate Unsaved" : "Candidate Saved",
          description: `The candidate has been ${action} your saved list.`,
        });
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: getSearchRecruiterTalentQueryKey() });
      },
      onError: (error: any) => {
        queryClient.invalidateQueries({ queryKey });
        toast({
          title: "Action failed",
          description: error.error || "Could not update saved status.",
          variant: "destructive",
        });
      }
    });
  }, [id, talent, saveTalent, unsaveTalent, queryClient, toast]);

  if (isLoading) {
    return (
      <EmployerLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
          <p>Loading candidate profile...</p>
        </div>
      </EmployerLayout>
    );
  }

  if (isError || !talent) {
    return (
      <EmployerLayout>
        <div className="mx-auto max-w-4xl p-6 md:p-8">
          <Button variant="ghost" asChild className="mb-8 -ml-4">
            <Link href="/employer/talent">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed shadow-sm">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <UserX className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Candidate Not Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              This candidate may have withdrawn their consent or the profile no longer exists.
            </p>
            <Button asChild>
              <Link href="/employer/talent">Return to Talent Search</Link>
            </Button>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const specialties = talent.hospitalitySpecialties 
    ? talent.hospitalitySpecialties.split(",").map(s => s.trim()).filter(Boolean) 
    : [];

  const techSkills = talent.technicalSkills 
    ? talent.technicalSkills.split(",").map(s => s.trim()).filter(Boolean) 
    : [];

  const posSystems = talent.posSystems 
    ? talent.posSystems.split(",").map(s => s.trim()).filter(Boolean) 
    : [];

  return (
    <EmployerLayout>
      <div className="flex flex-col h-full bg-muted/30">
        
        {/* Header Section */}
        <div className="border-b bg-background px-6 py-6 md:px-8">
          <div className="mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
              <Link href="/employer/talent">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
                  <AvatarImage src={talent.profilePhotoUrl || undefined} alt={talent.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {getInitials(talent.fullName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-1">
                  <h1 className="font-display text-2xl font-bold md:text-3xl tracking-tight text-foreground">
                    {talent.fullName}
                  </h1>
                  {talent.headline && (
                    <p className="text-lg text-muted-foreground font-medium mt-1">{talent.headline}</p>
                  )}
                  
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {talent.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{talent.location}</span>
                      </div>
                    )}
                    {talent.yearsExperience && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        <span>{talent.yearsExperience} experience</span>
                      </div>
                    )}
                    {talent.availabilityStatus && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span className={cn(
                          talent.availabilityStatus === "Available Now" ? "text-emerald-600 font-medium" : ""
                        )}>
                          {talent.availabilityStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-3 shrink-0">
                <Button 
                  onClick={() => setIsInviteOpen(true)}
                  className="flex-1 md:flex-none shadow-sm"
                  data-testid="button-invite-detail"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Invite to Apply
                </Button>
                <Button 
                  variant="outline"
                  className={cn("flex-1 md:flex-none bg-card", talent.saved ? "border-accent text-accent hover:text-accent/80 hover:bg-accent/10" : "")}
                  onClick={handleSaveToggle}
                  disabled={saveTalent.isPending || unsaveTalent.isPending}
                  data-testid="button-save-detail"
                >
                  <Bookmark className={cn("mr-2 h-4 w-4 transition-transform", talent.saved ? "fill-current" : "")} />
                  {talent.saved ? "Saved" : "Save Candidate"}
                </Button>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="mt-8 flex items-start gap-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 p-4 text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Privacy Protected Profile</p>
                <p className="opacity-90">
                  Direct contact details (email, phone) and full CV files are hidden to protect candidate privacy. When you invite them to apply, they can choose to share their complete profile and CV with your company.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Main Column */}
              <div className="md:col-span-2 space-y-8">
                
                {/* Specialties */}
                {specialties.length > 0 && (
                  <section className="bg-card rounded-xl border p-6 shadow-sm">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Hospitality Specialties
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((spec, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 font-medium bg-secondary/60">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Technical Skills */}
                {(techSkills.length > 0 || posSystems.length > 0) && (
                  <section className="bg-card rounded-xl border p-6 shadow-sm">
                    <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Technical & Operational Skills
                    </h2>
                    
                    <div className="space-y-6">
                      {posSystems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">POS & Software Systems</h3>
                          <div className="flex flex-wrap gap-2">
                            {posSystems.map((sys, i) => (
                              <Badge key={i} variant="outline" className="px-3 py-1 font-medium bg-background">
                                {sys}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {techSkills.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Technical Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {techSkills.map((skill, i) => (
                              <Badge key={i} variant="outline" className="px-3 py-1 font-medium bg-background">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Experience Detail */}
                <section className="bg-card rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Experience Breakdown
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {talent.totalHospitalityExperience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hospitality</p>
                        <p className="font-medium text-lg">{talent.totalHospitalityExperience}</p>
                      </div>
                    )}
                    {talent.totalResortExperience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resort Experience</p>
                        <p className="font-medium text-lg">{talent.totalResortExperience}</p>
                      </div>
                    )}
                    {talent.luxuryResortExperience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Luxury Resort</p>
                        <p className="font-medium text-lg">{talent.luxuryResortExperience}</p>
                      </div>
                    )}
                    {talent.maldivesExperience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Maldives Exp.</p>
                        <p className="font-medium text-lg">{talent.maldivesExperience}</p>
                      </div>
                    )}
                    {talent.leadershipExperience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leadership</p>
                        <p className="font-medium text-lg">{talent.leadershipExperience}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Education & Certs */}
                {(talent.education || talent.hospitalityCertifications || talent.professionalCertifications) && (
                  <section className="bg-card rounded-xl border p-6 shadow-sm">
                    <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Education & Certifications
                    </h2>
                    
                    <div className="space-y-6">
                      {talent.education && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Highest Education</h3>
                          <p className="font-medium">{talent.education}</p>
                        </div>
                      )}
                      
                      {talent.hospitalityCertifications && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hospitality Certifications</h3>
                          <p className="font-medium leading-relaxed">{talent.hospitalityCertifications}</p>
                        </div>
                      )}

                      {talent.professionalCertifications && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Professional Certifications</h3>
                          <p className="font-medium leading-relaxed">{talent.professionalCertifications}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
              
              {/* Sidebar Column */}
              <div className="space-y-6">
                
                {/* Career Preferences */}
                <section className="bg-card rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-base font-bold mb-4 border-b pb-3">Career Preferences</h2>
                  <div className="space-y-4">
                    {talent.desiredPosition && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Desired Position</p>
                        <p className="font-medium text-sm">{talent.desiredPosition}</p>
                      </div>
                    )}
                    {talent.department && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                        <p className="font-medium text-sm">{talent.department}</p>
                      </div>
                    )}
                    {talent.employmentStatus && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Status</p>
                        <p className="font-medium text-sm">{talent.employmentStatus}</p>
                      </div>
                    )}
                    {talent.noticePeriod && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notice Period</p>
                        <p className="font-medium text-sm">{talent.noticePeriod}</p>
                      </div>
                    )}
                    {talent.availableFrom && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Available From</p>
                        <p className="font-medium text-sm">{new Date(talent.availableFrom).toLocaleDateString()}</p>
                      </div>
                    )}
                    {talent.currentlyInMaldives !== null && talent.currentlyInMaldives !== undefined && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Currently in Maldives</p>
                        <p className="font-medium text-sm">{talent.currentlyInMaldives ? "Yes" : "No"}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Languages */}
                {talent.languages && (
                  <section className="bg-card rounded-xl border p-6 shadow-sm">
                    <h2 className="font-display text-base font-bold mb-4 border-b pb-3 flex items-center gap-2">
                      <Languages className="h-4 w-4 text-primary" />
                      Languages
                    </h2>
                    <ul className="space-y-2">
                      {talent.languages.split(",").map((lang, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                          {lang.trim()}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <InviteTalentDialog
        candidateId={id}
        candidateName={talent.fullName}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </EmployerLayout>
  );
}
