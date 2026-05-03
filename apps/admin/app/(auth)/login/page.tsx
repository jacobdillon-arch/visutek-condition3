'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login({ email, password });
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: 'var(--grey-50)' }}>
        No account?{' '}
        <Link href="/register" style={{ color: 'var(--black)', fontWeight: 500 }}>Create one</Link>
      </p>
    </div>
  );
}
