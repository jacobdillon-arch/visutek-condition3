'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProductsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    try { setConfigs(await api.getConfigs()); }
    catch { setConfigs([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this viewer? This cannot be undone.')) return;
    setDeleting(id);
    try { await api.deleteConfig(id); setConfigs(c => c.filter(x => x.id !== id)); }
    catch (err: any) { alert(err.message); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>3D Viewers</h1>
          <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Manage your product viewer configurations</p>
        </div>
        <Link href="/dashboard/products/new"><button className="btn btn-primary">New Viewer</button></Link>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--grey-50)', fontSize: 13 }}>Loading…</p>
        ) : configs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--grey-50)' }}>
            <p style={{ fontSize: 15 }}>No viewers yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Create a viewer to embed 3D models on your Shopify product pages.</p>
            <Link href="/dashboard/products/new"><button className="btn btn-primary" style={{ marginTop: 16 }}>Create first viewer</button></Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Shopify Product</th><th>Models</th><th>Colors</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {configs.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link href={`/dashboard/products/${c.id}`} style={{ color: 'var(--black)' }}>{c.name}</Link>
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--grey-50)' }}>{c.shopifyProductId ?? '—'}</td>
                  <td>{c.models?.filter((m: any) => m.uploadStatus === 'ready').length ?? 0}</td>
                  <td>{c.colorOptions?.length ?? 0}</td>
                  <td><span className={`badge ${c.active ? 'badge-green' : 'badge-grey'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/dashboard/products/${c.id}`}><button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}>Edit</button></Link>
                      <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleDelete(c.id)} disabled={deleting === c.id}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
