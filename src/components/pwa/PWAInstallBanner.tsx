'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISSED_KEY = 'habitflow_pwa_install_dismissed';

/**
 * Shows a banner prompting the user to install HabitFlow as a PWA.
 * - On Chrome/Edge/Android: uses the native beforeinstallprompt flow.
 * - On iOS Safari: shows manual "Add to Home Screen" instructions.
 * - Hides itself if already installed (standalone mode).
 */
export default function PWAInstallBanner() {
  const { installState, triggerInstall, dismiss, isInstalling } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true); // start hidden, check storage
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
    dismiss();
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const accepted = await triggerInstall();
    if (accepted) {
      setDismissed(true);
    }
  };

  // Don't show if: already installed, dismissed, or browser doesn't support it
  // (unless iOS — iOS never fires beforeinstallprompt but we still want to show instructions)
  const shouldShow =
    !dismissed &&
    installState !== 'installed' &&
    (installState === 'prompt-ready' || isIOS);

  if (!shouldShow) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-primary/5 to-secondary-container/30 border border-primary/15 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">
              install_mobile
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold text-sm text-on-surface mb-0.5">
              Install HabitFlow
            </h3>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Add to your home screen for the full app experience — faster access,
              offline support, and push notifications that actually work.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0 text-on-surface-variant"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="flex gap-2 mt-3 ml-13">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-headline font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {isInstalling ? 'Installing…' : isIOS ? 'How to Install' : 'Install App'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-headline font-medium rounded-full hover:bg-surface-container-high transition-colors"
          >
            Not now
          </button>
        </div>
      </div>

      {/* iOS manual install guide modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Add to Home Screen
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="font-body text-sm text-on-surface-variant">
                  Tap the{' '}
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    Share
                    <span className="material-symbols-outlined text-sm">ios_share</span>
                  </span>{' '}
                  button at the bottom of Safari.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="font-body text-sm text-on-surface-variant">
                  Scroll down and tap{' '}
                  <span className="font-medium text-on-surface">"Add to Home Screen"</span>.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="font-body text-sm text-on-surface-variant">
                  Tap <span className="font-medium text-on-surface">"Add"</span> in the top right corner.
                </p>
              </li>
            </ol>

            <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant font-body">
              💡 Once installed, push notifications will work even when the app is closed.
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-3 bg-primary text-on-primary font-headline font-bold rounded-full text-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
