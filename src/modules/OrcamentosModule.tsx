import { useState } from 'react';
import { Orcamento, OrcamentoItem } from '@/types';
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
}

export default function OrcamentosModule({ orcamentos, addOrcamento, updateOrcamento, empresaLogo, empresaNome }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);

  const addItem = () => setItens(prev => [...prev, { descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrcamentoItem, value: string | number) => {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const total = itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome) { toast.error('Preencha o cliente'); return; }
    if (itens.some(i => !i.descricao)) { toast.error('Preencha todos os itens'); return; }
    addOrcamento({ clienteId: '', clienteNome, itens, validade, observacoes });
    setClienteNome(''); setValidade(''); setObservacoes('');
    setItens([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);
    toast.success('Orçamento criado!');
  };

  const gerarPDF = (orc: Orcamento) => {
    const orcTotal = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Orçamento</title><style>
        body{font-family:system-ui;margin:40px;color:#222}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
        th{background:#f5f5f5}
        .logo{max-height:60px}
        .total{font-size:18px;font-weight:bold;text-align:right}
        .assinatura{margin-top:60px;border-top:1px solid #222;width:250px;text-align:center;padding-top:4px}
      </style></head><body>
      ${empresaLogo ? `<img src="${empresaLogo}" class="logo"/>` : ''}
      <h2>${empresaNome || 'Empresa'}</h2>
      <h3>ORÇAMENTO</h3>
      <p><strong>Cliente:</strong> ${orc.clienteNome}</p>
      <p><strong>Data:</strong> ${new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p>
      ${orc.validade ? `<p><strong>Validade:</strong> ${orc.validade}</p>` : ''}
      <table>
        <tr><th>Item</th><th>Qtd</th><th>Valor Unit.</th><th>Subtotal</th></tr>
        ${orc.itens.map(i => `<tr><td>${i.descricao}</td><td>${i.quantidade}</td><td>R$ ${i.valorUnitario.toFixed(2)}</td><td>R$ ${(i.quantidade * i.valorUnitario).toFixed(2)}</td></tr>`).join('')}
      </table>
      <p class="total">Total: R$ ${orcTotal.toFixed(2)}</p>
      ${orc.observacoes ? `<p><strong>Observações:</strong> ${orc.observacoes}</p>` : ''}
      <div class="assinatura">Assinatura do Cliente</div>
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

            <div>
              <label className="mb-2 block text-sm font-medium">Itens</label>
              {itens.map((item, i) => (
                <div key={i} className="mb-2 flex flex-wrap gap-2">
                  <Input className="flex-1 min-w-[140px]" placeholder="Descrição" value={item.descricao}
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
                <Plus className="h-4 w-4" /> Adicionar item
              </Button>
              <p className="mt-2 text-right font-semibold">Total: R$ {total.toFixed(2)}</p>
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
              const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
              return (
                <Card key={orc.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="font-semibold">{orc.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">{orc.itens.length} itens • R$ {t.toFixed(2)}</p>
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
