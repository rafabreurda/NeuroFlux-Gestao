import { useState } from 'react';
import { ServicoCatalogo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  servicos: ServicoCatalogo[];
  addServico: (s: Omit<ServicoCatalogo, 'id' | 'criadoEm'>) => void;
  removeServico: (id: string) => void;
  updateServico: (id: string, updates: Partial<ServicoCatalogo>) => void;
}

export default function ServicosCatalogo({ servicos, addServico, removeServico, updateServico }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  const resetForm = () => { setNome(''); setDescricao(''); setValor(''); setEditId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) { toast.error('Preencha o nome do serviço'); return; }
    if (editId) {
      updateServico(editId, { nome, descricao, valor: parseFloat(valor) || 0 });
    } else {
      addServico({ nome, descricao, valor: parseFloat(valor) || 0 });
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (s: ServicoCatalogo) => {
    setEditId(s.id);
    setNome(s.nome);
    setDescricao(s.descricao);
    setValor(s.valor.toFixed(2));
    setShowForm(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Catálogo de Serviços
        </h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Novo Serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum serviço cadastrado no catálogo
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {servicos.map(s => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.nome}</p>
                  {s.descricao && <p className="text-xs text-muted-foreground truncate">{s.descricao}</p>}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    R$ {s.valor.toFixed(2)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeServico(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={open => { if (!open) { resetForm(); } setShowForm(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            <DialogDescription>Cadastre um serviço no catálogo com valor padrão</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome do serviço</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Instalação elétrica" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição (opcional)</label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes do serviço" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valor (R$)</label>
              <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit">{editId ? 'Salvar' : 'Cadastrar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
