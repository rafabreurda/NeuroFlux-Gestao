import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Users, Trash2, Key, Eye, EyeOff, ChevronDown, ChevronUp,
  CreditCard, FileText, Upload, Download, AlertTriangle, Plus, CalendarIcon,
  Ban, CheckCircle, Clock,
} from 'lucide-react';
import { formatCpfCnpj, formatPhone } from '@/lib/masks';

interface Plano {
  id: string;
  user_id: string;
  nome_plano: string;
  valor: number;
  data_inicio: string;
  data_vencimento: string;
  observacoes: string;
}

interface Contrato {
  id: string;
  user_id: string;
  nome_arquivo: string;
  storage_path: string;
  created_at: string;
}

interface ManagedUser {
  user_id: string;
  username: string;
  nome: string;
  email: string;
  cpf: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  empresa: string;
  role: string;
  senha_texto: string | null;
  blocked: boolean;
  last_seen: string | null;
  planos: Plano[];
  contratos: Contrato[];
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

function diasParaVencimento(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [resetPassword, setResetPassword] = useState<Record<string, string>>({});
  const [activeUserTab, setActiveUserTab] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Plan form state
  const [planoForm, setPlanoForm] = useState<Record<string, { nomePlano: string; valor: string; dataInicio: string; dataVencimento: string; observacoes: string }>>({});

  const [form, setForm] = useState({
    username: '', password: '', nome: '', cpf: '', telefone: '',
    endereco: '', bairro: '', cidade: '', estado: '', empresa: '', cnpj: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-users', {
        body: { action: 'list-users' },
      });
      if (res.data?.users) {
        setUsers(res.data.users.filter((u: ManagedUser) => u.role !== 'admin'));
      }
    } catch (err) {
      console.error('UserManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Check for expiring plans
  const expiringPlans = users.flatMap(u =>
    (u.planos || [])
      .filter(p => diasParaVencimento(p.data_vencimento) <= 7 && diasParaVencimento(p.data_vencimento) >= 0)
      .map(p => ({ ...p, userName: u.nome || u.username }))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Usuário e senha são obrigatórios'); return; }
    const res = await supabase.functions.invoke('admin-users', { body: { action: 'create-user', ...form } });
    if (res.data?.error) { toast.error(res.data.error); }
    else if (res.data?.success) {
      toast.success('Usuário criado com sucesso!');
      setForm({ username: '', password: '', nome: '', cpf: '', telefone: '', endereco: '', bairro: '', cidade: '', estado: '', empresa: '', cnpj: '' });
      setShowForm(false);
      fetchUsers();
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPwd = resetPassword[userId];
    if (!newPwd || newPwd.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    const res = await supabase.functions.invoke('admin-users', { body: { action: 'reset-password', userId, newPassword: newPwd } });
    if (res.data?.success) { toast.success('Senha resetada!'); setResetPassword(prev => ({ ...prev, [userId]: '' })); fetchUsers(); }
    else { toast.error(res.data?.error || 'Erro ao resetar senha'); }
  };

  const handleDelete = async (userId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;
    const res = await supabase.functions.invoke('admin-users', { body: { action: 'delete-user', userId } });
    if (res.data?.success) { toast.success('Usuário excluído'); fetchUsers(); }
    else { toast.error(res.data?.error || 'Erro ao excluir'); }
  };

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'unblock-user' : 'block-user';
    const res = await supabase.functions.invoke('admin-users', { body: { action, userId } });
    if (res.data?.success) {
      toast.success(currentlyBlocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!');
      fetchUsers();
    } else {
      toast.error(res.data?.error || 'Erro');
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'Nunca';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleAddPlano = async (userId: string) => {
    const pf = planoForm[userId];
    if (!pf?.nomePlano || !pf?.dataVencimento) { toast.error('Preencha o nome do plano e a data de vencimento'); return; }
    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'add-plano', userId, nomePlano: pf.nomePlano, valor: parseFloat(pf.valor) || 0, dataInicio: pf.dataInicio || new Date().toISOString().split('T')[0], dataVencimento: pf.dataVencimento, observacoes: pf.observacoes || '' },
    });
    if (res.data?.success) { toast.success('Plano adicionado!'); setPlanoForm(prev => ({ ...prev, [userId]: { nomePlano: '', valor: '', dataInicio: '', dataVencimento: '', observacoes: '' } })); fetchUsers(); }
    else { toast.error(res.data?.error || 'Erro'); }
  };

  const handleDeletePlano = async (planoId: string) => {
    if (!confirm('Excluir este plano?')) return;
    const res = await supabase.functions.invoke('admin-users', { body: { action: 'delete-plano', planoId } });
    if (res.data?.success) { toast.success('Plano excluído'); fetchUsers(); }
  };

  const handleUploadContrato = async (userId: string, file: File) => {
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('contratos').upload(path, file);
    if (uploadError) { toast.error('Erro ao fazer upload: ' + uploadError.message); return; }
    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'add-contrato', userId, nomeArquivo: file.name, storagePath: path },
    });
    if (res.data?.success) { toast.success('Contrato anexado!'); fetchUsers(); }
    else { toast.error('Erro ao salvar contrato'); }
  };

  const handleDownloadContrato = async (storagePath: string) => {
    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'get-contrato-url', storagePath },
    });
    if (res.data?.url) { window.open(res.data.url, '_blank'); }
    else { toast.error('Erro ao obter link do contrato'); }
  };

  const handleDeleteContrato = async (contratoId: string, storagePath: string) => {
    if (!confirm('Excluir este contrato?')) return;
    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete-contrato', contratoId, storagePath },
    });
    if (res.data?.success) { toast.success('Contrato excluído'); fetchUsers(); }
  };

  const getPlanoForm = (userId: string) => planoForm[userId] || { nomePlano: '', valor: '', dataInicio: new Date().toISOString().split('T')[0], dataVencimento: '', observacoes: '' };
  const setPlano = (userId: string, key: string, val: string) => setPlanoForm(prev => ({ ...prev, [userId]: { ...getPlanoForm(userId), [key]: val } }));


  return (
    <div className="space-y-4">
      {/* Expiring plans alert */}
      {expiringPlans.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive mb-1">
              <AlertTriangle className="h-4 w-4" /> Planos próximos do vencimento
            </p>
            {expiringPlans.map(p => {
              const dias = diasParaVencimento(p.data_vencimento);
              return (
                <p key={p.id} className="text-xs text-destructive/80">
                  • {p.userName} — {p.nome_plano} vence {dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`} ({new Date(p.data_vencimento).toLocaleDateString('pt-BR')})
                </p>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" /> Usuários Cadastrados
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      </div>

      {/* Hidden file input for contracts */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadingFor) { handleUploadContrato(uploadingFor, file); }
          setUploadingFor(null);
          e.target.value = '';
        }}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cadastrar Novo Usuário</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><Label>Nome de Usuário (login) *</Label><Input value={form.username} onChange={e => set('username', e.target.value)} placeholder="Ex: joao.silva" required /></div>
                <div><Label>Senha *</Label><Input value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} /></div>
              </div>
              <div><Label>Nome Completo</Label><Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do usuário" /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><Label>CPF</Label><Input value={form.cpf} onChange={e => set('cpf', formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" /></div>
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" /></div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><Label>Empresa</Label><Input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" /></div>
                <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => set('cnpj', formatCpfCnpj(e.target.value))} placeholder="00.000.000/0001-00" /></div>
              </div>
              <div><Label>Endereço</Label><Input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" /></div>
                <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" /></div>
                <div>
                  <Label>Estado</Label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">UF</option>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Criar Usuário</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : users.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum usuário cadastrado ainda.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const userTab = activeUserTab[u.user_id] || 'dados';
            const isExpanded = expandedUser === u.user_id;
            const planosVencendo = (u.planos || []).filter(p => diasParaVencimento(p.data_vencimento) <= 7 && diasParaVencimento(p.data_vencimento) >= 0);

            return (
              <Card key={u.user_id} className={u.blocked ? 'opacity-60 border-destructive/30' : ''}>
                <CardContent className="p-3">
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div>
                        <p className="font-medium flex items-center gap-1.5">
                          {u.nome || u.username || 'Sem nome'}
                          {u.blocked && <Ban className="h-4 w-4 text-destructive" />}
                        </p>
                        <p className="text-xs text-muted-foreground">Login: <span className="font-mono">{u.username}</span></p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Último acesso: {formatLastSeen(u.last_seen)}
                        </p>
                      </div>
                      {u.blocked && (
                        <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                      )}
                      {planosVencendo.length > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> Vencendo
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 border-t pt-3">
                      <Tabs value={userTab} onValueChange={v => setActiveUserTab(prev => ({ ...prev, [u.user_id]: v }))}>
                        <TabsList className="w-full flex-wrap mb-3">
                          <TabsTrigger value="dados" className="flex-1 text-xs"><Users className="h-3 w-3 mr-1" /> Dados</TabsTrigger>
                          <TabsTrigger value="planos" className="flex-1 text-xs"><CreditCard className="h-3 w-3 mr-1" /> Planos</TabsTrigger>
                          <TabsTrigger value="contratos" className="flex-1 text-xs"><FileText className="h-3 w-3 mr-1" /> Contratos</TabsTrigger>
                        </TabsList>

                        {/* ===== DADOS ===== */}
                        <TabsContent value="dados" className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">CPF:</span> {u.cpf || '-'}</div>
                            <div><span className="text-muted-foreground">Tel:</span> {u.telefone || '-'}</div>
                            <div><span className="text-muted-foreground">Empresa:</span> {u.empresa || '-'}</div>
                            <div><span className="text-muted-foreground">CNPJ:</span> {u.cnpj || '-'}</div>
                            <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {u.endereco || '-'}, {u.bairro || '-'}, {u.cidade || '-'} - {u.estado || '-'}</div>
                          </div>

                          <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                            <Key className="h-4 w-4 text-primary" />
                            <span>Senha:</span>
                            {u.senha_texto ? (
                              <>
                                <span className="font-mono font-medium">
                                  {showPassword[u.user_id] ? u.senha_texto : '••••••'}
                                </span>
                                <button onClick={() => setShowPassword(prev => ({ ...prev, [u.user_id]: !prev[u.user_id] }))}>
                                  {showPassword[u.user_id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">Não registrada</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Nova senha (min 6)"
                              value={resetPassword[u.user_id] || ''}
                              onChange={e => setResetPassword(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                              className="flex-1"
                            />
                            <Button size="sm" variant="outline" onClick={() => handleResetPassword(u.user_id)}>
                              <Key className="h-4 w-4 mr-1" /> Resetar
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant={u.blocked ? 'outline' : 'secondary'} onClick={() => handleToggleBlock(u.user_id, u.blocked)}>
                              {u.blocked ? <><CheckCircle className="h-4 w-4 mr-1" /> Desbloquear</> : <><Ban className="h-4 w-4 mr-1" /> Bloquear</>}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(u.user_id, u.nome || u.username)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Excluir
                            </Button>
                          </div>
                        </TabsContent>

                        {/* ===== PLANOS ===== */}
                        <TabsContent value="planos" className="space-y-3">
                          {(u.planos || []).length > 0 && (
                            <div className="space-y-2">
                              {u.planos.map(p => {
                                const dias = diasParaVencimento(p.data_vencimento);
                                const vencido = dias < 0;
                                const proximo = dias >= 0 && dias <= 7;
                                return (
                                  <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 ${vencido ? 'border-destructive/50 bg-destructive/5' : proximo ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
                                    <div>
                                      <p className="font-medium text-sm">{p.nome_plano}</p>
                                      <p className="text-xs text-muted-foreground">R$ {Number(p.valor).toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {new Date(p.data_inicio).toLocaleDateString('pt-BR')} → {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                                      </p>
                                      {vencido && <Badge variant="destructive" className="text-[10px] mt-1">Vencido há {Math.abs(dias)} dias</Badge>}
                                      {proximo && !vencido && <Badge className="text-[10px] mt-1 bg-yellow-500">Vence {dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`}</Badge>}
                                      {p.observacoes && <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>}
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeletePlano(p.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="rounded-lg border p-3 space-y-2">
                            <p className="text-sm font-semibold flex items-center gap-1"><Plus className="h-4 w-4" /> Novo Plano</p>
                            <Input placeholder="Nome do plano" value={getPlanoForm(u.user_id).nomePlano} onChange={e => setPlano(u.user_id, 'nomePlano', e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="number" step="0.01" placeholder="Valor (R$)" value={getPlanoForm(u.user_id).valor} onChange={e => setPlano(u.user_id, 'valor', e.target.value)} />
                              <Input placeholder="Observações" value={getPlanoForm(u.user_id).observacoes} onChange={e => setPlano(u.user_id, 'observacoes', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Início</Label>
                                <Input type="date" value={getPlanoForm(u.user_id).dataInicio} onChange={e => setPlano(u.user_id, 'dataInicio', e.target.value)} />
                              </div>
                              <div>
                                <Label className="text-xs">Vencimento</Label>
                                <Input type="date" value={getPlanoForm(u.user_id).dataVencimento} onChange={e => setPlano(u.user_id, 'dataVencimento', e.target.value)} />
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleAddPlano(u.user_id)} className="w-full">
                              <Plus className="h-4 w-4 mr-1" /> Adicionar Plano
                            </Button>
                          </div>
                        </TabsContent>

                        {/* ===== CONTRATOS ===== */}
                        <TabsContent value="contratos" className="space-y-3">
                          {(u.contratos || []).length > 0 && (
                            <div className="space-y-2">
                              {u.contratos.map(c => (
                                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                                  <div>
                                    <p className="text-sm font-medium flex items-center gap-1"><FileText className="h-4 w-4 text-primary" /> {c.nome_arquivo}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleDownloadContrato(c.storage_path)}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteContrato(c.id, c.storage_path)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button variant="outline" className="w-full" onClick={() => { setUploadingFor(u.user_id); fileInputRef.current?.click(); }}>
                            <Upload className="h-4 w-4 mr-1" /> Anexar Contrato
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
