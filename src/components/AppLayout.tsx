import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Wrench, FileText, Users, DollarSign, Settings, Menu, X, Camera, Receipt, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ModuleKey = 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

interface Props {
  activeModule: ModuleKey;
  onModuleChange: (m: ModuleKey) => void;
  children: React.ReactNode;
}

const modules: { key: ModuleKey; label: string; icon: React.ReactNode }[] = [
  { key: 'servicos', label: 'Serviços e OS', icon: <Wrench className="h-5 w-5" /> },
  { key: 'orcamentos', label: 'Orçamentos', icon: <FileText className="h-5 w-5" /> },
  { key: 'clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { key: 'faturamento', label: 'Faturamento', icon: <Receipt className="h-5 w-5" /> },
  { key: 'custos', label: 'Custos e Parcerias', icon: <DollarSign className="h-5 w-5" /> },
  { key: 'config', label: 'Configurações', icon: <Settings className="h-5 w-5" /> },
];

export default function AppLayout({ activeModule, onModuleChange, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <Camera className="h-7 w-7 text-sidebar-primary" />
          <div>
            <h1 className="text-base font-bold text-sidebar-primary-foreground">Pro Gestão</h1>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Sistema Profissional</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {modules.map(m => (
            <button
              key={m.key}
              onClick={() => { onModuleChange(m.key); setSidebarOpen(false); }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                activeModule === m.key
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {m.icon}
              {m.label}
              {activeModule === m.key && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-[11px] text-sidebar-foreground/50">v1.0 — Pro Gestão © 2026</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {modules.find(m => m.key === activeModule)?.label}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
