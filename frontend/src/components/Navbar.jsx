import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton.jsx';
import NetworkStatusIndicator from './NetworkStatusIndicator.jsx';

export default function Navbar({ walletAddress, userRole, connecting, onConnect, onDisconnect }) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      background: 'var(--color-bg-glass)',
      borderBottom: '1px solid var(--color-border)',
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <NavLink to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 20L12 4L19 20" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13C9 13 10.5 10.5 12 13C13.5 15.5 15 13 15 13" stroke="var(--color-saffron)" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="4" x2="12" y2="20" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            ALETHEIA
          </span>
        </NavLink>

        {/* Links */}
        <ul className="navbar-links" style={{
          display: 'flex',
          gap: 'var(--space-4)',
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              Home
            </NavLink>
          </li>
          {!isLandingPage && walletAddress && userRole === 'investor' && (
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                Investor Dashboard
              </NavLink>
            </li>
          )}
          {!isLandingPage && walletAddress && userRole === 'exporter' && (
            <li>
              <NavLink to="/exporter" className={({ isActive }) => isActive ? 'active' : ''}>
                Exporter Portal
              </NavLink>
            </li>
          )}
          {walletAddress && (
            <>
              <li>
                <NavLink to="/trade-passport" className={({ isActive }) => isActive ? 'active' : ''}>
                  Trade Passport
                </NavLink>
              </li>
              <li>
                <NavLink to="/wallet" className={({ isActive }) => isActive ? 'active' : ''}>
                  Stellar Wallet
                </NavLink>
              </li>
            </>
          )}
          {(isLandingPage || !walletAddress) && (
            <li>
              <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'active' : ''}>
                How It Works
              </NavLink>
            </li>
          )}
          {!isLandingPage && userRole === 'admin' && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                Admin
              </NavLink>
            </li>
          )}
        </ul>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <NetworkStatusIndicator />
          {walletAddress ? (
            <WalletConnectButton 
              walletAddress={walletAddress}
              connecting={connecting}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          ) : (
            <button className="btn btn-outline btn-sm" onClick={onConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
