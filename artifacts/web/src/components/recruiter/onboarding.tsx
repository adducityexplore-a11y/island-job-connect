import { zodResolver } from "@hookform/resolvers/zod";
import {
  getGetCompanyProfileQueryKey,
  getGetRecruiterDashboardQueryKey,
  getListRecruiterApplicationsQueryKey,
  getListRecruiterJobsQueryKey,
  useRegisterRecruiter,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  phone: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function RecruiterOnboarding() {
  const queryClient = useQueryClient();
  const registration = useRegisterRecruiter();
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: "", contactName: "", phone: "" },
  });

  const onSubmit = (data: Values) => {
    registration.mutate(
      { data },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getGetRecruiterDashboardQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetCompanyProfileQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListRecruiterJobsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListRecruiterApplicationsQueryKey() }),
          ]);
          toast({
            title: "Recruiter workspace ready",
            description: "Your company profile has been created.",
          });
        },
        onError: (error) => {
          toast({
            title: "Could not create recruiter profile",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-xl items-center">
      <Card className="w-full border-primary/15 shadow-lg">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Set up your recruiter workspace</CardTitle>
          <CardDescription>
            Add the company details candidates should see with your vacancies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company or resort name</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="organization" data-testid="input-onboarding-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary contact name</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="name" data-testid="input-onboarding-contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" autoComplete="tel" data-testid="input-onboarding-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registration.isPending}
                data-testid="button-create-recruiter-profile"
              >
                {registration.isPending ? "Creating workspace..." : "Continue to dashboard"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}