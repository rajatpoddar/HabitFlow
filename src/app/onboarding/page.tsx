'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { subscribeToPush, isPushSupported } from '@/lib/push-notifications';
import toast from 'react-hot-toast';

// Habit templates for step 2
const HABIT_TEMPLATES = [
  { id: 'morning-run', emoji: '🏃', name: 'Morning Run', category: 'Fitness' },
  { id: 'drink-water', emoji: '💧', name: 'Drink Water', category: 'Health' },
  { id: 'read-30min', emoji: '📚', name: 'Read 30min', category: 'Learning' },
  { id: 'meditate', emoji: '🧘', name: 'Meditate', category: 'Mental Health' },
  { id: 'exercise', emoji: '💪', name: 'Exercise', category: 'Fitness' },
  { id: 'sleep-by-10', emoji: '🌙', name: 'Sleep by 10pm', category: 'Sleep' },
  { id: 'journal', emoji: '📝', name: 'Journal', category: 'Mental Health' },
  { id: 'no-social-media', emoji: '🚫', name: 'No Social Media', category: 'Productivity' },
  { id: 'eat-healthy', emoji: '🥗', name: 'Eat Healthy', category: 'Nutrition' },
  { id: 'deep-work', emoji: '🎯', name: 'Deep Work', category: 'Productivity' },
  { id: 'gratitude', emoji: '🙏', name: 'Gratitude', category: 'Mental Health' },
  { id: 'take-vitamins', emoji: '💊', name: 'Take Vitamins', category: 'Health' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, checkAuth } = useStore();
  const [step, setStep] = useState(1);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [reminderTimes, setReminderTimes] = useState<Record<string, string>>({});
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user) {
        router.push('/login');
      }
    });

    isPushSupported().then(setPushSupported);
  }, [checkAuth, router]);

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits: [], reminderTimes: {} }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip onboarding');
      }

      // Refresh user state to get updated onboarding_completed flag
      await checkAuth();
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Try to navigate anyway
      router.push('/dashboard');
    }
  };

  const handleNext = () => {
    if (step === 2 && selectedHabits.length === 0) {
      toast.error('Please select at least 1 habit');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const toggleHabit = (habitId: string) => {
    if (selectedHabits.includes(habitId)) {
      setSelectedHabits(selectedHabits.filter((id) => id !== habitId));
      const newTimes = { ...reminderTimes };
      delete newTimes[habitId];
      setReminderTimes(newTimes);
    } else {
      if (selectedHabits.length >= 5) {
        toast.error('Maximum 5 habits for your first setup');
        return;
      }
      setSelectedHabits([...selectedHabits, habitId]);
    }
  };

  const addCustomHabit = () => {
    if (!customHabit.trim()) return;
    if (selectedHabits.length >= 5) {
      toast.error('Maximum 5 habits for your first setup');
      return;
    }
    const customId = `custom-${Date.now()}`;
    setSelectedHabits([...selectedHabits, customId]);
    setCustomHabit('');
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await subscribeToPush(user.id);
      setRemindersEnabled(true);
      toast.success('Notifications enabled! 🔔');
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const habitsToCreate = selectedHabits.map((habitId) => {
        const template = HABIT_TEMPLATES.find((t) => t.id === habitId);
        return {
          name: template?.name || habitId.replace('custom-', ''),
          icon: template?.emoji || '🌱',
          category: template?.category || 'Other',
          reminderTime: reminderTimes[habitId] || null,
        };
      });

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: habitsToCreate,
          reminderTimes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Refresh user state to get updated onboarding_completed flag
      await checkAuth();

      toast.success('Welcome to HabitFlow! 🌿');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-container-low to-surface-container flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-primary'
                  : s < step
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-outline-variant/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-surface rounded-[2rem] p-8 shadow-ambient-lg text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-5xl">🌿</span>
              </div>
              <h1 className="font-headline text-3xl font-bold text-on-surface mb-3">
                Welcome to HabitFlow
              </h1>
              <p className="font-body text-on-surface-variant mb-8">
                Let's set up your habit tracking journey in just a few steps
              </p>
              <button
                onClick={handleNext}
                className="w-full bg-primary text-on-primary rounded-full py-4 font-label font-bold text-lg hover:scale-105 transition-transform shadow-primary-glow mb-3"
              >
                Get Started →
              </button>
              <button
                onClick={handleSkip}
                className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                I'll explore on my own
              </button>
            </motion.div>
          )}

          {/* Step 2: Pick Habits */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-surface rounded-[2rem] p-8 shadow-ambient-lg"
            >
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
                What would you like to work on?
              </h2>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Select 1-5 habits to start with
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 max-h-[400px] overflow-y-auto">
                {HABIT_TEMPLATES.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`p-4 rounded-[1.25rem] flex flex-col items-center gap-2 transition-all ${
                      selectedHabits.includes(habit.id)
                        ? 'bg-primary text-on-primary shadow-primary-glow scale-105'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-3xl">{habit.emoji}</span>
                    <span className="font-label text-sm font-semibold text-center">
                      {habit.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={customHabit}
                  onChange={(e) => setCustomHabit(e.target.value)}
                  placeholder="+ Add custom habit"
                  className="flex-1 bg-surface-container-low rounded-full px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomHabit()}
                />
                <button
                  onClick={addCustomHabit}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-label font-semibold hover:scale-105 transition-transform"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-surface-container text-on-surface rounded-full py-4 font-label font-bold hover:bg-surface-container-high transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedHabits.length === 0}
                  className="flex-1 bg-primary text-on-primary rounded-full py-4 font-label font-bold hover:scale-105 transition-transform shadow-primary-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Set Reminders */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-surface rounded-[2rem] p-8 shadow-ambient-lg"
            >
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
                Set Reminder Times
              </h2>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Get notified when it's time for your habits
              </p>

              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {selectedHabits.map((habitId) => {
                  const template = HABIT_TEMPLATES.find((t) => t.id === habitId);
                  return (
                    <div
                      key={habitId}
                      className="bg-surface-container-low rounded-[1.25rem] p-4 flex items-center gap-3"
                    >
                      <span className="text-2xl">{template?.emoji || '🌱'}</span>
                      <div className="flex-1">
                        <div className="font-label font-semibold text-on-surface">
                          {template?.name || habitId}
                        </div>
                      </div>
                      <input
                        type="time"
                        value={reminderTimes[habitId] || '09:00'}
                        onChange={(e) =>
                          setReminderTimes({ ...reminderTimes, [habitId]: e.target.value })
                        }
                        className="bg-surface-container rounded-lg px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  );
                })}
              </div>

              {pushSupported && !remindersEnabled && (
                <button
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="w-full bg-primary/10 text-primary border-2 border-primary rounded-full py-4 font-label font-bold hover:bg-primary hover:text-on-primary transition-all mb-4 disabled:opacity-50"
                >
                  {isLoading ? 'Enabling...' : '🔔 Enable Notifications'}
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-surface-container text-on-surface rounded-full py-4 font-label font-bold hover:bg-surface-container-high transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary text-on-primary rounded-full py-4 font-label font-bold hover:scale-105 transition-transform shadow-primary-glow"
                >
                  Next →
                </button>
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full mt-3 font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Skip this step
              </button>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface rounded-[2rem] p-8 shadow-ambient-lg text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <span className="text-6xl">🎉</span>
              </motion.div>

              <h2 className="font-headline text-3xl font-bold text-on-surface mb-3">
                You're all set!
              </h2>

              <div className="bg-surface-container-low rounded-[1.25rem] p-6 mb-6">
                <p className="font-body text-on-surface-variant mb-4">
                  You've added <strong className="text-primary">{selectedHabits.length}</strong>{' '}
                  {selectedHabits.length === 1 ? 'habit' : 'habits'}:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedHabits.map((habitId) => {
                    const template = HABIT_TEMPLATES.find((t) => t.id === habitId);
                    return (
                      <div
                        key={habitId}
                        className="bg-surface-container rounded-full px-4 py-2 flex items-center gap-2"
                      >
                        <span>{template?.emoji || '🌱'}</span>
                        <span className="font-label text-sm font-semibold text-on-surface">
                          {template?.name || habitId}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {remindersEnabled && (
                  <p className="font-body text-sm text-primary mt-4">
                    ✅ Reminders are enabled
                  </p>
                )}
              </div>

              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full py-5 font-headline font-bold text-lg hover:scale-105 transition-transform shadow-primary-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined">eco</span>
                    Go to My Dashboard
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Counter */}
        <p className="text-center mt-6 font-body text-sm text-on-surface-variant">
          Step {step} of 4
        </p>
      </div>
    </div>
  );
}
