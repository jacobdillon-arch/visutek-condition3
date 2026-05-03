'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    await api.logout();
    router.push('/login');
  }

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: 'var(--white)', borderRight: '1px solid var(--grey-20)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--grey-20)' }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>VisuTek</span>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {[
          { href: '/dashboard', label: 'Overview' },
          { href: '/dashboard/products', label: 'Viewers' },
          { href: '/dashboard/connect', label: 'Connect Shopify' },
          { href: '/dashboard/billing', label: 'Billing' },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{ display: 'block', padding: '8px 20px', fontSize: 13, color: 'var(--black)', borderRadius: 0, transition: 'background 0.1s' }}
            className="sidebar-link">
            {link.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '0 20px', borderTop: '1px solid var(--grey-20)', paddingTop: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--grey-50)', marginBottom: 8 }}>{user?.email}</p>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>Sign out</button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
  }
  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
