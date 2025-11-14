-- Phase 2.3: Consolidate Menu Categories RLS Policies
-- Remove duplicate/conflicting policies, keep only Phase 2 pattern

-- Drop old/duplicate policies
DROP POLICY IF EXISTS "Allow authenticated all menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow authenticated read menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Managers manage categories in accessible branches" ON public.menu_categories;
DROP POLICY IF EXISTS "Users view categories in accessible branches" ON public.menu_categories;

-- Keep only Phase 2 policies:
-- menu_categories_select (already exists)
-- menu_categories_write (already exists)