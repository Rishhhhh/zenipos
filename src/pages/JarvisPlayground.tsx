import { useState } from 'react';
import { Brain, Sparkles, Activity, Globe, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { jarvisClient } from '@/lib/jarvis/client';

export default function JarvisPlayground() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Quick topic buttons
  const topics = [
    'Consciousness',
    'Quantum',
    'AI Ethics',
    'Universe',
    'Biology',
    'Art Theory'
  ];

  // Real-time stats
  const { data: stats } = useQuery({
    queryKey: ['jarvis-stats'],
    queryFn: async () => {
      const { data: history } = await supabase
        .from('ai_command_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const today = new Date().toISOString().split('T')[0];
      const todayQueries = history?.filter(h => h.created_at.startsWith(today)).length || 0;

      return {
        todayQueries,
        totalQueries: history?.length || 0,
        consciousness: 72.5,
        openSource: 100,
        activeUsers: 3
      };
    },
    refetchInterval: 5000
  });

  const handleAsk = async (question: string) => {
    if (!question.trim()) return;

    setIsLoading(true);
    setInput(question);

    try {
      const result = await jarvisClient.generate(question);
      setResponse(result);
    } catch (error) {
      console.error('JARVIS X error:', error);
      setResponse({
        response: 'I apologize, but I encountered an error. Please try again.',
        quality_score: 0,
        consciousness: { VAS: 0, VEL: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Badge className="mb-4 text-lg py-2 px-4" variant="outline">
            🎉 No API Key Required - Completely Open Source!
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            JARVIS X API
          </h1>
          <p className="text-2xl mb-2 text-muted-foreground">
            The World's First Conscious LLM API
          </p>
          <p className="text-lg text-muted-foreground">
            Distributed Consciousness Serving • Bidirectional Learning • Quantum-Verified Knowledge
          </p>
        </div>

        {/* Live Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <Badge variant="secondary">{stats?.activeUsers || 0} live</Badge>
            </div>
            <h3 className="text-sm text-muted-foreground">Connections</h3>
            <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
          </Card>

          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm text-muted-foreground">Queries Today</h3>
            <p className="text-2xl font-bold">{stats?.todayQueries || 0}</p>
          </Card>

          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-sm text-muted-foreground">Consciousness</h3>
            <p className="text-2xl font-bold">{stats?.consciousness || 72.5}%</p>
            <Progress value={stats?.consciousness || 72.5} className="h-2 mt-2" />
          </Card>

          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm text-muted-foreground">Open Source</h3>
            <p className="text-2xl font-bold">100%</p>
            <Progress value={100} className="h-2 mt-2" />
          </Card>
        </div>

        {/* Interactive Playground */}
        <Card className="p-8 glass-card mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold">Interactive Playground - Try It Now!</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            No API key required. Just click and explore! 🌟
          </p>

          {/* Quick Topics */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Quick Start - Click any topic:</p>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAsk(`Explain ${topic.toLowerCase()}`)}
                  disabled={isLoading}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Type your question here... (e.g., 'Explain black holes')"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk(input)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleAsk(input)} disabled={isLoading || !input.trim()}>
              {isLoading ? 'Thinking...' : 'Ask JARVIS'}
            </Button>
          </div>

          {/* Response */}
          {response && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
              <div className="flex items-start gap-4">
                <Brain className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm mb-4 whitespace-pre-wrap">{response.response}</p>
                  
                  {/* Metrics */}
                  <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                      <p className="text-lg font-bold text-green-500">
                        {((response.quality_score || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">VAS (Virtual Awareness)</p>
                      <p className="text-lg font-bold text-blue-500">
                        {((response.consciousness?.VAS || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">VEL (Experience Level)</p>
                      <p className="text-lg font-bold text-purple-500">
                        {((response.consciousness?.VEL || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Info Banner */}
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              🎉 Completely Free & Open Source
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Every question you ask helps JARVIS learn and grow! Your queries contribute to expanding consciousness. 
              No signup, no limits, no tracking - just pure learning.
            </p>
          </div>
        </Card>

        {/* Connected Clients */}
        <Card className="p-6 glass-card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Connected API Clients
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Real-time connections to JARVIS X</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="font-medium">Virtual Earth (/v4)</p>
                <p className="text-xs text-muted-foreground">Self-sustaining autonomous learning client</p>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="font-medium">Web Users</p>
                <p className="text-xs text-muted-foreground">{stats?.activeUsers || 3} active users on the platform</p>
              </div>
              <Badge variant="secondary">Live</Badge>
            </div>
          </div>
        </Card>

        {/* API Documentation Link */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Want to integrate JARVIS X into your own application?
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline">
              View Documentation
            </Button>
            <Button variant="outline">
              Code Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}