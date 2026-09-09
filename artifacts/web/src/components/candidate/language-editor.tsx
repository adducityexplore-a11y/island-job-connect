import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type LanguageEntry = {
  id: string;
  language: string;
  proficiency: string;
};

interface LanguageEditorProps {
  value: LanguageEntry[];
  onChange: (value: LanguageEntry[]) => void;
}

export function LanguageEditor({ value, onChange }: LanguageEditorProps) {
  const handleAdd = () => {
    onChange([...value, { id: crypto.randomUUID(), language: "", proficiency: "Conversational" }]);
  };

  const handleUpdate = (id: string, field: keyof LanguageEntry, val: string) => {
    onChange(value.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  const handleDelete = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-3">
      {value.map((entry) => (
        <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            value={entry.language}
            onChange={(e) => handleUpdate(entry.id, "language", e.target.value)}
            placeholder="e.g. English, Dhivehi"
            className="flex-1"
          />
          <div className="flex items-center gap-3">
            <Select value={entry.proficiency} onValueChange={(v) => handleUpdate(entry.id, "proficiency", v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Proficiency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Conversational">Conversational</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Fluent">Fluent</SelectItem>
                <SelectItem value="Native">Native</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="mt-2 border-dashed">
        <Plus className="mr-2 h-4 w-4" /> Add Language
      </Button>
    </div>
  );
}
