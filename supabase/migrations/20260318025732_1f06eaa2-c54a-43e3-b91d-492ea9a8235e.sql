
ALTER TABLE public.ordens_servico 
  ADD COLUMN IF NOT EXISTS materiais_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duracao_horas numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_agendamento timestamptz DEFAULT NULL;
