import { cn } from '@/lib/utils';
import {
  Home, Users, Wrench, FileText, Handshake, DollarSign, Settings, ShieldCheck, LayoutDashboard
} from 'lucide-react';

type ModuleKey = 'home' | 'servicos' | 'orcamentos' | 'clientes' | 'faturamento' | 'custos' | 'config';

interface Props {
  activeModule: ModuleKey;
  onModuleChange: (m: ModuleKey) => void;
  isAdmin?: boolean;
}

const userNavItems: { key: ModuleKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Início', icon: <Home className="h-5 w-5" /> },
  { key: 'clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { key: 'servicos', label: 'Serviços', icon: <Wrench className="h-5 w-5" /> },
  { key: 'orcamentos', label: 'Orçam.', icon: <FileText className="h-5 w-5" /> },
  { key: 'custos', label: 'Parceiros', icon: <Handshake className="h-5 w-5" /> },
  { key: 'faturamento', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" /> },
  { key: 'config', label: 'Config', icon: <Settings className="h-5 w-5" /> },
];

const adminNavItems: { key: ModuleKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Início', icon: <Home className="h-5 w-5" /> },
  { key: 'config', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { key: 'faturamento', label: 'Financeiro', icon: <LayoutDashboard className="h-5 w-5" /> },
];

export default function BottomNav({ activeModule, onModuleChange, isAdmin }: Props) {
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onModuleChange(item.key)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors min-w-0 flex-1',
              activeModule === item.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className={cn(
              'flex items-center justify-center rounded-full p-1 transition-colors',
              activeModule === item.key && 'bg-primary/10'
            )}>
              {item.icon}
            </span>
            <span className="truncate w-full text-center">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
