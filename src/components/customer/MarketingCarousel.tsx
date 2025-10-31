import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function MarketingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: marketingContent, isLoading } = useQuery({
    queryKey: ['marketing-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (!marketingContent || marketingContent.length === 0) return;

    const currentContent = marketingContent[currentIndex];
    const duration = (currentContent?.duration_seconds || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % marketingContent.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, marketingContent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!marketingContent || marketingContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Welcome to Our Restaurant
          </h1>
          <p className="text-3xl text-muted-foreground">
            Quality Food, Great Service
          </p>
        </motion.div>
      </div>
    );
  }

  const currentContent = marketingContent[currentIndex];

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          {currentContent.media_type === 'image' ? (
            <>
              <img
                src={currentContent.media_url}
                alt={currentContent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-16 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-6xl font-bold text-foreground mb-4"
                >
                  {currentContent.title}
                </motion.h2>
                {currentContent.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-3xl text-muted-foreground"
                  >
                    {currentContent.description}
                  </motion.p>
                )}
              </div>
            </>
          ) : (
            <video
              src={currentContent.media_url}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {marketingContent.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-12 bg-primary'
                : 'w-2 bg-primary/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
