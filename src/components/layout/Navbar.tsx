import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, UserRound } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

const links = [
  { path: '/', label: 'الرئيسية' },
  { path: '/games', label: 'الألعاب' },
  { path: '/categories', label: 'التصنيفات' },
  { path: '/leaderboard', label: 'المجتمع' },
  { path: '/how-to-play', label: 'المتجر' },
];

export function Navbar() {
  const { toggleTheme, playSound } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090d]/95 backdrop-blur-xl" dir="rtl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-8 lg:px-12 xl:px-16">
        <button
          onClick={() => { playSound('click'); navigate('/'); }}
          className="shrink-0 text-right leading-none"
          aria-label="قدّها - الرئيسية"
        >
          <span className="block font-cairo text-2xl font-black text-white">قدّها</span>
          <span className="mt-1 block text-[9px] font-bold text-[#ffb23f]/75">جلسة ممتعة تبدأ من هنا</span>
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) => cn(
                'relative py-5 text-sm font-bold transition-colors',
                isActive ? 'text-[#ffb23f]' : 'text-white/70 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <span className="absolute inset-x-0 bottom-2 h-[2px] rounded-full bg-[#ffb23f] shadow-[0_0_10px_rgba(255,178,63,.85)]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { playSound('click'); toggleTheme(); }}
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-[#ffb23f] transition hover:bg-white/5 sm:flex"
            aria-label="تبديل الوضع"
          >
            <Sun className="h-5 w-5" />
          </button>
          <button
            onClick={() => { playSound('click'); navigate('/profile'); }}
            className="flex items-center gap-2 rounded-full border border-white/35 px-4 py-2 text-sm font-black text-white transition hover:border-[#ffb23f]/70 hover:bg-[#ffb23f]/5"
          >
            <UserRound className="h-4 w-4" />
            دخول
          </button>
        </div>
      </div>
    </header>
  );
}
