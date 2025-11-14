import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  name: string;
  price: number;
}

interface Category {
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

// Generate deterministic SKU from category and item index
function generateSKU(categoryName: string, itemIndex: number): string {
  const slug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
  return `${slug}-${String(itemIndex).padStart(3, '0')}`;
}

// Complete menu data for Restoran Al Mufah Tasik
const MENU_DATA: Category[] = [
  {
    name: 'Mufah Specials',
    sortOrder: 10,
    items: [
      { name: 'Pasumpal Tea (Teh Susu Lembu)', price: 6.50 },
      { name: 'Maggi Goreng Mufah (Special)', price: 8.20 },
    ],
  },
  {
    name: 'Set Meals',
    sortOrder: 20,
    items: [
      { name: 'Nasi + Ayam + Sayur', price: 9.50 },
      { name: 'Nasi + Kambing + Sayur', price: 12.00 },
      { name: 'Nasi + Daging + Sayur', price: 11.00 },
      { name: 'Nasi + Ikan + Sayur', price: 11.00 },
    ],
  },
  {
    name: 'Capati',
    sortOrder: 30,
    items: [
      { name: 'Capati', price: 2.30 },
      { name: 'Capati Planta', price: 4.30 },
      { name: 'Capati Cheese', price: 4.90 },
      { name: 'Capati Telur', price: 4.60 },
    ],
  },
  {
    name: 'Nasi Goreng',
    sortOrder: 40,
    items: [
      { name: 'Nasi Goreng (Biasa)', price: 6.90 },
      { name: 'Nasi Goreng Ayam', price: 11.90 },
      { name: 'Nasi Goreng Kambing', price: 14.70 },
      { name: 'Nasi Goreng Kampung Mamak', price: 8.20 },
      { name: 'Nasi Goreng Pattaya Mamak', price: 9.50 },
      { name: 'Nasi Goreng Vegetarian', price: 5.60 },
      { name: 'Nasi Goreng Cina', price: 6.90 },
    ],
  },
  {
    name: 'Maggi',
    sortOrder: 50,
    items: [
      { name: 'Maggi Goreng', price: 6.90 },
      { name: 'Maggi Goreng Ayam', price: 11.90 },
      { name: 'Maggi Kari', price: 6.50 },
      { name: 'Maggi Kari Ayam', price: 10.70 },
      { name: 'Maggi Kari Double', price: 8.50 },
      { name: 'Maggi Goreng Double', price: 10.80 },
      { name: 'Maggi Goreng Double Ayam', price: 16.00 },
      { name: 'Maggi Goreng Mufah (Special)', price: 8.20 },
    ],
  },
  {
    name: 'Mee Goreng',
    sortOrder: 60,
    items: [
      { name: 'Mee Goreng (Biasa)', price: 6.90 },
      { name: 'Mee Goreng Ayam', price: 11.90 },
      { name: 'Mee Goreng Special Ayam', price: 12.90 },
    ],
  },
  {
    name: 'Indomie',
    sortOrder: 70,
    items: [
      { name: 'Indomie (Biasa)', price: 6.20 },
      { name: 'Indomie Ayam', price: 10.90 },
      { name: 'Indomie Double', price: 7.80 },
    ],
  },
  {
    name: 'Bihun Goreng',
    sortOrder: 80,
    items: [
      { name: 'Bihun Goreng (Biasa)', price: 6.90 },
      { name: 'Bihun Goreng Ayam', price: 11.90 },
    ],
  },
  {
    name: 'Kuey Teow Goreng',
    sortOrder: 90,
    items: [
      { name: 'Kuey Teow Goreng (Biasa)', price: 6.90 },
      { name: 'Kuey Teow Goreng Ayam', price: 11.90 },
    ],
  },
  {
    name: 'Roti Canai',
    sortOrder: 100,
    items: [
      { name: 'Roti Canai (Kosong)', price: 1.50 },
      { name: 'Roti Petak', price: 1.50 },
    ],
  },
  {
    name: 'Roti Telur & Variants',
    sortOrder: 110,
    items: [
      { name: 'Roti Telur', price: 3.10 },
      { name: 'Roti Telur Bawang', price: 3.90 },
      { name: 'Roti Telur Bawang Cili Padi', price: 4.60 },
      { name: 'Roti Telur Cheese', price: 5.10 },
    ],
  },
  {
    name: 'Roti Manis & Special',
    sortOrder: 120,
    items: [
      { name: 'Roti Jantan', price: 4.70 },
      { name: 'Roti Kahwin', price: 4.50 },
      { name: 'Roti Tampal', price: 3.10 },
      { name: 'Roti Kaya', price: 3.00 },
      { name: 'Roti Bom', price: 3.00 },
      { name: 'Roti Planta', price: 3.00 },
      { name: 'Roti Bawang', price: 2.60 },
      { name: 'Roti Tisu', price: 3.50 },
      { name: 'Roti Cheese', price: 3.90 },
      { name: 'Roti Sardin', price: 5.90 },
      { name: 'Roti Sardin Ayam', price: 11.00 },
      { name: 'Roti Sardin Kambing', price: 13.60 },
      { name: 'Roti Special', price: 4.90 },
      { name: 'Roti Milo', price: 3.90 },
      { name: 'Roti Horlicks', price: 5.50 },
    ],
  },
  {
    name: 'Tosai',
    sortOrder: 130,
    items: [
      { name: 'Tosai', price: 2.50 },
      { name: 'Tosai Telur', price: 4.80 },
      { name: 'Tosai Telur Bawang', price: 5.50 },
      { name: 'Tosai Telur Bawang Cili Padi', price: 6.10 },
      { name: 'Tosai Telur Bawang Cheese', price: 7.40 },
      { name: 'Tosai Jantan', price: 6.40 },
      { name: 'Tosai Telur Planta', price: 5.50 },
      { name: 'Tosai Kaya', price: 4.50 },
      { name: 'Tosai Telur Cheese', price: 6.80 },
      { name: 'Tosai Planta', price: 4.50 },
      { name: 'Tosai Gula', price: 3.90 },
      { name: 'Tosai Sardin', price: 7.80 },
      { name: 'Tosai Pepper', price: 4.00 },
    ],
  },
  {
    name: 'Uthappam',
    sortOrder: 140,
    items: [
      { name: 'Uthappam', price: 2.50 },
    ],
  },
  {
    name: 'Roti Bakar',
    sortOrder: 150,
    items: [
      { name: 'Roti Bakar', price: 1.70 },
      { name: 'Roti Bakar Telur', price: 3.20 },
      { name: 'Roti Bakar Cheese', price: 3.60 },
      { name: 'Roti Bakar Telur Cheese', price: 5.20 },
    ],
  },
  {
    name: 'French Toast (Breakfast)',
    sortOrder: 160,
    items: [
      { name: 'French Toast', price: 3.90 },
      { name: 'French Toast Kaya', price: 4.60 },
      { name: 'French Toast Cheese', price: 5.80 },
      { name: 'French Toast Kaya Cheese', price: 6.50 },
      { name: 'French Toast Special', price: 7.40 },
    ],
  },
  {
    name: 'Telur Separuh Masak',
    sortOrder: 170,
    items: [
      { name: 'Telur ½ Masak (1 Set)', price: 3.40 },
    ],
  },
  {
    name: 'Ala Carte',
    sortOrder: 180,
    items: [
      { name: 'Nasi Putih', price: 2.60 },
      { name: 'Ayam Goreng', price: 5.20 },
      { name: 'Ayam Kari', price: 5.20 },
      { name: 'Kari Kepala Ikan (Kecil)', price: 19.00 },
      { name: 'Kari Kepala Ikan (Besar)', price: 26.00 },
      { name: 'Ikan Goreng', price: 5.20 },
      { name: 'Ikan Kari', price: 6.50 },
      { name: 'Kambing', price: 7.80 },
      { name: 'Daging', price: 6.50 },
    ],
  },
  {
    name: 'Hot Beverages — Teh',
    sortOrder: 190,
    items: [
      { name: 'Teh Tarik', price: 2.90 },
      { name: 'Teh C', price: 2.90 },
      { name: 'Teh O', price: 2.20 },
      { name: 'Teh O Limau', price: 2.90 },
      { name: 'Teh Halia', price: 3.30 },
    ],
  },
  {
    name: 'Hot Beverages — Kopi',
    sortOrder: 200,
    items: [
      { name: 'Kopi Tarik', price: 2.90 },
      { name: 'Kopi C', price: 2.90 },
      { name: 'Kopi O', price: 2.20 },
      { name: 'Kopi Halia', price: 3.30 },
      { name: 'Kopi Jantan', price: 4.50 },
    ],
  },
  {
    name: 'Minuman Panas Lain',
    sortOrder: 210,
    items: [
      { name: 'Cham', price: 3.50 },
      { name: 'Susu Lembu', price: 5.20 },
      { name: 'Nescafe', price: 3.60 },
      { name: 'Milo', price: 3.60 },
      { name: 'Neslo', price: 4.50 },
      { name: 'Horlicks', price: 5.20 },
    ],
  },
  {
    name: 'Energy / Special Drink',
    sortOrder: 220,
    items: [
      { name: 'Extra Joss (Anggur)', price: 3.60 },
      { name: 'Extra Joss (Mangga)', price: 3.60 },
      { name: 'Extra Joss (Original)', price: 3.60 },
    ],
  },
  {
    name: 'Barli & Sirap',
    sortOrder: 230,
    items: [
      { name: 'Barli', price: 2.90 },
      { name: 'Barli Susu', price: 3.50 },
      { name: 'Limau', price: 2.80 },
      { name: 'Sirap', price: 2.20 },
      { name: 'Sirap Limau', price: 2.90 },
      { name: 'Sirap Bandung', price: 2.90 },
    ],
  },
  {
    name: 'Soft Drinks (Tin/Botol/Packet)',
    sortOrder: 240,
    items: [
      { name: 'Coke Cola', price: 3.30 },
      { name: 'Pepsi', price: 3.30 },
      { name: '100 Plus', price: 3.30 },
      { name: '7 Up', price: 3.30 },
      { name: 'Sprite', price: 3.30 },
      { name: 'F&N', price: 3.30 },
      { name: 'Fanta', price: 3.30 },
      { name: 'Redbull', price: 4.50 },
      { name: 'Kickapoo', price: 3.30 },
      { name: 'Dutchlady Milks', price: 3.30 },
      { name: 'Mineral Water', price: 1.90 },
      { name: 'Drinking Water', price: 1.60 },
    ],
  },
  {
    name: 'Fresh Juices',
    sortOrder: 250,
    items: [
      { name: 'Fresh Orange Juice', price: 5.90 },
      { name: 'Green Apple Juice', price: 5.90 },
      { name: 'Green Apple Milk Juice', price: 6.80 },
      { name: 'Carrot Juice', price: 5.90 },
      { name: 'Carrot Milk Juice', price: 6.80 },
      { name: 'Lychee Juices', price: 5.90 },
      { name: 'Teh O Ais Lychee', price: 6.80 },
      { name: 'Cucumber Juices', price: 5.90 },
      { name: 'Cucumber Milk Juices', price: 6.80 },
      { name: 'Double / Mix Fruit Juices', price: 8.00 },
    ],
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { organizationEmail } = await req.json();

    if (!organizationEmail) {
      throw new Error('organizationEmail is required');
    }

    console.log(`[Seed Menu] Finding organization: ${organizationEmail}`);

    // Find organization by email
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('login_email', organizationEmail)
      .single();

    if (orgError || !org) {
      throw new Error(`Organization not found: ${organizationEmail}`);
    }

    console.log(`[Seed Menu] Found organization: ${org.name} (${org.id})`);

    // Find MAIN branch (prefer code='MAIN', else earliest created)
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, code, created_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: true });

    if (branchError || !branches || branches.length === 0) {
      throw new Error('No branches found for organization');
    }

    const mainBranch = branches.find((b) => b.code === 'MAIN') || branches[0];
    console.log(`[Seed Menu] Using branch: ${mainBranch.name} (${mainBranch.id})`);

    let categoriesCreated = 0;
    let itemsCreated = 0;
    const categorySummary: { name: string; itemCount: number }[] = [];

    // Seed categories and items
    for (const categoryData of MENU_DATA) {
      console.log(`[Seed Menu] Processing category: ${categoryData.name}`);

      // Upsert category (idempotent)
      const { data: category, error: catError } = await supabase
        .from('menu_categories')
        .upsert(
          {
            branch_id: mainBranch.id,
            name: categoryData.name,
            sort_order: categoryData.sortOrder,
          },
          {
            onConflict: 'branch_id,name',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (catError) {
        console.error(`[Seed Menu] Error creating category: ${categoryData.name}`, catError);
        throw catError;
      }

      categoriesCreated++;

      // Seed items for this category
      let categoryItemCount = 0;
      for (let i = 0; i < categoryData.items.length; i++) {
        const item = categoryData.items[i];
        const sku = generateSKU(categoryData.name, i + 1);
        const cost = item.price * 0.35; // 35% cost ratio

        const { error: itemError } = await supabase
          .from('menu_items')
          .upsert(
            {
              branch_id: mainBranch.id,
              category_id: category.id,
              name: item.name,
              sku: sku,
              price: item.price,
              cost: cost,
              in_stock: true,
              archived: false,
              tax_rate: 0,
              sst_rate: 0,
              track_inventory: false,
            },
            {
              onConflict: 'branch_id,sku',
              ignoreDuplicates: false,
            }
          );

        if (itemError) {
          console.error(`[Seed Menu] Error creating item: ${item.name}`, itemError);
          throw itemError;
        }

        itemsCreated++;
        categoryItemCount++;
      }

      categorySummary.push({
        name: categoryData.name,
        itemCount: categoryItemCount,
      });

      console.log(`[Seed Menu] Created ${categoryItemCount} items in ${categoryData.name}`);
    }

    // Verification query
    const { count: finalCategoryCount } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', mainBranch.id);

    const { count: finalItemCount } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', mainBranch.id);

    console.log(`[Seed Menu] ✅ Complete! ${categoriesCreated} categories, ${itemsCreated} items`);

    return new Response(
      JSON.stringify({
        success: true,
        organization_name: org.name,
        branch_id: mainBranch.id,
        branch_name: mainBranch.name,
        categories_created: categoriesCreated,
        items_created: itemsCreated,
        final_category_count: finalCategoryCount,
        final_item_count: finalItemCount,
        categories: categorySummary,
        cache_keys_to_invalidate: [
          ['categories', mainBranch.id],
          ['categoryItemCounts', mainBranch.id],
          ['menuItems', mainBranch.id],
        ],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Seed Menu] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
