import { Link } from "wouter";
import { format } from "date-fns";
import { UserSearch, Sparkles, ArrowRight, Loader2, Building2 } from "lucide-react";
import { useListEmployerRecruitmentRequests } from "@workspace/api-client-react";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployerRecruitmentRequests() {
  const { data, isLoading } = useListEmployerRecruitmentRequests();
  const requests = data;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Vacancy": return { label: "Request Received", color: "bg-slate-100 text-slate-700 border-slate-200" };
      case "Applications": return { label: "Sourcing", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "Screening": return { label: "Screening", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "Expert Review": return { label: "Expert Review", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "Interview-Ready Shortlist": return { label: "Shortlist Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200 font-medium" };
      case "Employer Interview": return { label: "Interview", color: "bg-orange-100 text-orange-800 border-orange-200" };
      case "Position Filled": return { label: "Filled", color: "bg-slate-100 text-slate-800 border-slate-200" };
      case "Closed": return { label: "Closed", color: "bg-muted text-muted-foreground border-border" };
      default: return { label: status, color: "bg-muted text-muted-foreground border-border" };
    }
  };

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Hiring Support</h1>
            <p className="mt-2 text-muted-foreground">
              Tell us who you need. Our hospitality team will help with the search, screening, and shortlist.
            </p>
          </div>
          <Button asChild>
            <Link href="/employer/recruitment-requests/new">
              <UserSearch className="mr-2 h-4 w-4" strokeWidth={1.9} />
              Find Candidates For Me
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Loading your requests...</p>
          </div>
        ) : !requests?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
               <div className="rounded-xl bg-[#D9A520]/10 p-3">
                 <Sparkles className="h-8 w-8 text-[#D9A520]" strokeWidth={1.9} />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">No supported searches yet</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Tell us about the role and our recruitment team can help source candidates, provide Expert Screening, and prepare a shortlist for your review.
              </p>
              <Button asChild className="mt-6">
                <Link href="/employer/recruitment-requests/new">
                   <UserSearch className="mr-2 h-4 w-4" strokeWidth={1.9} />
                   Find Candidates For Me
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Link key={request.id} href={`/employer/recruitment-requests/${request.id}`} className="block group">
                <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {request.positionTitle}
                        </h3>
                        <Badge variant="outline" className={getStatusDisplay(request.status).color}>
                          {getStatusDisplay(request.status).label}
                        </Badge>
                        {request.urgency === "Urgent" && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                            Urgent Hiring
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 mt-1">
                        <span className="font-medium text-foreground/80 flex items-center gap-1.5"><Building2 className="h-4 w-4 text-muted-foreground" /> {request.companyPropertyName}</span>
                        <span>&middot;</span>
                        <span>{request.department}</span>
                        <span>&middot;</span>
                        <span>{request.employeesRequired} {request.employeesRequired === 1 ? "position" : "positions"}</span>
                        <span>&middot;</span>
                        <span>Requested {format(new Date(request.createdAt), "MMM d, yyyy")}</span>
                        {request.counters && (
                          <>
                            <span>&middot;</span>
                            <span className="font-medium text-foreground/90">{request.counters.shortlistedCandidates ?? 0} Shortlisted</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
