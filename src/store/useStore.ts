import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, OrdemServico, Orcamento, Recibo, CustoFixo, EmpresaConfig, ServicoCatalogo } from '@/types';
import { toast } from 'sonner';

// Helper to get current user id
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ========== CLIENTES ==========
export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setClientes(data.map(d => ({
        id: d.id, nome: d.nome, telefone: d.telefone, email: d.email,
        cpfCnpj: d.cpf_cnpj, cep: d.cep, endereco: d.endereco,
        bairro: d.bairro, cidade: d.cidade, estado: d.estado, criadoEm: d.created_at,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCliente = useCallback(async (c: Omit<Cliente, 'id' | 'criadoEm'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('clientes').insert({
      user_id: userId, nome: c.nome, telefone: c.telefone, email: c.email,
      cpf_cnpj: c.cpfCnpj, cep: c.cep, endereco: c.endereco,
      bairro: c.bairro, cidade: c.cidade, estado: c.estado,
    }).select().single();
    if (error) { toast.error('Erro ao salvar cliente'); console.error(error); return; }
    if (data) {
      setClientes(prev => [{
        id: data.id, nome: data.nome, telefone: data.telefone, email: data.email,
        cpfCnpj: data.cpf_cnpj, cep: data.cep, endereco: data.endereco,
        bairro: data.bairro, cidade: data.cidade, estado: data.estado, criadoEm: data.created_at,
      }, ...prev]);
    }
  }, []);

  const updateCliente = useCallback(async (id: string, updates: Partial<Cliente>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.telefone !== undefined) dbUpdates.telefone = updates.telefone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.cpfCnpj !== undefined) dbUpdates.cpf_cnpj = updates.cpfCnpj;
    if (updates.cep !== undefined) dbUpdates.cep = updates.cep;
    if (updates.endereco !== undefined) dbUpdates.endereco = updates.endereco;
    if (updates.bairro !== undefined) dbUpdates.bairro = updates.bairro;
    if (updates.cidade !== undefined) dbUpdates.cidade = updates.cidade;
    if (updates.estado !== undefined) dbUpdates.estado = updates.estado;
    const { error } = await supabase.from('clientes').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar cliente'); return; }
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeCliente = useCallback(async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover cliente'); return; }
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  return { clientes, loading, addCliente, updateCliente, removeCliente, refetch: fetch };
}

// ========== ORDENS DE SERVICO ==========
export function useOrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('ordens_servico').select('*').order('created_at', { ascending: false });
    if (data) {
      setOrdens(data.map(d => ({
        id: d.id, clienteId: d.cliente_id, clienteNome: d.cliente_nome,
        descricao: d.descricao, data: d.data, codigo: d.codigo,
        status: d.status as OrdemServico['status'], fotoAntes: d.foto_antes,
        fotoDepois: d.foto_depois, valor: Number(d.valor), criadoEm: d.created_at,
      })));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addOrdem = useCallback(async (o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('ordens_servico').insert({
      user_id: userId, cliente_id: o.clienteId, cliente_nome: o.clienteNome,
      descricao: o.descricao, data: o.data, codigo: o.codigo, valor: o.valor,
    }).select().single();
    if (error) { toast.error('Erro ao criar OS'); console.error(error); return; }
    if (data) {
      setOrdens(prev => [{
        id: data.id, clienteId: data.cliente_id, clienteNome: data.cliente_nome,
        descricao: data.descricao, data: data.data, codigo: data.codigo,
        status: data.status as OrdemServico['status'], fotoAntes: data.foto_antes,
        fotoDepois: data.foto_depois, valor: Number(data.valor), criadoEm: data.created_at,
      }, ...prev]);
    }
  }, []);

  const updateOrdem = useCallback(async (id: string, updates: Partial<OrdemServico>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.fotoAntes !== undefined) dbUpdates.foto_antes = updates.fotoAntes;
    if (updates.fotoDepois !== undefined) dbUpdates.foto_depois = updates.fotoDepois;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    const { error } = await supabase.from('ordens_servico').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar OS'); return; }
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const removeOrdem = useCallback(async (id: string) => {
    const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover OS'); return; }
    setOrdens(prev => prev.filter(o => o.id !== id));
  }, []);

  return { ordens, addOrdem, updateOrdem, removeOrdem };
}

// ========== ORCAMENTOS ==========
export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('orcamentos').select('*, orcamento_itens(*), orcamento_materiais(*)').order('created_at', { ascending: false });
    if (data) {
      setOrcamentos(data.map(d => ({
        id: d.id, clienteId: d.cliente_id, clienteNome: d.cliente_nome,
        itens: (d.orcamento_itens || []).map((i: any) => ({
          descricao: i.descricao, quantidade: i.quantidade, valorUnitario: Number(i.valor_unitario),
          unidade: i.unidade || 'un.', custoUnitario: Number(i.custo_unitario || 0), margemLucro: Number(i.margem_lucro || 0),
        })),
        materiais: (d.orcamento_materiais || []).map((m: any) => ({
          nome: m.nome, valor: Number(m.valor),
          unidade: m.unidade || 'un.', quantidade: m.quantidade || 1, custoUnitario: Number(m.custo_unitario || 0), margemLucro: Number(m.margem_lucro || 0),
        })),
        maoDeObra: Number(d.mao_de_obra), horas: Number((d as any).horas || 0), dias: Number((d as any).dias || 0), km: Number((d as any).km || 0), desconto: Number((d as any).desconto || 0),
        validade: d.validade, observacoes: d.observacoes,
        status: d.status as Orcamento['status'], assinatura: d.assinatura, criadoEm: d.created_at,
      })));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addOrcamento = useCallback(async (o: Omit<Orcamento, 'id' | 'criadoEm' | 'status' | 'assinatura'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('orcamentos').insert({
      user_id: userId, cliente_id: o.clienteId, cliente_nome: o.clienteNome,
      mao_de_obra: o.maoDeObra, horas: o.horas, dias: o.dias, km: o.km, desconto: o.desconto,
      validade: o.validade, observacoes: o.observacoes,
    }).select().single();
    if (error) { toast.error('Erro ao criar orçamento'); console.error(error); return; }
    if (data) {
      // Insert itens and materiais
      if (o.itens.length > 0) {
        await supabase.from('orcamento_itens').insert(
          o.itens.map(i => ({ orcamento_id: data.id, descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valorUnitario, unidade: i.unidade, custo_unitario: i.custoUnitario, margem_lucro: i.margemLucro }))
        );
      }
      if (o.materiais.length > 0) {
        await supabase.from('orcamento_materiais').insert(
          o.materiais.filter(m => m.nome).map(m => ({ orcamento_id: data.id, nome: m.nome, valor: m.valor, unidade: m.unidade, quantidade: m.quantidade, custo_unitario: m.custoUnitario, margem_lucro: m.margemLucro }))
        );
      }
      // Refetch to get complete data
      await fetch();
    }
  }, [fetch]);

  const updateOrcamento = useCallback(async (id: string, updates: Partial<Orcamento>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.assinatura !== undefined) dbUpdates.assinatura = updates.assinatura;
    const { error } = await supabase.from('orcamentos').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar orçamento'); return; }
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  return { orcamentos, addOrcamento, updateOrcamento };
}

// ========== RECIBOS ==========
export function useRecibos() {
  const [recibos, setRecibos] = useState<Recibo[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('recibos').select('*').order('created_at', { ascending: false });
    if (data) {
      setRecibos(data.map(d => ({
        id: d.id, numero: d.numero, clienteId: d.cliente_id, clienteNome: d.cliente_nome,
        descricao: d.descricao, valor: Number(d.valor), formaPagamento: d.forma_pagamento,
        criadoEm: d.created_at,
      })));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addRecibo = useCallback(async (r: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('recibos').insert({
      user_id: userId, cliente_id: r.clienteId, cliente_nome: r.clienteNome,
      descricao: r.descricao, valor: r.valor, forma_pagamento: r.formaPagamento,
    }).select().single();
    if (error) { toast.error('Erro ao emitir recibo'); console.error(error); return; }
    if (data) {
      setRecibos(prev => [{
        id: data.id, numero: data.numero, clienteId: data.cliente_id,
        clienteNome: data.cliente_nome, descricao: data.descricao,
        valor: Number(data.valor), formaPagamento: data.forma_pagamento,
        criadoEm: data.created_at,
      }, ...prev]);
    }
  }, []);

  return { recibos, addRecibo };
}

// ========== CUSTOS ==========
export function useCustos() {
  const [custos, setCustos] = useState<CustoFixo[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('custos').select('*').order('nome');
    if (data) {
      setCustos(data.map(d => ({ id: d.id, nome: d.nome, valor: Number(d.valor) })));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCusto = useCallback(async (c: Omit<CustoFixo, 'id'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('custos').insert({
      user_id: userId, nome: c.nome, valor: c.valor,
    }).select().single();
    if (error) { toast.error('Erro ao adicionar custo'); return; }
    if (data) setCustos(prev => [...prev, { id: data.id, nome: data.nome, valor: Number(data.valor) }]);
  }, []);

  const removeCusto = useCallback(async (id: string) => {
    const { error } = await supabase.from('custos').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover custo'); return; }
    setCustos(prev => prev.filter(c => c.id !== id));
  }, []);

  return { custos, addCusto, removeCusto };
}

// ========== EMPRESA CONFIG ==========
export function useEmpresaConfig() {
  const [config, setConfig] = useState<EmpresaConfig>({
    nome: '', cnpj: '', endereco: '', telefone: '', email: '', logo: null, assinatura: null,
    valorHora: 0, valorDia: 0, valorKm: 0,
  });

  const fetch = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;
    const { data } = await supabase.from('empresa_config').select('*').eq('user_id', userId).single();
    if (data) {
      setConfig({
        nome: data.nome, cnpj: data.cnpj, endereco: data.endereco,
        telefone: data.telefone, email: data.email, logo: data.logo, assinatura: data.assinatura,
        valorHora: Number(data.valor_hora || 0), valorDia: Number(data.valor_dia || 0), valorKm: Number(data.valor_km || 0),
      });
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateConfig = useCallback(async (updates: Partial<EmpresaConfig>) => {
    const userId = await getUserId();
    if (!userId) return;
    const newConfig = { ...config, ...updates };
    const { error } = await supabase.from('empresa_config').upsert({
      user_id: userId, nome: newConfig.nome, cnpj: newConfig.cnpj,
      endereco: newConfig.endereco, telefone: newConfig.telefone,
      email: newConfig.email, logo: newConfig.logo, assinatura: newConfig.assinatura,
      valor_hora: newConfig.valorHora, valor_dia: newConfig.valorDia, valor_km: newConfig.valorKm,
    }, { onConflict: 'user_id' });
    if (error) { toast.error('Erro ao salvar configuração'); console.error(error); return; }
    setConfig(newConfig);
  }, [config]);

  return { config, updateConfig };
}

// ========== CATÁLOGO DE SERVIÇOS ==========
export function useServicosCatalogo() {
  const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('servicos_catalogo' as any).select('*').order('created_at', { ascending: false });
    if (data) {
      setServicos((data as any[]).map(d => ({
        id: d.id, nome: d.nome, descricao: d.descricao || '', valor: Number(d.valor), criadoEm: d.created_at,
      })));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addServico = useCallback(async (s: Omit<ServicoCatalogo, 'id' | 'criadoEm'>) => {
    const userId = await getUserId();
    if (!userId) return;
    const { data, error } = await supabase.from('servicos_catalogo' as any).insert({
      user_id: userId, nome: s.nome, descricao: s.descricao, valor: s.valor,
    } as any).select().single();
    if (error) { toast.error('Erro ao salvar serviço'); return; }
    if (data) {
      const d = data as any;
      setServicos(prev => [{ id: d.id, nome: d.nome, descricao: d.descricao || '', valor: Number(d.valor), criadoEm: d.created_at }, ...prev]);
    }
    toast.success('Serviço cadastrado!');
  }, []);

  const removeServico = useCallback(async (id: string) => {
    const { error } = await supabase.from('servicos_catalogo' as any).delete().eq('id', id);
    if (error) { toast.error('Erro ao remover serviço'); return; }
    setServicos(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateServico = useCallback(async (id: string, updates: Partial<ServicoCatalogo>) => {
    const payload: any = {};
    if (updates.nome !== undefined) payload.nome = updates.nome;
    if (updates.descricao !== undefined) payload.descricao = updates.descricao;
    if (updates.valor !== undefined) payload.valor = updates.valor;
    const { error } = await supabase.from('servicos_catalogo' as any).update(payload).eq('id', id);
    if (error) { toast.error('Erro ao atualizar serviço'); return; }
    setServicos(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  return { servicos, addServico, removeServico, updateServico };
}
