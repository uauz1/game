export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'Home' },
  { path: '/play', label: 'العب الآن', icon: 'Gamepad2' },
  { path: '/categories', label: 'التصنيفات', icon: 'LayoutGrid' },
  { path: '/how-to-play', label: 'كيف تلعب؟', icon: 'HelpCircle' },
  { path: '/leaderboard', label: 'لوحة المتصدرين', icon: 'Trophy' },
  { path: '/favorites', label: 'المفضلة', icon: 'Heart' },
  { path: '/profile', label: 'الملف الشخصي', icon: 'User' },
  { path: '/settings', label: 'الإعدادات', icon: 'Settings' },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'Home' },
  { path: '/play', label: 'العب', icon: 'Gamepad2' },
  { path: '/categories', label: 'تصنيفات', icon: 'LayoutGrid' },
  { path: '/leaderboard', label: 'المتصدرين', icon: 'Trophy' },
  { path: '/profile', label: 'حسابي', icon: 'User' },
];
