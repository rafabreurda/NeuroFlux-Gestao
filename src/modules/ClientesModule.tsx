import { useState } from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  removeCliente: (id: string) => void;
}

export default function ClientesModule({ clientes, addCliente, removeCliente }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) { toast.error('Preencha o nome'); return; }
    addCliente({ nome, telefone, email, cpfCnpj, endereco });
    setNome(''); setTelefone(''); setEmail(''); setCpfCnpj(''); setEndereco('');
    toast.success('Cliente cadastrado!');
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpfCnpj.includes(search)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
                <Input value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefone</label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">E-mail</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Endereço</label>
              <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
            <Button type="submit"><Plus className="h-4 w-4" /> Cadastrar</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" /> Clientes <Badge variant="secondary">{clientes.length}</Badge>
          </h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-sm text-muted-foreground">{c.telefone} {c.email && `• ${c.email}`}</p>
                    {c.cpfCnpj && <p className="text-xs text-muted-foreground">{c.cpfCnpj}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCliente(c.id)}>
                    <Trash2 className="h-4 w-4" />
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
