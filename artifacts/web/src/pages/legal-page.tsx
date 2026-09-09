import { type ReactNode } from "react";
import { SEO } from "@/components/seo";

interface LegalPageProps {
  title: string;
  description: string;
  canonicalPath: string;
  children: ReactNode;
}

export function LegalPage({ title, description, canonicalPath, children }: LegalPageProps) {
  return (
    <div className="w-full bg-background">
      <SEO title={title} description={description} canonicalPath={canonicalPath} />
      <section className="bg-primary px-4 py-16 text-white md:py-20">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">{description}</p>
        </div>
      </section>
      <article className="container mx-auto max-w-4xl px-4 py-14 md:py-20">
        <div className="space-y-10 text-muted-foreground leading-relaxed">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold text-foreground">{heading}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}