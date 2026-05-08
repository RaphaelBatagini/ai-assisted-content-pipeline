const API_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : '';

/**
 * Fire-and-forget analytics event tracker.
 * Uses sendBeacon when available, falls back to fetch with keepalive.
 * Never throws, never blocks navigation.
 *
 * @param siteId    - The site UUID from the static JSON data
 * @param eventType - Event name, e.g. 'cta_click'
 * @param payload   - Optional extra fields: postId, metadata
 */
export function trackEvent(
  siteId: string,
  eventType: string,
  payload?: { postId?: string; metadata?: Record<string, unknown> },
): void {
  try {
    if (!API_URL || !siteId) return;

    const body = JSON.stringify({
      siteId,
      eventType,
      postId: payload?.postId || null,
      metadata: payload?.metadata || null,
    });

    const url = `${API_URL}/api/analytics/events`;

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    // fire-and-forget: never throw, never block navigation
  }
}
