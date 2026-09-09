import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Users } from "lucide-react";
import { SEO } from "@/components/seo";

export default function About() {
  return (
    <div className="w-full">
      <SEO 
        title="About Us" 
        description="Learn about The Jobs MV and its approach to clearer hospitality recruitment in the Maldives."
      />
      {/* Hero */}
      <section className="bg-primary text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            About The Jobs MV
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Right Talent. Right Opportunity. Right Time.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-24">

          {/* Mission */}
          <div className="space-y-6 text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Our Mission</h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Great talent should never be lost to a slow hiring process.
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              We make hospitality recruitment faster and simpler, helping employers find the right people and job seekers reach the right opportunities when they matter most.
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-6 text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Our Vision</h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              A future where talent never misses opportunity.
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Where every employer can reach the people they need, and every job seeker has a fair chance to be discovered.
            </p>
          </div>

          {/* Values */}
          <div className="pt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary text-center mb-10">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border shadow-sm rounded-3xl p-8 md:p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">People First</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Behind every CV is a person looking for an opportunity. Behind every vacancy is a team looking for the right person.
                </p>
              </div>
              <div className="bg-card border border-border shadow-sm rounded-3xl p-8 md:p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">Time Matters</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Great talent doesn't wait forever. We help employers and job seekers connect before opportunities are lost.
                </p>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="bg-primary rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-6">Our Purpose</h2>
            <p className="text-3xl md:text-5xl font-display font-bold mb-10">
              Right Talent. Right Opportunity. Right Time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-full bg-secondary hover:bg-secondary/90 text-white h-14 px-8 shadow-lg shadow-secondary/20 w-full sm:w-auto">
                <Link href="/jobs">
                  Find Jobs <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-8 border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm w-full sm:w-auto">
                <Link href="/employers">
                  For Employers
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
