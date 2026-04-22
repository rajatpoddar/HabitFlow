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

    // Check if HTTPS (required for PWA except localhost)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('[PWA] Install requires HTTPS');
      setInstallState('unsupported');
      return;
    }

    // Listen for the browser's install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] Install prompt available');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('prompt-ready');
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setInstallState('installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Timeout to check if prompt never fires (common on some browsers)
    const timeout = setTimeout(() => {
      if (installState === 'unsupported') {
        console.log('[PWA] Install prompt not available, showing manual instructions');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
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
