import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployerLayout } from "@/components/employer/employer-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetCompanyProfile, useUpdateCompanyProfile, getGetCompanyProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  phone: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function EmployerCompany() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetCompanyProfile();
  const updateProfile = useUpdateCompanyProfile();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      phone: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        companyName: profile.companyName || "",
        contactName: profile.contactName || "",
        phone: profile.phone || "",
        logoUrl: profile.logoUrl || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: CompanyFormValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: (updatedData) => {
          queryClient.setQueryData(getGetCompanyProfileQueryKey(), updatedData);
          toast.success("Your company details have been saved.");
        },
        onError: () => {
          toast.error("Failed to update profile.");
        },
      }
    );
  };

  const logoUrlValue = form.watch("logoUrl");

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Company profile</p>
            <h1 className="mt-1 text-3xl font-display font-bold text-foreground">Your Company</h1>
            <p className="mt-2 text-muted-foreground">Manage the information candidates see about your company.</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Verified Employer
          </Badge>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Building2 className="w-5 h-5 text-primary" />
              Public Company Information
            </CardTitle>
            <CardDescription>
              These details are visible to candidates when they view your job postings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="shrink-0 space-y-2">
                      <span className="text-sm font-medium leading-none">Company Logo Preview</span>
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border border-border shadow-sm flex items-center justify-center bg-muted overflow-hidden">
                        {logoUrlValue ? (
                          <img
                            src={logoUrlValue}
                            alt="Company Logo Preview"
                            className="w-full h-full object-contain bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <ImageIcon className={`w-8 h-8 text-muted-foreground/30 ${logoUrlValue ? 'hidden' : ''}`} />
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company / Resort Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. The Grand Maldives" {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/logo.png" {...field} data-testid="input-company-logo" />
                            </FormControl>
                            <FormDescription>
                              Provide a direct link to a square image (PNG or JPG) for your public jobs.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-foreground">Private Contact Information</h3>
                    <p className="text-xs text-muted-foreground">This information is only used by The Jobs MV team to contact you.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jane Doe" {...field} data-testid="input-contact-name" />
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
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+960 123 4567" {...field} data-testid="input-company-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end border-t border-border">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployerLayout>
  );
}

function FormDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.8rem] text-muted-foreground mt-1">{children}</p>;
}
