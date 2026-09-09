import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';
import { SEO } from '@/components/seo';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] w-full flex items-center justify-center bg-muted/20">
      <SEO title="Page Not Found" />
      <div className="w-full max-w-md mx-4 text-center">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Compass className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">
          404 Not Found
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
