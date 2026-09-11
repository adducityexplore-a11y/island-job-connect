import { useMemo, useState } from "react";
import { useSendAdminOutreachEmail } from "@workspace/api-client-react";
import { Mail, Send, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminOutreach() {
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ sent: number; failed: Array<{ email: string; error: string }> } | null>(null);

  const sendMutation = useSendAdminOutreachEmail({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        toast.success(`Sent to ${data.sent} of ${data.sent + data.failed.length} recipients`);
      },
      onError: () => toast.error("Failed to send outreach emails"),
    },
  });

  const { validEmails, invalidEntries } = useMemo(() => {
    const entries = recipientsRaw.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    const unique = Array.from(new Set(entries.map((e) => e.toLowerCase())));
    const valid = unique.filter((e) => EMAIL_RE.test(e));
    const invalid = unique.filter((e) => !EMAIL_RE.test(e));
    return { validEmails: valid, invalidEntries: invalid };
  }, [recipientsRaw]);

  const canSend = validEmails.length > 0 && subject.trim().length > 0 && message.trim().length > 0 && validEmails.length <= 200;

  const handleSend = () => {
    setResult(null);
    sendMutation.mutate({ data: { recipients: validEmails, subject: subject.trim(), message: message.trim() } });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-primary">Outreach</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send an email about The Jobs MV to a list of HR contacts.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm bg-white">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Mail className="w-5 h-5" /> Compose Email
          </CardTitle>
          <CardDescription>Paste HR contact emails, one per line (or separated by commas).</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="outreach-recipients">Recipients</Label>
            <Textarea
              id="outreach-recipients"
              placeholder={"hr@resortname.com\nrecruitment@hotelname.com"}
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              data-testid="input-outreach-recipients"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-medium">
                {validEmails.length} valid
              </Badge>
              {invalidEntries.length > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none font-medium">
                  {invalidEntries.length} invalid — ignored
                </Badge>
              )}
              {validEmails.length > 200 && (
                <span className="text-red-600 font-medium">Maximum 200 recipients per send</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outreach-subject">Subject</Label>
            <Input
              id="outreach-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Partner with The Jobs MV — find your next hire faster"
              data-testid="input-outreach-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outreach-message">Message</Label>
            <Textarea
              id="outreach-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[220px]"
              data-testid="input-outreach-message"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!canSend || sendMutation.isPending} className="w-full sm:w-auto bg-primary hover:bg-primary/90" data-testid="button-outreach-send">
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending ? "Sending..." : `Send to ${validEmails.length} Recipient${validEmails.length === 1 ? "" : "s"}`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <AlertDialogTitle>Send this email?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send "{subject}" to {validEmails.length} recipient{validEmails.length === 1 ? "" : "s"}. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSend} className="bg-primary hover:bg-primary/90 text-white">
                  Send
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-border/50 shadow-sm bg-white">
          <CardHeader className="border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base text-primary">Send Results</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{result.sent} sent successfully</span>
            </div>
            {result.failed.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium">{result.failed.length} failed</span>
                </div>
                <ul className="text-xs text-muted-foreground bg-muted/20 border border-border/50 rounded p-3 space-y-1">
                  {result.failed.map((f) => (
                    <li key={f.email}><span className="font-medium text-foreground">{f.email}</span>: {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
