import { useRef } from 'react';
import { EmpresaConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  config: EmpresaConfig;
  updateConfig: (updates: Partial<EmpresaConfig>) => void;
}

export default function ConfigModule({ config, updateConfig }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateConfig({ logo: reader.result as string });
      toast.success('Logo atualizada!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome da Empresa</label>
            <Input value={config.nome} onChange={e => updateConfig({ nome: e.target.value })} placeholder="Minha Empresa Ltda" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">CNPJ</label>
            <Input value={config.cnpj} onChange={e => updateConfig({ cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Endereço</label>
            <Input value={config.endereco} onChange={e => updateConfig({ endereco: e.target.value })} placeholder="Rua, número, cidade - UF" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input value={config.telefone} onChange={e => updateConfig({ telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <Input value={config.email} onChange={e => updateConfig({ email: e.target.value })} placeholder="contato@empresa.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Logomarca</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            A logo será incluída em recibos, orçamentos e notas fiscais.
          </p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />

          {config.logo ? (
            <div className="flex items-start gap-4">
              <img src={config.logo} alt="Logo" className="h-20 rounded-lg border object-contain" />
              <div className="space-y-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Trocar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateConfig({ logo: null })}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Enviar Logo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
