import { useState, useRef } from 'react';
import { OrdemServico, Cliente, Orcamento } from '@/types';
import ClienteAutocomplete from '@/components/ClienteAutocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Camera, Plus, Trash2, Eye, ImageIcon, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  ordens: OrdemServico[];
  clientes: Cliente[];
  orcamentos: Orcamento[];
  addOrdem: (o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => void;
  updateOrdem: (id: string, updates: Partial<OrdemServico>) => void;
  removeOrdem: (id: string) => void;
}

export default function ServicosModule({ ordens, clientes, orcamentos, addOrdem, updateOrdem, removeOrdem }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [orcamentoId, setOrcamentoId] = useState('');
  const [viewOrdem, setViewOrdem] = useState<OrdemServico | null>(null);

  const antesRef = useRef<HTMLInputElement>(null);
  const depoisRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<{ id: string; type: 'antes' | 'depois' } | null>(null);

  const orcamentosCliente = orcamentos.filter(o =>
    o.clienteId === clienteId || o.clienteNome.toLowerCase() === clienteNome.toLowerCase()
  );

  const orcamentoVinculado = orcamentos.find(o => o.id === orcamentoId);

  const handleOrcamentoSelect = (id: string) => {
    setOrcamentoId(id);
    if (id) {
      const orc = orcamentos.find(o => o.id === id);
      if (orc) {
        const total = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
          + (orc.materiais || []).reduce((s, m) => s + m.valor, 0)
          + (orc.maoDeObra || 0) - (orc.desconto || 0);
        setValor(total.toFixed(2));
        if (!descricao) setDescricao(orc.itens.map(i => i.descricao).join(', '));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !descricao) {
      toast.error('Preencha o cliente e a descrição');
      return;
    }
    addOrdem({ clienteId, clienteNome, descricao, data, codigo, valor: parseFloat(valor) || 0 });
    setClienteNome(''); setClienteId(''); setDescricao('');
    setCodigo(''); setValor(''); setOrcamentoId('');
    setShowForm(false);
    toast.success('Ordem de serviço criada!');
  };

  const handlePhoto = (id: string, type: 'antes' | 'depois') => {
    setPhotoTarget({ id, type });
    setTimeout(() => {
      if (type === 'antes') antesRef.current?.click();
      else depoisRef.current?.click();
    }, 100);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTarget) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateOrdem(photoTarget.id, {
        [photoTarget.type === 'antes' ? 'fotoAntes' : 'fotoDepois']: dataUrl,
      });
      toast.success(`Foto ${photoTarget.type === 'antes' ? 'ANTES' : 'DEPOIS'} salva!`);
      setPhotoTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const statusColor = (s: string) => {
    if (s === 'concluido') return 'bg-accent text-accent-foreground';
    if (s === 'em_andamento') return 'bg-[hsl(var(--chart-orange))] text-white';
    return 'bg-secondary text-secondary-foreground';
  };

  const statusLabel = (s: string) => {
    if (s === 'concluido') return 'Concluído';
    if (s === 'em_andamento') return 'Em andamento';
    return 'Pendente';
  };

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input ref={antesRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={depoisRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      {/* OS List */}
      {ordens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <WrenchIcon className="h-12 w-12 opacity-30" />
            <p className="text-sm">Nenhum serviço cadastrado</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Nova Ordem de Serviço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordens.map(os => (
            <Card key={os.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{os.clienteNome}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{os.descricao}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {os.data}{os.codigo && ` • ${os.codigo}`}{os.valor > 0 && ` • R$ ${os.valor.toFixed(2)}`}
                    </p>
                  </div>
                  <Badge className={statusColor(os.status)}>{statusLabel(os.status)}</Badge>
                </div>

                {/* Photo thumbnails */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-dashed p-2 text-center">
                    {os.fotoAntes ? (
                      <img src={os.fotoAntes} alt="Antes" className="mx-auto max-h-28 rounded object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-3 text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">ANTES</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-dashed p-2 text-center">
                    {os.fotoDepois ? (
                      <img src={os.fotoDepois} alt="Depois" className="mx-auto max-h-28 rounded object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-3 text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">DEPOIS</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handlePhoto(os.id, 'antes')}>
                    <Camera className="h-4 w-4" /> Antes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePhoto(os.id, 'depois')}>
                    <Camera className="h-4 w-4" /> Depois
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setViewOrdem(os)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <select
                    className="rounded border bg-background px-2 py-1 text-xs"
                    value={os.status}
                    onChange={e => updateOrdem(os.id, { status: e.target.value as OrdemServico['status'] })}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => removeOrdem(os.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating add button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 hover:scale-105 lg:bottom-8 lg:right-8"
        aria-label="Nova OS"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New OS Dialog */}
      <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) { setClienteNome(''); setClienteId(''); setDescricao(''); setCodigo(''); setValor(''); setOrcamentoId(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>Preencha os dados do serviço</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente</label>
              <ClienteAutocomplete
                clientes={clientes}
                value={clienteNome}
                onChange={(nome, id) => { setClienteNome(nome); setClienteId(id || ''); setOrcamentoId(''); }}
              />
            </div>

            {orcamentosCliente.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4 text-primary" /> Vincular Orçamento (opcional)
                </label>
                <select
                  className="w-full rounded border bg-background px-3 py-2 text-sm"
                  value={orcamentoId}
                  onChange={e => handleOrcamentoSelect(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {orcamentosCliente.map(o => {
                    const total = o.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
                      + (o.materiais || []).reduce((s, m) => s + m.valor, 0)
                      + (o.maoDeObra || 0) - (o.desconto || 0);
                    return (
                      <option key={o.id} value={o.id}>
                        {new Date(o.criadoEm).toLocaleDateString('pt-BR')} — R$ {total.toFixed(2)} ({o.status})
                      </option>
                    );
                  })}
                </select>
                {orcamentoVinculado && orcamentoVinculado.materiais?.length > 0 && (
                  <div className="mt-2 rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-semibold flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" /> Materiais:
                    </p>
                    <ul className="space-y-0.5">
                      {orcamentoVinculado.materiais.map((m, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          • {m.nome} ({m.quantidade} {m.unidade}) — R$ {m.valor.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe o serviço" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Data</label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Código</label>
                <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="OS-001" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
                <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit"><Plus className="h-4 w-4" /> Salvar Serviço</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewOrdem} onOpenChange={() => setViewOrdem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>OS — {viewOrdem?.clienteNome}</DialogTitle>
            <DialogDescription>{viewOrdem?.descricao}</DialogDescription>
          </DialogHeader>
          {viewOrdem && (
            <div className="space-y-4">
              <p className="text-sm">Data: {viewOrdem.data} • Status: {statusLabel(viewOrdem.status)}</p>
              {viewOrdem.valor > 0 && <p className="text-sm font-semibold">Valor: R$ {viewOrdem.valor.toFixed(2)}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">ANTES</p>
                  {viewOrdem.fotoAntes ? (
                    <img src={viewOrdem.fotoAntes} alt="Antes" className="rounded-lg" />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-xs">Sem foto</div>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">DEPOIS</p>
                  {viewOrdem.fotoDepois ? (
                    <img src={viewOrdem.fotoDepois} alt="Depois" className="rounded-lg" />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-xs">Sem foto</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrdem(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
