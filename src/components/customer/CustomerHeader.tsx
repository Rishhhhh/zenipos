import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface CustomerHeaderProps {
  organizationId?: string;
}

export function CustomerHeader({ organizationId }: CustomerHeaderProps) {
  const { data: organization } = useQuery({
    queryKey: ["organization-branding", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("name, logo_url, settings")
        .eq("id", organizationId)
        .single();

      if (error) {
        console.error("Failed to fetch organization:", error);
        return null;
      }
      return data;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b"
    >
      {organization?.logo_url ? (
        <img
          src={organization.logo_url}
          alt={organization.name || "Restaurant"}
          className="h-12 w-auto object-contain"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {organization?.name?.charAt(0) || "Z"}
          </span>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {organization?.name || "ZeniPOS"}
        </h1>
        <p className="text-sm text-muted-foreground">Welcome</p>
      </div>
    </motion.header>
  );
}
