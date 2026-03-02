import { useState, useCallback } from 'react';
import { Cliente, OrdemServico, Orcamento, Recibo, CustoFixo, EmpresaConfig } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 10);

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>(() => loadFromStorage('clientes', []));

  const addCliente = useCallback((c: Omit<Cliente, 'id' | 'criadoEm'>) => {
    setClientes(prev => {
      const next = [...prev, { ...c, id: generateId(), criadoEm: new Date().toISOString() }];
      saveToStorage('clientes', next);
      return next;
    });
  }, []);

  const removeCliente = useCallback((id: string) => {
    setClientes(prev => {
      const next = prev.filter(c => c.id !== id);
      saveToStorage('clientes', next);
      return next;
    });
  }, []);

  return { clientes, addCliente, removeCliente };
}

export function useOrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>(() => loadFromStorage('ordens', []));

  const addOrdem = useCallback((o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => {
    setOrdens(prev => {
      const next = [...prev, { ...o, id: generateId(), criadoEm: new Date().toISOString(), fotoAntes: null, fotoDepois: null, status: 'pendente' as const }];
      saveToStorage('ordens', next);
      return next;
    });
  }, []);

  const updateOrdem = useCallback((id: string, updates: Partial<OrdemServico>) => {
    setOrdens(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      saveToStorage('ordens', next);
      return next;
    });
  }, []);

  const removeOrdem = useCallback((id: string) => {
    setOrdens(prev => {
      const next = prev.filter(o => o.id !== id);
      saveToStorage('ordens', next);
      return next;
    });
  }, []);

  return { ordens, addOrdem, updateOrdem, removeOrdem };
}

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(() => loadFromStorage('orcamentos', []));

  const addOrcamento = useCallback((o: Omit<Orcamento, 'id' | 'criadoEm' | 'status' | 'assinatura'>) => {
    setOrcamentos(prev => {
      const next = [...prev, { ...o, id: generateId(), criadoEm: new Date().toISOString(), status: 'pendente' as const, assinatura: null }];
      saveToStorage('orcamentos', next);
      return next;
    });
  }, []);

  const updateOrcamento = useCallback((id: string, updates: Partial<Orcamento>) => {
    setOrcamentos(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      saveToStorage('orcamentos', next);
      return next;
    });
  }, []);

  return { orcamentos, addOrcamento, updateOrcamento };
}

export function useRecibos() {
  const [recibos, setRecibos] = useState<Recibo[]>(() => loadFromStorage('recibos', []));

  const addRecibo = useCallback((r: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>) => {
    setRecibos(prev => {
      const numero = prev.length > 0 ? Math.max(...prev.map(x => x.numero)) + 1 : 1;
      const next = [...prev, { ...r, id: generateId(), numero, criadoEm: new Date().toISOString() }];
      saveToStorage('recibos', next);
      return next;
    });
  }, []);

  return { recibos, addRecibo };
}

export function useCustos() {
  const [custos, setCustos] = useState<CustoFixo[]>(() => loadFromStorage('custos', []));

  const addCusto = useCallback((c: Omit<CustoFixo, 'id'>) => {
    setCustos(prev => {
      const next = [...prev, { ...c, id: generateId() }];
      saveToStorage('custos', next);
      return next;
    });
  }, []);

  const removeCusto = useCallback((id: string) => {
    setCustos(prev => {
      const next = prev.filter(c => c.id !== id);
      saveToStorage('custos', next);
      return next;
    });
  }, []);

  return { custos, addCusto, removeCusto };
}

export function useEmpresaConfig() {
  const [config, setConfig] = useState<EmpresaConfig>(() =>
    loadFromStorage('empresaConfig', {
      nome: '', cnpj: '', endereco: '', telefone: '', email: '', logo: null,
    })
  );

  const updateConfig = useCallback((updates: Partial<EmpresaConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      saveToStorage('empresaConfig', next);
      return next;
    });
  }, []);

  return { config, updateConfig };
}
