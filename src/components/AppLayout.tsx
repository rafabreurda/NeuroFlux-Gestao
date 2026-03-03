import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Wrench, FileText, Users, DollarSign, Settings, Menu, X, Camera, Receipt, ChevronRight, Home, Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

type ModuleKey = 'home' | 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

interface Props {
  activeModule: ModuleKey;
  onModuleChange: (m: ModuleKey) => void;
  children: React.ReactNode;
  signOut?: () => Promise<void>;
  userName?: string;
}

const modules: { key: ModuleKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Início', icon: <Home className="h-5 w-5" /> },
  { key: 'clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { key: 'servicos', label: 'Serviços e OS', icon: <Wrench className="h-5 w-5" /> },
  { key: 'orcamentos', label: 'Orçamentos', icon: <FileText className="h-5 w-5" /> },
  { key: 'custos', label: 'Parceiros e Custos', icon: <Handshake className="h-5 w-5" /> },
  { key: 'faturamento', label: 'Financeiro', icon: <Receipt className="h-5 w-5" /> },
  { key: 'config', label: 'Configurações', icon: <Settings className="h-5 w-5" /> },
];

export default function AppLayout({ activeModule, onModuleChange, children, signOut, userName }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop only */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex lg:static'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <Camera className="h-7 w-7 text-sidebar-primary" />
          <div>
            <h1 className="text-base font-bold text-sidebar-primary-foreground">NeuroFlux Gestão</h1>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Sistema Inteligente</p>
          </div>
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

        <div className="border-t border-sidebar-border p-4 space-y-2">
          {userName && <p className="text-xs text-sidebar-foreground/70 truncate">{userName}</p>}
          {signOut && (
            <button onClick={signOut} className="text-xs text-red-400 hover:underline">Sair da conta</button>
          )}
          <p className="text-[11px] text-sidebar-foreground/50">v1.0 — NeuroFlux Gestão © 2026</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <h2 className="text-lg font-semibold">
            {modules.find(m => m.key === activeModule)?.label}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile & tablet only */}
      <BottomNav activeModule={activeModule} onModuleChange={onModuleChange} />
    </div>
  );
}
