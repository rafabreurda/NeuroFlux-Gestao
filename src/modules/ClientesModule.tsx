import { useState } from 'react';
import { Cliente, OrdemServico, Orcamento } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, Users, Search, ChevronDown, Wrench, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  removeCliente: (id: string) => void;
  ordens: OrdemServico[];
  orcamentos: Orcamento[];
}

export default function ClientesModule({ clientes, addCliente, removeCliente, ordens, orcamentos }: Props) {
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

  const getClienteOrdens = (nome: string) =>
    ordens.filter(o => o.clienteNome.toLowerCase() === nome.toLowerCase());

  const getClienteOrcamentos = (nome: string) =>
    orcamentos.filter(o => o.clienteNome.toLowerCase() === nome.toLowerCase());

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
            {filtered.map(c => {
              const cOrdens = getClienteOrdens(c.nome);
              const cOrcamentos = getClienteOrcamentos(c.nome);
              const totalHistorico = cOrdens.length + cOrcamentos.length;

              return (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{c.nome}</p>
                        <p className="text-sm text-muted-foreground">{c.telefone} {c.email && `• ${c.email}`}</p>
                        {c.cpfCnpj && <p className="text-xs text-muted-foreground">{c.cpfCnpj}</p>}
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCliente(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {totalHistorico > 0 && (
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              📋 Histórico ({totalHistorico})
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {cOrdens.length > 0 && (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                <Wrench className="h-3 w-3" /> Serviços ({cOrdens.length})
                              </p>
                              <div className="space-y-1">
                                {cOrdens.map(os => (
                                  <div key={os.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                    <div>
                                      <p className="font-medium">{os.descricao}</p>
                                      <p className="text-xs text-muted-foreground">{os.data} {os.valor > 0 && `• R$ ${os.valor.toFixed(2)}`}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">{statusLabel(os.status)}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {cOrcamentos.length > 0 && (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                <FileText className="h-3 w-3" /> Orçamentos ({cOrcamentos.length})
                              </p>
                              <div className="space-y-1">
                                {cOrcamentos.map(orc => {
                                  const t = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
                                  return (
                                    <div key={orc.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                      <div>
                                        <p className="font-medium">{orc.itens.length} itens</p>
                                        <p className="text-xs text-muted-foreground">R$ {t.toFixed(2)} • {new Date(orc.criadoEm).toLocaleDateString('pt-BR')}</p>
                                      </div>
                                      <Badge variant="secondary" className="text-xs">{statusLabel(orc.status)}</Badge>
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
    </div>
  );
}
