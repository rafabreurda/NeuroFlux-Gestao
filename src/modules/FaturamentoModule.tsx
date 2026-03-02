import { useState } from 'react';
import { Recibo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  recibos: Recibo[];
  addRecibo: (r: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>) => void;
  empresaLogo: string | null;
  empresaNome: string;
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

export default function FaturamentoModule({ recibos, addRecibo, empresaLogo, empresaNome }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !valor) { toast.error('Preencha cliente e valor'); return; }
    addRecibo({ clienteId: '', clienteNome, descricao, valor: parseFloat(valor), formaPagamento });
    setClienteNome(''); setDescricao(''); setValor('');
    toast.success('Recibo emitido!');
  };

  const gerarReciboPDF = (rec: Recibo) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Recibo #${rec.numero}</title><style>
        body{font-family:system-ui;margin:40px;color:#222}
        .logo{max-height:60px}
        .box{border:2px solid #222;padding:30px;max-width:600px;margin:0 auto}
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

  const totalReceitas = recibos.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Recibos</p>
            <p className="text-2xl font-bold">{recibos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Faturado</p>
            <p className="text-2xl font-bold text-accent">R$ {totalReceitas.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Média por Recibo</p>
            <p className="text-2xl font-bold">R$ {recibos.length ? (totalReceitas / recibos.length).toFixed(2) : '0,00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* New Recibo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Emitir Recibo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Cliente</label>
                <Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome" />
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

      {/* Recibos list */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Receipt className="h-5 w-5" /> Recibos Emitidos <Badge variant="secondary">{recibos.length}</Badge>
        </h3>
        {recibos.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum recibo emitido.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {[...recibos].reverse().map(rec => (
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
    </div>
  );
}
