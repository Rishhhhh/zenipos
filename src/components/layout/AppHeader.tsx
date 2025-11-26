import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, LogIn, Clock, Shield } from 'lucide-react';
import { AISearchBar } from '@/components/ai/AISearchBar';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useModalManager } from '@/hooks/useModalManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ZeniPOSLogo } from './ZeniPOSLogo';
import { QueueStatusBadge } from '@/components/offline/QueueStatusBadge';
import { BranchSelector } from '@/components/branch/BranchSelector';
import { useBranch } from '@/contexts/BranchContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export function AppHeader({ currentShiftId, shiftElapsed, onClockIn, onClockOut }: {
  currentShiftId?: string | null;
  shiftElapsed?: string;
  onClockIn?: () => void;
  onClockOut?: () => void;
}) {
  const [showAI, setShowAI] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | undefined>(undefined);
  const { employee, role, logout, isSuperAdmin } = useAuth();
  const { selectedBranchId, selectBranch, hasMultipleBranches, branches, isLoading: branchesLoading } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useModalManager();
  const isPOSPage = location.pathname === '/pos';
  const { device, isMobile } = useDeviceDetection();

  const handleCommand = (command: string) => {
    setPendingCommand(command);
    setShowAI(true);
  };

  const handleOpenChat = () => {
    setPendingCommand(undefined);
    setShowAI(true);
  };

  // Mobile Header: Compact with dropdown menu
  if (isMobile) {
    return (
      <>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container flex h-14 items-center justify-between px-3">
            <Link to="/" className="flex items-center gap-2">
              <ZeniPOSLogo variant="icon" theme="color" className="h-8 w-8" />
              <div className="flex flex-col">
                <h1 className="text-sm font-bold leading-none">
                  <span className="text-foreground">ZENI</span>
                  <span className="text-primary">POS</span>
                </h1>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <QueueStatusBadge />

              {employee ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {hasMultipleBranches && !branchesLoading && (
                      <>
                        <div className="px-2 py-2">
                          <BranchSelector 
                            value={selectedBranchId} 
                            onChange={selectBranch}
                            showAll={true}
                            branches={branches}
                            isLoading={branchesLoading}
                          />
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem onClick={handleOpenChat}>
                      <span className="mr-2">🤖</span>
                      AI Assistant
                    </DropdownMenuItem>

                    {isSuperAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/super-admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Super Admin
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </header>

        <Sheet open={showAI} onOpenChange={setShowAI}>
          <SheetContent side="bottom" className="h-[85vh]">
            <AIAssistantPanel initialCommand={pendingCommand} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Portrait Tablet: Compact header with AI button
  if (device === 'portrait-tablet') {
    return (
      <>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container flex h-14 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <ZeniPOSLogo variant="icon" theme="color" className="h-9 w-9" />
              <div className="flex flex-col">
                <h1 className="text-base font-bold leading-none">
                  <span className="text-foreground">ZENI</span>
                  <span className="text-primary">POS</span>
                </h1>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenChat}
              className="h-9 w-9 rounded-full p-0"
            >
              🤖
            </Button>

            <div className="flex items-center gap-2">
              {hasMultipleBranches && !branchesLoading && (
                <BranchSelector 
                  value={selectedBranchId} 
                  onChange={selectBranch}
                  showAll={true}
                  branches={branches}
                  isLoading={branchesLoading}
                />
              )}

              <QueueStatusBadge />

              {employee ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {isSuperAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/super-admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Super Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </header>

        <Sheet open={showAI} onOpenChange={setShowAI}>
          <SheetContent side="right" className="w-[400px]">
            <AIAssistantPanel initialCommand={pendingCommand} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop & Landscape Tablet: Full header
  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <ZeniPOSLogo variant="icon" theme="color" className="h-10 w-10" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">
                <span className="text-foreground">ZENI</span>
                <span className="text-primary">POS</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-wider">ZERO ERROR</p>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl mx-8">
            <AISearchBar 
              onCommand={handleCommand}
              onOpenChat={handleOpenChat}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Button */}
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin')}
                className="hidden sm:flex"
              >
                <Shield className="h-4 w-4 mr-2" />
                Super Admin
              </Button>
            )}
            
            {/* Branch Selector - only if multiple branches */}
            {hasMultipleBranches && !branchesLoading && (
              <div className="hidden sm:block">
                <BranchSelector 
                  value={selectedBranchId} 
                  onChange={selectBranch}
                  showAll={true}
                  branches={branches}
                  isLoading={branchesLoading}
                />
              </div>
            )}

            {/* Offline sync status */}
            <QueueStatusBadge />

            {/* Clock In/Out - Available on all pages */}
            {employee && currentShiftId !== undefined && (
              <>
                {currentShiftId && shiftElapsed && (
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {shiftElapsed}
                  </Badge>
                )}
                {!currentShiftId ? (
                  <Button onClick={onClockIn} size="sm" variant="outline">
                    <LogIn className="h-4 w-4 mr-2" />
                    Clock In
                  </Button>
                ) : (
                  <Button onClick={onClockOut} size="sm" variant="outline">
                    <LogOut className="h-4 w-4 mr-2" />
                    Clock Out
                  </Button>
                )}
              </>
            )}

            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{employee.name}</span>
                    <Badge variant="outline" className="ml-1 capitalize">
                      {role}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-danger cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <Sheet open={showAI} onOpenChange={setShowAI}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 z-[10003]">
          <AIAssistantPanel 
            initialCommand={pendingCommand}
            onCommandProcessed={() => setPendingCommand(undefined)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
