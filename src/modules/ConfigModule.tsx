import { useRef, useEffect, useState, useCallback } from 'react';
import { EmpresaConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Upload, Trash2, PenTool } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  config: EmpresaConfig;
  updateConfig: (updates: Partial<EmpresaConfig>) => void;
}

function SignaturePad({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#222';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
    toast.success('Assinatura salva!');
  };

  // Load existing signature
  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0);
          setHasDrawn(true);
        }
      };
      img.src = value;
    }
  }, []);

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full rounded-lg border-2 border-dashed bg-white touch-none cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={!hasDrawn}>
          <PenTool className="h-4 w-4" /> Salvar Assinatura
        </Button>
        <Button size="sm" variant="outline" onClick={clear}>
          <Trash2 className="h-4 w-4" /> Limpar
        </Button>
      </div>
    </div>
  );
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-primary" /> Assinatura do Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Desenhe sua assinatura abaixo. Ela aparecerá nos orçamentos e documentos como "Assinatura do Trabalhador".
          </p>
          {config.assinatura && (
            <div className="mb-3 rounded-lg border bg-muted/30 p-2">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Assinatura atual:</p>
              <img src={config.assinatura} alt="Assinatura salva" className="h-16 object-contain" />
            </div>
          )}
          <SignaturePad value={config.assinatura} onChange={(v) => updateConfig({ assinatura: v })} />
        </CardContent>
      </Card>
    </div>
  );
}
