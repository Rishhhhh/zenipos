import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, FileText, Code, Database, Settings, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CATEGORY_ICONS = {
  general: BookOpen,
  modules: FileText,
  technical: Code,
  api: Settings,
};

export default function Documentation() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const currentSlug = slug ? `/${slug}` : '/overview';

  const { data: pages } = useQuery({
    queryKey: ['documentation-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentation_pages')
        .select('*')
        .eq('is_published', true)
        .order('category');

      if (error) throw error;
      return data;
    },
  });

  const { data: currentPage, isLoading } = useQuery({
    queryKey: ['documentation-page', currentSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentation_pages')
        .select('*')
        .eq('slug', currentSlug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('documentation_pages')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data;
    },
  });

  const filteredPages = pages?.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagesByCategory = filteredPages?.reduce((acc, page) => {
    const category = page.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Documentation
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {Object.entries(pagesByCategory || {}).map(([category, categoryPages]) => {
              const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || FileText;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground uppercase">
                    <Icon className="h-4 w-4" />
                    {category}
                  </div>
                  <div className="space-y-1">
                    {categoryPages.map((page) => (
                      <Button
                        key={page.id}
                        variant={page.slug === currentSlug ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigate(`/documentation${page.slug}`)}
                      >
                        <span className="truncate">{page.title}</span>
                        {page.slug === currentSlug && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-8">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ) : currentPage ? (
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <div className="flex items-center gap-2 mb-4">
                  {currentPage.category && (
                    <Badge variant="outline">{currentPage.category}</Badge>
                  )}
                  {currentPage.version && (
                    <Badge variant="secondary">v{currentPage.version}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    {currentPage.view_count || 0} views
                  </span>
                </div>

                <h1 className="text-4xl font-bold mb-6">{currentPage.title}</h1>

                <ReactMarkdown
                  components={{
                    code: ({ className, children, ...props }: any) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {currentPage.content}
                </ReactMarkdown>

                {currentPage.tags && currentPage.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Tags:</span>
                      {currentPage.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Documentation page not found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {currentPage && (
          <div className="border-t p-4 bg-muted/50">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Last updated: {new Date(currentPage.updated_at).toLocaleDateString()}
              </span>
              <Button variant="outline" size="sm" asChild>
                <a href={`/changelog`}>View Version History</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
