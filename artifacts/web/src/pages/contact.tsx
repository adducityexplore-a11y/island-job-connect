import { Mail } from "lucide-react";
import { SEO } from "@/components/seo";

export default function Contact() {
  return (
    <div className="w-full bg-background">
      <SEO title="Contact The Jobs MV" description="Contact The Jobs MV for hospitality recruitment and platform support in the Maldives." canonicalPath="/contact" />
      <section className="bg-primary px-4 py-16 text-white md:py-20">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Contact The Jobs MV</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">We are here to help candidates and employers make hospitality recruitment clearer and simpler.</p>
        </div>
      </section>
      <section className="container mx-auto max-w-4xl px-4 py-14 md:py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
          <Mail className="mb-5 h-9 w-9 text-secondary" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-foreground">Email us</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">For candidate support, employer enquiries, recruitment services, or general questions, email our team.</p>
          <a className="mt-6 inline-block font-semibold text-secondary underline underline-offset-4" href="mailto:hello@thejobsmv.com">hello@thejobsmv.com</a>
        </div>
      </section>
    </div>
  );
}