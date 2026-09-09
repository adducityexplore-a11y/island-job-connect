import { useState } from "react";
import { Plus, Trash2, Pencil, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export type WorkHistoryEntry = {
  id: string;
  position: string;
  employer: string;
  country: string;
  resortHotel: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
};

interface WorkHistoryEditorProps {
  value: WorkHistoryEntry[];
  onChange: (value: WorkHistoryEntry[]) => void;
}

export function WorkHistoryEditor({ value, onChange }: WorkHistoryEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<WorkHistoryEntry>>({});

  const handleAdd = () => {
    const newId = crypto.randomUUID();
    setEditingId(newId);
    setDraft({ id: newId });
  };

  const handleEdit = (entry: WorkHistoryEntry) => {
    setEditingId(entry.id);
    setDraft({ ...entry });
  };

  const handleDelete = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    if (!draft.position || !draft.employer) return;
    if (value.find((v) => v.id === draft.id)) {
      onChange(value.map((v) => (v.id === draft.id ? (draft as WorkHistoryEntry) : v)));
    } else {
      onChange([...value, draft as WorkHistoryEntry]);
    }
    setEditingId(null);
    setDraft({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraft({});
  };

  return (
    <div className="space-y-4">
      {value.length === 0 && !editingId && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-muted/10">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No work history added</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add your relevant hospitality experience.</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Experience
          </Button>
        </div>
      )}

      {value.map((entry) => (
        <Card key={entry.id} className="overflow-hidden transition-all hover:border-primary/30">
          {editingId === entry.id ? (
            <CardContent className="p-5 space-y-4 bg-muted/5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Position / Title *</Label>
                  <Input
                    value={draft.position || ""}
                    onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                    placeholder="e.g. Front Office Manager"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Employer *</Label>
                  <Input
                    value={draft.employer || ""}
                    onChange={(e) => setDraft({ ...draft, employer: e.target.value })}
                    placeholder="e.g. Soneva Fushi"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Resort / Hotel</Label>
                  <Input
                    value={draft.resortHotel || ""}
                    onChange={(e) => setDraft({ ...draft, resortHotel: e.target.value })}
                    placeholder="If different from employer"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input
                    value={draft.country || ""}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    placeholder="e.g. Maldives"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={draft.startDate || ""}
                    onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={draft.endDate || ""}
                    onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                    placeholder="Leave blank if current"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Responsibilities</Label>
                <Textarea
                  rows={3}
                  value={draft.responsibilities || ""}
                  onChange={(e) => setDraft({ ...draft, responsibilities: e.target.value })}
                  placeholder="Key achievements and duties..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={!draft.position || !draft.employer}>
                  Save Entry
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-5 flex items-start justify-between group">
              <div>
                <h4 className="font-display font-semibold text-base">{entry.position}</h4>
                <p className="text-sm text-foreground/80 mt-0.5">
                  {entry.employer} {entry.resortHotel ? `· ${entry.resortHotel}` : ""}{" "}
                  {entry.country ? `· ${entry.country}` : ""}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {entry.startDate || "Unknown"} — {entry.endDate || "Present"}
                  </span>
                </div>
                {entry.responsibilities && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{entry.responsibilities}</p>
                )}
              </div>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => handleEdit(entry)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {editingId && !value.find((v) => v.id === editingId) && (
        <Card className="overflow-hidden border-primary/50 ring-1 ring-primary/20">
          <CardContent className="p-5 space-y-4 bg-muted/5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Position / Title *</Label>
                <Input
                  value={draft.position || ""}
                  onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                  placeholder="e.g. Front Office Manager"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employer *</Label>
                <Input
                  value={draft.employer || ""}
                  onChange={(e) => setDraft({ ...draft, employer: e.target.value })}
                  placeholder="e.g. Soneva Fushi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Resort / Hotel</Label>
                <Input
                  value={draft.resortHotel || ""}
                  onChange={(e) => setDraft({ ...draft, resortHotel: e.target.value })}
                  placeholder="If different from employer"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={draft.country || ""}
                  onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                  placeholder="e.g. Maldives"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="month"
                  value={draft.startDate || ""}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={draft.endDate || ""}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                  placeholder="Leave blank if current"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsibilities</Label>
              <Textarea
                rows={3}
                value={draft.responsibilities || ""}
                onChange={(e) => setDraft({ ...draft, responsibilities: e.target.value })}
                placeholder="Key achievements and duties..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={!draft.position || !draft.employer}>
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {value.length > 0 && !editingId && (
        <Button type="button" variant="outline" className="w-full border-dashed" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Another Position
        </Button>
      )}
    </div>
  );
}
