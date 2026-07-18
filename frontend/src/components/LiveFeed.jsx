import React, { useState, useEffect, useRef } from 'react';
import { oracleApi } from '../stellar/client.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Live Event Feed ───────────────────────────────────────────
// Connects to the API's SSE stream (/api/stellar/stream/issuer)
// for real Horizon payments, AND polls the oracle events DB every 5s
// for application-level events (attestations, distributions, etc.).
// Merges both streams into a single unified feed.
export default function LiveFeed({ walletAddress }) {
  const [events, setEvents] = useState([]);
  const feedRef = useRef(null);
  const sseRef = useRef(null);

  // ── Oracle events poll (app-layer) ────────────────────────
  useEffect(() => {
    const tick = async () => {
      try {
        const data = await oracleApi.events();
        setEvents((prev) => {
          // Merge oracle events with existing SSE events
          const oracleEvts = data.slice(0, 15).map((e) => ({
            ...e,
            source: 'oracle',
            key: `oracle-${e.id}`,
          }));
          const sseEvts = prev.filter((e) => e.source === 'horizon');
          // Deduplicate + sort newest first
          const merged = [...sseEvts, ...oracleEvts]
            .sort((a, b) => new Date(b.occurred_at || b.created_at || 0) - new Date(a.occurred_at || a.created_at || 0))
            .slice(0, 25);
          return merged;
        });
      } catch {
        // API offline — keep existing events
      }
    };

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Horizon SSE stream ────────────────────────────────────
  useEffect(() => {
    let es;
    const connect = () => {
      es = new EventSource(`${API_URL}/api/stellar/stream/issuer`);
      sseRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat' || data.type === 'connected') return;
          if (data.type === 'payment') {
            const sseEvent = {
              id: data.id,
              key: `horizon-${data.id}`,
              source: 'horizon',
              event_type: 'payment',
              receivable_id: null,
              amount_cents: Math.round(parseFloat(data.amount || 0) * 100),
              occurred_at: data.created_at,
              _raw: data,
            };
            setEvents((prev) => [sseEvent, ...prev].slice(0, 25));
          }
        } catch {
          // Malformed SSE data — ignore
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 10s
        setTimeout(connect, 10000);
      };
    };

    connect();
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  // Auto-scroll to top (newest first)
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events]);

  const EVENT_META = {
    payment_confirmed: { icon: '💸', color: 'var(--color-saffron)',     label: 'Payment Confirmed'   },
    distributed:       { icon: '🎉', color: 'var(--color-green-light)', label: 'Pro-rata Payout'     },
    clawback:          { icon: '⚠️', color: '#f08080',                  label: 'Emergency Clawback'  },
    registered:        { icon: '📋', color: 'var(--color-text-secondary)', label: 'Registered'       },
    attested:          { icon: '✅', color: 'var(--color-teal-light)',   label: 'Attestation'         },
    minted:            { icon: '🪙', color: 'var(--color-gold)',         label: 'Token Minted'        },
    dex_listed:        { icon: '📊', color: '#a78bfa',                  label: 'DEX Listed'          },
    payment:           { icon: '⚡', color: 'var(--color-teal-light)',   label: 'Stellar Payment'     },
  };

  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-green-light)',
          boxShadow: '0 0 6px var(--color-green-light)',
          animation: 'pulse-saffron 2s ease-in-out infinite',
        }} />
        <span className="section-label" style={{ margin: 0 }}>Live Chain Events</span>
        <span className="text-ui-xs text-muted" style={{ marginLeft: 'auto' }}>
          SSE + polling
        </span>
      </div>

      <div className="live-feed" ref={feedRef} id="live-feed" style={{ maxHeight: 320 }}>
        {events.length === 0 ? (
          <div style={{
            padding: 'var(--space-5)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🌊</div>
            Waiting for on-chain events…
            <br />
            <span style={{ fontSize: '0.73rem' }}>
              Seed data or complete a transaction to see the feed populate
            </span>
          </div>
        ) : (
          events.map((event, idx) => {
            const meta = EVENT_META[event.event_type] || { icon: '🔔', color: 'var(--color-teal-light)', label: event.event_type };
            return (
              <div key={event.key || event.id || idx} className="live-event" style={{
                borderLeft: `2px solid ${meta.color}`,
                marginBottom: 'var(--space-2)',
                paddingLeft: 'var(--space-3)',
              }}>
                <div className="live-event-dot" style={{ background: meta.color }} />
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: meta.color,
                  }}>
                    {meta.label}
                    {event.source === 'horizon' && (
                      <span className="badge" style={{
                        marginLeft: 6,
                        fontSize: '0.58rem',
                        background: 'rgba(13,154,168,0.15)',
                        color: 'var(--color-teal-light)',
                        padding: '1px 5px',
                        borderRadius: 3,
                      }}>
                        HORIZON
                      </span>
                    )}
                  </div>
                  <div className="text-ui-xs text-muted">
                    {event.receivable_id && `Receivable #${event.receivable_id}`}
                    {event.amount_cents > 0 && ` · $${(event.amount_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    {event.proof && !event.proof.startsWith('seed') && (
                      <span className="monospace" style={{ marginLeft: 4, fontSize: '0.68rem', opacity: 0.6 }}>
                        {event.proof.slice(0, 28)}…
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-ui-xs text-muted" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatRelTime(event.occurred_at)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatRelTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (isNaN(diff)) return '';
  if (diff < 5)   return 'just now';
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}
