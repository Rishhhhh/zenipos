import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useDemoDataGenerator } from '@/hooks/useDemoDataGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DemoModePanel() {
  const { demoMode, isLoading, toggleDemoMode, isToggling } = useDemoMode();
  const { generate, clear, isGenerating, isClearing } = useDemoDataGenerator();

  return (
    <Card className="p-6 mb-8 border-warning/50 bg-gradient-to-r from-warning/5 to-transparent">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <Sparkles className="h-6 w-6 text-warning" />
          </div>
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Demo Mode
                {demoMode && (
                  <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {demoMode 
                  ? 'Simulated restaurant data is active. Perfect for testing and demonstrations.'
                  : 'Generate realistic demo data to showcase system capabilities.'}
              </p>
            </div>

            {demoMode && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-3 w-3" />
                <span>Demo data is visible across all modules. Toggle off for production use.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          {!demoMode ? (
            <Button
              variant="default"
              onClick={() => generate(42)}
              disabled={isGenerating}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Demo Data'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="demo-toggle" className="text-sm font-medium">
                  Demo Mode
                </Label>
                <Switch
                  id="demo-toggle"
                  checked={demoMode}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      // Turning off requires confirmation and clearing
                      return;
                    }
                    toggleDemoMode(checked);
                  }}
                  disabled={isLoading || isToggling}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={isClearing}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isClearing ? 'Clearing...' : 'Clear All Demo Data'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Demo Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all demo orders, customers, menu items, and related data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clear();
                        setTimeout(() => toggleDemoMode(false), 1000);
                      }}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Clear Demo Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {demoMode && (
        <div className="mt-4 pt-4 border-t border-warning/20">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">~1000</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">50</p>
              <p className="text-xs text-muted-foreground">Menu Items</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">200</p>
              <p className="text-xs text-muted-foreground">Customers</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">30</p>
              <p className="text-xs text-muted-foreground">Days History</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
