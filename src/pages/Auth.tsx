import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert username to internal email
      const email = `${form.username.toLowerCase().replace(/\s+/g, '.')}@neuroflux.app`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) throw new Error('Usuário ou senha incorretos');
      toast.success('Login realizado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">NeuroFlux Gestão</CardTitle>
          <p className="text-sm text-muted-foreground">Acesse sua conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Usuário</Label>
              <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Seu nome de usuário" required />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Sua senha" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" /> Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
