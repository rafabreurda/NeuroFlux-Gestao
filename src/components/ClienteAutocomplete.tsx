import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Cliente } from '@/types';
import { Users } from 'lucide-react';

interface Props {
  clientes: Cliente[];
  value: string;
  onChange: (nome: string, clienteId?: string) => void;
  placeholder?: string;
}

export default function ClienteAutocomplete({ clientes, value, onChange, placeholder = 'Nome do cliente' }: Props) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Cliente[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 1) {
      const lower = value.toLowerCase();
      setFiltered(clientes.filter(c => c.nome.toLowerCase().includes(lower)).slice(0, 8));
    } else {
      setFiltered([]);
    }
  }, [value, clientes]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (c: Cliente) => {
    onChange(c.nome, c.id);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              onClick={() => handleSelect(c)}
            >
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium truncate">{c.nome}</p>
                {(c.telefone || c.cpfCnpj) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {c.telefone}{c.cpfCnpj && ` • ${c.cpfCnpj}`}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
