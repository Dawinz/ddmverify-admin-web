'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiGet, apiGetOptional } from '@/lib/api';

export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function useAdminQuery<T>({
  key,
  path,
  fallback,
}: {
  key: string[];
  path: string;
  fallback?: T;
}) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      if (fallback !== undefined) {
        return apiGetOptional<T>(path, token, fallback);
      }
      return apiGet<T>(path, token);
    },
  });
}
