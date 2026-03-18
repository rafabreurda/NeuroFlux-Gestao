import { useState, useMemo } from 'react';
import { Cliente, OrdemServico, Orcamento } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Users, Search, ChevronRight, Wrench, FileText, Contact, Loader2, Pencil, ArrowLeft, Navigation, Map, PlusCircle, RefreshCw, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { formatCpfCnpj, formatPhone, formatCep } from '@/lib/masks';

interface Props {
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  updateCliente: (id: string, updates: Partial<Cliente>) => void;
  removeCliente: (id: string) => void;
  ordens: OrdemServico[];
  orcamentos: Orcamento[];
  addOrdem: (o: Omit<OrdemServico, 'id' | 'criadoEm' | 'fotoAntes' | 'fotoDepois' | 'status'>) => void;
}

interface ContactInfo {
  name?: string[];
  email?: string[];
  tel?: string[];
  address?: { city?: string; street?: string; region?: string }[];
}

// Importar MÚLTIPLOS contatos da agenda do celular
async function pickContacts(): Promise<ContactInfo[]> {
  try {
    const contacts = (navigator as any).contacts;
    if (!contacts) return [];
    const supported = await contacts.getProperties();
    const validProps = ['name', 'email', 'tel', 'address'].filter(p => supported.includes(p));
    const result = await contacts.select(validProps, { multiple: true });
    return result || [];
  } catch { return []; }
}

function hasContactPicker(): boolean {
  return 'contacts' in navigator && 'ContactsManager' in window;
}

// Tenta Capacitor Contacts (app nativo) via objeto global — sem import estático
async function getAllContactsNative(): Promise<ContactInfo[]> {
  try {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return [];
    // No app nativo o plugin é injetado globalmente pelo Capacitor
    const Contacts = (window as any).CapacitorCommunityContacts;
    if (!Contacts) return [];
    const perm = await Contacts.requestPermissions();
    if (perm.contacts !== 'granted') return [];
    const { contacts } = await Contacts.getContacts({ projection: { name: true, phones: true, emails: true } });
    return contacts.map((c: any) => ({
      name: c.name?.display ? [c.name.display] : undefined,
      tel: c.phones?.map((p: any) => p.number),
      email: c.emails?.map((e: any) => e.address),
    }));
  } catch {
    return [];
  }
}

const SYNC_KEY = 'neuroflux_contacts_last_sync';

async function fetchCep(cep: string) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return { endereco: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' };
  } catch { return null; }
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ClientesModule({ clientes, addCliente, updateCliente, removeCliente, ordens, orcamentos, addOrdem }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [search, setSearch] = useState('');
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showNovoServico, setShowNovoServico] = useState(false);
  const [osDescricao, setOsDescricao] = useState('');
  const [osData, setOsData] = useState(new Date().toISOString().split('T')[0]);
  const [osValor, setOsValor] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false);
  const lastSync = localStorage.getItem(SYNC_KEY);

  const handleCepChange = async (value: string, setters?: { setEndereco: (v: string) => void; setBairro: (v: string) => void; setCidade: (v: string) => void; setEstado: (v: string) => void }) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCep(true);
      const result = await fetchCep(digits);
      setLoadingCep(false);
      if (result) {
        if (setters) {
          setters.setEndereco(result.endereco);
          setters.setBairro(result.bairro);
          setters.setCidade(result.cidade);
          setters.setEstado(result.estado);
        } else {
          setEndereco(result.endereco); setBairro(result.bairro); setCidade(result.cidade); setEstado(result.estado);
        }
        toast.success('Endereço preenchido automaticamente!');
      } else {
        toast.error('CEP não encontrado.');
      }
    }
  };

  const resetForm = () => {
    setNome(''); setTelefone(''); setEmail(''); setCpfCnpj('');
    setCep(''); setEndereco(''); setBairro(''); setCidade(''); setEstado('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) { toast.error('Preencha o nome'); return; }
    addCliente({ nome, telefone, email, cpfCnpj, cep: cep.replace(/\D/g, ''), endereco, bairro, cidade, estado });
    resetForm();
    toast.success('Cliente cadastrado!');
  };

  // Sincronizar contatos da agenda do telefone
  const handleSyncContacts = async () => {
    setSyncing(true);
    let contacts: ContactInfo[] = [];

    // Tenta nativo (Capacitor) primeiro
    contacts = await getAllContactsNative();

    // Fallback: Contact Picker API (browser/PWA)
    if (contacts.length === 0) {
      if (!hasContactPicker()) {
        toast.error('Sincronização de contatos não suportada neste navegador. Use o app instalado no celular.');
        setSyncing(false);
        return;
      }
      contacts = await pickContacts();
    }

    if (contacts.length === 0) {
      toast('Nenhum contato selecionado.');
      setSyncing(false);
      return;
    }

    let importados = 0;
    let duplicados = 0;

    for (const contact of contacts) {
      const nomeContato = contact.name?.[0]?.trim();
      if (!nomeContato) continue;

      // Verificar se já existe (por nome ou telefone)
      const telefoneContato = contact.tel?.[0] || '';
      const jaExiste = clientes.some(
        c => c.nome.toLowerCase() === nomeContato.toLowerCase() ||
          (telefoneContato && c.telefone && c.telefone.replace(/\D/g, '') === telefoneContato.replace(/\D/g, ''))
      );

      if (jaExiste) { duplicados++; continue; }

      addCliente({
        nome: nomeContato,
        telefone: contact.tel?.[0] || '',
        email: contact.email?.[0] || '',
        cpfCnpj: '',
        cep: '',
        endereco: contact.address?.[0]?.street || '',
        bairro: '',
        cidade: contact.address?.[0]?.city || '',
        estado: contact.address?.[0]?.region || '',
      });
      importados++;
    }

    localStorage.setItem(SYNC_KEY, new Date().toISOString());
    setSyncing(false);

    if (importados > 0) {
      toast.success(`${importados} contato${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''}!${duplicados > 0 ? ` (${duplicados} já existiam)` : ''}`);
    } else if (duplicados > 0) {
      toast('Todos os contatos selecionados já estão cadastrados.');
    }
  };

  const handleSaveEdit = () => {
    if (!editCliente) return;
    updateCliente(editCliente.id, {
      nome: editCliente.nome, telefone: editCliente.telefone, email: editCliente.email,
      cpfCnpj: editCliente.cpfCnpj, cep: editCliente.cep, endereco: editCliente.endereco,
      bairro: editCliente.bairro, cidade: editCliente.cidade, estado: editCliente.estado,
    });
    toast.success('Cliente atualizado!');
    setEditCliente(null);
    if (selectedCliente?.id === editCliente.id) setSelectedCliente(editCliente);
  };

  const sortedFiltered = useMemo(() => {
    const base = clientes
      .filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpfCnpj.includes(search))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (activeLetter) return base.filter(c => c.nome[0]?.toUpperCase() === activeLetter);
    return base;
  }, [clientes, search, activeLetter]);

  const groupedClientes = useMemo(() => {
    const groups: Record<string, Cliente[]> = {};
    sortedFiltered.forEach(c => {
      const letter = c.nome[0]?.toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });
    return groups;
  }, [sortedFiltered]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach(c => { const l = c.nome[0]?.toUpperCase(); if (l) set.add(l); });
    return set;
  }, [clientes]);

  const getClienteOrdens = (id: string, nome: string) => ordens.filter(o => o.clienteId === id || o.clienteNome.toLowerCase() === nome.toLowerCase());
  const getClienteOrcamentos = (id: string, nome: string) => orcamentos.filter(o => o.clienteId === id || o.clienteNome.toLowerCase() === nome.toLowerCase());

  const statusLabel = (s: string) => {
    if (s === 'concluido') return 'Concluído';
    if (s === 'em_andamento') return 'Em andamento';
    if (s === 'aprovado') return 'Aprovado';
    if (s === 'recusado') return 'Recusado';
    return 'Pendente';
  };

  // ==================== DETAIL VIEW ====================
  if (selectedCliente) {
    const cOrdens = getClienteOrdens(selectedCliente.id, selectedCliente.nome);
    const cOrcamentos = getClienteOrcamentos(selectedCliente.id, selectedCliente.nome);
    const enderecoCompleto = [selectedCliente.endereco, selectedCliente.bairro, selectedCliente.cidade, selectedCliente.estado].filter(Boolean).join(', ');

    return (
      <div className="space-y-4 pb-24">
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => { setSelectedCliente(null); setShowNovoServico(false); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{selectedCliente.nome}</h2>
            {selectedCliente.telefone && (
              <a href={`tel:${selectedCliente.telefone}`} className="flex items-center gap-1 text-sm text-primary">
                <PhoneCall className="h-3.5 w-3.5" /> {selectedCliente.telefone}
              </a>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setEditCliente({ ...selectedCliente })}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => { removeCliente(selectedCliente.id); setSelectedCliente(null); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Novo Serviço inline form */}
        {showNovoServico && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Nova OS — {selectedCliente.nome}</h4>
              <div>
                <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
                <Textarea value={osDescricao} onChange={e => setOsDescricao(e.target.value)} placeholder="Detalhe o serviço..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Data</label>
                  <Input type="date" value={osData} onChange={e => setOsData(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
                  <Input type="number" step="0.01" value={osValor} onChange={e => setOsValor(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  if (!osDescricao) { toast.error('Preencha a descrição'); return; }
                  addOrdem({ clienteId: selectedCliente.id, clienteNome: selectedCliente.nome, descricao: osDescricao, data: osData, codigo: '', valor: parseFloat(osValor) || 0 });
                  setOsDescricao(''); setOsValor(''); setShowNovoServico(false);
                  toast.success('Serviço criado!');
                }}>
                  <Plus className="h-4 w-4" /> Salvar OS
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowNovoServico(false); setOsDescricao(''); setOsValor(''); }}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Cadastro / Histórico */}
        <Tabs defaultValue="cadastro">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
            <TabsTrigger value="historico">Histórico ({cOrdens.length + cOrcamentos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                {selectedCliente.email && <p className="text-sm"><span className="font-medium text-muted-foreground">E-mail:</span> {selectedCliente.email}</p>}
                {selectedCliente.cpfCnpj && <p className="text-sm"><span className="font-medium text-muted-foreground">CPF/CNPJ:</span> {selectedCliente.cpfCnpj}</p>}
                {selectedCliente.cep && <p className="text-sm"><span className="font-medium text-muted-foreground">CEP:</span> {formatCep(selectedCliente.cep)}</p>}
                {enderecoCompleto && (
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium text-muted-foreground">Endereço:</span> {enderecoCompleto}</p>
                    <div className="flex gap-2 pt-1">
                      <a href={`https://waze.com/ul?q=${encodeURIComponent(enderecoCompleto)}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 text-xs font-bold hover:bg-sky-500/20">
                        <Navigation size={13} /> Waze
                      </a>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(enderecoCompleto)}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500/20">
                        <Map size={13} /> Google Maps
                      </a>
                    </div>
                  </div>
                )}
                {!selectedCliente.telefone && !selectedCliente.email && !selectedCliente.cpfCnpj && !enderecoCompleto && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado adicional cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-4 space-y-4">
            {cOrdens.length === 0 && cOrcamentos.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhum serviço ou orçamento registrado.</CardContent></Card>
            ) : (
              <>
                {cOrdens.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wrench className="h-4 w-4 text-primary" /> Serviços ({cOrdens.length})</h4>
                    <div className="space-y-2">
                      {cOrdens.map(os => (
                        <Card key={os.id}>
                          <CardContent className="p-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{os.descricao}</p>
                              <p className="text-xs text-muted-foreground">{os.data}{os.valor > 0 && ` • R$ ${os.valor.toFixed(2)}`}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs self-start sm:self-auto">{statusLabel(os.status)}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {cOrcamentos.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Orçamentos ({cOrcamentos.length})</h4>
                    <div className="space-y-2">
                      {cOrcamentos.map(orc => {
                        const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
                        return (
                          <Card key={orc.id}>
                            <CardContent className="p-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{orc.itens.length} item(ns)</p>
                                <p className="text-xs text-muted-foreground">R$ {t.toFixed(2)} • {new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs self-start sm:self-auto">{statusLabel(orc.status)}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating "Novo Serviço" button in detail view */}
        <button
          onClick={() => { setShowNovoServico(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg font-semibold transition-transform active:scale-95 hover:scale-105 lg:bottom-8 lg:right-8"
        >
          <PlusCircle className="h-5 w-5" /> Novo Serviço
        </button>

        {/* Edit Dialog */}
        <Dialog open={!!editCliente} onOpenChange={() => setEditCliente(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
            {editCliente && (
              <div className="space-y-3">
                <div><label className="mb-1 block text-sm font-medium">Nome</label><Input value={editCliente.nome} onChange={e => setEditCliente({ ...editCliente, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-sm font-medium">CPF/CNPJ</label><Input value={editCliente.cpfCnpj} onChange={e => setEditCliente({ ...editCliente, cpfCnpj: formatCpfCnpj(e.target.value) })} /></div>
                  <div><label className="mb-1 block text-sm font-medium">Telefone</label><Input value={editCliente.telefone} onChange={e => setEditCliente({ ...editCliente, telefone: formatPhone(e.target.value) })} /></div>
                </div>
                <div><label className="mb-1 block text-sm font-medium">E-mail</label><Input value={editCliente.email} onChange={e => setEditCliente({ ...editCliente, email: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="mb-1 block text-sm font-medium">CEP</label>
                    <Input value={editCliente.cep} onChange={e => { const f = formatCep(e.target.value); setEditCliente({ ...editCliente, cep: f }); handleCepChange(e.target.value, { setEndereco: v => setEditCliente(prev => prev ? { ...prev, endereco: v } : null), setBairro: v => setEditCliente(prev => prev ? { ...prev, bairro: v } : null), setCidade: v => setEditCliente(prev => prev ? { ...prev, cidade: v } : null), setEstado: v => setEditCliente(prev => prev ? { ...prev, estado: v } : null) }); }} maxLength={9} />
                  </div>
                  <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Endereço</label><Input value={editCliente.endereco} onChange={e => setEditCliente({ ...editCliente, endereco: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="mb-1 block text-sm font-medium">Bairro</label><Input value={editCliente.bairro} onChange={e => setEditCliente({ ...editCliente, bairro: e.target.value })} /></div>
                  <div><label className="mb-1 block text-sm font-medium">Cidade</label><Input value={editCliente.cidade} onChange={e => setEditCliente({ ...editCliente, cidade: e.target.value })} /></div>
                  <div><label className="mb-1 block text-sm font-medium">Estado</label><Input value={editCliente.estado} onChange={e => setEditCliente({ ...editCliente, estado: e.target.value })} maxLength={2} /></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCliente(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ==================== LISTA DE CLIENTES ====================
  return (
    <div className="space-y-3">
      {/* Sync banner — aparece se faz mais de 1 dia sem sincronizar */}
      {hasContactPicker() && (!lastSync || Date.now() - new Date(lastSync).getTime() > 86_400_000) && clientes.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <p className="text-xs text-primary font-medium">Sincronizar contatos do celular?</p>
          <Button size="sm" variant="default" onClick={handleSyncContacts} disabled={syncing} className="gap-2 h-8 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      )}

      {/* Search + sync button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou CPF..." value={search} onChange={e => { setSearch(e.target.value); setActiveLetter(null); }} />
        </div>
        <Button variant="outline" size="icon" onClick={handleSyncContacts} disabled={syncing} title="Sincronizar com contatos do celular">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Client list */}
      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Users className="h-12 w-12 opacity-30" />
            <p className="text-sm">Nenhum cliente cadastrado</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button onClick={() => setShowNovoClienteDialog(true)}>
                <Plus className="h-4 w-4" /> Novo Cliente
              </Button>
              <Button variant="outline" onClick={handleSyncContacts} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Importar da Agenda
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <div className="sticky top-0 flex flex-col items-center gap-0.5 py-1 self-start">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                className={`h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                  activeLetter === letter
                    ? 'bg-primary text-primary-foreground'
                    : availableLetters.has(letter)
                      ? 'text-muted-foreground hover:bg-muted'
                      : 'text-muted-foreground/25 pointer-events-none'
                }`}
                onClick={() => setActiveLetter(letter === activeLetter ? null : letter)}
                disabled={!availableLetters.has(letter)}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {sortedFiltered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedClientes).map(([letter, group]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-10 mb-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{letter}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-1">
                      {group.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCliente(c)}
                          className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-medium truncate block">{c.nome}</span>
                            {c.telefone && <span className="text-xs text-muted-foreground">{c.telefone}</span>}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating add button */}
      <button
        onClick={() => setShowNovoClienteDialog(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 hover:scale-105 lg:bottom-8 lg:right-8"
        aria-label="Novo Cliente"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Client Dialog */}
      <Dialog open={showNovoClienteDialog} onOpenChange={open => { setShowNovoClienteDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Novo Cliente
              <Button type="button" variant="outline" size="sm" onClick={async () => {
                const contacts = await pickContacts();
                const c = contacts[0];
                if (!c) return;
                setNome(c.name?.[0] || '');
                setTelefone(c.tel?.[0] || '');
                setEmail(c.email?.[0] || '');
                if (c.address?.[0]) { setEndereco(c.address[0].street || ''); setCidade(c.address[0].city || ''); setEstado(c.address[0].region || ''); }
                toast.success('Contato importado!');
              }} className="gap-2 text-xs">
                <Contact className="h-4 w-4" /> Importar
              </Button>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { handleSubmit(e); setShowNovoClienteDialog(false); }} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium">Nome</label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" /></div>
              <div><label className="mb-1 block text-sm font-medium">CPF / CNPJ</label><Input value={cpfCnpj} onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" /></div>
              <div><label className="mb-1 block text-sm font-medium">Telefone</label><Input value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" /></div>
              <div><label className="mb-1 block text-sm font-medium">E-mail</label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">CEP</label>
                <div className="relative">
                  <Input value={cep} onChange={e => { setCep(formatCep(e.target.value)); handleCepChange(e.target.value); }} placeholder="00000-000" maxLength={9} />
                  {loadingCep && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Rua / Endereço</label><Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="mb-1 block text-sm font-medium">Bairro</label><Input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" /></div>
              <div><label className="mb-1 block text-sm font-medium">Cidade</label><Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" /></div>
              <div><label className="mb-1 block text-sm font-medium">Estado</label><Input value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" maxLength={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowNovoClienteDialog(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit"><Plus className="h-4 w-4" /> Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCliente} onOpenChange={() => setEditCliente(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {editCliente && (
            <div className="space-y-3">
              <div><label className="mb-1 block text-sm font-medium">Nome</label><Input value={editCliente.nome} onChange={e => setEditCliente({ ...editCliente, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium">CPF/CNPJ</label><Input value={editCliente.cpfCnpj} onChange={e => setEditCliente({ ...editCliente, cpfCnpj: formatCpfCnpj(e.target.value) })} /></div>
                <div><label className="mb-1 block text-sm font-medium">Telefone</label><Input value={editCliente.telefone} onChange={e => setEditCliente({ ...editCliente, telefone: formatPhone(e.target.value) })} /></div>
              </div>
              <div><label className="mb-1 block text-sm font-medium">E-mail</label><Input value={editCliente.email} onChange={e => setEditCliente({ ...editCliente, email: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-sm font-medium">CEP</label>
                  <Input value={editCliente.cep} onChange={e => { const f = formatCep(e.target.value); setEditCliente({ ...editCliente, cep: f }); handleCepChange(e.target.value, { setEndereco: v => setEditCliente(prev => prev ? { ...prev, endereco: v } : null), setBairro: v => setEditCliente(prev => prev ? { ...prev, bairro: v } : null), setCidade: v => setEditCliente(prev => prev ? { ...prev, cidade: v } : null), setEstado: v => setEditCliente(prev => prev ? { ...prev, estado: v } : null) }); }} maxLength={9} />
                </div>
                <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Endereço</label><Input value={editCliente.endereco} onChange={e => setEditCliente({ ...editCliente, endereco: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-sm font-medium">Bairro</label><Input value={editCliente.bairro} onChange={e => setEditCliente({ ...editCliente, bairro: e.target.value })} /></div>
                <div><label className="mb-1 block text-sm font-medium">Cidade</label><Input value={editCliente.cidade} onChange={e => setEditCliente({ ...editCliente, cidade: e.target.value })} /></div>
                <div><label className="mb-1 block text-sm font-medium">Estado</label><Input value={editCliente.estado} onChange={e => setEditCliente({ ...editCliente, estado: e.target.value })} maxLength={2} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCliente(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
