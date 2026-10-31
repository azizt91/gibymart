import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { USE_MOCK } from '../utils/constants';

/**
 * Custom hook to listen to real-time changes in Supabase and window focus.
 * Automatically triggers callback when database changes occur or user refocuses tab.
 * 
 * @param {Function} onDataChange - Callback function to trigger when data updates
 * @param {Array<string>} tables - Database tables to listen to, default ['attendance', 'employees']
 * @param {Object} options - Options (e.g. { enabled: true, debounceMs: 400 })
 */
export function useRealtimeAttendance(
  onDataChange,
  tables = ['attendance', 'employees'],
  options = {}
) {
  const { enabled = true, debounceMs = 400 } = options;
  const onDataChangeRef = useRef(onDataChange);
  const lastUpdateRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  const tablesKey = tables.join(',');

  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled || USE_MOCK) return;

    // Debounced trigger helper
    const triggerUpdate = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        if (typeof onDataChangeRef.current === 'function') {
          onDataChangeRef.current();
        }
      }, debounceMs);
    };

    // 1. Setup Supabase Realtime Channel
    const randomId = Math.random().toString(36).substring(7);
    const channelName = `realtime-giby-${tablesKey}-${randomId}`;
    let channel = supabase.channel(channelName);

    tables.forEach((tableName) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          triggerUpdate();
        }
      );
    });

    channel.subscribe((status, err) => {
      if (err) {
        console.warn(`[Realtime] Subscription error on tables [${tables.join(', ')}]:`, err);
      }
    });

    // 2. Window Focus & Visibility Change Listener (Auto-Revalidate)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastUpdateRef.current;
        // If tab was inactive for more than 8 seconds, re-fetch fresh data
        if (elapsed > 8000) {
          triggerUpdate();
        }
      }
    };

    const handleWindowFocus = () => {
      const elapsed = Date.now() - lastUpdateRef.current;
      if (elapsed > 8000) {
        triggerUpdate();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [enabled, tablesKey, debounceMs]);
}

export default useRealtimeAttendance;
