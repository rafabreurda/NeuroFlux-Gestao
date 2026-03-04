import { useState, useMemo } from 'react';
import { Recibo, OrdemServico, Orcamento, CustoFixo, Cliente } from '@/types';
import ClienteAutocomplete from '@/components/ClienteAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Receipt, Download, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  recibos: Recibo[];
  addRecibo: (r: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>) => void;
  empresaLogo: string | null;
  empresaNome: string;
  ordens: OrdemServico[];
  orcamentos: Orcamento[];
  custos: CustoFixo[];
  clientes: Cliente[];
}

const valorPorExtenso = (valor: number): string => {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const intPart = Math.floor(valor);
  const centavos = Math.round((valor - intPart) * 100);
  if (intPart === 0 && centavos === 0) return 'zero reais';
  const numberToWords = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' e ' + units[n % 10] : '');
    if (n < 1000) return hundreds[Math.floor(n / 100)] + (n % 100 ? ' e ' + numberToWords(n % 100) : '');
    if (n < 1000000) {
      const mil = Math.floor(n / 1000);
      const rest = n % 1000;
      return (mil === 1 ? 'mil' : numberToWords(mil) + ' mil') + (rest ? ' e ' + numberToWords(rest) : '');
    }
    return String(n);
  };
  let result = '';
  if (intPart > 0) result = numberToWords(intPart) + (intPart === 1 ? ' real' : ' reais');
  if (centavos > 0) result += (result ? ' e ' : '') + numberToWords(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  return result;
};

const CHART_COLORS = ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(280, 67%, 55%)'];

export default function FaturamentoModule({ recibos, addRecibo, empresaLogo, empresaNome, ordens, orcamentos, custos, clientes }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');

  const financeiro = useMemo(() => {
    const totalEntradas = recibos.reduce((s, r) => s + r.valor, 0);
    const totalCustos = custos.reduce((s, c) => s + c.valor, 0);
    const totalOrcamentos = orcamentos.reduce((s, o) => {
      const itens = o.itens.reduce((si, i) => si + i.quantidade * i.valorUnitario, 0);
      const materiais = o.materiais.reduce((sm, m) => sm + m.valor, 0);
      return s + itens + materiais + o.maoDeObra;
    }, 0);
    const lucro = totalEntradas - totalCustos;
    const porOS = ordens.map(os => {
      const orcamentosOS = orcamentos.filter(o => o.clienteId === os.clienteId);
      const recibosOS = recibos.filter(r => r.clienteId === os.clienteId);
      const entradaOS = recibosOS.reduce((s, r) => s + r.valor, 0) || os.valor;
      const custoOS = orcamentosOS.reduce((s, o) => s + o.materiais.reduce((sm, m) => sm + m.valor, 0), 0);
      return { codigo: os.codigo, cliente: os.clienteNome, entrada: entradaOS, saida: custoOS, lucro: entradaOS - custoOS, status: os.status };
    });
    const porPagamento: Record<string, number> = {};
    recibos.forEach(r => { porPagamento[r.formaPagamento] = (porPagamento[r.formaPagamento] || 0) + r.valor; });
    const chartPagamento = Object.entries(porPagamento).map(([name, value]) => ({ name, value }));
    const porMes: Record<string, { entrada: number; saida: number }> = {};
    recibos.forEach(r => {
      const mes = new Date(r.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!porMes[mes]) porMes[mes] = { entrada: 0, saida: 0 };
      porMes[mes].entrada += r.valor;
    });
    custos.forEach(c => {
      const mes = 'fixo';
      if (!porMes[mes]) porMes[mes] = { entrada: 0, saida: 0 };
      porMes[mes].saida += c.valor;
    });
    const chartMensal = Object.entries(porMes).map(([mes, v]) => ({ mes, ...v, lucro: v.entrada - v.saida }));
    return { totalEntradas, totalCustos, totalOrcamentos, lucro, porOS, chartPagamento, chartMensal };
  }, [recibos, custos, ordens, orcamentos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !valor) { toast.error('Preencha cliente e valor'); return; }
    addRecibo({ clienteId, clienteNome, descricao, valor: parseFloat(valor), formaPagamento });
    setClienteNome(''); setDescricao(''); setValor('');
    toast.success('Recibo emitido!');
  };

  const gerarReciboPDF = (rec: Recibo) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Recibo #${rec.numero}</title><style>
        body{font-family:system-ui;margin:40px;color:#222}
        .logo{max-height:60px}.box{border:2px solid #222;padding:30px;max-width:600px;margin:0 auto}
        .numero{text-align:right;font-size:14px;color:#666}
        .valor{font-size:22px;font-weight:bold;margin:16px 0}
        .extenso{font-style:italic;color:#555;margin-bottom:16px}
        .assinatura{margin-top:60px;border-top:1px solid #222;width:250px;text-align:center;padding-top:4px}
      </style></head><body>
      <div class="box">
        ${empresaLogo ? `<img src="${empresaLogo}" class="logo"/>` : ''}
        <h2>${empresaNome || 'Empresa'}</h2>
        <p class="numero">Recibo nº ${String(rec.numero).padStart(4, '0')}</p>
        <h3>RECIBO DE PAGAMENTO</h3>
        <p>Recebi de <strong>${rec.clienteNome}</strong> a importância de:</p>
        <p class="valor">R$ ${rec.valor.toFixed(2)}</p>
        <p class="extenso">(${valorPorExtenso(rec.valor)})</p>
        <p><strong>Referente a:</strong> ${rec.descricao || 'Serviço prestado'}</p>
        <p><strong>Forma de pagamento:</strong> ${rec.formaPagamento}</p>
        <p><strong>Data:</strong> ${new Date(rec.criadoEm).toLocaleDateString('pt-BR')}</p>
        <div class="assinatura">Assinatura</div>
      </div>
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>
    `);
  };

  const lucroPositivo = financeiro.lucro >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ArrowUpRight className="h-3.5 w-3.5 text-green-500" /> Entradas</div>
            <p className="mt-1 text-xl font-bold text-green-600">R$ {financeiro.totalEntradas.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{recibos.length} recibos emitidos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ArrowDownRight className="h-3.5 w-3.5 text-red-500" /> Saídas</div>
            <p className="mt-1 text-xl font-bold text-red-600">R$ {financeiro.totalCustos.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{custos.length} custos registrados</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${lucroPositivo ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {lucroPositivo ? <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> : <TrendingDown className="h-3.5 w-3.5 text-orange-500" />} Lucro Líquido
            </div>
            <p className={`mt-1 text-xl font-bold ${lucroPositivo ? 'text-blue-600' : 'text-orange-600'}`}>R$ {financeiro.lucro.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Entradas − Custos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><BarChart3 className="h-3.5 w-3.5 text-amber-500" /> Orçamentos</div>
            <p className="mt-1 text-xl font-bold text-amber-600">R$ {financeiro.totalOrcamentos.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{orcamentos.length} orçamentos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="recibos">Recibos</TabsTrigger>
          <TabsTrigger value="por-os">Por O.S.</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Entradas vs Saídas</CardTitle></CardHeader>
              <CardContent>
                {financeiro.chartMensal.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={financeiro.chartMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Bar dataKey="entrada" name="Entradas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saida" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-muted-foreground">Sem dados para exibir</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Formas de Pagamento</CardTitle></CardHeader>
              <CardContent>
                {financeiro.chartPagamento.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={financeiro.chartPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {financeiro.chartPagamento.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-muted-foreground">Sem recibos registrados</p>}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Resumo Rápido</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                  <span className="text-xs text-green-700 dark:text-green-400">Média/Recibo</span>
                  <span className="font-bold text-sm text-green-700 dark:text-green-400">R$ {recibos.length ? (financeiro.totalEntradas / recibos.length).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                  <span className="text-xs text-blue-700 dark:text-blue-400">Margem</span>
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-400">{financeiro.totalEntradas > 0 ? ((financeiro.lucro / financeiro.totalEntradas) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                  <span className="text-xs text-amber-700 dark:text-amber-400">OS Concluídas</span>
                  <span className="font-bold text-sm text-amber-700 dark:text-amber-400">{ordens.filter(o => o.status === 'concluido').length}/{ordens.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recibos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-5 w-5 text-primary" /> Emitir Recibo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
                    <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Descrição</label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Referente a..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Forma de Pagamento</label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                    <option>Dinheiro</option>
                    <option>PIX</option>
                    <option>Cartão de Crédito</option>
                    <option>Cartão de Débito</option>
                    <option>Transferência</option>
                    <option>Boleto</option>
                  </select>
                </div>
                <Button type="submit"><Receipt className="h-4 w-4" /> Emitir Recibo</Button>
              </form>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Receipt className="h-5 w-5" /> Recibos Emitidos <Badge variant="secondary">{recibos.length}</Badge>
            </h3>
            {recibos.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum recibo emitido.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {recibos.map(rec => (
                  <Card key={rec.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                      <div>
                        <p className="font-semibold">#{String(rec.numero).padStart(4, '0')} — {rec.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">R$ {rec.valor.toFixed(2)} • {rec.formaPagamento}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => gerarReciboPDF(rec)}>
                        <Download className="h-4 w-4" /> PDF
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="por-os" className="space-y-4 mt-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5" /> Lucro por Ordem de Serviço
          </h3>
          {financeiro.porOS.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma ordem de serviço registrada.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {financeiro.porOS.map((os, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{os.codigo} — {os.cliente}</p>
                        <Badge variant={os.status === 'concluido' ? 'default' : os.status === 'em_andamento' ? 'secondary' : 'outline'} className="mt-1 text-[10px]">
                          {os.status === 'concluido' ? 'Concluído' : os.status === 'em_andamento' ? 'Em andamento' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> R$ {os.entrada.toFixed(2)}</span>
                          <span className="text-red-600 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" /> R$ {os.saida.toFixed(2)}</span>
                        </div>
                        <p className={`mt-1 text-base font-bold ${os.lucro >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          Lucro: R$ {os.lucro.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
