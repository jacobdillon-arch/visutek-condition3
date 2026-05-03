'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ColorsPage() {
  const { id } = useParams<{ id: string }>();
  const [colors, setColors] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#000000');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getColors(id).then(setColors).catch(() => {}); }, [id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setError('Name is required'); return; }
    setError('');
    setAdding(true);
    try {
      const color = await api.createColor(id, { name: newName.trim(), hexValue: newHex, isDefault: colors.length === 0 }) as any;
      setColors(c => [...c, color]);
      setNewName('');
      setNewHex('#000000');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      await api.updateColors(id, colors.map((c, i) => ({ ...c, sortOrder: i })));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(colorId: string) {
    try {
      await api.deleteColor(id, colorId);
      setColors(c => c.filter(x => x.id !== colorId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  function setDefault(colorId: string) {
    setColors(colors.map(c => ({ ...c, isDefault: c.id === colorId })));
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/dashboard/products/${id}`} style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewer settings</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>Color Options</h1>
        <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Define the color swatches shown in the viewer.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Add new */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add Color</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="color-name">Color name</label>
              <input id="color-name" type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Forest Green" />
            </div>
            <div>
              <label htmlFor="color-hex">Hex value</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" id="color-hex" value={newHex} onChange={e => setNewHex(e.target.value)} style={{ width: 40, height: 36, border: '1px solid var(--grey-20)', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
                <input type="text" className="input" value={newHex} onChange={e => setNewHex(e.target.value)} style={{ width: 120 }} pattern="^#[0-9a-fA-F]{6}$" />
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={adding} style={{ alignSelf: 'flex-start' }}>
              {adding ? 'Adding…' : 'Add color'}
            </button>
          </form>
        </div>

        {/* Color list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Colors ({colors.length})</h2>
            {colors.length > 0 && (
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={handleSaveAll} disabled={saving}>
                {saving ? 'Saving…' : 'Save order'}
              </button>
            )}
          </div>
          {colors.length === 0 ? (
            <p style={{ color: 'var(--grey-50)', fontSize: 13 }}>No colors yet. Add your first color.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colors.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--grey-20)', borderRadius: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.hexValue, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--grey-50)', fontFamily: 'monospace' }}>{c.hexValue}</p>
                  </div>
                  {c.isDefault && <span className="badge badge-green">Default</span>}
                  {!c.isDefault && (
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setDefault(c.id)}>Set default</button>
                  )}
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleDelete(c.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
