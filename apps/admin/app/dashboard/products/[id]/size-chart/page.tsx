'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { SizeChartData } from '@visutek/shared';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function emptyChart(): SizeChartData {
  return Object.fromEntries(DEFAULT_SIZES.map(sz => [sz, {
    waist: [0, 0] as [number, number],
    hip: [0, 0] as [number, number],
    inseam: { short: 0, reg: 0, tall: 0 },
  }]));
}

export default function SizeChartPage() {
  const { id } = useParams<{ id: string }>();
  const [charts, setCharts] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<any | null>(null);
  const [chartData, setChartData] = useState<SizeChartData>(emptyChart());
  const [label, setLabel] = useState('');
  const [gender, setGender] = useState('unisex');
  const [unit, setUnit] = useState('in');
  const [easeWaist, setEaseWaist] = useState(1.0);
  const [easeHip, setEaseHip] = useState(1.5);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.getSizeCharts(id).then(c => {
      setCharts(c);
      if (c.length > 0) selectChart(c[0]);
    }).catch(() => {});
  }, [id]);

  function selectChart(chart: any) {
    setActiveChart(chart);
    setLabel(chart.label);
    setGender(chart.gender);
    setUnit(chart.unit);
    setChartData(chart.chartData);
    setEaseWaist((chart.easeData as any).waist);
    setEaseHip((chart.easeData as any).hip);
  }

  function updateCell(size: string, field: string, subfield: string, val: number) {
    setChartData(prev => {
      const entry = { ...prev[size] };
      if (subfield === 'lo') { (entry as any)[field] = [val, (entry as any)[field][1]]; }
      else if (subfield === 'hi') { (entry as any)[field] = [(entry as any)[field][0], val]; }
      else { (entry as any)[field] = { ...(entry as any)[field], [subfield]: val }; }
      return { ...prev, [size]: entry };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { label, gender, unit, chartData, easeData: { waist: easeWaist, hip: easeHip } };
      if (activeChart) {
        const updated = await api.updateSizeChart(id, activeChart.id, payload) as any;
        setCharts(charts.map(c => c.id === activeChart.id ? updated : c));
        setActiveChart(updated);
      } else {
        const created = await api.createSizeChart(id, payload) as any;
        setCharts([...charts, created]);
        selectChart(created);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleNewChart() {
    setActiveChart(null);
    setLabel('');
    setGender('unisex');
    setUnit('in');
    setChartData(emptyChart());
    setEaseWaist(1.0);
    setEaseHip(1.5);
    setCreating(true);
  }

  const sizes = Object.keys(chartData);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/dashboard/products/${id}`} style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewer settings</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Size Charts</h1>
            <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Define size ranges used by the fit calculator.</p>
          </div>
          <button className="btn btn-secondary" onClick={handleNewChart}>+ New chart</button>
        </div>
      </div>

      {charts.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {charts.map(c => (
            <button key={c.id} className={`btn ${activeChart?.id === c.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => selectChart(c)} style={{ fontSize: 12 }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <div>
            <label htmlFor="chart-label">Chart label</label>
            <input id="chart-label" type="text" className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Men's US" />
          </div>
          <div>
            <label htmlFor="chart-gender">Gender</label>
            <select id="chart-gender" className="input" value={gender} onChange={e => setGender(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="mens">Men's</option>
              <option value="womens">Women's</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div>
            <label htmlFor="chart-unit">Unit</label>
            <select id="chart-unit" className="input" value={unit} onChange={e => setUnit(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="in">Inches</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label>Waist ease ({unit})</label>
              <input type="number" className="input" step="0.5" value={easeWaist} onChange={e => setEaseWaist(parseFloat(e.target.value))} />
            </div>
            <div>
              <label>Hip ease ({unit})</label>
              <input type="number" className="input" step="0.5" value={easeHip} onChange={e => setEaseHip(parseFloat(e.target.value))} />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Size</th>
                <th>Waist lo</th><th>Waist hi</th>
                <th>Hip lo</th><th>Hip hi</th>
                <th>Inseam short</th><th>Inseam reg</th><th>Inseam tall</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map(sz => {
                const row = chartData[sz];
                return (
                  <tr key={sz}>
                    <td style={{ fontWeight: 600 }}>{sz}</td>
                    {[['waist','lo'],['waist','hi'],['hip','lo'],['hip','hi']].map(([f,s]) => (
                      <td key={`${f}-${s}`}>
                        <input type="number" step="0.5" className="input" style={{ width: 70, padding: '4px 6px', fontSize: 12 }}
                          value={(row as any)[f][s === 'lo' ? 0 : 1]}
                          onChange={e => updateCell(sz, f, s, parseFloat(e.target.value))} />
                      </td>
                    ))}
                    {['short','reg','tall'].map(len => (
                      <td key={len}>
                        <input type="number" step="0.5" className="input" style={{ width: 70, padding: '4px 6px', fontSize: 12 }}
                          value={(row.inseam as any)[len]}
                          onChange={e => updateCell(sz, 'inseam', len, parseFloat(e.target.value))} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save chart'}</button>
          {activeChart && (
            <button className="btn btn-danger" onClick={async () => {
              if (!confirm('Delete this size chart?')) return;
              await api.deleteSizeChart(id, activeChart.id);
              const remaining = charts.filter(c => c.id !== activeChart.id);
              setCharts(remaining);
              if (remaining.length > 0) selectChart(remaining[0]);
              else { setActiveChart(null); setChartData(emptyChart()); setCreating(false); }
            }}>Delete chart</button>
          )}
        </div>
      </div>
    </div>
  );
}
