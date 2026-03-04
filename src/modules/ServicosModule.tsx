import { useState, useRef } from 'react';
import { OrdemServico, Cliente } from '@/types';
import ClienteAutocomplete from '@/components/ClienteAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Camera, Plus, Trash2, Eye, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  ordens: OrdemServico[];
  clientes: Cliente[];
  addOrdem: (o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => void;
  updateOrdem: (id: string, updates: Partial<OrdemServico>) => void;
  removeOrdem: (id: string) => void;
}

export default function ServicosModule({ ordens, clientes, addOrdem, updateOrdem, removeOrdem }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [viewOrdem, setViewOrdem] = useState<OrdemServico | null>(null);

  const antesRef = useRef<HTMLInputElement>(null);
  const depoisRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState<{ id: string; type: 'antes' | 'depois' } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !descricao) {
      toast.error('Preencha o cliente e a descrição');
      return;
    }
    addOrdem({
      clienteId,
      clienteNome,
      descricao,
      data,
      codigo,
      valor: parseFloat(valor) || 0,
    });
    setClienteNome('');
    setClienteId('');
    setDescricao('');
    setCodigo('');
    setValor('');
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
    <div className="space-y-6">
      {/* Hidden file inputs for camera */}
      <input ref={antesRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={depoisRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      {/* New OS form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Ordem de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente</label>
              <ClienteAutocomplete
                clientes={clientes}
                value={clienteNome}
                onChange={(nome, id) => { setClienteNome(nome); setClienteId(id || ''); }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe o serviço" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Data</label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Código (opcional)</label>
                <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="OS-001" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
                <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Salvar Serviço
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* OS List */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          Serviços em Andamento
          <Badge variant="secondary">{ordens.length}</Badge>
        </h3>

        {ordens.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Wrench className="h-10 w-10" />
              <p>Nenhum serviço cadastrado ainda.</p>
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
                      <p className="text-sm text-muted-foreground">{os.descricao}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {os.data} {os.codigo && `• ${os.codigo}`} {os.valor > 0 && `• R$ ${os.valor.toFixed(2)}`}
                      </p>
                    </div>
                    <Badge className={statusColor(os.status)}>{statusLabel(os.status)}</Badge>
                  </div>

                  {/* Photo thumbnails */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-dashed p-2 text-center">
                      {os.fotoAntes ? (
                        <img src={os.fotoAntes} alt="Antes" className="mx-auto max-h-32 rounded object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-xs">Foto ANTES</span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-dashed p-2 text-center">
                      {os.fotoDepois ? (
                        <img src={os.fotoDepois} alt="Depois" className="mx-auto max-h-32 rounded object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-xs">Foto DEPOIS</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handlePhoto(os.id, 'antes')}>
                      <Camera className="h-4 w-4" /> Foto ANTES
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePhoto(os.id, 'depois')}>
                      <Camera className="h-4 w-4" /> Foto DEPOIS
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
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeOrdem(os.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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

function Wrench(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
