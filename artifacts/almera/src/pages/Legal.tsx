import { useRoute } from 'wouter';
import { useGetLegalPage } from '@workspace/api-client-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function Legal() {
  const [, params] = useRoute("/legal/:slug");
  const slug = params?.slug || '';

  const { data: page, isLoading, isError } = useGetLegalPage(slug);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : isError || !page ? (
          <div className="text-center py-20">
            <h1 className="font-display text-4xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground">The document you are looking for does not exist.</p>
          </div>
        ) : (
          <article className="prose prose-stone dark:prose-invert prose-headings:font-display prose-a:text-primary max-w-none">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-10">{page.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
