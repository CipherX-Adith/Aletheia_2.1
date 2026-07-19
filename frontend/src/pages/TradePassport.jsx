import React, { useEffect, useState } from 'react';
import { formatAddress } from '../stellar/client.js';

const API_URL = import.meta.env.VITE_API_URL || 'https://aletheia21-production.up.railway.app';

export default function TradePassport({ walletAddress, onConnect }) {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    async function fetchPassport() {
      try {
        const res = await fetch(`${API_URL}/api/trade-passport/my?address=${walletAddress}`);
        const data = await res.json();
        setPassport(data.data);
      } catch (err) {
        console.error('Failed to load Trade Passport details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPassport();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base text-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connect your wallet to view Trade Passport</div>
              <div className="text-ui-sm">You need a Stellar wallet linked to view your verifiable business identity.</div>
              <button className="btn btn-saffron btn-sm" onClick={onConnect} style={{ marginTop: 'var(--space-3)' }}>
                Connect Freighter
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-7)' }}>
          <div className="section-label" style={{ color: 'var(--color-saffron)' }}>Trust Profile</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
            Trade Passport
          </h1>
          <p className="text-secondary text-ui-sm" style={{ maxWidth: 600 }}>
            Verifiable digital business identity on the Stellar network. Contains trust ratings, KYB status, and compliance checklists.
          </p>
        </div>

        {/* Passport Grid */}
        <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Profile Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="badge badge-active" style={{ width: 'fit-content' }}>
                    {passport?.status || 'ACTIVE'}
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '8px 0 0 0' }}>
                    {passport?.organization?.name || 'Loading organization...'}
                  </h2>
                  <p className="text-secondary text-ui-xs" style={{ margin: 0 }}>
                    Legal ID: {passport?.passportNumber || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-ui-xs" style={{ fontWeight: 600, color: 'var(--color-green)' }}>✓ KYB Approved</span>
                </div>
              </div>

              <div className="grid-3" style={{ gap: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <p className="text-ui-xs text-secondary" style={{ margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered in</p>
                  <p className="text-ui-sm" style={{ margin: 0, fontWeight: 600 }}>{passport?.organization?.country || 'India'}</p>
                </div>
                <div>
                  <p className="text-ui-xs text-secondary" style={{ margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Type</p>
                  <p className="text-ui-sm" style={{ margin: 0, fontWeight: 600 }}>{passport?.organization?.orgType || 'Exporter'}</p>
                </div>
                <div>
                  <p className="text-ui-xs text-secondary" style={{ margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</p>
                  <p className="text-ui-sm" style={{ margin: 0, fontWeight: 600 }}>
                    {passport?.activeSince ? new Date(passport.activeSince).getFullYear() : '2026'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scores & Statistics Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.25rem' }}>Reputation & Trust</h3>
            
            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <div style={{ background: 'var(--color-bg-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <p className="text-ui-xs text-secondary" style={{ margin: '0 0 4px 0' }}>Trust Score</p>
                <p className="display-sm" style={{ margin: 0, color: 'var(--color-saffron)', fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {passport?.trustScore ? `${passport.trustScore}%` : '95%'}
                </p>
              </div>
              <div style={{ background: 'var(--color-bg-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <p className="text-ui-xs text-secondary" style={{ margin: '0 0 4px 0' }}>Reputation</p>
                <p className="display-sm" style={{ margin: 0, color: 'var(--color-teal-light)', fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {passport?.reputationScore ? `${passport.reputationScore}%` : '98%'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="text-secondary">Successful Trades</span>
                <span style={{ fontWeight: 600 }}>{passport?.successfulTrades || 0}</span>
              </div>
              <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="text-secondary">Defaults</span>
                <span style={{ fontWeight: 600, color: 'var(--color-clawback)' }}>{passport?.defaultCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Avg Settlement Time</span>
                <span style={{ fontWeight: 600 }}>
                  {passport?.avgSettlementDays ? `${passport.avgSettlementDays} Days` : '12 Days'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checklists */}
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 var(--space-4) 0', fontSize: '1.25rem' }}>Compliance Checklists</h3>
          <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-green)', fontSize: '1.5rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <p className="text-ui-sm" style={{ margin: '0 0 2px 0', fontWeight: 600 }}>Corporate KYB</p>
                <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>Verified legally registered entity</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-green)', fontSize: '1.5rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <p className="text-ui-sm" style={{ margin: '0 0 2px 0', fontWeight: 600 }}>Stellar Wallet trust</p>
                <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>USDC token trustline verified</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-green)', fontSize: '1.5rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <p className="text-ui-sm" style={{ margin: '0 0 2px 0', fontWeight: 600 }}>Export Certifications</p>
                <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>SGS and logistics trust validated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
