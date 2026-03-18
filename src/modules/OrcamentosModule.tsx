import { useState } from 'react';
import { Orcamento, OrcamentoItem, OrcamentoMaterial, Cliente, ServicoCatalogo } from '@/types';
import ClienteAutocomplete from '@/components/ClienteAutocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, FileText, Download, Minus, Navigation, Map, Package } from 'lucide-react';
import { toast } from 'sonner';

const UNIDADES = [
  { value: 'un.', label: 'un.', desc: 'unidades' },
  { value: 'm²', label: 'm²', desc: 'metros quadrados' },
  { value: 'km²', label: 'km²', desc: 'quilômetros quadrados' },
  { value: 'ha', label: 'ha', desc: 'hectares' },
  { value: 'mm', label: 'mm', desc: 'milímetros' },
  { value: 'cm', label: 'cm', desc: 'centímetros' },
  { value: 'm', label: 'm', desc: 'metros (linear)' },
  { value: 'km', label: 'km', desc: 'quilômetros' },
  { value: 'mL', label: 'mL', desc: 'mililitros' },
  { value: 'L', label: 'L', desc: 'litros' },
  { value: 'm³', label: 'm³', desc: 'metros cúbicos' },
  { value: 'kg', label: 'kg', desc: 'quilogramas' },
  { value: 'g', label: 'g', desc: 'gramas' },
  { value: 'pç', label: 'pç', desc: 'peças' },
  { value: 'cx', label: 'cx', desc: 'caixas' },
  { value: 'rolo', label: 'rolo', desc: 'rolos' },
];

function calcPrecoVenda(custo: number, margem: number): number {
  return custo * (1 + margem / 100);
}

interface Props {
  orcamentos: Orcamento[];
  clientes: Cliente[];
  addOrcamento: (o: Omit<Orcamento, 'id' | 'criadoEm' | 'status' | 'assinatura'>) => void;
  updateOrcamento: (id: string, updates: Partial<Orcamento>) => void;
  empresaLogo: string | null;
  empresaNome: string;
  empresaAssinatura: string | null;
  empresaEndereco: string;
  valorHora: number;
  valorDia: number;
  valorKm: number;
  catalogoServicos: ServicoCatalogo[];
}

const emptyItem = (): OrcamentoItem => ({ descricao: '', quantidade: 1, valorUnitario: 0, unidade: 'un.', custoUnitario: 0, margemLucro: 0 });
const emptyMaterial = (): OrcamentoMaterial => ({ nome: '', valor: 0, unidade: 'un.', quantidade: 1, custoUnitario: 0, margemLucro: 0 });

export default function OrcamentosModule({ orcamentos, clientes, addOrcamento, updateOrcamento, empresaLogo, empresaNome, empresaAssinatura, empresaEndereco, valorHora, valorDia, valorKm, catalogoServicos }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([emptyItem()]);
  const [materiais, setMateriais] = useState<OrcamentoMaterial[]>([emptyMaterial()]);
  const [maoDeObra, setMaoDeObra] = useState('');
  const [horas, setHoras] = useState('');
  const [dias, setDias] = useState('');
  const [km, setKm] = useState('');
  const [desconto, setDesconto] = useState('');
  const [showUnidadeDialog, setShowUnidadeDialog] = useState<{ type: 'item' | 'material'; index: number } | null>(null);

  const addItem = () => setItens(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, updates: Partial<OrcamentoItem>) => {
    setItens(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, ...updates };
      if (updates.custoUnitario !== undefined || updates.margemLucro !== undefined) {
        updated.valorUnitario = calcPrecoVenda(updated.custoUnitario, updated.margemLucro);
      }
      return updated;
    }));
  };

  const addMaterial = () => setMateriais(prev => [...prev, emptyMaterial()]);
  const removeMaterial = (i: number) => setMateriais(prev => prev.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, updates: Partial<OrcamentoMaterial>) => {
    setMateriais(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const updated = { ...m, ...updates };
      if (updates.custoUnitario !== undefined || updates.margemLucro !== undefined) {
        const precoVenda = calcPrecoVenda(updated.custoUnitario, updated.margemLucro);
        updated.valor = precoVenda * updated.quantidade;
      }
      if (updates.quantidade !== undefined) {
        const precoVenda = calcPrecoVenda(updated.custoUnitario, updated.margemLucro);
        updated.valor = precoVenda * updated.quantidade;
      }
      return updated;
    }));
  };

  const totalItens = itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
  const totalMateriais = materiais.reduce((sum, m) => sum + m.valor, 0);
  const maoDeObraVal = parseFloat(maoDeObra) || 0;
  const horasVal = parseFloat(horas) || 0;
  const diasVal = parseFloat(dias) || 0;
  const kmVal = parseFloat(km) || 0;
  const totalHoras = horasVal * valorHora;
  const totalDias = diasVal * valorDia;
  const totalKm = kmVal * valorKm;
  const descontoVal = parseFloat(desconto) || 0;
  const totalDeslocamento = totalHoras + totalDias + totalKm;
  const totalGeral = totalItens + totalMateriais + maoDeObraVal + totalDeslocamento - descontoVal;
  const custoItens = itens.reduce((sum, item) => sum + item.quantidade * item.custoUnitario, 0);
  const custoMateriais = materiais.reduce((sum, m) => sum + m.quantidade * m.custoUnitario, 0);
  const lucroEstimado = totalGeral - custoItens - custoMateriais - maoDeObraVal;

  const resetForm = () => {
    setClienteNome(''); setClienteId(''); setValidade(''); setObservacoes('');
    setMaoDeObra(''); setHoras(''); setDias(''); setKm(''); setDesconto('');
    setItens([emptyItem()]); setMateriais([emptyMaterial()]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome) { toast.error('Preencha o cliente'); return; }
    if (itens.some(i => !i.descricao)) { toast.error('Preencha todos os itens'); return; }
    addOrcamento({
      clienteId, clienteNome, itens, materiais: materiais.filter(m => m.nome),
      maoDeObra: maoDeObraVal + totalDeslocamento, horas: horasVal, dias: diasVal, km: kmVal,
      desconto: descontoVal, validade, observacoes,
    });
    resetForm();
    setShowForm(false);
    toast.success('Orçamento criado!');
  };

  const gerarPDF = (orc: Orcamento) => {
    const orcTotalItens = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
    const orcTotalMat = (orc.materiais || []).reduce((s, m) => s + m.valor, 0);
    const orcDesconto = orc.desconto || 0;
    const orcTotal = orcTotalItens + orcTotalMat + (orc.maoDeObra || 0) - orcDesconto;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Orçamento</title><style>
        body{font-family:system-ui;margin:40px;color:#222;font-size:14px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f5f5f5;font-size:13px}
        .logo{max-height:60px}
        .total{font-size:18px;font-weight:bold;text-align:right;margin:8px 0}
        .section{margin-top:20px;font-weight:bold;font-size:15px;border-bottom:2px solid #222;padding-bottom:4px}
        .signatures{display:flex;justify-content:space-between;margin-top:60px;gap:40px}
        .sig-box{flex:1;text-align:center}
        .sig-line{border-top:1px solid #222;padding-top:6px;margin-top:40px;font-size:13px}
        .sig-img{max-height:50px;margin:0 auto}
        .header{display:flex;align-items:center;gap:16px;margin-bottom:20px}
      </style></head><body>
      <div class="header">
        ${empresaLogo ? `<img src="${empresaLogo}" class="logo"/>` : ''}
        <div>
          <h2 style="margin:0">${empresaNome || 'Empresa'}</h2>
          <p style="margin:2px 0;color:#666">ORÇAMENTO DE SERVIÇO</p>
        </div>
      </div>
      <p><strong>Cliente:</strong> ${orc.clienteNome}</p>
      <p><strong>Data:</strong> ${new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p>
      ${orc.validade ? `<p><strong>Validade:</strong> ${orc.validade}</p>` : ''}
      <p class="section">Descrição dos Serviços</p>
      <table>
        <tr><th>Serviço</th><th>Unid.</th><th>Qtd</th><th>Valor Unit.</th><th>Subtotal</th></tr>
        ${orc.itens.map(i => `<tr><td>${i.descricao}</td><td>${i.unidade || 'un.'}</td><td>${i.quantidade}</td><td>R$ ${i.valorUnitario.toFixed(2)}</td><td>R$ ${(i.quantidade * i.valorUnitario).toFixed(2)}</td></tr>`).join('')}
      </table>
      <p style="text-align:right"><strong>Subtotal Serviços: R$ ${orcTotalItens.toFixed(2)}</strong></p>
      ${(orc.materiais && orc.materiais.length > 0) ? `
        <p class="section">Materiais</p>
        <table>
          <tr><th>Material</th><th>Unid.</th><th>Qtd</th><th>Valor</th></tr>
          ${orc.materiais.map(m => `<tr><td>${m.nome}</td><td>${m.unidade || 'un.'}</td><td>${m.quantidade || 1}</td><td>R$ ${m.valor.toFixed(2)}</td></tr>`).join('')}
        </table>
        <p style="text-align:right"><strong>Subtotal Materiais: R$ ${orcTotalMat.toFixed(2)}</strong></p>
      ` : ''}
      ${(orc.maoDeObra || 0) > 0 ? `
        <p class="section">Mão de Obra</p>
        <p style="text-align:right"><strong>R$ ${orc.maoDeObra.toFixed(2)}</strong></p>
      ` : ''}
      ${orcDesconto > 0 ? `
        <p style="text-align:right;color:#e53e3e">Desconto: - R$ ${orcDesconto.toFixed(2)}</p>
      ` : ''}
      <hr style="margin:20px 0"/>
      <p class="total">TOTAL GERAL: R$ ${orcTotal.toFixed(2)}</p>
      ${orc.observacoes ? `<p><strong>Observações:</strong> ${orc.observacoes}</p>` : ''}
      <div class="signatures">
        <div class="sig-box">
          ${empresaAssinatura ? `<img src="${empresaAssinatura}" class="sig-img"/>` : ''}
          <div class="sig-line">Assinatura do Trabalhador<br/><small>${empresaNome || ''}</small></div>
        </div>
        <div class="sig-box">
          <div class="sig-line">Assinatura do Cliente<br/><small>${orc.clienteNome}</small></div>
        </div>
      </div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>
    `);
  };

  const statusLabel = (s: string) => {
    if (s === 'aprovado') return 'Aprovado';
    if (s === 'recusado') return 'Recusado';
    return 'Pendente';
  };

  const statusColor = (s: string) => {
    if (s === 'aprovado') return 'bg-accent text-accent-foreground';
    if (s === 'recusado') return 'bg-destructive/10 text-destructive';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="space-y-3">
      {/* Orçamentos List */}
      {orcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="text-sm">Nenhum orçamento criado</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Novo Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orcamentos.map(orc => {
            const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
              + (orc.materiais || []).reduce((s, m) => s + m.valor, 0)
              + (orc.maoDeObra || 0) - (orc.desconto || 0);
            return (
              <Card key={orc.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{orc.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {orc.itens.length} serviço{orc.itens.length !== 1 ? 's' : ''} • R$ {t.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Badge className={statusColor(orc.status)}>{statusLabel(orc.status)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select
                      className="rounded border bg-background px-2 py-1 text-xs"
                      value={orc.status}
                      onChange={e => updateOrcamento(orc.id, { status: e.target.value as Orcamento['status'] })}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="recusado">Recusado</option>
                    </select>
                    <Button size="sm" variant="outline" onClick={() => gerarPDF(orc)}>
                      <Download className="h-4 w-4" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating add button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 hover:scale-105 lg:bottom-8 lg:right-8"
        aria-label="Novo Orçamento"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Orcamento Dialog */}
      <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>Preencha os serviços e materiais</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cliente + Validade */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Cliente</label>
                <ClienteAutocomplete
                  clientes={clientes}
                  value={clienteNome}
                  onChange={(nome, id) => { setClienteNome(nome); setClienteId(id || ''); }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Validade</label>
                <Input value={validade} onChange={e => setValidade(e.target.value)} placeholder="Ex: 15 dias" />
              </div>
            </div>

            {/* Ver rota */}
            {(() => {
              const clienteSelecionado = clientes.find(c => c.id === clienteId);
              const endCliente = clienteSelecionado
                ? [clienteSelecionado.endereco, clienteSelecionado.bairro, clienteSelecionado.cidade, clienteSelecionado.estado].filter(Boolean).join(', ')
                : '';
              if (!endCliente) return null;
              const origem = encodeURIComponent(empresaEndereco || '');
              const destino = encodeURIComponent(endCliente);
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Rota até o cliente:</span>
                  <a href={`https://waze.com/ul?q=${destino}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 text-xs font-bold hover:bg-sky-500/20">
                    <Navigation size={13} /> Waze
                  </a>
                  <a href={`https://maps.google.com/maps?saddr=${origem}&daddr=${destino}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500/20">
                    <Map size={13} /> Google Maps
                  </a>
                </div>
              );
            })()}

            {/* Itens / Serviços */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Serviços</label>
              <div className="space-y-3">
                {itens.map((item, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-3 space-y-2">
                      <Input placeholder="Qual é o serviço?" value={item.descricao}
                        onChange={e => updateItem(i, { descricao: e.target.value })} />
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-md border px-3 py-1.5 text-sm bg-muted hover:bg-muted/80"
                          onClick={() => setShowUnidadeDialog({ type: 'item', index: i })}>
                          {item.unidade} <span className="text-muted-foreground text-xs ml-1">▼</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Custo unitário</label>
                          <Input type="number" step="0.01" placeholder="R$ 0,00" value={item.custoUnitario || ''}
                            onChange={e => updateItem(i, { custoUnitario: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Margem lucro (%)</label>
                          <Input type="number" step="0.1" placeholder="0%" value={item.margemLucro || ''}
                            onChange={e => updateItem(i, { margemLucro: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Preço de venda</label>
                          <Input type="number" step="0.01" value={item.valorUnitario || ''}
                            onChange={e => updateItem(i, { valorUnitario: parseFloat(e.target.value) || 0 })}
                            className="font-medium" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Quantidade</label>
                          <div className="flex items-center gap-1">
                            <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                              onClick={() => updateItem(i, { quantidade: Math.max(1, item.quantidade - 1) })}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input type="number" className="text-center" value={item.quantidade}
                              onChange={e => updateItem(i, { quantidade: parseInt(e.target.value) || 1 })} />
                            <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                              onClick={() => updateItem(i, { quantidade: item.quantidade + 1 })}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        {itens.length > 1 && (
                          <Button type="button" size="sm" variant="ghost" className="text-destructive h-8 px-2"
                            onClick={() => removeItem(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="ml-auto text-right">
                          <span className="text-xs text-muted-foreground">Valor </span>
                          <span className="font-bold text-primary">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="mt-2">
                <Plus className="h-4 w-4" /> Adicionar serviço
              </Button>
            </div>

            {/* Materiais */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Materiais</label>
              <div className="space-y-3">
                {materiais.map((m, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-3 space-y-2">
                      <Input placeholder="Nome do material" value={m.nome}
                        onChange={e => updateMaterial(i, { nome: e.target.value })} />
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-md border px-3 py-1.5 text-sm bg-muted hover:bg-muted/80"
                          onClick={() => setShowUnidadeDialog({ type: 'material', index: i })}>
                          {m.unidade} <span className="text-muted-foreground text-xs ml-1">▼</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Custo unitário</label>
                          <Input type="number" step="0.01" placeholder="R$ 0,00" value={m.custoUnitario || ''}
                            onChange={e => updateMaterial(i, { custoUnitario: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Margem lucro (%)</label>
                          <Input type="number" step="0.1" placeholder="0%" value={m.margemLucro || ''}
                            onChange={e => updateMaterial(i, { margemLucro: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Preço venda (por {m.unidade})</label>
                          <span className="block text-sm font-medium pt-1.5">R$ {calcPrecoVenda(m.custoUnitario, m.margemLucro).toFixed(2)}</span>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Quantidade</label>
                          <div className="flex items-center gap-1">
                            <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                              onClick={() => updateMaterial(i, { quantidade: Math.max(1, m.quantidade - 1) })}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input type="number" className="text-center" value={m.quantidade}
                              onChange={e => updateMaterial(i, { quantidade: parseInt(e.target.value) || 1 })} />
                            <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                              onClick={() => updateMaterial(i, { quantidade: m.quantidade + 1 })}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        {materiais.length > 1 && (
                          <Button type="button" size="sm" variant="ghost" className="text-destructive h-8 px-2"
                            onClick={() => removeMaterial(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="ml-auto text-right">
                          <span className="text-xs text-muted-foreground">Valor </span>
                          <span className="font-bold text-primary">R$ {m.valor.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addMaterial} className="mt-2">
                <Plus className="h-4 w-4" /> Adicionar material
              </Button>
            </div>

            {/* Deslocamento e Tempo */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Deslocamento e Tempo</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Horas (R$ {valorHora.toFixed(2)}/h)</label>
                  <Input type="number" step="0.5" value={horas} onChange={e => setHoras(e.target.value)} placeholder="0" />
                  {horasVal > 0 && <p className="text-xs text-primary mt-1">= R$ {totalHoras.toFixed(2)}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Dias (R$ {valorDia.toFixed(2)}/dia)</label>
                  <Input type="number" step="0.5" value={dias} onChange={e => setDias(e.target.value)} placeholder="0" />
                  {diasVal > 0 && <p className="text-xs text-primary mt-1">= R$ {totalDias.toFixed(2)}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">KM (R$ {valorKm.toFixed(2)}/km)</label>
                  <Input type="number" step="1" value={km} onChange={e => setKm(e.target.value)} placeholder="0" />
                  {kmVal > 0 && <p className="text-xs text-primary mt-1">= R$ {totalKm.toFixed(2)}</p>}
                </div>
              </div>
              {valorHora === 0 && valorDia === 0 && valorKm === 0 && (
                <p className="text-xs text-muted-foreground mt-1">⚠️ Configure os valores em Configurações → Empresa</p>
              )}
            </div>

            {/* Mão de obra */}
            <div>
              <label className="mb-1 block text-sm font-medium">Mão de Obra (R$)</label>
              <Input type="number" step="0.01" value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} placeholder="0,00" />
            </div>

            {/* Desconto */}
            <div>
              <label className="mb-1 block text-sm font-medium">Desconto (R$)</label>
              <Input type="number" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)} placeholder="0,00" />
            </div>

            {/* Totais */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Serviços:</span><span>R$ {totalItens.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Materiais:</span><span>R$ {totalMateriais.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Mão de Obra:</span><span>R$ {(maoDeObraVal + totalDeslocamento).toFixed(2)}</span></div>
              {descontoVal > 0 && <div className="flex justify-between text-destructive"><span>Desconto:</span><span>- R$ {descontoVal.toFixed(2)}</span></div>}
              <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Total Geral:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
              {lucroEstimado > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>Lucro estimado:</span>
                  <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>R$ {lucroEstimado.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="mb-1 block text-sm font-medium">Observações</label>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Condições, prazos..." />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit"><Plus className="h-4 w-4" /> Criar Orçamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unidade Selection Dialog */}
      <Dialog open={!!showUnidadeDialog} onOpenChange={() => setShowUnidadeDialog(null)}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unidade de medida</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {UNIDADES.map(u => (
              <button key={u.value} type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-muted"
                onClick={() => {
                  if (showUnidadeDialog) {
                    if (showUnidadeDialog.type === 'item') updateItem(showUnidadeDialog.index, { unidade: u.value });
                    else updateMaterial(showUnidadeDialog.index, { unidade: u.value });
                  }
                  setShowUnidadeDialog(null);
                }}>
                <div>
                  <p className="font-semibold">{u.label}</p>
                  <p className="text-xs text-muted-foreground">{u.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnidadeDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
