'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function VariantsPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [shopifyVariants, setShopifyVariants] = useState<any[]>([]);
  const [manualVariants, setManualVariants] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getConfig(id), api.getVariants(id)]).then(([c, m]) => {
      setConfig(c);
      setMappings(m);
    }).catch(() => {});
  }, [id]);

  function parseManualVariants() {
    const lines = manualVariants.split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      const [variantId, title] = line.split('\t');
      return { id: variantId?.trim(), title: title?.trim() ?? variantId?.trim() };
    }).filter(v => v.id);
    setShopifyVariants(parsed);
    initMappings(parsed);
  }

  function initMappings(variants: any[]) {
    const existing = new Map(mappings.map(m => [m.shopifyVariantId, m]));
    setMappings(variants.map(v => existing.get(v.id) ?? {
      shopifyVariantId: v.id,
      size: '',
      colorOptionId: null,
      priceOverride: null,
    }));
  }

  function updateMapping(variantId: string, field: string, value: string | null) {
    setMappings(mappings.map(m => m.shopifyVariantId === variantId ? { ...m, [field]: value } : m));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateVariants(id, mappings.filter(m => m.size));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const sizes = config ? Object.keys(config.sizeCharts?.[0]?.chartData ?? {}) : [];
  const colors = config?.colorOptions ?? [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/dashboard/products/${id}`} style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewer settings</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>Variant Mapping</h1>
        <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Map each Shopify variant to a size and color so the viewer knows which variant to add to cart.</p>
      </div>

      {shopifyVariants.length === 0 && (
        <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Import Shopify Variants</h2>
          <p style={{ fontSize: 13, color: 'var(--grey-50)', marginBottom: 12 }}>
            Paste your variant IDs below (one per line). You can find them in Shopify Admin → Products → the variant IDs in the URL or via the Shopify API.
          </p>
          <p style={{ fontSize: 12, color: 'var(--grey-50)', marginBottom: 8 }}>Format: <code style={{ background: 'var(--grey-08)', padding: '1px 4px', borderRadius: 3 }}>variantId[tab]title</code></p>
          <textarea
            className="input"
            rows={6}
            value={manualVariants}
            onChange={e => setManualVariants(e.target.value)}
            placeholder="39284756382&#9;XS / Forest Green&#10;39284756383&#9;S / Forest Green&#10;..."
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={parseManualVariants}>Import variants</button>
        </div>
      )}

      {mappings.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Variant Mappings ({mappings.length})</h2>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save mappings'}</button>
          </div>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr><th>Variant ID</th><th>Title</th><th>Size</th><th>Color</th><th>Price override</th></tr>
            </thead>
            <tbody>
              {mappings.map((m: any, i) => {
                const variant = shopifyVariants.find(v => v.id === m.shopifyVariantId);
                return (
                  <tr key={m.shopifyVariantId}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--grey-50)' }}>{m.shopifyVariantId}</td>
                    <td>{variant?.title ?? '—'}</td>
                    <td>
                      <select className="input" style={{ padding: '4px 6px', fontSize: 12 }} value={m.size} onChange={e => updateMapping(m.shopifyVariantId, 'size', e.target.value)}>
                        <option value="">— select —</option>
                        {sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="input" style={{ padding: '4px 6px', fontSize: 12 }} value={m.colorOptionId ?? ''} onChange={e => updateMapping(m.shopifyVariantId, 'colorOptionId', e.target.value || null)}>
                        <option value="">— any —</option>
                        {colors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" className="input" step="0.01" style={{ width: 80, padding: '4px 6px', fontSize: 12 }} placeholder="—"
                        value={m.priceOverride ?? ''} onChange={e => updateMapping(m.shopifyVariantId, 'priceOverride', e.target.value ? parseFloat(e.target.value) as any : null)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
