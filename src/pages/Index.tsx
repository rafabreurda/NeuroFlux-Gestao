import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ServicosModule from '@/modules/ServicosModule';
import ClientesModule from '@/modules/ClientesModule';
import OrcamentosModule from '@/modules/OrcamentosModule';
import FaturamentoModule from '@/modules/FaturamentoModule';
import CustosModule from '@/modules/CustosModule';
import ConfigModule from '@/modules/ConfigModule';
import {
  useClientes, useOrdensServico, useOrcamentos,
  useRecibos, useCustos, useEmpresaConfig
} from '@/store/useStore';
import { Users, Wrench, FileText, Handshake, DollarSign, Settings } from 'lucide-react';

type ModuleKey = 'home' | 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

const menuItems: { key: Exclude<ModuleKey, 'home'>; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'clientes', label: 'Clientes', icon: <Users className="h-8 w-8" />, color: 'from-blue-500 to-blue-700' },
  { key: 'servicos', label: 'Serviços', icon: <Wrench className="h-8 w-8" />, color: 'from-emerald-500 to-emerald-700' },
  { key: 'orcamentos', label: 'Orçamentos', icon: <FileText className="h-8 w-8" />, color: 'from-amber-500 to-amber-700' },
  { key: 'custos', label: 'Parceiros', icon: <Handshake className="h-8 w-8" />, color: 'from-purple-500 to-purple-700' },
  { key: 'faturamento', label: 'Financeiro', icon: <DollarSign className="h-8 w-8" />, color: 'from-rose-500 to-rose-700' },
  { key: 'config', label: 'Configurações', icon: <Settings className="h-8 w-8" />, color: 'from-slate-500 to-slate-700' },
];

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('home');
  const { clientes, addCliente, removeCliente } = useClientes();
  const { ordens, addOrdem, updateOrdem, removeOrdem } = useOrdensServico();
  const { orcamentos, addOrcamento, updateOrcamento } = useOrcamentos();
  const { recibos, addRecibo } = useRecibos();
  const { custos, addCusto, removeCusto } = useCustos();
  const { config, updateConfig } = useEmpresaConfig();

  if (activeModule === 'home') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-col items-center px-4 pt-10 pb-6">
          <h1 className="text-2xl font-bold text-foreground">Pro Gestão</h1>
          <p className="text-sm text-muted-foreground">Sistema Profissional</p>
        </div>
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-4 px-4 pb-10 sm:grid-cols-3">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              className={`group flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br ${item.color} p-6 text-white shadow-lg transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-xl`}
              style={{
                boxShadow: '0 6px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)',
                transform: 'translateY(0)',
              }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0 rgba(0,0,0,0.25), 0 3px 8px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(4px)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {item.icon}
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto pb-4 text-center text-xs text-muted-foreground">v1.0 — Pro Gestão © 2026</div>
      </div>
    );
  }

  return (
    <AppLayout activeModule={activeModule} onModuleChange={setActiveModule}>
      {activeModule === 'servicos' && (
        <ServicosModule ordens={ordens} addOrdem={addOrdem} updateOrdem={updateOrdem} removeOrdem={removeOrdem} />
      )}
      {activeModule === 'clientes' && (
        <ClientesModule clientes={clientes} addCliente={addCliente} removeCliente={removeCliente} ordens={ordens} orcamentos={orcamentos} />
      )}
      {activeModule === 'orcamentos' && (
        <OrcamentosModule orcamentos={orcamentos} addOrcamento={addOrcamento} updateOrcamento={updateOrcamento} empresaLogo={config.logo} empresaNome={config.nome} empresaAssinatura={config.assinatura} />
      )}
      {activeModule === 'faturamento' && (
        <FaturamentoModule recibos={recibos} addRecibo={addRecibo} empresaLogo={config.logo} empresaNome={config.nome} />
      )}
      {activeModule === 'custos' && (
        <CustosModule custos={custos} addCusto={addCusto} removeCusto={removeCusto} />
      )}
      {activeModule === 'config' && (
        <ConfigModule config={config} updateConfig={updateConfig} />
      )}
    </AppLayout>
  );
};

export default Index;
