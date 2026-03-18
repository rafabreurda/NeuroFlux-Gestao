
-- Plans/subscriptions per user
CREATE TABLE public.planos_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_plano text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all planos" ON public.planos_usuarios
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own plano" ON public.planos_usuarios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Contracts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', false);

-- Storage policies for contratos
CREATE POLICY "Admins can manage all contracts" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'contratos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'contratos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own contracts" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'contratos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Contracts metadata table
CREATE TABLE public.contratos_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all contratos" ON public.contratos_usuarios
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own contratos" ON public.contratos_usuarios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
