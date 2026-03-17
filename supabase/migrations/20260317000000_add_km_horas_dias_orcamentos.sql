-- Adiciona campos de deslocamento, tempo e desconto na tabela orcamentos
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS horas numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto numeric(10,2) DEFAULT 0;
