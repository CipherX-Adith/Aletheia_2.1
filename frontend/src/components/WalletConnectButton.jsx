import React from 'react';
import { formatAddress } from '../stellar/client.js';

export default function WalletConnectButton({ walletAddress, connecting, onConnect, onDisconnect, isFreighterConnected }) {
  if (walletAddress && isFreighterConnected) {
    return (
      <div className="flex items-center gap-3">
        <div 
          className="btn btn-outline btn-sm"
          style={{ cursor: 'default', fontFamily: 'monospace' }}
          title={walletAddress}
        >
          {formatAddress(walletAddress, 4)}
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={onDisconnect}
          title="Disconnect Freighter Wallet"
          style={{ padding: '6px 10px' }}
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <button 
      className="btn btn-primary btn-sm" 
      onClick={onConnect} 
      disabled={connecting}
      id="connect-wallet-btn"
    >
      {connecting ? (
        <>
          <div className="spinner" style={{ width: 14, height: 14 }} /> 
          Connecting...
        </>
      ) : (
        'Connect Freighter'
      )}
    </button>
  );
}
