import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Sun, UserRound } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

const links = [
  { path: '/', label: 'الرئيسية' },
  { path: '/games', label: 'الألعاب' },
  { path: '/categories', label: 'التصنيفات' },
  { path: '/leaderboard', label: 'المجتمع' },
  { path: '/how-to-play', label: 'طريقة اللعب' },
];

export function Navbar() {
  const { toggleTheme, playSound } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className={cn('z-50', isHome ? 'bg-[#25242a] pt-1' : 'sticky top-0 border-b border-[#f6b94f]/10 bg-[#080a0f]/92 backdrop-blur-2xl')} dir="rtl">
      <div className={cn(
        'mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12',
        isHome
          ? 'mt-5 h-[82px] max-w-[1600px] rounded-t-[42px] border border-b-0 border-white/12 bg-[#080b11]/96 shadow-[0_-18px_55px_rgba(0,0,0,.28)]'
          : 'h-[76px] max-w-[1500px]'
      )}>
        <div className="flex justify-start">
          <button onClick={() => { playSound('click'); navigate('/profile'); }} className="flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-5 py-2.5 text-sm font-black transition hover:border-[#f6b94f]/70 hover:bg-[#f6b94f]/5">
            <UserRound className="h-4 w-4" /> دخول
          </button>
        </div>

        <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) => cn('relative py-7 text-[14px] font-black transition-colors', isActive ? 'text-[#f8bd4a]' : 'text-white/65 hover:text-white')}
            >
              {({ isActive }) => <>{item.label}{isActive && <span className="absolute inset-x-0 bottom-[13px] h-[2px] rounded-full bg-[#f6b94f] shadow-[0_0_14px_rgba(246,185,79,.95)]" />}</>}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <button onClick={() => { playSound('click'); toggleTheme(); }} className="flex h-10 w-10 items-center justify-center rounded-full text-[#f6b94f] transition hover:bg-white/5" aria-label="تبديل الوضع">
            <Sun className="h-5 w-5" />
          </button>
          {!isHome && (
            <button onClick={() => navigate('/')} className="hidden items-center gap-2 rounded-full border border-[#f6b94f]/20 bg-[#f6b94f]/5 px-3 py-2 text-sm font-black text-[#ffd477] sm:flex">
              <Crown className="h-4 w-4" /> قدّها
            </button>
          )}
        </div>
      </div>
    </header>
  );
}