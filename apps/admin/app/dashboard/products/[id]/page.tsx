'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TABS = [
  { label: '3D Models', href: 'models' },
  { label: 'Colors', href: 'colors' },
  { label: 'Size Chart', href: 'size-chart' },
  { label: 'Variants', href: 'variants' },
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    api.getConfig(id).then(c => { setConfig(c); setName(c.name); setActive(c.active); }).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try { await api.updateConfig(id, { name, active }); }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>;
  if (!config) return <div style={{ padding: 32 }}>Not found</div>;

  const viewerUrl = `${API}/viewer?config=${id}`;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/products" style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewers</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{config.name}</h1>
          <span className={`badge ${config.active ? 'badge-green' : 'badge-grey'}`}>{config.active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Settings card */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="cfg-name">Name</label>
                <input id="cfg-name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="cfg-active" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="cfg-active" style={{ margin: 0, textTransform: 'none', fontSize: 14, color: 'var(--black)', letterSpacing: 0 }}>Viewer is active (visible in Shopify)</label>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Quick nav */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Configure</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TABS.map(tab => (
                <Link key={tab.href} href={`/dashboard/products/${id}/${tab.href}`}>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>{tab.label}</button>
                </Link>
              ))}
            </div>
          </div>

          {/* Embed instructions */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Embed in Shopify</h2>
            <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Install the VisuTek block from the Shopify App Store (or via your partner install link)',
                'Go to your Shopify Admin → Online Store → Themes → Customize',
                'Navigate to the product page template',
                'Add the "VisuTek 3D Viewer" block and set the Viewer ID below',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--grey-50)' }}>{step}</li>
              ))}
            </ol>
            <div style={{ marginTop: 14 }}>
              <label>Viewer ID</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" readOnly value={id} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(id)} style={{ whiteSpace: 'nowrap' }}>Copy</button>
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--grey-20)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--grey-50)' }}>Live Preview</span>
              <a href={viewerUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--grey-50)' }}>Open ↗</a>
            </div>
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: 480, border: 'none', display: 'block' }}
              title="Viewer Preview"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
