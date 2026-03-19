import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, CreditCard, AlertTriangle, BarChart3, DollarSign, TrendingUp, TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Plano {
  id: string;
  user_id: string;
  nome_plano: string;
  valor: number;
  data_inicio: string;
  data_vencimento: string;
  observacoes: string;
}

interface UserData {
  user_id: string;
  nome: string;
  username: string;
  planos: Plano[];
}

function diasParaVencimento(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-users', {
        body: { action: 'list-users' },
      });
      if (res.data?.users) {
        setUsers(res.data.users.filter((u: UserData) => u.user_id));
      }
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allPlanos = useMemo(() =>
    users.flatMap(u => (u.planos || []).map(p => ({ ...p, userName: u.nome || u.username }))),
    [users]
  );

  const planosAtivos = useMemo(() => allPlanos.filter(p => diasParaVencimento(p.data_vencimento) >= 0), [allPlanos]);
  const planosVencidos = useMemo(() => allPlanos.filter(p => diasParaVencimento(p.data_vencimento) < 0), [allPlanos]);
  const receitaAtiva = useMemo(() => planosAtivos.reduce((s, p) => s + Number(p.valor), 0), [planosAtivos]);
  const totalReceita = useMemo(() => allPlanos.reduce((s, p) => s + Number(p.valor), 0), [allPlanos]);

  const expiringPlans = useMemo(() =>
    allPlanos.filter(p => {
      const d = diasParaVencimento(p.data_vencimento);
      return d >= 0 && d <= 7;
    }),
    [allPlanos]
  );

  // Monthly revenue data (last 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; receita: number; planos: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = `${MONTH_NAMES[month]}/${String(year).slice(2)}`;

      // Plans that were active during this month
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const activePlans = allPlanos.filter(p => {
        const inicio = new Date(p.data_inicio);
        const venc = new Date(p.data_vencimento);
        return inicio <= monthEnd && venc >= monthStart;
      });

      months.push({
        month: label,
        receita: activePlans.reduce((s, p) => s + Number(p.valor), 0),
        planos: activePlans.length,
      });
    }
    return months;
  }, [allPlanos]);

  // Revenue per user (bar chart)
  const revenueByUser = useMemo(() => {
    const map: Record<string, number> = {};
    planosAtivos.forEach(p => { map[p.userName] = (map[p.userName] || 0) + Number(p.valor); });
    return Object.entries(map).map(([name, valor]) => ({ name, valor }));
  }, [planosAtivos]);

  // Monthly trend indicator
  const currentMonthRevenue = monthlyData.length >= 1 ? monthlyData[monthlyData.length - 1].receita : 0;
  const prevMonthRevenue = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2].receita : 0;
  const revenueChange = prevMonthRevenue > 0
    ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)
    : '0';
  const isGrowth = currentMonthRevenue >= prevMonthRevenue;

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Carregando dashboard...</p>;
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Usuários</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CreditCard className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{planosAtivos.length}</p>
            <p className="text-xs text-muted-foreground">Planos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">R$ {receitaAtiva.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Receita Ativa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            {isGrowth ? <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-1" /> : <TrendingDown className="h-5 w-5 mx-auto text-destructive mb-1" />}
            <p className={`text-2xl font-bold ${isGrowth ? 'text-emerald-600' : 'text-destructive'}`}>
              {isGrowth ? '+' : ''}{revenueChange}%
            </p>
            <p className="text-xs text-muted-foreground">Variação Mensal</p>
          </CardContent>
        </Card>
      </div>

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

      {/* Monthly Revenue Line Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Receita Mensal (últimos 12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-foreground" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue per User Bar Chart */}
      {revenueByUser.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Receita por Usuário (planos ativos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByUser}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-foreground" />
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All plans table */}
      {allPlanos.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Todos os Planos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Usuário</th>
                    <th className="px-3 py-2 text-left font-medium">Plano</th>
                    <th className="px-3 py-2 text-right font-medium">Valor</th>
                    <th className="px-3 py-2 text-center font-medium">Vencimento</th>
                    <th className="px-3 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlanos.map(p => {
                    const dias = diasParaVencimento(p.data_vencimento);
                    const vencido = dias < 0;
                    const proximo = dias >= 0 && dias <= 7;
                    return (
                      <tr key={p.id} className="border-b">
                        <td className="px-3 py-2">{p.userName}</td>
                        <td className="px-3 py-2">{p.nome_plano}</td>
                        <td className="px-3 py-2 text-right">R$ {Number(p.valor).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2 text-center">
                          {vencido ? <Badge variant="destructive" className="text-[10px]">Vencido</Badge>
                            : proximo ? <Badge className="text-[10px] bg-yellow-500">Vencendo</Badge>
                            : <Badge variant="secondary" className="text-[10px]">Ativo</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
