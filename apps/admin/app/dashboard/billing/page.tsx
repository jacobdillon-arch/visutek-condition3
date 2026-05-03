'use client';
import Link from 'next/link';
import { PLANS, PLAN_PRICES } from '@visutek/shared';

const PLAN_FEATURES = {
  free: ['1 viewer', '2 models per viewer', '100MB storage', 'VisuTek branding'],
  starter: ['3 viewers', '4 models per viewer', '500MB storage', 'Shopify billing', 'VisuTek branding'],
  pro: ['Unlimited viewers', '10 models per viewer', '5GB storage', 'Remove branding', 'Priority support'],
};

export default function BillingPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Billing & Plans</h1>
      <p style={{ color: 'var(--grey-50)', fontSize: 13, marginBottom: 32 }}>Upgrade to unlock more viewers, storage, and remove VisuTek branding.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900 }}>
        {(['free', 'starter', 'pro'] as const).map(plan => (
          <div key={plan} className="card" style={{ border: plan === 'pro' ? '2px solid var(--black)' : '1px solid var(--grey-20)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{plan}</p>
                <p style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
                  {plan === 'free' ? 'Free' : `$${PLAN_PRICES[plan as 'starter' | 'pro']}`}
                  {plan !== 'free' && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--grey-50)' }}>/mo</span>}
                </p>
              </div>
              {plan === 'pro' && <span className="badge badge-green">Best value</span>}
            </div>
            <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {PLAN_FEATURES[plan].map(f => (
                <li key={f} style={{ fontSize: 13 }}>{f}</li>
              ))}
            </ul>
            {plan !== 'free' ? (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </button>
            ) : (
              <button className="btn btn-secondary" disabled style={{ width: '100%', justifyContent: 'center' }}>Current plan</button>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--grey-50)', marginTop: 20 }}>
        Plans are billed through Shopify. Charges appear on your Shopify invoice.{' '}
        <Link href="/dashboard/connect" style={{ color: 'var(--black)' }}>Connect your store</Link> to upgrade.
      </p>
    </div>
  );
}
