export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'Home' },
  { path: '/games', label: 'الألعاب', icon: 'Gamepad2' },
  { path: '/play', label: 'لعبة مخصصة', icon: 'SlidersHorizontal' },
  { path: '/categories', label: 'التصنيفات', icon: 'LayoutGrid' },
  { path: '/leaderboard', label: 'المتصدرين', icon: 'Trophy' },
  { path: '/favorites', label: 'المفضلة', icon: 'Heart' },
  { path: '/profile', label: 'حسابي', icon: 'User' },
  { path: '/settings', label: 'الإعدادات', icon: 'Settings' },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'Home' },
  { path: '/games', label: 'الألعاب', icon: 'Gamepad2' },
  { path: '/categories', label: 'تصنيفات', icon: 'LayoutGrid' },
  { path: '/leaderboard', label: 'المتصدرين', icon: 'Trophy' },
  { path: '/profile', label: 'حسابي', icon: 'User' },
];
