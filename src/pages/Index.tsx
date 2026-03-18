import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import AppLayout from '@/components/AppLayout';
import ServicosModule from '@/modules/ServicosModule';
import ClientesModule from '@/modules/ClientesModule';
import OrcamentosModule from '@/modules/OrcamentosModule';
import FaturamentoModule from '@/modules/FaturamentoModule';
import CustosModule from '@/modules/CustosModule';
import ConfigModule from '@/modules/ConfigModule';
import {
  useClientes, useOrdensServico, useOrcamentos,
  useRecibos, useCustos, useEmpresaConfig, useServicosCatalogo
} from '@/store/useStore';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useScheduleNotifications } from '@/hooks/useScheduleNotifications';
import { Users, Wrench, FileText, Handshake, DollarSign, Settings, LayoutDashboard, ShieldCheck } from 'lucide-react';

type ModuleKey = 'home' | 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

const userMenuItems: { key: Exclude<ModuleKey, 'home'>; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'clientes', label: 'Clientes', icon: <Users className="h-8 w-8" />, color: 'from-blue-500 to-blue-700' },
  { key: 'servicos', label: 'Serviços', icon: <Wrench className="h-8 w-8" />, color: 'from-emerald-500 to-emerald-700' },
  { key: 'orcamentos', label: 'Orçamentos', icon: <FileText className="h-8 w-8" />, color: 'from-amber-500 to-amber-700' },
  { key: 'custos', label: 'Parceiros', icon: <Handshake className="h-8 w-8" />, color: 'from-purple-500 to-purple-700' },
  { key: 'faturamento', label: 'Financeiro', icon: <DollarSign className="h-8 w-8" />, color: 'from-rose-500 to-rose-700' },
  { key: 'config', label: 'Configurações', icon: <Settings className="h-8 w-8" />, color: 'from-slate-500 to-slate-700' },
];

const adminMenuItems: { key: Exclude<ModuleKey, 'home'>; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'config', label: 'Clientes', icon: <Users className="h-8 w-8" />, color: 'from-blue-500 to-blue-700' },
  { key: 'faturamento', label: 'Financeiro', icon: <LayoutDashboard className="h-8 w-8" />, color: 'from-rose-500 to-rose-700' },
];

interface Props {
  user: User | null;
  signOut: () => Promise<void>;
}

const Index = ({ user, signOut }: Props) => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('home');
  const { clientes, addCliente, updateCliente, removeCliente } = useClientes();
  const { ordens, addOrdem, updateOrdem, removeOrdem } = useOrdensServico();
  const { orcamentos, addOrcamento, updateOrcamento } = useOrcamentos();
  const { recibos, addRecibo } = useRecibos();
  const { custos, addCusto, removeCusto } = useCustos();
  const { config, updateConfig } = useEmpresaConfig();
  const { servicos: catalogoServicos, addServico: addServicoCatalogo, removeServico: removeServicoCatalogo, updateServico: updateServicoCatalogo } = useServicosCatalogo();
  const { profile, updateProfile } = useProfile(user?.id);
  const { isAdmin } = useUserRole(user?.id);
  useScheduleNotifications(ordens);
  if (activeModule === 'home') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-col items-center px-4 pt-10 pb-6">
          <h1 className="text-2xl font-bold text-foreground">NeuroFlux Gestão</h1>
          <p className="text-sm text-muted-foreground">Olá, {profile?.nome || user?.email || 'Usuário'}</p>
          {isAdmin && <span className="mt-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">Administrador</span>}
        </div>
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3 px-4 pb-24 sm:grid-cols-3 sm:gap-4">
          {(isAdmin ? adminMenuItems : userMenuItems).map(item => (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              className={`group flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${item.color} p-4 text-white shadow-lg transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-xl sm:gap-3 sm:p-6`}
              style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)' }}
            >
              {item.icon}
              <span className="text-xs font-bold sm:text-sm">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          {user && <button onClick={signOut} className="text-sm text-destructive underline">Sair da conta</button>}
          <p className="text-xs text-muted-foreground">v1.0 — NeuroFlux Gestão © 2026</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout activeModule={activeModule} onModuleChange={setActiveModule} signOut={signOut} userName={profile?.nome} isAdmin={isAdmin}>
      {activeModule === 'servicos' && (
        <ServicosModule ordens={ordens} clientes={clientes} orcamentos={orcamentos} catalogoServicos={catalogoServicos} addServicoCatalogo={addServicoCatalogo} removeServicoCatalogo={removeServicoCatalogo} updateServicoCatalogo={updateServicoCatalogo} addOrdem={addOrdem} updateOrdem={updateOrdem} removeOrdem={removeOrdem} />
      )}
      {activeModule === 'clientes' && (
        <ClientesModule clientes={clientes} addCliente={addCliente} updateCliente={updateCliente} removeCliente={removeCliente} ordens={ordens} orcamentos={orcamentos} addOrdem={addOrdem} addOrcamento={addOrcamento} catalogoServicos={catalogoServicos} />
      )}
      {activeModule === 'orcamentos' && (
        <OrcamentosModule orcamentos={orcamentos} clientes={clientes} addOrcamento={addOrcamento} updateOrcamento={updateOrcamento} empresaLogo={config.logo} empresaNome={config.nome} empresaAssinatura={config.assinatura} empresaEndereco={config.endereco} valorHora={config.valorHora} valorDia={config.valorDia} valorKm={config.valorKm} catalogoServicos={catalogoServicos} />
      )}
      {activeModule === 'faturamento' && (
        <FaturamentoModule recibos={recibos} addRecibo={addRecibo} empresaLogo={config.logo} empresaNome={config.nome} ordens={ordens} orcamentos={orcamentos} custos={custos} clientes={clientes} />
      )}
      {activeModule === 'custos' && (
        <CustosModule custos={custos} addCusto={addCusto} removeCusto={removeCusto} />
      )}
      {activeModule === 'config' && (
        <ConfigModule config={config} updateConfig={updateConfig} profile={profile} updateProfile={updateProfile} isAdmin={isAdmin} />
      )}
    </AppLayout>
  );
};

export default Index;
