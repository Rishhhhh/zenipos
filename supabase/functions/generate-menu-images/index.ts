import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { menuItems, useLovableAIFallback = false } = await req.json();
    
    const results = {
      success: [] as string[],
      unsplashFailed: [] as string[],
      failed: [] as string[],
    };

    for (const item of menuItems as MenuItem[]) {
      try {
        console.log(`Processing: ${item.name}`);
        
        // Try Unsplash first (FREE)
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(item.name + ' food dish')}&per_page=1&orientation=landscape`;
        const unsplashResponse = await fetch(unsplashUrl, {
          headers: {
            'Authorization': 'Client-ID 5K8Mu2Tj7rg36PVYp75vxLkwKLpYeeF0rFKqT8NVaKY'
          }
        });

        const unsplashData = await unsplashResponse.json();
        
        if (unsplashData.results && unsplashData.results.length > 0) {
          const photo = unsplashData.results[0];
          const imageUrl = photo.urls.regular;
          
          // Download image
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          
          // Upload to Supabase storage
          const fileName = `${item.id}-${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('menu-images')
            .upload(fileName, imageBlob, {
              contentType: 'image/jpeg',
              cacheControl: '31536000',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('menu-images')
            .getPublicUrl(fileName);

          // Update menu item
          const { error: updateError } = await supabase
            .from('menu_items')
            .update({ image_url: urlData.publicUrl })
            .eq('id', item.id);

          if (updateError) throw updateError;

          results.success.push(item.name);
          console.log(`✅ ${item.name} - Unsplash success`);
        } else {
          // Unsplash failed, try Lovable AI if enabled
          if (useLovableAIFallback) {
            console.log(`🔄 ${item.name} - Trying Lovable AI fallback`);
            const aiResult = await generateWithLovableAI(item, supabase);
            if (aiResult) {
              results.success.push(item.name);
              console.log(`✅ ${item.name} - Lovable AI success`);
            } else {
              results.failed.push(item.name);
              console.log(`❌ ${item.name} - Both methods failed`);
            }
          } else {
            results.unsplashFailed.push(item.name);
            console.log(`⚠️ ${item.name} - No Unsplash match`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error);
        results.failed.push(item.name);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bulk generation error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWithLovableAI(item: MenuItem, supabase: any) {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return false;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: `Generate a professional, appetizing food photography image of ${item.name}. The image should be high quality, well-lit, and suitable for a restaurant menu. Ultra high resolution, 16:9 aspect ratio, top-down or side view.`
        }],
        modalities: ['image', 'text']
      })
    });

    const data = await response.json();
    const base64Image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64Image) return false;

    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: 'image/png' });

    // Upload to Supabase storage
    const fileName = `${item.id}-ai-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) return false;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    // Update menu item
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ image_url: urlData.publicUrl })
      .eq('id', item.id);

    return !updateError;
  } catch (error) {
    console.error('Lovable AI generation error:', error);
    return false;
  }
}
