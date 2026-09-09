import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useInviteRecruiterTalent, useListRecruiterJobs } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

const inviteSchema = z.object({
  jobId: z.coerce.number({ required_error: "Please select a job." }),
  message: z.string().max(2000).optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteTalentDialogProps {
  candidateId: number;
  candidateName: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InviteTalentDialog({
  candidateId,
  candidateName,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: InviteTalentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && setControlledOpen ? setControlledOpen : setInternalOpen;

  const { toast } = useToast();
  const { data: jobs, isLoading: isLoadingJobs } = useListRecruiterJobs();
  const inviteTalent = useInviteRecruiterTalent();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      message: "",
    },
  });

  const activeJobs = jobs?.filter((job) => job.status === "active" || job.status === "published") || [];

  const onSubmit = (values: InviteFormValues) => {
    inviteTalent.mutate(
      {
        id: candidateId,
        data: {
          jobId: values.jobId,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Invitation sent",
            description: `You have successfully invited ${candidateName} to apply.`,
          });
          setOpen(false);
          form.reset();
        },
        onError: (error: any) => {
          toast({
            title: "Invitation failed",
            description: error.error || "An error occurred while sending the invitation.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to Apply</DialogTitle>
          <DialogDescription>
            Record an invitation for {candidateName} to apply for one of your active roles. Their private contact details remain protected.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Vacancy</FormLabel>
                  <Select
                    disabled={isLoadingJobs || activeJobs.length === 0}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-job-invite">
                        <SelectValue placeholder={
                          isLoadingJobs ? "Loading jobs..." : 
                          activeJobs.length === 0 ? "No active jobs available" : 
                          "Select a job"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} {job.location ? `(${job.location})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personalized Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Hi ${candidateName}, we are currently hiring and your profile looks like a great fit...`}
                      className="resize-none min-h-[120px]"
                      data-testid="input-invite-message"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteTalent.isPending || activeJobs.length === 0}>
                {inviteTalent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
