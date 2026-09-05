import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, UserRound } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

const links = [
  { path: '/', label: 'الرئيسية' },
  { path: '/games', label: 'الألعاب' },
  { path: '/categories', label: 'التصنيفات' },
  { path: '/leaderboard', label: 'المجتمع' },
  { path: '/how-to-play', label: 'الأخرى' },
];

export function Navbar() {
  const { toggleTheme, playSound } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b10]/95 backdrop-blur-xl" dir="rtl">
      <div className="mx-auto grid h-[74px] max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-start">
          <button
            onClick={() => { playSound('click'); navigate('/profile'); }}
            className="flex items-center gap-2 rounded-full border border-white/35 bg-black/20 px-5 py-2.5 text-sm font-black text-white transition hover:border-[#f6b94f]/80 hover:bg-[#f6b94f]/5"
          >
            <UserRound className="h-4 w-4" />
            دخول
          </button>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) => cn(
                'relative py-6 text-sm font-bold transition-colors',
                isActive ? 'text-[#f6c56c]' : 'text-white/72 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <span className="absolute inset-x-0 bottom-[10px] h-[2px] rounded-full bg-[#f6b94f] shadow-[0_0_12px_rgba(246,185,79,.85)]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex justify-end">
          <button
            onClick={() => { playSound('click'); toggleTheme(); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#f6b94f] transition hover:bg-white/5"
            aria-label="تبديل الوضع"
          >
            <Sun className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
