// ============================================================
//  useWallet.js — shared wallet state hook
//  Provides wallet address, connection, KYC status, and
//  Stellar account balances to any component.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  connectFreighter,
  getFreighterPublicKey,
  getAccountBalances,
  authApi,
} from '../stellar/client.js';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [balances, setBalances] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore wallet on mount
  useEffect(() => {
    getFreighterPublicKey().then((pk) => {
      if (pk) {
        setAddress(pk);
        refreshBalances(pk);
      }
    });
  }, []);

  // Refresh KYC when address changes
  useEffect(() => {
    if (!address) { setKycStatus(null); return; }
    setKycLoading(true);
    authApi.checkWalletKyc(address)
      .then(setKycStatus)
      .catch(() => setKycStatus(null))
      .finally(() => setKycLoading(false));
  }, [address]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const pk = await connectFreighter();
      if (pk) {
        setAddress(pk);
        refreshBalances(pk);
      } else {
        setError('Freighter not detected. Install from freighter.app');
      }
    } catch (err) {
      setError(err.message);
    }
    setConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalances([]);
    setKycStatus(null);
  }, []);

  async function refreshBalances(pk) {
    const bals = await getAccountBalances(pk || address);
    setBalances(bals);
  }

  const isKyced = kycStatus?.approved === true;

  return {
    address,
    connecting,
    balances,
    kycStatus,
    kycLoading,
    isKyced,
    error,
    connect,
    disconnect,
    refreshBalances: () => refreshBalances(address),
  };
}
