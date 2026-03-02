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

type ModuleKey = 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('servicos');
  const { clientes, addCliente, removeCliente } = useClientes();
  const { ordens, addOrdem, updateOrdem, removeOrdem } = useOrdensServico();
  const { orcamentos, addOrcamento, updateOrcamento } = useOrcamentos();
  const { recibos, addRecibo } = useRecibos();
  const { custos, addCusto, removeCusto } = useCustos();
  const { config, updateConfig } = useEmpresaConfig();

  return (
    <AppLayout activeModule={activeModule} onModuleChange={setActiveModule}>
      {activeModule === 'servicos' && (
        <ServicosModule ordens={ordens} addOrdem={addOrdem} updateOrdem={updateOrdem} removeOrdem={removeOrdem} />
      )}
      {activeModule === 'clientes' && (
        <ClientesModule clientes={clientes} addCliente={addCliente} removeCliente={removeCliente} />
      )}
      {activeModule === 'orcamentos' && (
        <OrcamentosModule orcamentos={orcamentos} addOrcamento={addOrcamento} updateOrcamento={updateOrcamento} empresaLogo={config.logo} empresaNome={config.nome} />
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
