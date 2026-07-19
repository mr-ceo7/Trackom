/**
 * useRealtimeEvents - SSE hook for real-time backend event streaming.
 *
 * Connects to the backend /notifications/stream SSE endpoint and
 * dispatches custom DOM events that any component can subscribe to.
 *
 * Event types dispatched on `window`:
 *   - "sse:wallet_update"      → { sms_balance, message }
 *   - "sse:campaign_update"    → { campaign_id, status, ... }
 *   - "sse:campaign_progress"  → { campaign_id, sent_count, delivered_count, failed_count, total_contacts }
 *   - "sse:contacts_import"    → { status, message, success_count?, fail_count? }
 *   - "sse:incoming_sms"       → { id, sender, recipient, content, received_at }
 *   - "sse:notification"       → (generic new notification)
 *   - "sse:connected"          → (connection established)
 */

import { useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/** Small helper – strips trailing /api/v1 to get the bare origin when needed */
function getStreamUrl(token: string): string {
  // The SSE endpoint lives at /api/v1/notifications/stream?token=...
  return `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
}

export default function useRealtimeEvents() {
  const esRef = useRef<EventSource | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 10;

  const connect = useCallback(() => {
    const token = localStorage.getItem('trackom_access_token');
    if (!token) return;

    // Don't double-connect
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) {
      return;
    }

    const url = getStreamUrl(token);
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      retryCount.current = 0; // reset on successful connect
    };

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const eventType: string = payload.type || 'unknown';

        // Dispatch a CustomEvent on window so any component can listen
        window.dispatchEvent(
          new CustomEvent(`sse:${eventType}`, { detail: payload.data })
        );

        // Also dispatch a generic "sse:any" for components that want all events
        window.dispatchEvent(
          new CustomEvent('sse:any', { detail: payload })
        );
      } catch {
        // Malformed JSON – ignore (likely a keep-alive comment)
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      // Exponential back-off reconnection
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
        retryCount.current += 1;
        retryTimer.current = setTimeout(connect, delay);
      }
    };
  }, []);

  useEffect(() => {
    connect();

    // Reconnect if the token changes (e.g. after refresh)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trackom_access_token') {
        esRef.current?.close();
        esRef.current = null;
        retryCount.current = 0;
        connect();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      esRef.current?.close();
      esRef.current = null;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [connect]);
}
