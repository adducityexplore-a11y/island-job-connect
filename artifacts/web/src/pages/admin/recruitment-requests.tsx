import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetAdminUrgentRecruitmentMetrics, useListAdminRecruitmentRequests, type RecruitmentRequest } from "@workspace/api-client-react";
import { 
  Building2,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Users
} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getUrgentServiceLabel = (status?: string) => ({
  "Not Requested": "Standard",
  Requested: "Details pending",
  "Terms Ready": "Terms ready",
  Accepted: "Terms accepted",
  Active: "Priority active",
  Fulfilled: "Completed",
  Declined: "Closed",
}[status || ""] || status);

export default function AdminRecruitmentRequests() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  
  const [debouncedPosition, setDebouncedPosition] = useState("");
  const [debouncedDepartment, setDebouncedDepartment] = useState("");
  const [debouncedProperty, setDebouncedProperty] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPosition(positionFilter);
      setDebouncedDepartment(departmentFilter);
      setDebouncedProperty(propertyFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [positionFilter, departmentFilter, propertyFilter]);

  const { data, isLoading } = useListAdminRecruitmentRequests({
    status: statusFilter !== "all" ? statusFilter : undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    position: debouncedPosition || undefined,
    department: debouncedDepartment || undefined,
    property: debouncedProperty || undefined,
  });
  const { data: urgentMetrics } = useGetAdminUrgentRecruitmentMetrics();

  const requests = (data as RecruitmentRequest[]) || [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Closed":
      case "Position Filled":
        return "bg-muted text-muted-foreground border-transparent shadow-none";
      case "Vacancy":
      case "Applications":
        return "bg-blue-50 text-blue-700 border-transparent shadow-none font-medium";
      case "Screening":
      case "Expert Review":
        return "bg-violet-50 text-violet-700 border-transparent shadow-none font-medium";
      case "Employer Interview":
      case "Interview-Ready Shortlist":
        return "bg-accent/10 text-accent border-transparent shadow-none font-bold";
      default:
        return "bg-emerald-50 text-emerald-700 border-transparent shadow-none font-medium";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Managed Recruitment</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage employer recruitment requests from vacancy to interview-ready shortlist.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Requests", urgentMetrics?.requested ?? 0],
          ["Accepted", urgentMetrics?.accepted ?? 0],
          ["Conversion", `${urgentMetrics?.conversionRate ?? 0}%`],
          ["Avg. fulfillment", urgentMetrics?.averageFulfillmentHours == null ? "—" : `${urgentMetrics.averageFulfillmentHours}h`],
          ["Interviews / Hires", `${urgentMetrics?.interviews ?? 0} / ${urgentMetrics?.hires ?? 0}`],
        ].map(([label, value]) => (
          <Card key={label} className="border-amber-200/70 bg-amber-50/40">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Property</label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search property..." className="pl-9 h-9 text-sm" value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Position</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search titles..."
                    className="pl-9 h-9 text-sm"
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Department</label>
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. F&B..."
                    className="pl-9 h-9 text-sm"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Vacancy">Vacancy Setup</SelectItem>
                    <SelectItem value="Applications">Applications</SelectItem>
                    <SelectItem value="Screening">Screening</SelectItem>
                    <SelectItem value="Expert Review">Expert Review</SelectItem>
                    <SelectItem value="Interview-Ready Shortlist">Shortlist Ready</SelectItem>
                    <SelectItem value="Employer Interview">Employer Interview</SelectItem>
                    <SelectItem value="Position Filled">Position Filled</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Urgency</label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Urgencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgencies</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgent">Urgent Hiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View: Cards */}
          <div className="md:hidden flex flex-col divide-y divide-border">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-16" /></div>
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p>No recruitment requests found.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-4 space-y-3 group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-primary text-base leading-tight">{req.positionTitle}</h3>
                      <div className="text-sm text-muted-foreground mt-1">{req.companyPropertyName}</div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(req.status)}>{req.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {req.department}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(req.createdAt), "MMM d, yyyy")}</span>
                    <span className="font-semibold text-primary flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {req.employeesRequired} needed</span>
                    {req.urgency === "Urgent" && (
                      <Badge variant="destructive" className="w-fit text-[10px] px-1.5 py-0 h-4 shadow-none">
                        <AlertCircle className="w-3 h-3 mr-1" /> Urgent
                      </Badge>
                    )}
                    {req.urgency === "Urgent" && <Badge variant="outline">{getUrgentServiceLabel(req.urgentServiceStatus)}</Badge>}
                  </div>
                  <Button size="sm" className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-medium h-9" asChild>
                    <Link href={`/admin/recruitment-requests/${req.id}`}>Open Workspace</Link>
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-primary w-[300px]">Position & Timeline</TableHead>
                  <TableHead className="font-semibold text-primary">Employer Details</TableHead>
                  <TableHead className="font-semibold text-primary">Requirements</TableHead>
                  <TableHead className="font-semibold text-primary">Current Stage</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm">No recruitment requests found matching your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-primary text-base line-clamp-1">{req.positionTitle}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              {req.department}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Req: {format(new Date(req.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground line-clamp-1">{req.companyPropertyName}</span>
                          </div>
                          {req.contactPerson && (
                            <span className="text-xs text-muted-foreground pl-8">{req.contactPerson}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge variant="outline" className="font-medium shadow-none bg-muted/50">
                            {req.employeesRequired} Needed
                          </Badge>
                          {req.urgency === "Urgent" && (
                            <Badge variant="destructive" className="w-fit text-[10px] px-1.5 py-0 h-5 shadow-none uppercase tracking-wider font-bold">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {req.urgency === "Urgent" && <Badge variant="outline" className="text-[10px]">{getUrgentServiceLabel(req.urgentServiceStatus)}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2.5 py-1 ${getStatusColor(req.status)}`}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-sm opacity-0 group-hover:opacity-100 h-8" asChild>
                          <Link href={`/admin/recruitment-requests/${req.id}`}>
                            Open Workspace
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

