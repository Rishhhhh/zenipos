import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Check } from "lucide-react";
import { WIDGET_CATALOG, WidgetDefinition } from "@/lib/widgets/widgetCatalog";
import { cn } from "@/lib/utils";

interface WidgetLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "cashier" | "manager" | "admin";
  activeWidgets: string[];
  onAddWidget: (widgetId: string, defaultSize: { cols: number; rows: number }) => void;
}

export function WidgetLibrary({
  open,
  onOpenChange,
  userRole,
  activeWidgets,
  onAddWidget,
}: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter widgets by role and search
  const filteredWidgets = useMemo(() => {
    const allWidgets = Object.entries(WIDGET_CATALOG).flatMap(([category, widgets]) =>
      widgets.map(w => ({ ...w, category }))
    );

    return allWidgets.filter(widget => {
      const matchesRole = widget.roles.includes(userRole);
      const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || widget.category === selectedCategory;
      
      return matchesRole && matchesSearch && matchesCategory;
    });
  }, [userRole, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    return ["all", ...Object.keys(WIDGET_CATALOG)];
  }, []);

  const handleAddWidget = (widget: WidgetDefinition) => {
    if (!activeWidgets.includes(widget.id)) {
      onAddWidget(widget.id, widget.defaultSize);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Widget Library</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map(widget => {
                const Icon = widget.icon;
                const isAdded = activeWidgets.includes(widget.id);

                return (
                  <div
                    key={widget.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all",
                      "hover:shadow-lg hover:scale-105",
                      isAdded 
                        ? "bg-primary/10 border-primary" 
                        : "bg-accent/30 border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {isAdded && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success">
                          <Check className="h-3 w-3 mr-1" />
                          Added
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold mb-1">{widget.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {widget.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {widget.defaultSize.cols} × {widget.defaultSize.rows}
                      </span>
                      <Button
                        size="sm"
                        variant={isAdded ? "outline" : "default"}
                        disabled={isAdded}
                        onClick={() => handleAddWidget(widget)}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredWidgets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No widgets found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
