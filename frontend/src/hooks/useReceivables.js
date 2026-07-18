// ============================================================
//  useReceivables.js — receivables data fetching hook
//  Auto-refreshes on an interval and exposes manual refresh.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { receivablesApi } from '../stellar/client.js';

export function useReceivables(params = {}, refreshIntervalMs = 10000) {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await receivablesApi.list(params);
      setReceivables(data);
    } catch (err) {
      setError(err.message);
    }
    if (!silent) setLoading(false);
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
    if (refreshIntervalMs) {
      const interval = setInterval(() => fetch(true), refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetch, refreshIntervalMs]);

  return { receivables, loading, error, refresh: () => fetch() };
}
