import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AISearchBar } from './AISearchBar';
import { AIApprovalDialog } from './AIApprovalDialog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolResults?: any[];
  requiresApproval?: boolean;
  pendingActions?: any[];
  timestamp: Date;
}

interface AIAssistantPanelProps {
  language?: 'en' | 'ms';
}

export function AIAssistantPanel({ language = 'en' }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { toast } = useToast();

  const handleCommand = async (command: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: command,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call AI orchestrator
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: { command, language }
      });

      if (error) throw error;

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        toolResults: data.tool_results,
        requiresApproval: data.requires_approval,
        pendingActions: data.pending_actions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If requires approval, show dialog
      if (data.requires_approval) {
        setPendingActions(data.pending_actions);
        setShowApproval(true);
      }

    } catch (error) {
      console.error('AI command error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process command',
      });

      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'ms' 
          ? 'Maaf, saya tidak dapat memproses arahan tersebut.' 
          : 'Sorry, I could not process that command.',
        timestamp: new Date()
      }]);

    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalComplete = () => {
    setShowApproval(false);
    setPendingActions([]);
    
    toast({
      title: language === 'ms' ? 'Tindakan Diluluskan' : 'Action Approved',
      description: language === 'ms' ? 'Perubahan telah dilaksanakan' : 'Changes have been applied',
    });

    // Refresh the last message to show completion
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 
        ? { ...msg, requiresApproval: false }
        : msg
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">ZENI AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {language === 'ms' 
                ? 'Pembantu pintar untuk POS anda' 
                : 'Your intelligent POS assistant'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {language === 'ms' 
                ? 'Tanya saya apa sahaja tentang operasi restoran anda' 
                : 'Ask me anything about your restaurant operations'}
            </p>
            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCommand(
                  language === 'ms' 
                    ? 'Berikan saya laporan jualan hari ini' 
                    : 'Give me today\'s sales report'
                )}
              >
                {language === 'ms' ? 'Laporan Jualan' : 'Sales Report'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCommand(
                  language === 'ms' 
                    ? 'Senaraikan item yang stok rendah' 
                    : 'List low stock items'
                )}
              >
                {language === 'ms' ? 'Stok Rendah' : 'Low Stock'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[80%] p-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Tool Results */}
                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {msg.toolResults.map((tool, tidx) => (
                        <div key={tidx} className="text-xs">
                          <Badge variant={tool.classification === 'safe' ? 'secondary' : 'destructive'}>
                            {tool.tool}
                          </Badge>
                          <pre className="mt-1 text-xs opacity-70 overflow-auto">
                            {JSON.stringify(tool.result, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Approval Required */}
                  {msg.requiresApproval && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{language === 'ms' ? 'Memerlukan kelulusan pengurus' : 'Requires manager approval'}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs opacity-50 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <AISearchBar onCommand={handleCommand} language={language} />
      </div>

      {/* Approval Dialog */}
      <AIApprovalDialog
        open={showApproval}
        onOpenChange={setShowApproval}
        actions={pendingActions}
        language={language}
        onApprovalComplete={handleApprovalComplete}
      />
    </div>
  );
}
