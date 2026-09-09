import { useState, useCallback, FormEvent } from "react";
import { 
  useSearchRecruiterTalent, 
  getSearchRecruiterTalentQueryKey,
  useSaveRecruiterTalent,
  useDeleteRecruiterTalentSaved,
  getGetRecruiterTalentQueryKey,
  SearchRecruiterTalentParams
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { TalentCard } from "@/components/employer/talent-card";
import { InviteTalentDialog } from "@/components/employer/invite-talent-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, SlidersHorizontal, UserX, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEPARTMENTS = [
  "Front Office", "Food & Beverage", "Housekeeping", "Culinary", 
  "Human Resources", "Finance", "Sales & Marketing", "Engineering", 
  "Spa & Wellness", "Water Sports & Dive"
];

const EXPERIENCES = ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "10+ Years"];
const AVAILABILITIES = ["Available Now", "Available Within 30 Days", "Currently Employed"];
const MALDIVES_EXPERIENCE = ["Yes", "No", "1+ Years", "3+ Years"];

export default function EmployerTalentSearch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filters state
  const [params, setParams] = useState<SearchRecruiterTalentParams>({});
  const [searchValue, setSearchValue] = useState(params.role || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Invite dialog state
  const [inviteCandidateId, setInviteCandidateId] = useState<number | null>(null);
  const [inviteCandidateName, setInviteCandidateName] = useState<string>("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Fetch talent
  const { data: talents, isLoading, isError } = useSearchRecruiterTalent(params);

  // Mutations
  const saveTalent = useSaveRecruiterTalent();
  const unsaveTalent = useDeleteRecruiterTalentSaved();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setParams(prev => ({ ...prev, role: searchValue || undefined }));
  };

  const updateFilter = (key: keyof SearchRecruiterTalentParams, value: string | undefined) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchValue("");
    setParams({});
  };

  const handleSaveToggle = useCallback((id: number, currentSavedState: boolean) => {
    const mutation = currentSavedState ? unsaveTalent : saveTalent;
    const action = currentSavedState ? "removed from" : "saved to";
    
    // Optimistic update
    const queryKey = getSearchRecruiterTalentQueryKey(params);
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return old.map((t: any) => t.id === id ? { ...t, saved: !currentSavedState } : t);
    });

    mutation.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: currentSavedState ? "Candidate Unsaved" : "Candidate Saved",
          description: `The candidate has been ${action} your saved list.`,
        });
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: getGetRecruiterTalentQueryKey(id) });
      },
      onError: (error: any) => {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey });
        toast({
          title: "Action failed",
          description: error.error || "Could not update saved status.",
          variant: "destructive",
        });
      }
    });
  }, [params, saveTalent, unsaveTalent, queryClient, toast]);

  const handleInvite = (id: number, name: string) => {
    setInviteCandidateId(id);
    setInviteCandidateName(name);
    setIsInviteOpen(true);
  };

  const activeFilterCount = Object.keys(params).filter(k => k !== 'role' && params[k as keyof SearchRecruiterTalentParams] !== undefined).length;

  return (
    <EmployerLayout>
      <div className="flex flex-col h-full bg-background/50">
        {/* Header */}
        <div className="border-b bg-background px-6 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Talent Search</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover and invite consented hospitality professionals to apply for your roles.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-6 md:px-8">
            
            {/* Search and Filters Bar */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by role or position..."
                  className="pl-9 bg-card shadow-sm"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  data-testid="input-talent-search"
                />
              </form>

              <div className="flex items-center gap-3">
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="bg-card shadow-sm gap-2" data-testid="button-filters">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 rounded-sm">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
                    <SheetHeader className="p-6 border-b">
                      <SheetTitle className="font-display">Filter Candidates</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="talent-skills">Skills</Label>
                          <Input
                            id="talent-skills"
                            value={params.skills || ""}
                            onChange={(event) => updateFilter("skills", event.target.value || undefined)}
                            placeholder="Service, culinary, systems..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="talent-location">Location</Label>
                          <Input
                            id="talent-location"
                            value={params.location || ""}
                            onChange={(event) => updateFilter("location", event.target.value || undefined)}
                            placeholder="Malé, Addu, resort..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="talent-language">Language</Label>
                          <Input
                            id="talent-language"
                            value={params.language || ""}
                            onChange={(event) => updateFilter("language", event.target.value || undefined)}
                            placeholder="English, Dhivehi..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select 
                            value={params.department || ""} 
                            onValueChange={(val) => updateFilter("department", val === "any" ? undefined : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Any department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any department</SelectItem>
                              {DEPARTMENTS.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Hospitality Experience</Label>
                          <Select 
                            value={params.hospitalityExperience || ""} 
                            onValueChange={(val) => updateFilter("hospitalityExperience", val === "any" ? undefined : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Any experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any experience</SelectItem>
                              {EXPERIENCES.map(exp => (
                                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Maldives Experience</Label>
                          <Select 
                            value={params.maldivesExperience || ""} 
                            onValueChange={(val) => updateFilter("maldivesExperience", val === "any" ? undefined : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              {MALDIVES_EXPERIENCE.map(exp => (
                                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Availability</Label>
                          <Select 
                            value={params.availability || ""} 
                            onValueChange={(val) => updateFilter("availability", val === "any" ? undefined : val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Any availability" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any availability</SelectItem>
                              {AVAILABILITIES.map(avail => (
                                <SelectItem key={avail} value={avail}>{avail}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
                      <Button variant="ghost" onClick={clearFilters} disabled={activeFilterCount === 0}>
                        Clear all
                      </Button>
                      <SheetClose asChild>
                        <Button>Show Results</Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1">Active filters:</span>
                {params.department && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    {params.department}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("department", undefined)} />
                  </Badge>
                )}
                {params.skills && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Skills: {params.skills}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("skills", undefined)} />
                  </Badge>
                )}
                {params.location && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Location: {params.location}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("location", undefined)} />
                  </Badge>
                )}
                {params.language && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Language: {params.language}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("language", undefined)} />
                  </Badge>
                )}
                {params.hospitalityExperience && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Exp: {params.hospitalityExperience}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("hospitalityExperience", undefined)} />
                  </Badge>
                )}
                {params.maldivesExperience && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Maldives: {params.maldivesExperience}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("maldivesExperience", undefined)} />
                  </Badge>
                )}
                {params.availability && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1">
                    Avail: {params.availability}
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => updateFilter("availability", undefined)} />
                  </Badge>
                )}
                <Button variant="link" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground px-2">
                  Clear All
                </Button>
              </div>
            )}

            {/* Content Area */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>Searching for talent...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <UserX className="h-12 w-12 text-destructive mb-4 opacity-50" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">Failed to load candidates</h3>
                <p className="text-sm text-muted-foreground max-w-md">There was a problem retrieving the talent pool. Please try again or adjust your filters.</p>
              </div>
            ) : talents && talents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                {talents.map((talent, i) => (
                  <div key={talent.id} style={{ animationDelay: `${i * 50}ms` }}>
                    <TalentCard 
                      talent={talent} 
                      onSaveToggle={handleSaveToggle} 
                      onInvite={handleInvite}
                      isTogglingSave={saveTalent.isPending || unsaveTalent.isPending}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-xl border border-dashed shadow-sm">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <UserX className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No candidates found</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  We couldn't find any candidates matching your exact criteria. Try broadening your search terms or clearing some filters.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {inviteCandidateId && (
        <InviteTalentDialog
          candidateId={inviteCandidateId}
          candidateName={inviteCandidateName}
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
        />
      )}
    </EmployerLayout>
  );
}
