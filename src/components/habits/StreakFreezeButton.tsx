'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

interface StreakFreezeButtonProps {
  habitId: string;
  habitName: string;
  onFreeze?: () => void;
}

export default function StreakFreezeButton({
  habitId,
  habitName,
  onFreeze,
}: StreakFreezeButtonProps) {
  const user = useStore((s) => s.user);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [freezesRemaining, setFreezesRemaining] = useState<number | null>(null);

  // Fetch freezes remaining on mount
  useState(() => {
    if (user) {
      fetch('/api/user/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.streak_freezes !== undefined) {
            setFreezesRemaining(data.streak_freezes);
          }
        })
        .catch(console.error);
    }
  });

  const handleFreeze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/habits/freeze-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to freeze streak');
      }

      setFreezesRemaining(data.remaining);
      toast.success('❄️ Streak protected today!');
      setShowConfirm(false);
      onFreeze?.();
    } catch (error: any) {
      console.error('Error freezing streak:', error);
      toast.error(error.message || 'Failed to freeze streak');
    } finally {
      setIsLoading(false);
    }
  };

  if (freezesRemaining === null || freezesRemaining <= 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 bg-surface-container-high text-primary rounded-full font-label text-xs font-semibold hover:bg-primary/10 transition-colors flex items-center gap-1"
        title="Use a streak freeze"
      >
        <span>❄️</span>
        <span>Freeze ({freezesRemaining})</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-surface rounded-[2rem] p-6 max-w-sm w-full shadow-ambient-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">❄️</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
                Use Streak Freeze?
              </h3>
              <p className="font-body text-sm text-on-surface-variant">
                This will protect your streak for <strong>{habitName}</strong> today. You have{' '}
                <strong className="text-primary">{freezesRemaining}</strong> freeze
                {freezesRemaining === 1 ? '' : 's'} remaining.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 bg-surface-container text-on-surface rounded-full py-3 font-label font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                disabled={isLoading}
                className="flex-1 bg-primary text-on-primary rounded-full py-3 font-label font-semibold hover:scale-105 transition-transform shadow-primary-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span>❄️</span>
                    Use Freeze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
