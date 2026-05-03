export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grey-08)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>VisuTek</span>
          <p style={{ fontSize: 12, color: 'var(--grey-50)', marginTop: 4 }}>3D Product Viewer Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
