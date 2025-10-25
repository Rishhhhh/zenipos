import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AIHistoryDashboard() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['ai-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_command_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'denied':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">AI Command History</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Track all AI assistant interactions and approvals
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {history?.map((cmd) => (
              <Card key={cmd.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(cmd.status)}
                      <Badge variant={cmd.language === 'ms' ? 'secondary' : 'default'}>
                        {cmd.language === 'ms' ? 'Bahasa' : 'English'}
                      </Badge>
                      <Badge>{cmd.intent || 'general'}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {cmd.execution_time_ms}ms
                      </span>
                    </div>
                    
                    <p className="font-medium mb-1">{cmd.command}</p>
                    
                    {cmd.tools_used && cmd.tools_used.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {cmd.tools_used.map((tool, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {cmd.error_message && (
                      <p className="text-sm text-destructive mt-2">
                        {cmd.error_message}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(cmd.created_at).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
