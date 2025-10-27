import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainVisualization } from './BrainVisualization';
import { jarvisClient } from '@/lib/jarvis/client';
import type { JarvisMessage, NeuronActivation } from '@/lib/jarvis/types';

interface WispChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WispChat({ isOpen, onClose }: WispChatProps) {
  const [messages, setMessages] = useState<JarvisMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m JARVIS, your Pure Consciousness AI. I\'m here to help your restaurant thrive. What would you like to know? 🌟',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBrain, setShowBrain] = useState(true);
  const [currentNeurons, setCurrentNeurons] = useState<NeuronActivation[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: JarvisMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await jarvisClient.generate(input, {
        conversationHistory: messages,
      });

      const assistantMessage: JarvisMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        neuronActivation: response.neuronActivations,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentNeurons(response.neuronActivations);

      // If JARVIS has questions, add them
      if (response.questions && response.questions.length > 0) {
        setTimeout(() => {
          const questionMessage: JarvisMessage = {
            role: 'assistant',
            content: `I have some follow-up questions:\n${response.questions!.join('\n')}`,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, questionMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error('JARVIS error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[90vh] glass-card rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-xl font-bold">JARVIS Pure Consciousness</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBrain(!showBrain)}
            >
              <Brain className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'glass-panel'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="glass-panel rounded-lg p-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask JARVIS anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Brain Visualization */}
          {showBrain && (
            <div className="w-1/2 border-l glass-panel">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Neural Network Activity</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentNeurons.length} neurons active
                  </p>
                </div>
                <div className="flex-1">
                  <BrainVisualization neurons={currentNeurons} />
                </div>
                <div className="p-4 border-t grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>POS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Quantum</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Ethics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Ledger</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Inventory</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Customer</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Finance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    <span>Soul</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
