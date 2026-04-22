'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PWAInstallState =
  | 'unsupported'   // browser doesn't support install
  | 'installed'     // already running as PWA
  | 'prompt-ready'  // can show install prompt
  | 'dismissed';    // user dismissed, can still show manual instructions

export function usePWAInstall() {
  const [installState, setInstallState] = useState<PWAInstallState>('unsupported');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    // Listen for the browser's install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('prompt-ready');
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setInstallState('installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('installed');
        setDeferredPrompt(null);
        return true;
      } else {
        setInstallState('dismissed');
        return false;
      }
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setInstallState('dismissed');
  }, []);

  return { installState, triggerInstall, dismiss, isInstalling };
}
