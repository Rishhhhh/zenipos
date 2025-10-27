import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlassModal } from '@/components/modals/GlassModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Gift, Loader2, CheckCircle } from 'lucide-react';

interface CustomerLoyaltyPanelProps {
  sessionId: string;
  total: number;
  onCustomerLinked?: (customerId: string) => void;
}

export function CustomerLoyaltyPanel({ sessionId, total, onCustomerLinked }: CustomerLoyaltyPanelProps) {
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  const pointsToEarn = Math.floor(total * 10); // RM 1 = 10 points

  const handleLinkCustomer = async () => {
    if (!phone || phone.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone',
        description: 'Please enter a valid Malaysian phone number',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format phone to +60 format
      const formattedPhone = phone.startsWith('+60') ? phone : `+60${phone.replace(/^0/, '')}`;

      // Check if customer exists
      let { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingCustomer) {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            phone: formattedPhone,
            name: name || 'Guest',
            last_visit: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        existingCustomer = newCustomer;

        toast({
          title: 'Welcome!',
          description: 'Your loyalty account has been created',
        });
      } else {
        toast({
          title: 'Welcome Back!',
          description: `You have ${existingCustomer.loyalty_points} points`,
        });
      }

      setCustomer(existingCustomer);
      setShowLoginModal(false);
      onCustomerLinked?.(existingCustomer.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Link Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!customer ? (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Earn Loyalty Points</h3>
              <p className="text-sm text-muted-foreground">Link your account to earn rewards</p>
            </div>
            <Gift className="h-10 w-10 text-primary" />
          </div>
          
          <div className="bg-card p-4 rounded-lg mb-4">
            <p className="text-center text-sm text-muted-foreground mb-2">This order will earn</p>
            <p className="text-center text-3xl font-bold text-primary">{pointsToEarn} points</p>
            <p className="text-center text-xs text-muted-foreground mt-1">Worth RM {(pointsToEarn / 100).toFixed(2)}</p>
          </div>

          <Button onClick={() => setShowLoginModal(true)} className="w-full" size="lg">
            <QrCode className="h-4 w-4 mr-2" />
            Link Loyalty Account
          </Button>
        </Card>
      ) : (
        <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h3 className="font-bold text-lg">Linked: {customer.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current Points</p>
              <p className="text-2xl font-bold text-primary">{customer.loyalty_points}</p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Will Earn</p>
              <p className="text-2xl font-bold text-success">+{pointsToEarn}</p>
            </div>
          </div>

          {customer.loyalty_points < 1000 && (
            <div className="bg-warning/10 p-3 rounded text-center">
              <p className="text-sm text-warning">
                {1000 - customer.loyalty_points} more points to redeem
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Login Modal */}
      <GlassModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        title="Link Loyalty Account"
        size="md"
        variant="default"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number (Malaysia)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0123456789 or +60123456789"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your phone number is used to track loyalty points
            </p>
          </div>

          <div>
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <Button onClick={handleLinkCustomer} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Link Account
          </Button>
        </div>
      </GlassModal>
    </>
  );
}
