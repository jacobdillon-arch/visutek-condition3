'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.storeId) {
      api.getConfigs().then(setConfigs).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Overview</h1>
        <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Welcome back{user?.name ? `, ${user.name}` : ''}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="card">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grey-50)' }}>Active Viewers</p>
          <p style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{loading ? '—' : configs.filter(c => c.active).length}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grey-50)' }}>Shopify Store</p>
          <p style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>
            {user?.storeId ? <span className="badge badge-green">Connected</span> : <span className="badge badge-yellow">Not connected</span>}
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grey-50)' }}>Plan</p>
          <p style={{ fontSize: 14, fontWeight: 500, marginTop: 8, textTransform: 'capitalize' }}>Free</p>
        </div>
      </div>

      {!user?.storeId && (
        <div className="card" style={{ background: '#fffbeb', border: '1px solid #fef3c7', marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Connect your Shopify store to get started</p>
          <p style={{ fontSize: 13, color: 'var(--grey-50)', marginTop: 4 }}>Connecting your store lets you embed 3D viewers on your product pages and sync with your cart.</p>
          <Link href="/dashboard/connect"><button className="btn btn-primary" style={{ marginTop: 12 }}>Connect Shopify</button></Link>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Your Viewers</h2>
          <Link href="/dashboard/products/new"><button className="btn btn-primary">New Viewer</button></Link>
        </div>
        {loading ? (
          <p style={{ color: 'var(--grey-50)', fontSize: 13 }}>Loading…</p>
        ) : configs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--grey-50)' }}>
            <p style={{ fontSize: 14 }}>No viewers yet.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Create your first 3D viewer to embed in your Shopify store.</p>
            <Link href="/dashboard/products/new"><button className="btn btn-secondary" style={{ marginTop: 12 }}>Create your first viewer</button></Link>
          </div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Product ID</th><th>Models</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {configs.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--grey-50)', fontSize: 12, fontFamily: 'monospace' }}>{c.shopifyProductId ?? '—'}</td>
                  <td>{c.models?.length ?? 0}</td>
                  <td><span className={`badge ${c.active ? 'badge-green' : 'badge-grey'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td><Link href={`/dashboard/products/${c.id}`}><button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}>Edit</button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
