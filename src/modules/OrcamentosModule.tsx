import { useState } from 'react';
import { Orcamento, OrcamentoItem, OrcamentoMaterial } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  orcamentos: Orcamento[];
  addOrcamento: (o: Omit<Orcamento, 'id' | 'criadoEm' | 'status' | 'assinatura'>) => void;
  updateOrcamento: (id: string, updates: Partial<Orcamento>) => void;
  empresaLogo: string | null;
  empresaNome: string;
  empresaAssinatura: string | null;
}

export default function OrcamentosModule({ orcamentos, addOrcamento, updateOrcamento, empresaLogo, empresaNome, empresaAssinatura }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const [materiais, setMateriais] = useState<OrcamentoMaterial[]>([{ nome: '', valor: 0 }]);
  const [maoDeObra, setMaoDeObra] = useState('');

  const addItem = () => setItens(prev => [...prev, { descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrcamentoItem, value: string | number) => {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const addMaterial = () => setMateriais(prev => [...prev, { nome: '', valor: 0 }]);
  const removeMaterial = (i: number) => setMateriais(prev => prev.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, field: keyof OrcamentoMaterial, value: string | number) => {
    setMateriais(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const totalItens = itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
  const totalMateriais = materiais.reduce((sum, m) => sum + m.valor, 0);
  const maoDeObraVal = parseFloat(maoDeObra) || 0;
  const totalGeral = totalItens + totalMateriais + maoDeObraVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome) { toast.error('Preencha o cliente'); return; }
    if (itens.some(i => !i.descricao)) { toast.error('Preencha todos os itens'); return; }
    addOrcamento({
      clienteId: '', clienteNome, itens, materiais: materiais.filter(m => m.nome),
      maoDeObra: maoDeObraVal, validade, observacoes,
    });
    setClienteNome(''); setValidade(''); setObservacoes(''); setMaoDeObra('');
    setItens([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);
    setMateriais([{ nome: '', valor: 0 }]);
    toast.success('Orçamento criado!');
  };

  const gerarPDF = (orc: Orcamento) => {
    const orcTotalItens = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
    const orcTotalMat = (orc.materiais || []).reduce((s, m) => s + m.valor, 0);
    const orcTotal = orcTotalItens + orcTotalMat + (orc.maoDeObra || 0);
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
        <tr><th>Serviço</th><th>Qtd</th><th>Valor Unit.</th><th>Subtotal</th></tr>
        ${orc.itens.map(i => `<tr><td>${i.descricao}</td><td>${i.quantidade}</td><td>R$ ${i.valorUnitario.toFixed(2)}</td><td>R$ ${(i.quantidade * i.valorUnitario).toFixed(2)}</td></tr>`).join('')}
      </table>
      <p style="text-align:right"><strong>Subtotal Serviços: R$ ${orcTotalItens.toFixed(2)}</strong></p>

      ${(orc.materiais && orc.materiais.length > 0) ? `
        <p class="section">Materiais</p>
        <table>
          <tr><th>Material</th><th>Valor</th></tr>
          ${orc.materiais.map(m => `<tr><td>${m.nome}</td><td>R$ ${m.valor.toFixed(2)}</td></tr>`).join('')}
        </table>
        <p style="text-align:right"><strong>Subtotal Materiais: R$ ${orcTotalMat.toFixed(2)}</strong></p>
      ` : ''}

      ${(orc.maoDeObra || 0) > 0 ? `
        <p class="section">Mão de Obra</p>
        <p style="text-align:right"><strong>R$ ${orc.maoDeObra.toFixed(2)}</strong></p>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Cliente</label>
                <Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Validade</label>
                <Input value={validade} onChange={e => setValidade(e.target.value)} placeholder="Ex: 15 dias" />
              </div>
            </div>

            {/* Itens / Serviços */}
            <div>
              <label className="mb-2 block text-sm font-medium">Serviços</label>
              {itens.map((item, i) => (
                <div key={i} className="mb-2 flex flex-wrap gap-2">
                  <Input className="flex-1 min-w-[140px]" placeholder="Descrição do serviço" value={item.descricao}
                    onChange={e => updateItem(i, 'descricao', e.target.value)} />
                  <Input className="w-20" type="number" placeholder="Qtd" value={item.quantidade}
                    onChange={e => updateItem(i, 'quantidade', parseInt(e.target.value) || 0)} />
                  <Input className="w-28" type="number" step="0.01" placeholder="Valor" value={item.valorUnitario}
                    onChange={e => updateItem(i, 'valorUnitario', parseFloat(e.target.value) || 0)} />
                  {itens.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4" /> Adicionar serviço
              </Button>
            </div>

            {/* Materiais */}
            <div>
              <label className="mb-2 block text-sm font-medium">Materiais</label>
              {materiais.map((m, i) => (
                <div key={i} className="mb-2 flex flex-wrap gap-2">
                  <Input className="flex-1 min-w-[140px]" placeholder="Nome do material" value={m.nome}
                    onChange={e => updateMaterial(i, 'nome', e.target.value)} />
                  <Input className="w-28" type="number" step="0.01" placeholder="Valor" value={m.valor}
                    onChange={e => updateMaterial(i, 'valor', parseFloat(e.target.value) || 0)} />
                  {materiais.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeMaterial(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addMaterial}>
                <Plus className="h-4 w-4" /> Adicionar material
              </Button>
            </div>

            {/* Mão de obra */}
            <div>
              <label className="mb-1 block text-sm font-medium">Mão de Obra (R$)</label>
              <Input type="number" step="0.01" value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} placeholder="0,00" />
            </div>

            {/* Totais */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Serviços:</span><span>R$ {totalItens.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Materiais:</span><span>R$ {totalMateriais.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Mão de Obra:</span><span>R$ {maoDeObraVal.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Total Geral:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Observações</label>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Condições, prazos..." />
            </div>

            <Button type="submit"><Plus className="h-4 w-4" /> Criar Orçamento</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" /> Orçamentos <Badge variant="secondary">{orcamentos.length}</Badge>
        </h3>
        {orcamentos.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum orçamento ainda.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {orcamentos.map(orc => {
              const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
                + (orc.materiais || []).reduce((s, m) => s + m.valor, 0)
                + (orc.maoDeObra || 0);
              return (
                <Card key={orc.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="font-semibold">{orc.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">{orc.itens.length} serviços • R$ {t.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
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
      </div>
    </div>
  );
}
