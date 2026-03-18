import { useState, useRef } from 'react';
import { OrdemServico, OSMaterial, Cliente, Orcamento, ServicoCatalogo } from '@/types';
import ClienteAutocomplete from '@/components/ClienteAutocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Camera, Plus, Trash2, Eye, ImageIcon, FileText, Package, List, Clock, CalendarIcon } from 'lucide-react';
import ServicosCatalogo from '@/components/ServicosCatalogo';
import { toast } from 'sonner';

interface Props {
  ordens: OrdemServico[];
  clientes: Cliente[];
  orcamentos: Orcamento[];
  catalogoServicos: ServicoCatalogo[];
  addServicoCatalogo: (s: Omit<ServicoCatalogo, 'id' | 'criadoEm'>) => void;
  removeServicoCatalogo: (id: string) => void;
  updateServicoCatalogo: (id: string, updates: Partial<ServicoCatalogo>) => void;
  addOrdem: (o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => void;
  updateOrdem: (id: string, updates: Partial<OrdemServico>) => void;
  removeOrdem: (id: string) => void;
}

export default function ServicosModule({ ordens, clientes, orcamentos, catalogoServicos, addServicoCatalogo, removeServicoCatalogo, updateServicoCatalogo, addOrdem, updateOrdem, removeOrdem }: Props) {
  const [activeTab, setActiveTab] = useState<'ordens' | 'catalogo' | 'agenda'>('ordens');
  const [showForm, setShowForm] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [orcamentoId, setOrcamentoId] = useState('');
  const [viewOrdem, setViewOrdem] = useState<OrdemServico | null>(null);
  const [materiais, setMateriais] = useState<OSMaterial[]>([]);
  const [duracaoHoras, setDuracaoHoras] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');

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

  const addMaterial = () => setMateriais(prev => [...prev, { nome: '', quantidade: 1, unidade: 'un.', valor: 0 }]);
  const updateMaterial = (idx: number, field: keyof OSMaterial, val: string | number) => {
    setMateriais(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };
  const removeMaterial = (idx: number) => setMateriais(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setClienteNome(''); setClienteId(''); setDescricao('');
    setCodigo(''); setValor(''); setOrcamentoId('');
    setMateriais([]); setDuracaoHoras(''); setDataAgendamento('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !descricao) {
      toast.error('Preencha o cliente e a descrição');
      return;
    }
    addOrdem({
      clienteId, clienteNome, descricao, data, codigo,
      valor: parseFloat(valor) || 0,
      materiais: materiais.filter(m => m.nome),
      duracaoHoras: parseFloat(duracaoHoras) || 0,
      dataAgendamento: dataAgendamento || null,
    });
    resetForm();
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

  // Agenda: ordens agendadas ordenadas por data
  const agendadas = ordens
    .filter(o => o.dataAgendamento)
    .sort((a, b) => new Date(a.dataAgendamento!).getTime() - new Date(b.dataAgendamento!).getTime());

  const formatDateTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('ordens')}
          className={`flex items-center gap-1.5 rounded-t px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'ordens' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <List className="h-4 w-4" /> Ordens
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-1.5 rounded-t px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'agenda' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <CalendarIcon className="h-4 w-4" /> Agenda
        </button>
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`flex items-center gap-1.5 rounded-t px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'catalogo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Package className="h-4 w-4" /> Catálogo
        </button>
      </div>

      {activeTab === 'catalogo' ? (
        <ServicosCatalogo
          servicos={catalogoServicos}
          addServico={addServicoCatalogo}
          removeServico={removeServicoCatalogo}
          updateServico={updateServicoCatalogo}
        />
      ) : activeTab === 'agenda' ? (
        /* ==================== AGENDA ==================== */
        <div className="space-y-3">
          {agendadas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 opacity-30" />
                <p className="text-sm">Nenhum serviço agendado</p>
                <Button onClick={() => { setActiveTab('ordens'); setShowForm(true); }}>
                  <Plus className="h-4 w-4" /> Agendar Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            agendadas.map(os => {
              const agendDt = new Date(os.dataAgendamento!);
              const isPast = agendDt < new Date();
              return (
                <Card key={os.id} className={`overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDateTime(os.dataAgendamento!)}
                        </p>
                        <p className="font-semibold mt-1">{os.clienteNome}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{os.descricao}</p>
                        {os.duracaoHoras > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Duração: {os.duracaoHoras}h
                          </p>
                        )}
                        {os.valor > 0 && <p className="text-xs font-medium mt-0.5">R$ {os.valor.toFixed(2)}</p>}
                      </div>
                      <Badge className={statusColor(os.status)}>{statusLabel(os.status)}</Badge>
                    </div>
                    {os.materiais && os.materiais.length > 0 && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <p className="text-xs font-semibold mb-1">Materiais:</p>
                        {os.materiais.map((m, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {m.nome} ({m.quantidade} {m.unidade}) — R$ {m.valor.toFixed(2)}</p>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <select
                        className="rounded border bg-background px-2 py-1 text-xs"
                        value={os.status}
                        onChange={e => updateOrdem(os.id, { status: e.target.value as OrdemServico['status'] })}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => setViewOrdem(os)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
      <>
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
                    {os.dataAgendamento && (
                      <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                        <CalendarIcon className="h-3 w-3" /> Agendado: {formatDateTime(os.dataAgendamento)}
                      </p>
                    )}
                    {os.duracaoHoras > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {os.duracaoHoras}h
                      </p>
                    )}
                  </div>
                  <Badge className={statusColor(os.status)}>{statusLabel(os.status)}</Badge>
                </div>

                {/* Materials */}
                {os.materiais && os.materiais.length > 0 && (
                  <div className="mt-2 rounded bg-muted/50 p-2">
                    <p className="text-xs font-semibold mb-1">Materiais:</p>
                    {os.materiais.map((m, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {m.nome} ({m.quantidade} {m.unidade}) — R$ {m.valor.toFixed(2)}</p>
                    ))}
                  </div>
                )}

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
      <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) resetForm(); }}>
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
                      <Package className="h-3.5 w-3.5" /> Materiais do orçamento:
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

            {catalogoServicos.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium flex items-center gap-1">
                  <Package className="h-4 w-4 text-primary" /> Selecionar do Catálogo (opcional)
                </label>
                <select
                  className="w-full rounded border bg-background px-3 py-2 text-sm"
                  value=""
                  onChange={e => {
                    const svc = catalogoServicos.find(s => s.id === e.target.value);
                    if (svc) {
                      setDescricao(prev => prev ? `${prev}\n${svc.nome}` : svc.nome);
                      setValor(prev => {
                        const current = parseFloat(prev) || 0;
                        return (current + svc.valor).toFixed(2);
                      });
                    }
                  }}
                >
                  <option value="">Escolha um serviço...</option>
                  {catalogoServicos.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} — R$ {s.valor.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe o serviço" />
            </div>

            {/* Materiais */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Package className="h-4 w-4 text-primary" /> Materiais
                </label>
                <Button type="button" size="sm" variant="outline" onClick={addMaterial}>
                  <Plus className="h-3 w-3" /> Material
                </Button>
              </div>
              {materiais.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 mb-1.5">
                  <Input className="col-span-4" placeholder="Nome" value={m.nome} onChange={e => updateMaterial(idx, 'nome', e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Qtd" value={m.quantidade || ''} onChange={e => updateMaterial(idx, 'quantidade', parseFloat(e.target.value) || 0)} />
                  <Input className="col-span-2" placeholder="un." value={m.unidade} onChange={e => updateMaterial(idx, 'unidade', e.target.value)} />
                  <Input className="col-span-3" type="number" step="0.01" placeholder="Valor" value={m.valor || ''} onChange={e => updateMaterial(idx, 'valor', parseFloat(e.target.value) || 0)} />
                  <Button type="button" variant="ghost" size="sm" className="col-span-1 p-0 text-destructive" onClick={() => removeMaterial(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" /> Duração (horas)
                </label>
                <Input type="number" step="0.5" value={duracaoHoras} onChange={e => setDuracaoHoras(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Agendamento
                </label>
                <Input type="datetime-local" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} />
              </div>
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
              {viewOrdem.dataAgendamento && (
                <p className="text-sm text-primary font-medium flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" /> Agendado: {formatDateTime(viewOrdem.dataAgendamento)}
                </p>
              )}
              {viewOrdem.duracaoHoras > 0 && <p className="text-sm flex items-center gap-1"><Clock className="h-4 w-4" /> Duração: {viewOrdem.duracaoHoras}h</p>}
              {viewOrdem.valor > 0 && <p className="text-sm font-semibold">Valor: R$ {viewOrdem.valor.toFixed(2)}</p>}
              {viewOrdem.materiais && viewOrdem.materiais.length > 0 && (
                <div className="rounded bg-muted/50 p-3">
                  <p className="text-xs font-semibold mb-1">Materiais:</p>
                  {viewOrdem.materiais.map((m, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {m.nome} ({m.quantidade} {m.unidade}) — R$ {m.valor.toFixed(2)}</p>
                  ))}
                </div>
              )}
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
      </>
      )}
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
