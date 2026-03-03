import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Users, Trash2, Key, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface ManagedUser {
  user_id: string;
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
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [createdPasswords, setCreatedPasswords] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [resetPassword, setResetPassword] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    email: '', password: '', nome: '', cpf: '', telefone: '',
    endereco: '', bairro: '', cidade: '', estado: '', empresa: '', cnpj: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'list-users' },
    });

    if (res.data?.users) {
      setUsers(res.data.users.filter((u: ManagedUser) => u.role !== 'admin'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email e senha são obrigatórios');
      return;
    }

    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'create-user', ...form },
    });

    if (res.data?.error) {
      toast.error(res.data.error);
    } else if (res.data?.success) {
      toast.success('Usuário criado com sucesso!');
      // Store initial password for visibility
      setCreatedPasswords(prev => ({
        ...prev,
        [res.data.user.id]: form.password,
      }));
      setForm({ email: '', password: '', nome: '', cpf: '', telefone: '', endereco: '', bairro: '', cidade: '', estado: '', empresa: '', cnpj: '' });
      setShowForm(false);
      fetchUsers();
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPwd = resetPassword[userId];
    if (!newPwd || newPwd.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'reset-password', userId, newPassword: newPwd },
    });

    if (res.data?.success) {
      toast.success('Senha resetada!');
      setCreatedPasswords(prev => ({ ...prev, [userId]: newPwd }));
      setResetPassword(prev => ({ ...prev, [userId]: '' }));
    } else {
      toast.error(res.data?.error || 'Erro ao resetar senha');
    }
  };

  const handleDelete = async (userId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;

    const res = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete-user', userId },
    });

    if (res.data?.success) {
      toast.success('Usuário excluído');
      fetchUsers();
    } else {
      toast.error(res.data?.error || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" /> Usuários Cadastrados
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastrar Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@email.com" required />
                </div>
                <div>
                  <Label>Senha Inicial *</Label>
                  <Input value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
              </div>
              <div>
                <Label>Nome Completo</Label>
                <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
                </div>
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
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum usuário cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.user_id}>
              <CardContent className="p-3">
                <button
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                >
                  <div>
                    <p className="font-medium">{u.nome || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {expandedUser === u.user_id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {expandedUser === u.user_id && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">CPF:</span> {u.cpf || '-'}</div>
                      <div><span className="text-muted-foreground">Tel:</span> {u.telefone || '-'}</div>
                      <div><span className="text-muted-foreground">Empresa:</span> {u.empresa || '-'}</div>
                      <div><span className="text-muted-foreground">CNPJ:</span> {u.cnpj || '-'}</div>
                      <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {u.endereco || '-'}, {u.bairro || '-'}, {u.cidade || '-'} - {u.estado || '-'}</div>
                    </div>

                    {createdPasswords[u.user_id] && (
                      <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                        <Key className="h-4 w-4 text-primary" />
                        <span>Senha atual:</span>
                        <span className="font-mono font-medium">
                          {showPassword[u.user_id] ? createdPasswords[u.user_id] : '••••••'}
                        </span>
                        <button onClick={() => setShowPassword(prev => ({ ...prev, [u.user_id]: !prev[u.user_id] }))}>
                          {showPassword[u.user_id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}

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

                    <Button size="sm" variant="destructive" onClick={() => handleDelete(u.user_id, u.nome)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir Usuário
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
