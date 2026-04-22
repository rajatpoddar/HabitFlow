'use client';

import { useState, useEffect } from 'react';
import { subscribeToPush, isPushSupported, isPushSubscribed } from '@/lib/push-notifications';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

const BANNER_DISMISSED_KEY = 'habitflow_notification_banner_dismissed';

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useStore((s) => s.user);

  useEffect(() => {
    async function checkPermission() {
      if (!user) return;

      // Check if banner was dismissed
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (dismissed === 'true') return;

      // Check if push is supported
      const supported = await isPushSupported();
      if (!supported) return;

      // Check if already subscribed
      const subscribed = await isPushSubscribed();
      if (subscribed) return;

      // Check notification permission
      if (Notification.permission === 'denied') return;

      setShow(true);
    }

    checkPermission();
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await subscribeToPush(user.id);
      toast.success('Notifications enabled! 🔔');
      setShow(false);
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch (error: any) {
      console.error('Error enabling notifications:', error);
      if (error.message === 'Notification permission denied') {
        toast.error('Please allow notifications in your browser settings');
      } else {
        toast.error('Failed to enable notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">🔔</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-emerald-900 mb-1">
            Enable reminders to never miss a habit
          </h3>
          <p className="text-xs text-emerald-700">
            Get timely notifications to stay on track with your habits, even when the app is closed.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3 ml-11">
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-white text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
