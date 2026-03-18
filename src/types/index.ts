export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  criadoEm: string;
}

export interface OSMaterial {
  nome: string;
  quantidade: number;
  unidade: string;
  valor: number;
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
  materiais: OSMaterial[];
  duracaoHoras: number;
  dataAgendamento: string | null;
  criadoEm: string;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: OrcamentoItem[];
  materiais: OrcamentoMaterial[];
  maoDeObra: number;
  horas: number;
  dias: number;
  km: number;
  desconto: number;
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
  unidade: string;
  custoUnitario: number;
  margemLucro: number;
}

export interface OrcamentoMaterial {
  nome: string;
  valor: number;
  unidade: string;
  quantidade: number;
  custoUnitario: number;
  margemLucro: number;
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
  assinatura: string | null;
  valorHora: number;
  valorDia: number;
  valorKm: number;
}

export interface ServicoCatalogo {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  criadoEm: string;
}
