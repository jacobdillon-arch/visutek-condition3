'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ConnectPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState('');
  const [error, setError] = useState('');

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const domain = shop.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    if (!domain.endsWith('.myshopify.com') && !domain.includes('.')) {
      setError('Enter your .myshopify.com domain, e.g. my-store.myshopify.com');
      return;
    }
    const normalized = domain.includes('.') ? domain : `${domain}.myshopify.com`;
    window.location.href = `${API}/auth/shopify/install?shop=${encodeURIComponent(normalized)}`;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connect Shopify Store</h1>
      <p style={{ color: 'var(--grey-50)', fontSize: 13, marginBottom: 32 }}>
        Connect your Shopify store to embed 3D viewers on product pages and sync cart functionality.
      </p>

      {user?.storeId && (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 24 }}>
          <p style={{ color: '#166534', fontWeight: 500 }}>Store connected</p>
          <p style={{ color: '#166534', fontSize: 13, marginTop: 4 }}>Your Shopify store is connected. You can reconnect below to update permissions.</p>
        </div>
      )}

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Enter your Shopify domain</h2>
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="shop">Shopify store domain</label>
            <input
              id="shop" type="text" className="input" value={shop}
              onChange={e => setShop(e.target.value)}
              placeholder="my-store.myshopify.com"
              required
            />
            <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 4 }}>Find this in your Shopify admin URL</p>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary">Connect Store</button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--grey-20)' }}>
          <p style={{ fontSize: 12, color: 'var(--grey-50)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>What happens next</p>
          <ol style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'You\'ll be redirected to Shopify to approve permissions',
              'VisuTek will request read access to your products',
              'You\'ll be redirected back here to finish setup',
              'Install the VisuTek block in your Shopify Theme Editor',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--grey-50)' }}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
