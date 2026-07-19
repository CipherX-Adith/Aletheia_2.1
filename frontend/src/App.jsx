import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import ExporterDashboard from './pages/ExporterDashboard.jsx';
import InvestorDashboard from './pages/InvestorDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NotFound from './pages/NotFound.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ReceivableDetail from './pages/ReceivableDetail.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Login from './pages/Login.jsx';

import Wallet from './pages/Wallet.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import { connectFreighter, getFreighterPublicKey } from './stellar/client.js';

const ProtectedRoute = ({ element, role, walletAddress, userRole, setShowLoginModal }) => {
  const isAuthorized = walletAddress && userRole === role;
  useEffect(() => {
    if (!isAuthorized) {
      setShowLoginModal(true);
    }
  }, [isAuthorized, setShowLoginModal]);

  return isAuthorized ? element : <Navigate to="/" replace />;
};

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isFreighterConnected, setIsFreighterConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Credentials fields inside the global admin modal
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Restore wallet and role on mount (only if previously logged in)
  useEffect(() => {
    const storedAddr = localStorage.getItem('userAddress');
    const storedRole = localStorage.getItem('userRole');
    const storedFreighter = localStorage.getItem('isFreighterConnected') === 'true';
    if (storedAddr && storedRole) {
      setWalletAddress(storedAddr);
      setUserRole(storedRole);
      setIsFreighterConnected(storedFreighter);
    } else {
      setWalletAddress(null);
      setUserRole(null);
      setIsFreighterConnected(false);
    }
  }, []);

  const handleLogin = (address, role, email) => {
    setWalletAddress(address);
    setUserRole(role);
    localStorage.setItem('userAddress', address);
    localStorage.setItem('userRole', role);
    if (email) {
      localStorage.setItem('userEmail', email);
    }
  };

  const handleDisconnectWallet = () => {
    setIsFreighterConnected(false);
    localStorage.removeItem('isFreighterConnected');
  };

  const handleLogout = () => {
    setWalletAddress(null);
    setUserRole(null);
    setIsFreighterConnected(false);
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isFreighterConnected');
    navigate('/login');
  };

  // Global keydown listener for Ctrl+Shift+A & "admin" keyboard sequence detection
  useEffect(() => {
    let keyBuffer = [];
    const handleKeyDown = (e) => {
      // 1. Check for Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminError('');
        setShowAdminModal(true);
        return;
      }

      // Ignore inputs/textareas to prevent false triggers when typing in text fields
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      // 2. Check for typing "admin"
      keyBuffer.push(e.key.toLowerCase());
      if (keyBuffer.length > 5) {
        keyBuffer.shift();
      }

      if (keyBuffer.join('') === 'admin') {
        setAdminError('');
        setShowAdminModal(true);
        keyBuffer = []; // Clear buffer
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const address = await connectFreighter();
      if (address) {
        let role = localStorage.getItem('userRole');
        if (!role) {
          if (location.pathname.startsWith('/exporter')) {
            role = 'exporter';
          } else {
            role = 'investor';
          }
        }
        const email = localStorage.getItem('userEmail');
        if (email) {
          const API_URL = import.meta.env.VITE_API_URL || 'https://aletheia21-production.up.railway.app';
          try {
            await fetch(`${API_URL}/api/wallet/sync-freighter`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, address })
            });
          } catch (e) {
            console.error('Failed to sync Freighter wallet with backend', e);
          }
        }
        localStorage.setItem('isFreighterConnected', 'true');
        setIsFreighterConnected(true);
        handleLogin(address, role, email);
      } else {
        setShowMobileModal(true);
      }
    } catch (err) {
      console.error('Wallet connect error', err);
    }
    setConnecting(false);
  }

  const handleAdminModalSubmit = (e) => {
    e.preventDefault();
    if (adminUser.trim().toLowerCase() === 'admin' && adminPass === 'admin') {
      handleLogin('GDEMO5LOGISTICS1PARTNER1ALETHEIA1FREIGHT1111111111111111', 'admin');
      setShowAdminModal(false);
      setAdminUser('');
      setAdminPass('');
      navigate('/admin');
    } else {
      setAdminError('Invalid admin credentials. Use admin/admin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
      {/* Navbar */}
      <Navbar 
        walletAddress={walletAddress}
        userRole={userRole}
        connecting={connecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnectWallet}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        isFreighterConnected={isFreighterConnected}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, paddingTop: 'var(--nav-height)' }}>
        <Routes>
          <Route path="/" element={<Landing walletAddress={walletAddress} userRole={userRole} onConnect={handleConnect} onOpenLogin={() => setShowLoginModal(true)} />} />
          <Route path="/marketplace" element={<Marketplace userRole={userRole} onOpenLogin={() => setShowLoginModal(true)} />} />

          <Route path="/wallet" element={<Wallet walletAddress={walletAddress} onConnect={handleConnect} />} />
          <Route path="/receivable/:id" element={<ReceivableDetail walletAddress={walletAddress} onConnect={handleConnect} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<InvestorDashboard walletAddress={walletAddress} onConnect={handleConnect} />} role="investor" walletAddress={walletAddress} userRole={userRole} setShowLoginModal={setShowLoginModal} />} />
          <Route path="/exporter" element={<ProtectedRoute element={<ExporterDashboard walletAddress={walletAddress} onConnect={handleConnect} />} role="exporter" walletAddress={walletAddress} userRole={userRole} setShowLoginModal={setShowLoginModal} />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/admin" element={<ProtectedRoute element={<AdminPanel walletAddress={walletAddress} />} role="admin" walletAddress={walletAddress} userRole={userRole} setShowLoginModal={setShowLoginModal} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />

      {/* Global Admin Bypass Authentication Modal */}
      {showAdminModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowAdminModal(false)}>
          <div className="modal" style={{ maxWidth: 400, border: '1px solid var(--color-saffron)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>🛡️ Administrative Login Bypass</h3>
              <button className="modal-close" onClick={() => setShowAdminModal(false)}>✕</button>
            </div>
            
            <p className="text-ui-xs text-secondary" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
              You triggered the administrative authentication prompt. Enter details to access the supervisor panel directly.
            </p>

            <form onSubmit={handleAdminModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label className="label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Username</label>
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <div>
                <label className="label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Password</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {adminError && (
                <div style={{ color: 'var(--color-red)', fontSize: '0.75rem', textAlign: 'center' }}>
                  ❌ {adminError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-full btn-sm"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-saffron), #e58a13)',
                    borderColor: 'var(--color-saffron)'
                  }}
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Wallet Guide Modal */}
      {showMobileModal && (
        <div className="modal-backdrop" style={{ zIndex: 1000 }} onClick={() => setShowMobileModal(false)}>
          <div className="modal" style={{ maxWidth: 440, border: '1px solid var(--color-saffron)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>📱 Mobile Wallet Guide</h3>
              <button className="modal-close" onClick={() => setShowMobileModal(false)}>✕</button>
            </div>
            
            <p className="text-ui-xs text-secondary" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
              On mobile devices, Freighter is available as a dedicated application rather than a browser extension. 
              To connect and sign transactions:
            </p>

            <div style={{
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
              border: '1px solid var(--color-border)'
            }}>
              <ol className="text-ui-xs text-secondary" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
                <li>Copy the current website URL:<br />
                  <span className="monospace text-accent" style={{ fontSize: '0.8rem', wordBreak: 'break-all', fontWeight: 600 }}>
                    {window.location.origin}/
                  </span>
                </li>
                <li>Open the <strong>Freighter Mobile App</strong> on your phone.</li>
                <li>Go to the <strong>Browser Tab</strong> (compass icon) inside Freighter.</li>
                <li>Paste the URL and open the site.</li>
                <li>Click <strong>Connect Wallet</strong> to connect natively!</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-full btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + "/").catch(() => {});
                  alert("URL copied!");
                }}
              >
                📋 Copy Link
              </button>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-full btn-sm"
                style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Get Freighter App ↗
              </a>
            </div>
          </div>
        </div>
      )}
      <Login 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={handleLogin} 
        currentWalletAddress={walletAddress}
      />

      {/* Global Chatbot Support Assistant */}
      <ChatbotWidget walletAddress={walletAddress} userRole={userRole} />
    </div>
  );
}
