import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setRole((data?.role as 'admin' | 'user') || 'user');
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchRole(); }, [fetchRole]);

  return { role, isAdmin: role === 'admin', loading };
}
