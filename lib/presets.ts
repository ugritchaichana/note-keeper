export type PresetCategory = {
  key: string;
  name: string;
  icon: string; // Lucide icon name as string
  color: string;
};

// Global preset categories (fixed list)
export const PRESET_CATEGORIES: PresetCategory[] = [
  { key: 'Learning', name: 'Learning', icon: 'Book', color: '#6366f1' },
  { key: 'Work', name: 'Work', icon: 'Briefcase', color: '#3b82f6' },
  { key: 'Personal', name: 'Personal', icon: 'User', color: '#64748b' },
  { key: 'Family', name: 'Family', icon: 'Users', color: '#f59e0b' },
  { key: 'Activities', name: 'Activities', icon: 'Calendar', color: '#22c55e' },
  { key: 'Health', name: 'Health', icon: 'Heart', color: '#ef4444' },
  { key: 'Finance', name: 'Finance', icon: 'Wallet', color: '#eab308' },
  { key: 'Travel', name: 'Travel', icon: 'Plane', color: '#06b6d4' },
  { key: 'Hobbies', name: 'Hobbies', icon: 'Star', color: '#8b5cf6' },
  { key: 'Food', name: 'Food', icon: 'Utensils', color: '#f97316' },
];
