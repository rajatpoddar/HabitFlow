'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { HABIT_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } from '@/lib/habit-templates';
import TopBar from '@/components/ui/TopBar';
import BottomNav from '@/components/ui/BottomNav';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { user, habits, canAddHabit, createHabit } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const filteredTemplates =
    selectedCategory === 'All'
      ? HABIT_TEMPLATES
      : getTemplatesByCategory(selectedCategory);

  const handleAddHabit = async (templateId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!canAddHabit()) {
      toast.error('Free plan is limited to 5 habits. Upgrade to Pro for unlimited habits.', {
        duration: 5000,
      });
      return;
    }

    const template = HABIT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setIsAdding(templateId);
    try {
      await createHabit({
        user_id: user.id,
        name: template.name,
        type: template.category === 'Breaking Bad Habits' ? 'bad' : 'good',
        category: template.category,
        icon: template.emoji,
        color: '#059669',
        frequency: 'daily',
        target_per_day: 1,
        is_active: true,
        reminder_enabled: false,
        reminder_time: null,
        daily_limit: template.category === 'Breaking Bad Habits' ? 5 : null,
      });
      toast.success(`${template.name} added! 🌱`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding habit:', error);
    } finally {
      setIsAdding(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekdays':
        return 'Weekdays';
      case 'weekends':
        return 'Weekends';
      case '3x_week':
        return '3x per week';
      default:
        return frequency;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
            Habit Templates
          </h1>
          <p className="font-body text-on-surface-variant">
            Browse curated habit templates and add them to your routine in one click
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full font-label text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-primary text-on-primary shadow-primary-glow'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All Templates
          </button>
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-label text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-on-primary shadow-primary-glow'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-surface-container-low rounded-[1.5rem] p-6 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-[1rem] bg-surface-container-high flex items-center justify-center text-3xl flex-shrink-0">
                  {template.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-lg font-bold text-on-surface mb-1">
                    {template.name}
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant mb-3">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-label font-medium text-on-surface-variant">
                      {getFrequencyLabel(template.frequency)}
                    </span>
                    <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-label font-medium text-on-surface-variant">
                      ⏱️ {template.estimatedMinutes} min
                    </span>
                    <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-label font-medium text-on-surface-variant">
                      🕐 {template.suggestedTime}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddHabit(template.id)}
                    disabled={isAdding === template.id}
                    className="w-full bg-primary text-on-primary rounded-full py-3 font-label font-semibold text-sm hover:scale-105 transition-transform shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isAdding === template.id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Add to My Habits
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-on-surface-variant">
              No templates found in this category
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
