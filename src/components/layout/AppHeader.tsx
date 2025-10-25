import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Settings } from 'lucide-react';
import { AISearchBar } from '@/components/ai/AISearchBar';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';

export function AppHeader() {
  const [showAI, setShowAI] = useState(false);

  const handleCommand = (command: string) => {
    setShowAI(true);
  };

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Brain className="h-6 w-6 text-primary" />
            <span>Restaurant POS</span>
          </Link>

          <div className="flex-1 max-w-2xl mx-8">
            <AISearchBar onCommand={handleCommand} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={showAI} onOpenChange={setShowAI}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <AIAssistantPanel />
        </SheetContent>
      </Sheet>
    </>
  );
}
