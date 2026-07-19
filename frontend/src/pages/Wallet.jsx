import React, { useEffect, useState } from 'react';
import { formatAddress, HORIZON_EXPLORER_URL } from '../stellar/client.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const isTestnet = (import.meta.env.VITE_STELLAR_NETWORK || 'mainnet').toLowerCase() === 'testnet';

export default function Wallet({ walletAddress, onConnect }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  async function fetchWallet() {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    try {
      const email = localStorage.getItem('userEmail') || '';
      const emailQuery = email ? `&email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`${API_URL}/api/wallet/balance?address=${walletAddress}${emailQuery}`);
      const balanceData = await res.json();
      setWallet(balanceData.data);
      
      const txRes = await fetch(`${API_URL}/api/wallet/transactions?address=${walletAddress}${emailQuery}`);
      const txData = await txRes.json();
      setTransactions(txData.data || []);
    } catch (err) {
      console.error('Failed to load wallet balance', err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallet();
  }, [walletAddress]);

  const handleCreateWallet = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create wallet');
      setWallet(data.data.wallet);
      if (data.data.secretKey) {
        setSecretKey(data.data.secretKey);
      }
      fetchWallet();
    } catch (err) {
      console.error('Create wallet error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFundTestnet = async () => {
    if (!walletAddress) return;
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/fund-testnet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress })
      });
      if (!res.ok) throw new Error('Failed to fund testnet');
      fetchWallet();
    } catch (err) {
      console.error('Fund testnet error', err);
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connect your wallet to view Stellar Wallet details</div>
              <div className="text-ui-sm">You need a Stellar wallet linked to manage assets and transaction history.</div>
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
      <div className="container text-ui-sm">
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-7)' }}>
          <div>
            <div className="section-label" style={{ color: 'var(--color-saffron)' }}>Settlement Wallet</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
              Stellar Wallet
            </h1>
            <p className="text-secondary text-ui-sm" style={{ maxWidth: 600 }}>
              Manage Stellar assets, USDC settlement accounts, and transaction history
            </p>
          </div>
          {wallet && (
            <button
              onClick={fetchWallet}
              disabled={syncing}
              className="btn btn-outline btn-sm flex items-center gap-2"
            >
              Sync Balance
            </button>
          )}
        </div>

        {!wallet ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" style={{ margin: '0 auto' }}></div>
            <p className="text-secondary text-ui-sm" style={{ marginTop: '16px' }}>Initializing your wallet environment...</p>
          </div>
        ) : (
          // Active Wallet View
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {secretKey && (
              <div className="alert alert-warning" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 600 }}>⚠️ Backup Your Secret Key</div>
                <div className="text-ui-xs">
                  This secret key will only be shown ONCE. Aletheia does not store secret keys on our servers.
                </div>
                <div style={{
                  background: 'var(--color-bg-base)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all'
                }}>
                  {secretKey}
                </div>
              </div>
            )}

            {/* Account Balance tiles */}
            <div className="grid-2" style={{ gap: 'var(--space-5)' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex justify-between items-center">
                  <span className="text-secondary" style={{ fontWeight: 600 }}>USDC Balance</span>
                  <span className="badge badge-active">Active</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: 0 }}>
                  {parseFloat(wallet.usdc || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>USDC</span>
                </h3>
                <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>Settlement asset for trade invoice disbursements</p>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex justify-between items-center">
                  <span className="text-secondary" style={{ fontWeight: 600 }}>XLM Balance</span>
                  <span className="badge badge-attested">Gas Asset</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: 0 }}>
                  {parseFloat(wallet.xlm || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>XLM</span>
                </h3>
                <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>Stellar Network Native Asset used for transaction fees</p>
              </div>
            </div>

            {/* Address Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0 }}>Stellar Public Address</h3>
              <div className="flex gap-3" style={{ alignItems: 'center' }}>
                <div style={{
                  flex: 1, background: 'var(--color-bg-base)', border: '1px solid var(--color-border)',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {wallet.publicKey}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(wallet.publicKey)}
                    className="btn btn-outline btn-sm"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  {isTestnet && (
                    <button
                      onClick={handleFundTestnet}
                      className="btn btn-saffron btn-sm"
                    >
                      Fund Testnet
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0 }}>Recent Transactions</h3>
                <span className="text-ui-xs text-secondary">{isTestnet ? 'Testnet' : 'Mainnet'} network activity</span>
              </div>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  No recent transactions found on this account.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {transactions.map((tx) => (
                    <div key={tx.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: tx.type === 'RECEIVE' ? 'rgba(92,125,100,0.1)' : 'rgba(15,37,55,0.1)',
                          color: tx.type === 'RECEIVE' ? 'var(--color-green)' : 'var(--color-teal)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                        }}>
                          {tx.type === 'RECEIVE' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 2px 0', fontWeight: 600 }}>{tx.type}</p>
                          <p className="text-ui-xs text-secondary" style={{ margin: 0 }}>{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: tx.type === 'RECEIVE' ? 'var(--color-green)' : 'var(--color-text-primary)' }}>
                          {tx.type === 'RECEIVE' ? '+' : '-'}{tx.amount} {tx.asset}
                        </p>
                        {tx.txHash && (
                          <a
                            href={`${HORIZON_EXPLORER_URL}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ui-xs"
                            style={{ color: 'var(--color-saffron)', textDecoration: 'underline' }}
                          >
                            stellar.expert
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
