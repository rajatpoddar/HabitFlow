export interface HabitTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  suggestedTime: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | '3x_week';
  estimatedMinutes: number;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Morning Routines
  {
    id: 'morning-meditation',
    emoji: '🧘',
    name: 'Morning Meditation',
    description: 'Start your day with 10 minutes of mindfulness',
    category: 'Morning Routines',
    suggestedTime: '06:30',
    frequency: 'daily',
    estimatedMinutes: 10,
  },
  {
    id: 'morning-exercise',
    emoji: '🏃',
    name: 'Morning Exercise',
    description: 'Get your blood pumping with a morning workout',
    category: 'Morning Routines',
    suggestedTime: '07:00',
    frequency: 'daily',
    estimatedMinutes: 30,
  },
  {
    id: 'healthy-breakfast',
    emoji: '🥗',
    name: 'Healthy Breakfast',
    description: 'Fuel your body with a nutritious breakfast',
    category: 'Morning Routines',
    suggestedTime: '08:00',
    frequency: 'daily',
    estimatedMinutes: 20,
  },
  {
    id: 'morning-journaling',
    emoji: '📝',
    name: 'Morning Journaling',
    description: 'Write down your thoughts and set daily intentions',
    category: 'Morning Routines',
    suggestedTime: '07:30',
    frequency: 'daily',
    estimatedMinutes: 15,
  },
  {
    id: 'make-bed',
    emoji: '🛏️',
    name: 'Make Your Bed',
    description: 'Start the day with a small win',
    category: 'Morning Routines',
    suggestedTime: '07:00',
    frequency: 'daily',
    estimatedMinutes: 5,
  },

  // Fitness & Health
  {
    id: 'workout',
    emoji: '💪',
    name: 'Workout',
    description: 'Strength training or cardio session',
    category: 'Fitness & Health',
    suggestedTime: '18:00',
    frequency: 'weekdays',
    estimatedMinutes: 45,
  },
  {
    id: 'drink-water',
    emoji: '💧',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day',
    category: 'Fitness & Health',
    suggestedTime: '09:00',
    frequency: 'daily',
    estimatedMinutes: 5,
  },
  {
    id: 'take-vitamins',
    emoji: '💊',
    name: 'Take Vitamins',
    description: 'Daily vitamin and supplement routine',
    category: 'Fitness & Health',
    suggestedTime: '08:30',
    frequency: 'daily',
    estimatedMinutes: 2,
  },
  {
    id: 'stretch',
    emoji: '🤸',
    name: 'Stretching',
    description: 'Improve flexibility and prevent injuries',
    category: 'Fitness & Health',
    suggestedTime: '19:00',
    frequency: 'daily',
    estimatedMinutes: 15,
  },
  {
    id: 'walk',
    emoji: '🚶',
    name: 'Daily Walk',
    description: 'Get 10,000 steps or a 30-minute walk',
    category: 'Fitness & Health',
    suggestedTime: '17:00',
    frequency: 'daily',
    estimatedMinutes: 30,
  },

  // Mental Wellness
  {
    id: 'meditation',
    emoji: '🧘',
    name: 'Meditation',
    description: 'Practice mindfulness and reduce stress',
    category: 'Mental Wellness',
    suggestedTime: '20:00',
    frequency: 'daily',
    estimatedMinutes: 15,
  },
  {
    id: 'gratitude',
    emoji: '🙏',
    name: 'Gratitude Practice',
    description: "Write down 3 things you're grateful for",
    category: 'Mental Wellness',
    suggestedTime: '21:00',
    frequency: 'daily',
    estimatedMinutes: 5,
  },
  {
    id: 'no-phone-before-bed',
    emoji: '📵',
    name: 'No Phone Before Bed',
    description: 'Avoid screens 1 hour before sleep',
    category: 'Mental Wellness',
    suggestedTime: '21:00',
    frequency: 'daily',
    estimatedMinutes: 60,
  },
  {
    id: 'deep-breathing',
    emoji: '🌬️',
    name: 'Deep Breathing',
    description: '5 minutes of focused breathing exercises',
    category: 'Mental Wellness',
    suggestedTime: '12:00',
    frequency: 'daily',
    estimatedMinutes: 5,
  },
  {
    id: 'therapy-journaling',
    emoji: '📔',
    name: 'Therapy Journaling',
    description: 'Process emotions through writing',
    category: 'Mental Wellness',
    suggestedTime: '20:30',
    frequency: '3x_week',
    estimatedMinutes: 20,
  },

  // Learning & Growth
  {
    id: 'read-book',
    emoji: '📚',
    name: 'Read for 30 Minutes',
    description: 'Expand your knowledge through reading',
    category: 'Learning & Growth',
    suggestedTime: '21:00',
    frequency: 'daily',
    estimatedMinutes: 30,
  },
  {
    id: 'learn-language',
    emoji: '🗣️',
    name: 'Language Learning',
    description: 'Practice a new language',
    category: 'Learning & Growth',
    suggestedTime: '19:00',
    frequency: 'daily',
    estimatedMinutes: 20,
  },
  {
    id: 'online-course',
    emoji: '🎓',
    name: 'Online Course',
    description: 'Complete one lesson of your course',
    category: 'Learning & Growth',
    suggestedTime: '20:00',
    frequency: 'weekdays',
    estimatedMinutes: 30,
  },
  {
    id: 'podcast',
    emoji: '🎧',
    name: 'Educational Podcast',
    description: 'Listen to an educational podcast',
    category: 'Learning & Growth',
    suggestedTime: '08:00',
    frequency: '3x_week',
    estimatedMinutes: 30,
  },
  {
    id: 'practice-skill',
    emoji: '🎨',
    name: 'Practice a Skill',
    description: 'Dedicate time to improving a skill',
    category: 'Learning & Growth',
    suggestedTime: '19:30',
    frequency: 'weekdays',
    estimatedMinutes: 45,
  },

  // Breaking Bad Habits
  {
    id: 'no-social-media',
    emoji: '🚫',
    name: 'Limit Social Media',
    description: 'Reduce mindless scrolling',
    category: 'Breaking Bad Habits',
    suggestedTime: '09:00',
    frequency: 'daily',
    estimatedMinutes: 0,
  },
  {
    id: 'no-junk-food',
    emoji: '🍔',
    name: 'Avoid Junk Food',
    description: 'Choose healthy snacks instead',
    category: 'Breaking Bad Habits',
    suggestedTime: '12:00',
    frequency: 'daily',
    estimatedMinutes: 0,
  },
  {
    id: 'no-caffeine-afternoon',
    emoji: '☕',
    name: 'No Caffeine After 2 PM',
    description: 'Improve sleep quality',
    category: 'Breaking Bad Habits',
    suggestedTime: '14:00',
    frequency: 'daily',
    estimatedMinutes: 0,
  },
  {
    id: 'quit-smoking',
    emoji: '🚭',
    name: 'Stay Smoke-Free',
    description: 'Track your smoke-free days',
    category: 'Breaking Bad Habits',
    suggestedTime: '09:00',
    frequency: 'daily',
    estimatedMinutes: 0,
  },
];

export const TEMPLATE_CATEGORIES = [
  'Morning Routines',
  'Fitness & Health',
  'Mental Wellness',
  'Learning & Growth',
  'Breaking Bad Habits',
] as const;

export function getTemplatesByCategory(category: string): HabitTemplate[] {
  return HABIT_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): HabitTemplate | undefined {
  return HABIT_TEMPLATES.find((t) => t.id === id);
}
