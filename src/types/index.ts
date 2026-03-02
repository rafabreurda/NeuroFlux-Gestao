export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  endereco: string;
  criadoEm: string;
}

export interface OrdemServico {
  id: string;
  clienteId: string;
  clienteNome: string;
  descricao: string;
  data: string;
  codigo: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  fotoAntes: string | null;
  fotoDepois: string | null;
  valor: number;
  criadoEm: string;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: OrcamentoItem[];
  validade: string;
  observacoes: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  assinatura: string | null;
  criadoEm: string;
}

export interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface Recibo {
  id: string;
  numero: number;
  clienteId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  formaPagamento: string;
  criadoEm: string;
}

export interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

export interface EmpresaConfig {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logo: string | null;
}
