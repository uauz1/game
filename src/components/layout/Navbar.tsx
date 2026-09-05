import { NavLink, useNavigate } from 'react-router-dom';
import { Search, UserRound } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

const links = [
  { path: '/', label: 'الرئيسية' },
  { path: '/games', label: 'الألعاب' },
  { path: '/categories', label: 'التصنيفات' },
  { path: '/leaderboard', label: 'المجتمع' },
  { path: '/how-to-play', label: 'المقالات' },
];

export function Navbar() {
  const { playSound } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101f]/95 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-[72px] flex items-center justify-between gap-5" dir="rtl">
        <button
          onClick={() => { playSound('click'); navigate('/'); }}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="قدّها - الرئيسية"
        >
          <div className="text-right leading-none">
            <span className="block text-2xl font-cairo font-black text-white">قدّها</span>
            <span className="block text-[9px] text-violet-300 mt-1">اللعبة أقرب من هنا</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) => cn(
                'px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                isActive
                  ? 'bg-violet-600/25 text-white ring-1 ring-violet-500/40 shadow-[0_0_24px_rgba(124,58,237,.18)]'
                  : 'text-off-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2" dir="ltr">
          <button
            onClick={() => { playSound('click'); navigate('/profile'); }}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/5 transition-colors"
          >
            <UserRound className="w-4 h-4" />
            دخول
          </button>
          <button
            onClick={() => { playSound('click'); navigate('/categories'); }}
            className="p-2.5 rounded-xl text-off-white/80 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="بحث"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
