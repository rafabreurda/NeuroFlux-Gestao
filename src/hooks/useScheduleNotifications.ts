import { useEffect, useRef } from 'react';
import { OrdemServico } from '@/types';
import { toast } from 'sonner';

const NOTIF_LEAD_MS = 30 * 60 * 1000; // 30 minutes

export function useScheduleNotifications(ordens: OrdemServico[]) {
  const notifiedRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Clear old timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current.clear();

    const now = Date.now();
    const agendadas = ordens.filter(o => o.dataAgendamento && o.status !== 'concluido');

    for (const os of agendadas) {
      if (notifiedRef.current.has(os.id)) continue;
      const agendTime = new Date(os.dataAgendamento!).getTime();
      const notifTime = agendTime - NOTIF_LEAD_MS;
      const delay = notifTime - now;

      if (delay < -NOTIF_LEAD_MS) continue; // too far past
      if (delay <= 0) {
        // Should have notified already or right now
        sendNotification(os);
        notifiedRef.current.add(os.id);
      } else {
        const timer = setTimeout(() => {
          sendNotification(os);
          notifiedRef.current.add(os.id);
        }, delay);
        timersRef.current.set(os.id, timer);
      }
    }

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, [ordens]);
}

function sendNotification(os: OrdemServico) {
  const dt = new Date(os.dataAgendamento!);
  const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const body = `${os.clienteNome} — ${os.descricao.slice(0, 60)}`;
  const title = `⏰ Serviço às ${hora}`;

  // In-app toast
  toast.info(title, { description: body, duration: 15000 });

  // Browser push notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: `os-${os.id}`,
        vibrate: [200, 100, 200],
      });
    } catch {
      // Notification constructor may fail on some mobile browsers
    }
  }
}
