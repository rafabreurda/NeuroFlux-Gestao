
-- Clientes table
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  cpf_cnpj text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ordens de Servico table
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL,
  descricao text NOT NULL,
  data text NOT NULL,
  codigo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  foto_antes text,
  foto_depois text,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ordens" ON public.ordens_servico
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ordens" ON public.ordens_servico
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orcamentos table
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL,
  mao_de_obra numeric NOT NULL DEFAULT 0,
  validade text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  assinatura text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orcamento Itens table
CREATE TABLE public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orcamento_itens via orcamento" ON public.orcamento_itens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()));

-- Orcamento Materiais table
CREATE TABLE public.orcamento_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.orcamento_materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orcamento_materiais via orcamento" ON public.orcamento_materiais
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()));

-- Recibos table
CREATE TABLE public.recibos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero serial,
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  forma_pagamento text NOT NULL DEFAULT 'Dinheiro',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recibos" ON public.recibos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all recibos" ON public.recibos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Custos table
CREATE TABLE public.custos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custos" ON public.custos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all custos" ON public.custos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Empresa Config table
CREATE TABLE public.empresa_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  logo text,
  assinatura text
);

ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own empresa_config" ON public.empresa_config
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all empresa_config" ON public.empresa_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
