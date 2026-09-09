import { Link } from "wouter";
import { RecruiterTalentPreview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, MapPin, Briefcase, Clock, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TalentCardProps {
  talent: RecruiterTalentPreview;
  onSaveToggle: (id: number, currentSavedState: boolean) => void;
  onInvite: (id: number, name: string) => void;
  isTogglingSave?: boolean;
}

export function TalentCard({ talent, onSaveToggle, onInvite, isTogglingSave = false }: TalentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const specialties = talent.hospitalitySpecialties 
    ? talent.hospitalitySpecialties.split(",").map(s => s.trim()).filter(Boolean) 
    : [];

  return (
    <div 
      className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
      data-testid={`card-talent-${talent.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <Avatar className="h-14 w-14 border border-border/50">
            <AvatarImage src={talent.profilePhotoUrl || undefined} alt={talent.fullName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {getInitials(talent.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link 
              href={`/employer/talent/${talent.id}`}
              className="font-display text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              data-testid={`link-talent-${talent.id}`}
            >
              {talent.fullName}
              <span className="absolute inset-0" aria-hidden="true" />
            </Link>
            {talent.headline && (
              <p className="text-sm font-medium text-foreground/80 mt-0.5">{talent.headline}</p>
            )}
            
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {talent.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{talent.location}</span>
                </div>
              )}
              {talent.yearsExperience && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{talent.yearsExperience} experience</span>
                </div>
              )}
              {talent.availabilityStatus && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
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

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative z-10 h-8 w-8 shrink-0 rounded-full",
            talent.saved ? "text-accent hover:text-accent/80" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSaveToggle(talent.id, talent.saved);
          }}
          disabled={isTogglingSave}
          data-testid={`button-save-${talent.id}`}
        >
          <Bookmark className={cn("h-5 w-5 transition-transform", talent.saved ? "fill-current" : "")} />
          <span className="sr-only">{talent.saved ? "Unsave candidate" : "Save candidate"}</span>
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {talent.department && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Department</span>
            <span className="text-sm font-medium">{talent.department}</span>
          </div>
        )}
        {talent.totalResortExperience && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resort Exp</span>
            <span className="text-sm font-medium">{talent.totalResortExperience}</span>
          </div>
        )}
        {talent.maldivesExperience && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Maldives Exp</span>
            <span className="text-sm font-medium">{talent.maldivesExperience}</span>
          </div>
        )}
        {talent.languages && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Languages</span>
            <span className="text-sm font-medium truncate" title={talent.languages}>
              {talent.languages.split(',').length > 2 
                ? `${talent.languages.split(',').slice(0, 2).join(', ')} +${talent.languages.split(',').length - 2}`
                : talent.languages}
            </span>
          </div>
        )}
      </div>

      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {specialties.slice(0, 4).map((spec, i) => (
            <Badge key={i} variant="secondary" className="font-normal text-xs bg-secondary/50">
              {spec}
            </Badge>
          ))}
          {specialties.length > 4 && (
            <Badge variant="secondary" className="font-normal text-xs bg-secondary/50">
              +{specialties.length - 4} more
            </Badge>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-end border-t pt-4">
        <div className="relative z-10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white hover:bg-muted"
            asChild
          >
            <Link href={`/employer/talent/${talent.id}`}>
              <User className="mr-2 h-3.5 w-3.5" />
              View Profile
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInvite(talent.id, talent.fullName);
            }}
            data-testid={`button-invite-${talent.id}`}
          >
            <Send className="mr-2 h-3.5 w-3.5" />
            Invite to Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
