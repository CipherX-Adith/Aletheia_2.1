import React from 'react';
import { STATUS_BADGE, STATUS_LABEL, formatUsd, daysUntil, formatYield } from '../stellar/client.js';

// ── Status Badge ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE[status] || 'badge-pending'}`}>
      <span style={{ fontSize: '0.5rem' }}>●</span>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// ── Receivable Card ────────────────────────────────────────────
export default function ReceivableCard({ receivable, onClick, showInvest }) {
  const {
    id, commodity, buyer_country, amount_usd, maturity_date,
    discount_bps, status, exporter_name, attestation_count,
    doc_hash, token_asset_code, investments = [],
  } = receivable;

  const days = daysUntil(maturity_date);
  const { discount, apy } = formatYield(discount_bps || 500, days);
  const totalInvested = investments.reduce((s, i) => s + (i.share_cents / 100), 0);
  const pctSold = amount_usd > 0 ? Math.min(100, (totalInvested / amount_usd) * 100) : 0;

  return (
    <div
      className={`card card-highlight animate-fade-in`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      id={`receivable-card-${id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex items-center gap-2">
          <span className="section-label" style={{ margin: 0 }}>#{id}</span>
          {token_asset_code && (
            <span className="monospace text-ui-xs text-accent">{token_asset_code}</span>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Commodity + Buyer */}
      <h3 style={{ marginBottom: 'var(--space-1)', fontSize: '1.15rem' }}>
        {commodity || 'Export Receivable'}
      </h3>
      <p className="text-ui-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        {exporter_name || 'Kerala Exporter'} → {buyer_country || 'International Buyer'}
      </p>

      {/* Key metrics */}
      <div className="grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <div className="section-label">Face Value</div>
          <div className="text-ui-lg" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
            {formatUsd(amount_usd * 100)}
          </div>
        </div>
        <div>
          <div className="section-label">Discount</div>
          <div className="text-ui-lg" style={{ color: 'var(--color-saffron)', fontWeight: 600 }}>
            {discount}
          </div>
        </div>
        <div>
          <div className="section-label">Maturity</div>
          <div className="text-ui-lg" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
            {days}d
          </div>
        </div>
      </div>

      {/* Subscription progress bar */}
      {status === 'active' && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-1)' }}>
            <span className="text-ui-xs text-muted">Subscribed</span>
            <span className="text-ui-xs text-accent">{pctSold.toFixed(0)}%</span>
          </div>
          <div style={{
            height: 4, background: 'var(--color-border)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pctSold}%`,
              background: 'var(--gradient-brand)',
              borderRadius: 2,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Attestation tracker for pending receivables */}
      {status === 'pending' && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div className="section-label">Attestations</div>
          <AttestationMini count={attestation_count || 0} required={2} />
        </div>
      )}

      {/* APY estimate */}
      {apy && status === 'active' && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)', padding: '8px 12px' }}>
          <span style={{ fontSize: '0.8rem' }}>
            Est. annualized yield: <strong>{apy}</strong> over {days} days to maturity
          </span>
        </div>
      )}

      {/* Doc hash */}
      {doc_hash && (
        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="text-ui-xs text-muted">Doc hash:</span>
          <span className="monospace text-ui-xs text-muted truncate" style={{ maxWidth: 180 }}>
            {doc_hash.slice(0, 16)}…
          </span>
          <span className="badge badge-attested" style={{ fontSize: '0.6rem' }}>✓ On-chain</span>
        </div>
      )}

      {/* CTA */}
      {showInvest && status === 'active' && (
        <button
          className="btn btn-primary btn-full"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          id={`invest-btn-${id}`}
        >
          Invest in this receivable
        </button>
      )}
    </div>
  );
}

// ── Attestation Mini Tracker ──────────────────────────────────
export function AttestationMini({ count, required = 2 }) {
  const total = 3;
  return (
    <div className="attestation-dots">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`attestation-dot ${i < count ? 'filled' : ''}`}>
            {i >= count && <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{i + 1}</span>}
          </div>
          {i < total - 1 && (
            <div className="attestation-line">
              <div
                className="attestation-line-fill"
                style={{ width: i < count - 1 ? '100%' : i === count - 1 ? '50%' : '0%' }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
      <span className="text-ui-xs text-muted" style={{ marginLeft: 'var(--space-2)' }}>
        {count}/{required} required
      </span>
    </div>
  );
}
