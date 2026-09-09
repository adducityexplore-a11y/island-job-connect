import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useListPublicJobs,
  useListCandidateSavedJobs,
  useSaveCandidateJob,
  useDeleteCandidateSavedJob,
  getListCandidateSavedJobsQueryKey
} from "@workspace/api-client-react";
import type { ListPublicJobsExperienceLevel, ListPublicJobsCandidateScope } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Building2, Briefcase, BadgeCheck, SlidersHorizontal, X, Heart, Clock } from "lucide-react";
import { SEO } from "@/components/seo";
import { getCompactOfferIndicators, formatJobFreshness } from "@/lib/job-offer";
import { useAuth } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATIC_DEPARTMENTS = [
  "F&B",
  "Culinary",
  "Front Office",
  "Housekeeping",
  "Spa",
  "Engineering",
  "Recreation"
];

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "1-2 Years",
  "3-5 Years",
  "5+ Years",
];

const CANDIDATE_SCOPES = [
  "Local",
  "International",
  "Both",
];

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [location, setLocationState] = useState<string>("all");
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [candidateScope, setCandidateScope] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: rawJobs, isLoading } = useListPublicJobs({
    ...(debouncedSearchQuery ? { q: debouncedSearchQuery } : {}),
    ...(department !== "all" ? { department } : {}),
    ...(location !== "all" ? { location } : {}),
    ...(experienceLevel !== "all" ? { experienceLevel: experienceLevel as ListPublicJobsExperienceLevel } : {}),
    ...(candidateScope !== "all" ? { candidateScope: candidateScope as ListPublicJobsCandidateScope } : {}),
  });

  const { data: savedJobsData } = useListCandidateSavedJobs(
    { query: { enabled: !!isSignedIn, queryKey: getListCandidateSavedJobsQueryKey() } }
  );
  const savedJobIds = useMemo(() => new Set(savedJobsData || []), [savedJobsData]);

  const saveJob = useSaveCandidateJob();
  const deleteSavedJob = useDeleteCandidateSavedJob();

  const toggleSave = (jobId: number, isSaved: boolean) => {
    if (!isSignedIn) {
      setLocation("/candidate/sign-in");
      return;
    }

    if (isSaved) {
      // Optimistic update
      queryClient.setQueryData(getListCandidateSavedJobsQueryKey(), (old: number[] | undefined) => {
        if (!old) return old;
        return old.filter(id => id !== jobId);
      });

      deleteSavedJob.mutate(
        { jobId },
        {
          onError: () => {
            queryClient.invalidateQueries({ queryKey: getListCandidateSavedJobsQueryKey() });
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to remove saved job. Please try again."
            });
          }
        }
      );
    } else {
      // Optimistic update
      queryClient.setQueryData(getListCandidateSavedJobsQueryKey(), (old: number[] | undefined) => {
        return old ? [...old, jobId] : [jobId];
      });

      saveJob.mutate(
        { jobId },
        {
          onError: (err) => {
            queryClient.invalidateQueries({ queryKey: getListCandidateSavedJobsQueryKey() });

            if (err.status === 409) {
              toast({
                variant: "destructive",
                title: "Profile Required",
                description: "Please complete your candidate profile before saving jobs."
              });
              setLocation("/passport");
            } else {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save job. Please try again."
              });
            }
          }
        }
      );
    }
  };

  const filteredJobs = useMemo(() => {
    if (!rawJobs) return [];
    let jobs = rawJobs;
    if (verifiedOnly) {
      jobs = jobs.filter(j => j.verifiedEmployer);
    }
    return jobs;
  }, [rawJobs, verifiedOnly]);

  const [availableDepartments, setAvailableDepartments] = useState<Set<string>>(new Set(STATIC_DEPARTMENTS));
  const [availableLocations, setAvailableLocations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rawJobs) {
      setAvailableDepartments(prev => {
        const next = new Set(prev);
        rawJobs.forEach(job => {
          if (job.department) next.add(job.department);
        });
        return next;
      });

      setAvailableLocations(prev => {
        const next = new Set(prev);
        rawJobs.forEach(job => {
          if (job.location) next.add(job.location);
        });
        return next;
      });
    }
  }, [rawJobs]);

  const activeFilterCount =
    (department !== "all" ? 1 : 0) +
    (location !== "all" ? 1 : 0) +
    (experienceLevel !== "all" ? 1 : 0) +
    (candidateScope !== "all" ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setDepartment("all");
    setLocationState("all");
    setExperienceLevel("all");
    setCandidateScope("all");
    setVerifiedOnly(false);
  };

  return (
    <div className="w-full bg-muted/20 min-h-[calc(100dvh-5rem)] pb-24 md:pb-14">
      <SEO
        title="Find Hospitality Opportunities"
        description="Search and filter the latest hospitality vacancies across Maldives resorts and hotels."
      />
      {/* Header */}
      <div className="bg-primary text-white py-10 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white">
              Find Opportunities
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Explore the latest hospitality opportunities across the Maldives.
            </p>

            <div className="mt-8 relative max-w-3xl mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search by job title, resort, hotel or keyword..."
                className="pl-12 pr-4 h-14 md:h-16 w-full rounded-full bg-white text-foreground border-transparent shadow-lg text-base md:text-lg focus-visible:ring-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-job-search"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex mt-6 max-w-4xl mx-auto flex-wrap items-center justify-center gap-3">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-6 w-auto min-w-[140px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(availableDepartments).sort().map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={location} onValueChange={setLocationState}>
                <SelectTrigger className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-6 w-auto min-w-[140px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {Array.from(availableLocations).sort().map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-6 w-auto min-w-[140px]">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Experience</SelectItem>
                  {EXPERIENCE_LEVELS.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={candidateScope} onValueChange={setCandidateScope}>
                <SelectTrigger className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-6 w-auto min-w-[140px]">
                  <SelectValue placeholder="Candidate Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Scope</SelectItem>
                  {CANDIDATE_SCOPES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-6 hover:bg-muted/50 hover:text-foreground">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    More Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4 space-y-6 rounded-2xl">
                  <div className="space-y-4">
                    <h4 className="font-medium font-display">Additional Options</h4>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="verified-employer" className="cursor-pointer">
                        Verified Employers Only
                      </Label>
                      <Switch
                        id="verified-employer"
                        checked={verifiedOnly}
                        onCheckedChange={setVerifiedOnly}
                      />
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full rounded-full" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mobile Filter Button */}
            <div className="md:hidden mt-6 flex justify-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="bg-white text-foreground border-none shadow-md rounded-full h-12 px-8 w-full max-w-xs hover:bg-muted/50 hover:text-foreground">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filter Jobs
                    {activeFilterCount > 0 && (
                      <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl sm:max-w-none flex flex-col px-4 pt-6 pb-8">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-display">Filters</SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-2 -mx-2 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base">Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger className="w-full rounded-xl h-12">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {Array.from(availableDepartments).sort().map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Location</Label>
                      <Select value={location} onValueChange={setLocationState}>
                        <SelectTrigger className="w-full rounded-xl h-12">
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {Array.from(availableLocations).sort().map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Experience Level</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger className="w-full rounded-xl h-12">
                          <SelectValue placeholder="Any Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Experience</SelectItem>
                          {EXPERIENCE_LEVELS.map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Candidate Scope</Label>
                      <Select value={candidateScope} onValueChange={setCandidateScope}>
                        <SelectTrigger className="w-full rounded-xl h-12">
                          <SelectValue placeholder="Any Scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Scope</SelectItem>
                          {CANDIDATE_SCOPES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
                        <Label htmlFor="verified-employer-mobile" className="text-base cursor-pointer">
                          Verified Employers Only
                        </Label>
                        <Switch
                          id="verified-employer-mobile"
                          checked={verifiedOnly}
                          onCheckedChange={setVerifiedOnly}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-auto">
                    <Button variant="secondary" className="w-full rounded-full h-14 text-lg" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-display font-semibold">
              {isLoading ? "Loading roles..." : `${filteredJobs.length} ${filteredJobs.length === 1 ? 'Opportunity' : 'Opportunities'}`}
            </h2>

            {(activeFilterCount > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterCount > 0 && <span className="text-sm font-medium text-muted-foreground mr-1">Active filters:</span>}

                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    "{searchQuery}"
                    <button onClick={() => { setSearchQuery(""); setDebouncedSearchQuery(""); }} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {department !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {department}
                    <button onClick={() => setDepartment("all")} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {location !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {location}
                    <button onClick={() => setLocationState("all")} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {experienceLevel !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {experienceLevel}
                    <button onClick={() => setExperienceLevel("all")} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {candidateScope !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {candidateScope}
                    <button onClick={() => setCandidateScope("all")} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {verifiedOnly && (
                  <Badge variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Verified Only
                    <button onClick={() => setVerifiedOnly(false)} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground h-7 px-2 ml-1"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 md:p-8 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="shrink-0 flex flex-col justify-between">
                    <Skeleton className="h-12 w-32 rounded-full" />
                  </div>
                </div>
              ))
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const isSaved = savedJobIds.has(job.id);

                return (
                  <div
                    key={job.id}
                    className="group p-5 md:p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-4 md:gap-6 items-start"
                    data-testid={`list-item-job-${job.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <Link href={`/jobs/${job.id}`} className="inline-block mb-2">
                        <h3 className="text-xl md:text-2xl font-semibold font-display text-foreground group-hover:text-secondary transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Building2 className="w-4 h-4 text-primary" />
                          {job.companyName}
                        </span>
                        {job.verifiedEmployer && (
                          <span className="flex items-center gap-1.5 font-medium text-primary">
                            <BadgeCheck className="w-4 h-4" />
                            Verified
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                        )}
                      </div>

                      {getCompactOfferIndicators(job).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {getCompactOfferIndicators(job).map((indicator, i) => (
                            <span key={i} className="rounded-md bg-muted/50 border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                              {indicator}
                            </span>
                          ))}
                        </div>
                      )}

                      {formatJobFreshness(job) && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {formatJobFreshness(job)}
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex items-center gap-2 mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); toggleSave(job.id, isSaved); }}
                        className={`h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full transition-colors ${isSaved ? "text-red-500 bg-red-50 hover:bg-red-100 border-red-200" : "text-muted-foreground hover:text-foreground bg-card hover:bg-muted/50"}`}
                        aria-label={isSaved ? "Unsave job" : "Save job"}
                        title={isSaved ? "Unsave job" : "Save job"}
                      >
                        <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isSaved ? "fill-current" : ""}`} />
                      </Button>
                      <Button asChild className="flex-1 md:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-10 md:h-12 shadow-sm font-medium">
                        <Link href={`/jobs/${job.id}`}>
                          View Opportunity
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <Briefcase className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-2">No opportunities found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  We couldn't find any roles matching your search and filters. Try adjusting your criteria or browse all available opportunities.
                </p>
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="rounded-full px-8"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}