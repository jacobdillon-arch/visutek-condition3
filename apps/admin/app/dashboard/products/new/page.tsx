'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [bgColor, setBgColor] = useState('#f0efec');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const config = await api.createConfig({
        name: name.trim(),
        shopifyProductId: productId.trim() || undefined,
        backgroundColor: bgColor,
      }) as any;
      router.push(`/dashboard/products/${config.id}/models`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/products" style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewers</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>New Viewer</h1>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="name">Viewer name *</label>
            <input id="name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Powderverse Pant Viewer" required />
          </div>
          <div>
            <label htmlFor="productId">Shopify Product ID</label>
            <input id="productId" type="text" className="input" value={productId} onChange={e => setProductId(e.target.value)} placeholder="e.g. 7823648293 (optional)" />
            <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 4 }}>Find this in your Shopify Admin → Products → the numeric ID in the URL</p>
          </div>
          <div>
            <label htmlFor="bgColor">Background color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" id="bgColor" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 40, height: 36, border: '1px solid var(--grey-20)', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
              <input type="text" className="input" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 120 }} />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Viewer'}</button>
            <Link href="/dashboard/products"><button type="button" className="btn btn-secondary">Cancel</button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
