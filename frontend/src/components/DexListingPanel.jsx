import React, { useState } from 'react';
import { stellarApi, formatUsd } from '../stellar/client.js';

// ── DEX Listing Panel ─────────────────────────────────────────
// Lets an investor create a secondary market sell offer for a
// receivable token they hold. Uses Stellar's built-in DEX via
// ManageSellOffer — no custom AMM or order book required.
export default function DexListingPanel({ investment, walletAddress, onSuccess }) {
  const { receivable, share_cents } = investment;
  const faceValueUsd = share_cents / 100;

  const [priceUsdc, setPriceUsdc] = useState((faceValueUsd * 0.97).toFixed(2)); // 3% below face
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const impliedDiscount = ((faceValueUsd - parseFloat(priceUsdc)) / faceValueUsd * 100).toFixed(1);
  const isUnderPar = parseFloat(priceUsdc) < faceValueUsd;

  async function handleList() {
    if (!walletAddress) {
      setError('Connect your wallet first');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await stellarApi.createDexListing({
        seller_address: walletAddress,
        asset_code: receivable.token_asset_code,
        asset_issuer: null, // API uses env ISSUER_PUBLIC_KEY
        amount: (share_cents / 100).toFixed(7),
        price_usdc: parseFloat(priceUsdc).toFixed(7),
      });
      setResult(res);
      onSuccess?.(res);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (!receivable?.token_asset_code) return null;

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      {!showPanel ? (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowPanel(true)}
          id={`dex-list-toggle-${receivable.id}`}
        >
          📊 List on DEX (secondary market)
        </button>
      ) : result ? (
        <div className="alert alert-success animate-fade-in" style={{ padding: '10px 14px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>✓ DEX offer submitted</div>
            <div className="text-ui-xs text-muted">
              {result.message}
            </div>
            {result.stellar_expert_url && (
              <a
                href={result.stellar_expert_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ui-xs text-accent"
                style={{ marginTop: 4, display: 'block' }}
              >
                View on stellar.expert →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in" style={{
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a78bfa' }}>
              📊 List {receivable.token_asset_code} on Stellar DEX
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPanel(false)}>✕</button>
          </div>

          <div className="text-ui-xs text-muted" style={{ marginBottom: 'var(--space-3)' }}>
            Your token: <strong>{receivable.token_asset_code}</strong> · Face value: <strong>{formatUsd(share_cents)}</strong>
            <br />
            Other investors can buy your position on Stellar's built-in DEX before maturity.
          </div>

          {/* Price slider */}
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">Sell Price (USDC per token unit)</label>
            <input
              type="number"
              className="form-input"
              step="0.01"
              min={(faceValueUsd * 0.7).toFixed(2)}
              max={(faceValueUsd * 1.02).toFixed(2)}
              value={priceUsdc}
              onChange={(e) => setPriceUsdc(e.target.value)}
              id={`dex-price-${receivable.id}`}
            />
            <div className="form-hint">
              {isUnderPar
                ? `${impliedDiscount}% below face value — attractive to secondary buyers`
                : 'At or above face value — buyers may prefer to wait for new issuance'}
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 'var(--space-4)',
          }}>
            <span className="text-ui-xs text-muted">You receive</span>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>
              {formatUsd(parseFloat(priceUsdc) * 100)} USDC
            </span>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)', padding: '8px 12px' }}>
              <span className="text-ui-xs">{error}</span>
            </div>
          )}

          <div className="alert alert-info" style={{ marginBottom: 'var(--space-3)', padding: '8px 12px' }}>
            <span className="text-ui-xs">
              Uses Stellar's native ManageSellOffer — no intermediary, atomic settlement.
              {!walletAddress && ' Connect wallet to proceed.'}
            </span>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPanel(false)}>Cancel</button>
            <button
              className="btn btn-sm"
              style={{ background: '#7c3aed', color: 'white', flex: 1 }}
              onClick={handleList}
              disabled={loading || !walletAddress}
              id={`dex-confirm-${receivable.id}`}
            >
              {loading
                ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Listing…</>
                : `List for ${formatUsd(parseFloat(priceUsdc) * 100)} USDC`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
