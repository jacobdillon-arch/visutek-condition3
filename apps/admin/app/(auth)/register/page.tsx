'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register({ email, password, name: name || undefined });
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
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Create your account</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="name">Company / Name</label>
          <input id="name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 4 }}>Minimum 8 characters</p>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: 'var(--grey-50)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--black)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  );
}
