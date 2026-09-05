import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sun, UserRound } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

const links = [
  { path: '/', label: 'الرئيسية' },
  { path: '/games', label: 'الألعاب' },
  { path: '/categories', label: 'التصنيفات' },
  { path: '/leaderboard', label: 'المجتمع' },
  { path: '/how-to-play', label: 'الخصوص' },
];

export function Navbar() {
  const { toggleTheme, playSound } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const shell = isHome
    ? 'mx-auto mt-5 grid h-[82px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center rounded-t-[42px] border border-b-0 border-white/12 bg-[#080b11]/96 px-5 shadow-[0_-18px_55px_rgba(0,0,0,.28)] backdrop-blur-xl sm:px-10 lg:px-14'
    : 'mx-auto grid h-[74px] max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12 xl:px-16';

  return (
    <header className={cn('z-50', isHome ? 'bg-[#25242a] pt-1' : 'sticky top-0 border-b border-white/10 bg-[#090b10]/95 backdrop-blur-xl')} dir="rtl">
      <div className={shell}>
        <div className="flex justify-start">
          <button
            onClick={() => { playSound('click'); navigate('/profile'); }}
            className="flex items-center gap-2 rounded-full border border-white/50 bg-black/20 px-6 py-2.5 text-base font-black text-white transition hover:border-[#f8b93d] hover:bg-[#f8b93d]/5"
          >
            <UserRound className="h-4 w-4" />
            دخول
          </button>
        </div>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) => cn(
                'relative py-7 text-[15px] font-black transition-colors',
                isActive ? 'text-[#f8bd4a]' : 'text-white/72 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <span className="absolute inset-x-0 bottom-[13px] h-[2px] rounded-full bg-[#f6b94f] shadow-[0_0_14px_rgba(246,185,79,.95)]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex justify-end">
          <button
            onClick={() => { playSound('click'); toggleTheme(); }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#f6b94f] transition hover:bg-white/5"
            aria-label="تبديل الوضع"
          >
            <Sun className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
