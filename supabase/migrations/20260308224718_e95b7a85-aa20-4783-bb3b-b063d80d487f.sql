
ALTER TABLE public.orcamento_itens 
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'un.',
  ADD COLUMN IF NOT EXISTS custo_unitario numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margem_lucro numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orcamento_materiais
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'un.',
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS custo_unitario numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margem_lucro numeric NOT NULL DEFAULT 0;
