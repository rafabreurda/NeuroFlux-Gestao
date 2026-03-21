-- ============================================================
-- SECURITY FIXES — 2026-03-21
-- 1. Remove senha_texto (plain-text password column)
-- 2. Add admin RLS policies for orcamento_itens / orcamento_materiais
-- ============================================================

-- 1. Drop plain-text password column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS senha_texto;

-- 2. Admin can view/manage all orcamento_itens (for customer support)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_itens'
      AND policyname = 'Admin manages all orcamento_itens'
  ) THEN
    CREATE POLICY "Admin manages all orcamento_itens"
      ON public.orcamento_itens
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- 3. Admin can view/manage all orcamento_materiais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_materiais'
      AND policyname = 'Admin manages all orcamento_materiais'
  ) THEN
    CREATE POLICY "Admin manages all orcamento_materiais"
      ON public.orcamento_materiais
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
