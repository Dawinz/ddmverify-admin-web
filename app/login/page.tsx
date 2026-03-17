'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const token = data.session?.access_token;
      if (!token) {
        setError('No session returned');
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const meRes = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        setError('Failed to verify user');
        return;
      }
      const { user: profile } = await meRes.json();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. Admin role required.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: 360 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>DDM Verify Admin</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
