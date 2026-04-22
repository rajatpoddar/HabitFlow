'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker as early as possible so that:
 * 1. Push notifications can be received even before the user visits the settings page.
 * 2. The app is ready for offline caching (future enhancement).
 *
 * This runs once on mount, silently — no UI impact.
 */
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service worker registered:', registration.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
  }, []);

  return <>{children}</>;
}
