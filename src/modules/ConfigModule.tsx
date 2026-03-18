import { useRef, useEffect, useState } from 'react';
import { EmpresaConfig } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Upload, Trash2, PenTool, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';
import { formatCpfCnpj, formatPhone } from '@/lib/masks';

interface Props {
  config: EmpresaConfig;
  updateConfig: (updates: Partial<EmpresaConfig>) => void;
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

function SignaturePad({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setDrawing(true); setHasDrawn(true);
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#222';
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false); onChange(null);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
    toast.success('Assinatura salva!');
  };

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0); setHasDrawn(true);
        }
      };
      img.src = value;
    }
  }, []);

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} width={400} height={150}
        className="w-full rounded-lg border-2 border-dashed bg-white touch-none cursor-crosshair"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={!hasDrawn}><PenTool className="h-4 w-4" /> Salvar Assinatura</Button>
        <Button size="sm" variant="outline" onClick={clear}><Trash2 className="h-4 w-4" /> Limpar</Button>
      </div>
    </div>
  );
}

export default function ConfigModule({ config, updateConfig, profile, updateProfile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({
    nome: '', cpf: '', cnpj: '', telefone: '', data_nascimento: '',
    endereco: '', bairro: '', cidade: '', estado: '', empresa: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        nome: profile.nome || '', cpf: profile.cpf || '', cnpj: profile.cnpj || '',
        telefone: profile.telefone || '', data_nascimento: profile.data_nascimento || '',
        endereco: profile.endereco || '', bairro: profile.bairro || '',
        cidade: profile.cidade || '', estado: profile.estado || '', empresa: profile.empresa || '',
      });
    }
  }, [profile]);

  const set = (key: string, val: string) => setProfileForm(prev => ({ ...prev, [key]: val }));

  const saveProfile = async () => { await updateProfile(profileForm); };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateConfig({ logo: reader.result as string }); toast.success('Logo atualizada!'); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Tabs defaultValue="perfil">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="perfil" className="flex-1"><User className="mr-1 h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="empresa" className="flex-1"><Settings className="mr-1 h-4 w-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="assinatura" className="flex-1"><PenTool className="mr-1 h-4 w-4" /> Assinatura</TabsTrigger>
          
        </TabsList>

        <TabsContent value="perfil" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome Completo</Label><Input value={profileForm.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome completo" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>CPF</Label><Input value={profileForm.cpf} onChange={e => set('cpf', formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" /></div>
                <div><Label>Data de Nascimento</Label><Input type="date" value={profileForm.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Telefone</Label><Input value={profileForm.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" /></div>
                <div><Label>Empresa</Label><Input value={profileForm.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" /></div>
              </div>
              <div><Label>CNPJ</Label><Input value={profileForm.cnpj} onChange={e => set('cnpj', formatCpfCnpj(e.target.value))} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Endereço</Label><Input value={profileForm.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><Label>Bairro</Label><Input value={profileForm.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" /></div>
                <div><Label>Cidade</Label><Input value={profileForm.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" /></div>
                <div>
                  <Label>Estado</Label>
                  <select value={profileForm.estado} onChange={e => set('estado', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">UF</option>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={saveProfile} className="w-full">Salvar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome da Empresa</Label><Input value={config.nome} onChange={e => updateConfig({ nome: e.target.value })} placeholder="Minha Empresa Ltda" /></div>
              <div><Label>CNPJ</Label><Input value={config.cnpj} onChange={e => updateConfig({ cnpj: formatCpfCnpj(e.target.value) })} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Endereço</Label><Input value={config.endereco} onChange={e => updateConfig({ endereco: e.target.value })} placeholder="Rua, número, cidade - UF" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Telefone</Label><Input value={config.telefone} onChange={e => updateConfig({ telefone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" /></div>
                <div><Label>E-mail</Label><Input value={config.email} onChange={e => updateConfig({ email: e.target.value })} placeholder="contato@empresa.com" /></div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3">💰 Valores Padrão (usados nos Orçamentos)</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div><Label>Valor Hora (R$)</Label><Input type="number" step="0.01" value={config.valorHora || ''} onChange={e => updateConfig({ valorHora: parseFloat(e.target.value) || 0 })} placeholder="150,00" /></div>
                  <div><Label>Valor Dia (R$)</Label><Input type="number" step="0.01" value={config.valorDia || ''} onChange={e => updateConfig({ valorDia: parseFloat(e.target.value) || 0 })} placeholder="1.000,00" /></div>
                  <div><Label>Valor KM (R$)</Label><Input type="number" step="0.01" value={config.valorKm || ''} onChange={e => updateConfig({ valorKm: parseFloat(e.target.value) || 0 })} placeholder="3,50" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Logomarca</CardTitle></CardHeader>
            <CardContent>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              {config.logo ? (
                <div className="flex items-start gap-4">
                  <img src={config.logo} alt="Logo" className="h-20 rounded-lg border object-contain" />
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Trocar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateConfig({ logo: null })}><Trash2 className="h-4 w-4" /> Remover</Button>
                  </div>
                </div>
              ) : <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Enviar Logo</Button>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assinatura" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-primary" /> Assinatura do Responsável</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Desenhe sua assinatura. Ela aparecerá nos orçamentos como "Assinatura do Trabalhador".</p>
              {config.assinatura && (
                <div className="mb-3 rounded-lg border bg-muted/30 p-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Assinatura atual:</p>
                  <img src={config.assinatura} alt="Assinatura salva" className="h-16 object-contain" />
                </div>
              )}
              <SignaturePad value={config.assinatura} onChange={(v) => updateConfig({ assinatura: v })} />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
