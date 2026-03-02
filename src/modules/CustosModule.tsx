import { useState } from 'react';
import { CustoFixo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  custos: CustoFixo[];
  addCusto: (c: Omit<CustoFixo, 'id'>) => void;
  removeCusto: (id: string) => void;
}

export default function CustosModule({ custos, addCusto, removeCusto }: Props) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor) { toast.error('Preencha nome e valor'); return; }
    addCusto({ nome, valor: parseFloat(valor) });
    setNome(''); setValor('');
    toast.success('Custo adicionado!');
  };

  const totalCustos = custos.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo Custo / Parceria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Cadastre custos fixos de equipamentos e ferramentas. Esses valores serão abatidos dos orçamentos para calcular seu lucro líquido.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
            <Input className="flex-1 min-w-[200px]" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do equipamento / custo" />
            <Input className="w-32" type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="R$ 0,00" />
            <Button type="submit"><Plus className="h-4 w-4" /> Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-5 w-5" /> Custos Cadastrados <Badge variant="secondary">{custos.length}</Badge>
        </h3>

        {custos.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum custo cadastrado.</CardContent></Card>
        ) : (
          <>
            <div className="space-y-2">
              {custos.map(c => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{c.nome}</p>
                      <p className="text-sm text-muted-foreground">R$ {c.valor.toFixed(2)} / serviço</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCusto(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardContent className="p-4 text-right">
                <p className="text-sm text-muted-foreground">Total de custos por serviço</p>
                <p className="text-xl font-bold">R$ {totalCustos.toFixed(2)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
