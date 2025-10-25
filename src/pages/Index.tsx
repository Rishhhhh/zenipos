import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Monitor, Tv, ChefHat, Settings } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 mt-12">
          <h1 className="text-6xl font-bold tracking-tight mb-4 text-foreground">
            Restaurant POS System
          </h1>
          <p className="text-xl text-muted-foreground">
            Fast, minimal, and built for speed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link to="/pos">
            <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
              <Monitor className="h-16 w-16 text-primary mb-4 mx-auto" />
              <h2 className="text-2xl font-semibold mb-2 text-center text-foreground">
                POS Terminal
              </h2>
              <p className="text-muted-foreground text-center">
                Take orders and manage cart
              </p>
            </Card>
          </Link>

          <Link to="/customer/demo">
            <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
              <Tv className="h-16 w-16 text-primary mb-4 mx-auto" />
              <h2 className="text-2xl font-semibold mb-2 text-center text-foreground">
                Customer Screen
              </h2>
              <p className="text-muted-foreground text-center">
                Mirrored display with payment
              </p>
            </Card>
          </Link>

          <Link to="/kds">
            <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
              <ChefHat className="h-16 w-16 text-primary mb-4 mx-auto" />
              <h2 className="text-2xl font-semibold mb-2 text-center text-foreground">
                Kitchen Display
              </h2>
              <p className="text-muted-foreground text-center">
                Real-time order queue
              </p>
            </Card>
          </Link>

          <Link to="/admin">
            <Card className="p-8 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
              <Settings className="h-16 w-16 text-primary mb-4 mx-auto" />
              <h2 className="text-2xl font-semibold mb-2 text-center text-foreground">
                Admin Dashboard
              </h2>
              <p className="text-muted-foreground text-center">
                Manage your restaurant
              </p>
            </Card>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Phase 1a: Foundation & Core Infrastructure
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <div className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
              Real-time Sync
            </div>
            <div className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
              Offline-Ready
            </div>
            <div className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
              &lt;200ms Target
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
