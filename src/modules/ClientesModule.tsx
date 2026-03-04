import { useState } from 'react';
import { Cliente, OrdemServico, Orcamento } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Users, Search, ChevronDown, Wrench, FileText, Contact, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatCpfCnpj, formatPhone, formatCep } from '@/lib/masks';

interface Props {
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  updateCliente: (id: string, updates: Partial<Cliente>) => void;
  removeCliente: (id: string) => void;
  ordens: OrdemServico[];
  orcamentos: Orcamento[];
}

interface ContactInfo {
  name?: string[];
  email?: string[];
  tel?: string[];
  address?: { city?: string; street?: string; region?: string }[];
}

async function pickContact(): Promise<ContactInfo | null> {
  try {
    const contacts = (navigator as any).contacts;
    if (!contacts) return null;
    const supported = await contacts.getProperties();
    const validProps = ['name', 'email', 'tel', 'address'].filter(p => supported.includes(p));
    const [contact] = await contacts.select(validProps, { multiple: false });
    return contact || null;
  } catch { return null; }
}

function hasContactPicker(): boolean {
  return 'contacts' in navigator && 'ContactsManager' in window;
}

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

export default function ClientesModule({ clientes, addCliente, updateCliente, removeCliente, ordens, orcamentos }: Props) {
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

  const handleCepChange = async (value: string, setters?: { setEndereco: (v: string) => void; setBairro: (v: string) => void; setCidade: (v: string) => void; setEstado: (v: string) => void }) => {
    const formatted = formatCep(value);
    if (setters) {
      // editing mode
    } else {
      setCep(formatted);
    }
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
          setEndereco(result.endereco);
          setBairro(result.bairro);
          setCidade(result.cidade);
          setEstado(result.estado);
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

  const handleImportContact = async () => {
    if (!hasContactPicker()) { toast.error('Importação de contatos não suportada neste navegador.'); return; }
    const contact = await pickContact();
    if (!contact) return;
    setNome(contact.name?.[0] || '');
    setTelefone(contact.tel?.[0] || '');
    setEmail(contact.email?.[0] || '');
    if (contact.address?.[0]) {
      const a = contact.address[0];
      setEndereco(a.street || ''); setCidade(a.city || ''); setEstado(a.region || '');
    }
    toast.success('Contato importado! Revise e salve.');
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
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpfCnpj.includes(search)
  );

  const getClienteOrdens = (id: string, nome: string) => ordens.filter(o => o.clienteId === id || o.clienteNome.toLowerCase() === nome.toLowerCase());
  const getClienteOrcamentos = (id: string, nome: string) => orcamentos.filter(o => o.clienteId === id || o.clienteNome.toLowerCase() === nome.toLowerCase());

  const statusLabel = (s: string) => {
    if (s === 'concluido') return 'Concluído';
    if (s === 'em_andamento') return 'Em andamento';
    if (s === 'aprovado') return 'Aprovado';
    if (s === 'recusado') return 'Recusado';
    return 'Pendente';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo Cliente</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleImportContact} className="gap-2">
              <Contact className="h-4 w-4" />
              <span className="hidden sm:inline">Importar da Agenda</span>
              <span className="sm:hidden">Agenda</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
                <Input value={cpfCnpj} onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefone</label>
                <Input value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">E-mail</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">CEP</label>
                <div className="relative">
                  <Input value={cep} onChange={e => { setCep(formatCep(e.target.value)); handleCepChange(e.target.value); }} placeholder="00000-000" maxLength={9} />
                  {loadingCep && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Rua / Endereço</label>
                <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div><label className="mb-1 block text-sm font-medium">Bairro</label><Input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" /></div>
              <div><label className="mb-1 block text-sm font-medium">Cidade</label><Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" /></div>
              <div><label className="mb-1 block text-sm font-medium">Estado</label><Input value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" maxLength={2} /></div>
            </div>
            <Button type="submit" className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Cadastrar</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" /> Clientes <Badge variant="secondary">{clientes.length}</Badge>
          </h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const cOrdens = getClienteOrdens(c.id, c.nome);
              const cOrcamentos = getClienteOrcamentos(c.id, c.nome);
              const totalHistorico = cOrdens.length + cOrcamentos.length;
              const enderecoCompleto = [c.endereco, c.bairro, c.cidade, c.estado].filter(Boolean).join(', ');
              return (
                <Card key={c.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{c.nome}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.telefone} {c.email && `• ${c.email}`}</p>
                        {c.cpfCnpj && <p className="text-xs text-muted-foreground">{c.cpfCnpj}</p>}
                        {enderecoCompleto && <p className="text-xs text-muted-foreground truncate">📍 {enderecoCompleto}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => setEditCliente({ ...c })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCliente(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {totalHistorico > 0 && (
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between">
                            <span className="flex items-center gap-2">📋 Histórico ({totalHistorico})</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {cOrdens.length > 0 && (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Wrench className="h-3 w-3" /> Serviços ({cOrdens.length})</p>
                              <div className="space-y-1">
                                {cOrdens.map(os => (
                                  <div key={os.id} className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0"><p className="font-medium truncate">{os.descricao}</p><p className="text-xs text-muted-foreground">{os.data} {os.valor > 0 && `• R$ ${os.valor.toFixed(2)}`}</p></div>
                                    <Badge variant="secondary" className="text-xs self-start sm:self-auto">{statusLabel(os.status)}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {cOrcamentos.length > 0 && (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><FileText className="h-3 w-3" /> Orçamentos ({cOrcamentos.length})</p>
                              <div className="space-y-1">
                                {cOrcamentos.map(orc => {
                                  const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
                                  return (
                                    <div key={orc.id} className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                      <div className="min-w-0"><p className="font-medium truncate">{orc.itens.length} itens</p><p className="text-xs text-muted-foreground">R$ {t.toFixed(2)} • {new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p></div>
                                      <Badge variant="secondary" className="text-xs self-start sm:self-auto">{statusLabel(orc.status)}</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
                <div><label className="mb-1 block text-sm font-medium">CEP</label><Input value={editCliente.cep} onChange={e => { const f = formatCep(e.target.value); setEditCliente({ ...editCliente, cep: f }); handleCepChange(e.target.value, { setEndereco: v => setEditCliente(prev => prev ? { ...prev, endereco: v } : null), setBairro: v => setEditCliente(prev => prev ? { ...prev, bairro: v } : null), setCidade: v => setEditCliente(prev => prev ? { ...prev, cidade: v } : null), setEstado: v => setEditCliente(prev => prev ? { ...prev, estado: v } : null) }); }} maxLength={9} /></div>
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
