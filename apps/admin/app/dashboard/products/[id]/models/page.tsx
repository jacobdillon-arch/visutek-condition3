'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

const MAX_BYTES = 50 * 1024 * 1024;
const WARN_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ModelsPage() {
  const { id } = useParams<{ id: string }>();
  const [models, setModels] = useState<any[]>([]);
  const [label, setLabel] = useState("Men's");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getConfig(id).then(c => setModels(c.models ?? [])).catch(() => {});
  }, [id]);

  async function handleUpload(file: File) {
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      setError('Only .glb or .gltf files are supported');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large. Maximum size is ${formatBytes(MAX_BYTES)}.`);
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const { uploadUrl, modelId, warnings: w } = await api.requestUpload({ configId: id, label, fileSizeBytes: file.size });
      setWarnings(w);

      // Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'model/gltf-binary');
        xhr.send(file);
      });

      await api.completeUpload(modelId);
      const refreshed = await api.getConfig(id);
      setModels(refreshed.models ?? []);
    } catch (err: any) {
      setError(err.message);
      setWarnings([]);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(modelId: string) {
    if (!confirm('Delete this model?')) return;
    try {
      await api.deleteModel(modelId);
      setModels(m => m.filter(x => x.id !== modelId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  const statusColors: Record<string, string> = { ready: 'badge-green', processing: 'badge-yellow', error: 'badge-red', pending: 'badge-grey' };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/dashboard/products/${id}`} style={{ fontSize: 13, color: 'var(--grey-50)' }}>← Viewer settings</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>3D Models</h1>
        <p style={{ color: 'var(--grey-50)', fontSize: 13, marginTop: 4 }}>Upload GLB models for this viewer. Each model appears as a tab (e.g. Men's / Women's).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upload */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Upload Model</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="model-label">Model label</label>
              <input id="model-label" type="text" className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Men's" />
              <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 4 }}>Shown as a tab when multiple models are present</p>
            </div>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
              style={{
                border: '2px dashed var(--grey-20)', borderRadius: 8, padding: '32px 16px', textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer', background: 'var(--grey-08)', transition: 'border-color 0.15s'
              }}
            >
              {uploading ? (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>Uploading… {progress}%</p>
                  <div style={{ marginTop: 12, height: 4, background: 'var(--grey-20)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--black)', borderRadius: 2, transition: 'width 0.2s' }} />
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Drop .glb file here</p>
                  <p style={{ fontSize: 12, color: 'var(--grey-50)', marginTop: 4 }}>or click to browse</p>
                  <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 8 }}>Max 50MB · Recommend Draco compression for files &gt;15MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".glb,.gltf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            {error && <p className="form-error">{error}</p>}
            {warnings.map((w, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--warning)', background: '#fffbeb', padding: '8px 10px', borderRadius: 4, border: '1px solid #fef3c7' }}>{w}</p>
            ))}
          </div>
        </div>

        {/* Model list */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Uploaded Models</h2>
          {models.length === 0 ? (
            <p style={{ color: 'var(--grey-50)', fontSize: 13 }}>No models uploaded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {models.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--grey-20)', borderRadius: 6 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 13 }}>{m.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--grey-50)', marginTop: 2 }}>
                      {formatBytes(Number(m.fileSizeBytes))}
                      {Number(m.fileSizeBytes) > WARN_BYTES && <span style={{ color: 'var(--warning)', marginLeft: 6 }}>· Large file</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${statusColors[m.uploadStatus] ?? 'badge-grey'}`}>{m.uploadStatus}</span>
                    <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleDelete(m.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
