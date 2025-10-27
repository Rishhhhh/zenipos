import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { FileText, Bug, Wrench, AlertTriangle, Shield, Zap } from 'lucide-react';

const TYPE_ICONS = {
  feature: FileText,
  bugfix: Bug,
  refactor: Wrench,
  breaking: AlertTriangle,
  security: Shield,
  performance: Zap,
};

const TYPE_VARIANTS = {
  feature: 'default',
  bugfix: 'secondary',
  refactor: 'outline',
  breaking: 'destructive',
  security: 'default',
  performance: 'secondary',
} as const;

export default function Changelog() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['changelog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_changelog')
        .select('*')
        .order('released_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading changelog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">System Changelog</h1>
        <p className="text-lg text-muted-foreground">
          Complete version history and release notes for the POS system
        </p>
      </div>

      <div className="space-y-6">
        {entries?.map((entry) => {
          const Icon = TYPE_ICONS[entry.type as keyof typeof TYPE_ICONS];
          
          return (
            <Card key={entry.id} className="p-6 glass-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold">{entry.version}</h2>
                      <Badge variant={TYPE_VARIANTS[entry.type as keyof typeof TYPE_VARIANTS]}>
                        {entry.type}
                      </Badge>
                      {entry.module && (
                        <Badge variant="outline">{entry.module}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.released_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">{entry.title}</h3>
              {entry.description && (
                <p className="text-muted-foreground mb-4">{entry.description}</p>
              )}

              {entry.changes && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      View Technical Details
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(entry.changes, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </Card>
          );
        })}
      </div>

      {entries?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No changelog entries yet</p>
        </div>
      )}
    </div>
  );
}
