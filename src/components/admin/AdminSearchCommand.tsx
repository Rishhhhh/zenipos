import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ALL_MODULES } from "@/lib/admin/moduleRegistry";

interface AdminSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearchCommand({ open, onOpenChange }: AdminSearchCommandProps) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search admin modules..." />
      <CommandList>
        <CommandEmpty>No modules found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect('/admin/menu')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/pos')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/admin/inventory')}>
            <Plus className="mr-2 h-4 w-4" />
            Adjust Stock
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Modules">
          {ALL_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <CommandItem
                key={module.id}
                onSelect={() => handleSelect(module.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {module.name}
                {'shortcut' in module && module.shortcut && (
                  <CommandShortcut>{module.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
