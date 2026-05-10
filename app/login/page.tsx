'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Read from the form so browser autofill is included (controlled state often stays
      // empty until React sees an input event — Supabase then gets "missing email or phone").
      const form = e.currentTarget;
      const fd = new FormData(form);
      const emailFromDom = String(fd.get('email') ?? '').trim();
      const passwordFromDom = String(fd.get('password') ?? '');
      const effectiveEmail = emailFromDom || email.trim();
      const effectivePassword = passwordFromDom || password;

      if (!effectiveEmail) {
        setError('Enter your email address.');
        return;
      }
      if (!effectivePassword) {
        setError('Enter your password.');
        return;
      }

      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: effectiveEmail,
          password: effectivePassword,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setError('Registered. Check your email to confirm, then contact support to be marked as admin.');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: effectiveEmail,
        password: effectivePassword,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const token = data.session?.access_token;
      if (!token) {
        setError('No session returned');
        return;
      }
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
      if (!apiUrl) {
        setError('Admin is misconfigured: set NEXT_PUBLIC_API_URL in .env.local (e.g. https://api.ddmverify.com).');
        await supabase.auth.signOut();
        return;
      }
      let role: string | undefined;
      const meRes = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const { user: profile } = await meRes.json();
        role = profile?.role;
      } else {
        // Fallback: read role directly from Supabase profile table.
        const userId = data.user?.id;
        if (userId) {
          const profileQuery = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
          if (!profileQuery.error) {
            role = profileQuery.data?.role;
          }
        }
      }
      if (role !== 'admin') {
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #f6f7f9 0%, #e5eef5 100%)',
      }}
    >
      <div className="panel" style={{ padding: 32, maxWidth: 380, width: '100%' }}>
        <div className="brand-row" style={{ borderBottom: 'none', marginBottom: 14, padding: 0 }}>
          <img src="/icon.png" alt="DDM Verify" className="brand-logo-img" width={40} height={40} />
          <div className="brand-title">
            <strong style={{ color: '#0f172a' }}>DDM Verify Admin</strong>
            <span style={{ color: '#6b7280' }}>Secure management portal</span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Email</label>
            <input
              name="email"
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
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (mode === 'login' ? 'Signing in…' : 'Registering…') : mode === 'login' ? 'Sign in' : 'Register'}
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setError('');
              setMode((m) => (m === 'login' ? 'register' : 'login'));
            }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Back to login'}
          </button>
        </form>
      </div>
    </div>
  );
}
