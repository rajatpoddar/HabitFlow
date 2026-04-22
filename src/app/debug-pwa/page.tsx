'use client';

import { useEffect, useState } from 'react';
import { isPushSupported, isPushSubscribed, getNotificationPermission } from '@/lib/push-notifications';

export default function DebugPWAPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function gatherDebugInfo() {
      const info: any = {
        timestamp: new Date().toISOString(),
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        location: {
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          isSecure: window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1',
        },
        pwa: {
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),
        },
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          registered: false,
          active: false,
          scope: null,
        },
        notifications: {
          supported: 'Notification' in window,
          permission: getNotificationPermission(),
          pushSupported: await isPushSupported(),
          pushSubscribed: await isPushSubscribed(),
        },
        manifest: {
          accessible: false,
          valid: false,
        },
        env: {
          vapidKeyConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          vapidKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
        },
      };

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            info.serviceWorker.registered = true;
            info.serviceWorker.active = !!registration.active;
            info.serviceWorker.scope = registration.scope;
            info.serviceWorker.updateViaCache = registration.updateViaCache;
          }
        } catch (error) {
          info.serviceWorker.error = String(error);
        }
      }

      // Check manifest
      try {
        const manifestResponse = await fetch('/manifest.json');
        info.manifest.accessible = manifestResponse.ok;
        if (manifestResponse.ok) {
          const manifestData = await manifestResponse.json();
          info.manifest.valid = !!(manifestData.name && manifestData.icons);
          info.manifest.data = manifestData;
        }
      } catch (error) {
        info.manifest.error = String(error);
      }

      // Check icons
      info.icons = {
        icon192: await checkImageExists('/icons/icon-192.png'),
        icon512: await checkImageExists('/icons/icon-512.png'),
      };

      setDebugInfo(info);
      setLoading(false);
    }

    gatherDebugInfo();
  }, []);

  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  const getStatusIcon = (value: boolean) => {
    return value ? '✅' : '❌';
  };

  const getStatusColor = (value: boolean) => {
    return value ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant">Gathering debug info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface-container-low rounded-2xl p-6 mb-4">
          <h1 className="text-2xl font-bold text-on-surface mb-2">PWA Debug Information</h1>
          <p className="text-sm text-on-surface-variant">
            Use this page to diagnose PWA and notification issues
          </p>
        </div>

        {/* Security */}
        <Section title="🔒 Security">
          <InfoRow
            label="Protocol"
            value={debugInfo.location.protocol}
            status={debugInfo.location.isSecure}
          />
          <InfoRow
            label="Hostname"
            value={debugInfo.location.hostname}
          />
          <InfoRow
            label="HTTPS Enabled"
            value={debugInfo.location.isSecure ? 'Yes' : 'No'}
            status={debugInfo.location.isSecure}
          />
        </Section>

        {/* PWA Status */}
        <Section title="📱 PWA Status">
          <InfoRow
            label="Running as PWA"
            value={debugInfo.pwa.isStandalone ? 'Yes' : 'No'}
            status={debugInfo.pwa.isStandalone}
          />
          <InfoRow
            label="iOS Device"
            value={debugInfo.pwa.isIOS ? 'Yes' : 'No'}
          />
        </Section>

        {/* Service Worker */}
        <Section title="⚙️ Service Worker">
          <InfoRow
            label="Supported"
            value={debugInfo.serviceWorker.supported ? 'Yes' : 'No'}
            status={debugInfo.serviceWorker.supported}
          />
          <InfoRow
            label="Registered"
            value={debugInfo.serviceWorker.registered ? 'Yes' : 'No'}
            status={debugInfo.serviceWorker.registered}
          />
          <InfoRow
            label="Active"
            value={debugInfo.serviceWorker.active ? 'Yes' : 'No'}
            status={debugInfo.serviceWorker.active}
          />
          {debugInfo.serviceWorker.scope && (
            <InfoRow label="Scope" value={debugInfo.serviceWorker.scope} />
          )}
          {debugInfo.serviceWorker.error && (
            <InfoRow
              label="Error"
              value={debugInfo.serviceWorker.error}
              status={false}
            />
          )}
        </Section>

        {/* Notifications */}
        <Section title="🔔 Notifications">
          <InfoRow
            label="Notification API"
            value={debugInfo.notifications.supported ? 'Supported' : 'Not Supported'}
            status={debugInfo.notifications.supported}
          />
          <InfoRow
            label="Permission"
            value={debugInfo.notifications.permission}
            status={debugInfo.notifications.permission === 'granted'}
          />
          <InfoRow
            label="Push API"
            value={debugInfo.notifications.pushSupported ? 'Supported' : 'Not Supported'}
            status={debugInfo.notifications.pushSupported}
          />
          <InfoRow
            label="Push Subscribed"
            value={debugInfo.notifications.pushSubscribed ? 'Yes' : 'No'}
            status={debugInfo.notifications.pushSubscribed}
          />
        </Section>

        {/* Environment */}
        <Section title="🔑 Environment">
          <InfoRow
            label="VAPID Key Configured"
            value={debugInfo.env.vapidKeyConfigured ? 'Yes' : 'No'}
            status={debugInfo.env.vapidKeyConfigured}
          />
          <InfoRow
            label="VAPID Key Length"
            value={`${debugInfo.env.vapidKeyLength} characters`}
            status={debugInfo.env.vapidKeyLength > 0}
          />
        </Section>

        {/* Manifest */}
        <Section title="📄 Manifest">
          <InfoRow
            label="Accessible"
            value={debugInfo.manifest.accessible ? 'Yes' : 'No'}
            status={debugInfo.manifest.accessible}
          />
          <InfoRow
            label="Valid"
            value={debugInfo.manifest.valid ? 'Yes' : 'No'}
            status={debugInfo.manifest.valid}
          />
          {debugInfo.manifest.error && (
            <InfoRow
              label="Error"
              value={debugInfo.manifest.error}
              status={false}
            />
          )}
          {debugInfo.manifest.data && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-on-surface-variant mb-2">
                Manifest Data:
              </p>
              <pre className="bg-surface-container p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(debugInfo.manifest.data, null, 2)}
              </pre>
            </div>
          )}
        </Section>

        {/* Icons */}
        <Section title="🖼️ Icons">
          <InfoRow
            label="192x192 Icon"
            value={debugInfo.icons.icon192 ? 'Found' : 'Missing'}
            status={debugInfo.icons.icon192}
          />
          <InfoRow
            label="512x512 Icon"
            value={debugInfo.icons.icon512 ? 'Found' : 'Missing'}
            status={debugInfo.icons.icon512}
          />
        </Section>

        {/* Browser Info */}
        <Section title="🌐 Browser">
          <InfoRow label="User Agent" value={debugInfo.browser.userAgent} />
          <InfoRow label="Platform" value={debugInfo.browser.platform} />
          <InfoRow label="Language" value={debugInfo.browser.language} />
        </Section>

        {/* Actions */}
        <div className="bg-surface-container-low rounded-2xl p-6 mt-4">
          <h2 className="text-lg font-bold text-on-surface mb-4">🔧 Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                navigator.serviceWorker.getRegistration().then((reg) => {
                  if (reg) {
                    reg.unregister().then(() => {
                      alert('Service worker unregistered. Refresh the page.');
                    });
                  }
                });
              }}
              className="w-full bg-tertiary text-on-tertiary py-3 rounded-lg font-semibold"
            >
              Unregister Service Worker
            </button>
            <button
              onClick={() => {
                const data = JSON.stringify(debugInfo, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pwa-debug-${Date.now()}.json`;
                a.click();
              }}
              className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-lg font-semibold"
            >
              Download Debug Info
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-primary font-semibold hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-6 mb-4">
      <h2 className="text-lg font-bold text-on-surface mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm font-medium text-on-surface-variant">{label}:</span>
      <span className={`text-sm font-mono text-right ${status !== undefined ? (status ? 'text-green-600' : 'text-red-600') : 'text-on-surface'}`}>
        {status !== undefined && (status ? '✅ ' : '❌ ')}
        {value}
      </span>
    </div>
  );
}
