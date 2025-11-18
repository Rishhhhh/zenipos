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

    const { menuItems } = await req.json();
    
    // Create a TransformStream for streaming responses
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process items in background
    (async () => {
      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i] as MenuItem;
        try {
          console.log(`Processing ${i + 1}/${menuItems.length}: ${item.name}`);
          
          // Send progress update
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            current: i + 1,
            total: menuItems.length,
            itemName: item.name,
            status: 'generating'
          })}\n\n`));

          // Generate with Lovable AI
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (!LOVABLE_API_KEY) {
            throw new Error('LOVABLE_API_KEY not configured');
          }

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
          
          if (!base64Image) {
            throw new Error('No image generated');
          }

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
          
          // Send success update
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            current: i + 1,
            total: menuItems.length,
            itemName: item.name,
            status: 'success'
          })}\n\n`));

          console.log(`✅ ${item.name} - AI generation success`);
        } catch (error) {
          console.error(`Error processing ${item.name}:`, error);
          results.failed.push(item.name);
          
          // Send error update
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            current: i + 1,
            total: menuItems.length,
            itemName: item.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`));
        }
      }

      // Send final results
      await writer.write(encoder.encode(`data: ${JSON.stringify({
        type: 'complete',
        results
      })}\n\n`));

      await writer.close();
    })();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
