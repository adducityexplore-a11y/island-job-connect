import { useState, useMemo } from "react";
import { useListAdminAuditEvents } from "@workspace/api-client-react";
import { 
  Activity,
  UserCog,
  Briefcase,
  Building2,
  FileEdit,
  Shield,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminAuditLog() {
  const limit = 100;
  const { data, isLoading } = useListAdminAuditEvents({ limit });
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((event) => {
      const metadataStr = event.metadata ? JSON.stringify(event.metadata).toLowerCase() : "";
      const matchesSearch = event.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            event.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (event.entityId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            metadataStr.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      if (entityFilter !== "all" && event.entityType.toLowerCase() !== entityFilter.toLowerCase()) return false;
      
      return true;
    });
  }, [data?.items, searchTerm, entityFilter]);

  const emptyState = filteredEvents.length === 0 && !isLoading;

  const getEventIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
      case 'candidate': return <UserCog className="w-4 h-4 text-violet-600" />;
      case 'job':
      case 'vacancy': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'employer':
      case 'company': return <Building2 className="w-4 h-4 text-orange-600" />;
      case 'application': return <FileEdit className="w-4 h-4 text-emerald-600" />;
      default: return <Shield className="w-4 h-4 text-primary" />;
    }
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('verify') || a.includes('approve')) return 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-100';
    if (a.includes('delete') || a.includes('revoke') || a.includes('close') || a.includes('reject')) return 'text-destructive bg-destructive/10 px-2 py-0.5 rounded font-medium border border-destructive/20';
    if (a.includes('update') || a.includes('edit')) return 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-100';
    return 'text-foreground bg-muted px-2 py-0.5 rounded font-medium border border-border/50';
  };

  const uniqueEntities = useMemo(() => {
    if (!data?.items) return [];
    const entities = new Set(data.items.map(e => e.entityType.toLowerCase()));
    return Array.from(entities);
  }, [data?.items]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-primary">Audit Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review recent administrative actions and system events.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Activity className="w-5 h-5" />
              System Events
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search actions, IDs..." 
                  className="pl-9 h-9 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Entities" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {uniqueEntities.map(entity => (
                    <SelectItem key={entity} value={entity} className="capitalize">{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        {/* Mobile cards */}
        <CardContent className="p-0 md:hidden">
          {isLoading ? (
            <div className="divide-y divide-border/50">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          ) : emptyState ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">No audit events found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${getActionColor(event.action)}`}>{event.action}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(event.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center border border-border/50 shrink-0">
                      {getEventIcon(event.entityType)}
                    </div>
                    <span className="capitalize font-medium text-sm text-foreground">{event.entityType}</span>
                    {event.entityId && (
                      <span className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                        #{event.entityId}
                      </span>
                    )}
                  </div>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="bg-muted/20 border border-border/50 p-2 rounded text-xs font-mono">
                      {Object.entries(event.metadata).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-primary/70 font-semibold">{key}:</span>
                          <span className="truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Desktop table */}
        <CardContent className="p-0 hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[200px] font-semibold text-primary">Date & Time</TableHead>
                  <TableHead className="font-semibold text-primary">Action</TableHead>
                  <TableHead className="font-semibold text-primary">Entity</TableHead>
                  <TableHead className="font-semibold text-primary">Metadata Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(10).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    </TableRow>
                  ))
                ) : emptyState ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm">No audit events found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">{format(new Date(event.createdAt), "MMM d, yyyy")}</span>
                          <span className="text-xs">{format(new Date(event.createdAt), "HH:mm:ss")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs ${getActionColor(event.action)}`}>
                          {event.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center border border-border/50">
                            {getEventIcon(event.entityType)}
                          </div>
                          <span className="capitalize font-medium text-sm text-foreground">{event.entityType}</span>
                          {event.entityId && (
                            <span className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                              #{event.entityId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {event.metadata && Object.keys(event.metadata).length > 0 ? (
                          <div className="bg-muted/20 border border-border/50 p-2 rounded text-xs font-mono overflow-hidden">
                            {Object.entries(event.metadata).map(([key, val]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-primary/70 font-semibold">{key}:</span>
                                <span className="truncate">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-xs">No additional data</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {data?.items && data.items.length >= limit && (
          <div className="p-4 flex items-center justify-center border-t border-border/50 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing the {limit} most recent actions.
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
