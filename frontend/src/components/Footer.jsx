import React from 'react';
import NetworkStatusIndicator from './NetworkStatusIndicator.jsx';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-bg-ink-dark)',
      color: 'var(--color-text-ink-light)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: 'var(--space-7) 0 var(--space-6)',
      marginTop: 'auto',
      fontSize: '0.875rem'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'start',
          flexWrap: 'wrap',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)'
        }}>
          {/* Brand Info */}
          <div style={{ maxWidth: '320px' }}>
            <h4 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.25rem', 
              color: 'var(--color-text-ink-light)',
              marginBottom: 'var(--space-3)'
            }}>
              ALETHEIA
            </h4>
            <p style={{ opacity: 0.7, lineHeight: 1.6, fontSize: '0.8rem' }}>
              Truth in Trade, Trust in Time. Turning verified receivables into tokenized assets on Stellar to reveal truth to investors and accelerate trust for exporters.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="form-label" style={{ color: 'var(--color-saffron-light)', marginBottom: 'var(--space-3)' }}>Legals & Safety</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <li>
                <a href="#terms" style={{ color: 'inherit', opacity: 0.7 }}>Terms of Service</a>
              </li>
              <li>
                <a href="#privacy" style={{ color: 'inherit', opacity: 0.7 }}>Privacy & KYC Policy</a>
              </li>
              <li>
                <a href="#audit" style={{ color: 'inherit', opacity: 0.7 }}>Smart Contract Audits</a>
              </li>
            </ul>
          </div>

          {/* Network Status */}
          <div>
            <h5 className="form-label" style={{ color: 'var(--color-saffron-light)', marginBottom: 'var(--space-3)' }}>Network Status</h5>
            <NetworkStatusIndicator />
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          opacity: 0.5,
          fontSize: '0.75rem'
        }}>
          <span>&copy; {new Date().getFullYear()} Aletheia. All rights reserved.</span>
          <span>Stellar Build Better 2026 Submission · Built for Demonstration Purposes</span>
        </div>
      </div>
    </footer>
  );
}
