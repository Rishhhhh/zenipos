import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StationKDSView } from '@/components/kds/StationKDSView';
import { ExpoStationView } from '@/components/kds/ExpoStationView';
import { Loader2 } from 'lucide-react';

export default function StationKDS() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();

  const { data: station, isLoading } = useQuery({
    queryKey: ['station', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!stationId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Station Not Found</h1>
        <button onClick={() => navigate('/kds')} className="text-primary hover:underline">
          Go to KDS
        </button>
      </div>
    );
  }

  // If it's an expo station, show the expo view
  if (station.type === 'expo' || station.name.toLowerCase().includes('expo')) {
    return <ExpoStationView />;
  }

  // Otherwise show station-specific view
  return <StationKDSView stationId={station.id} stationName={station.name} />;
}
