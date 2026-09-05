import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun } from 'lucide-react';
import { NAV_ITEMS } from '@/data/navigation';
import { DynamicIcon } from '@/components/ui/CategoryIcon';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

export function Navbar() {
  const { settings, toggleTheme, playSound } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button
          onClick={() => { playSound('click'); navigate('/'); }}
          className="flex items-center gap-3 shrink-0 group"
          aria-label="قدّها - الرئيسية"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple via-purple to-turquoise flex items-center justify-center shadow-glow-purple transition-transform group-hover:-rotate-3">
            <span className="text-white font-cairo font-black text-lg">ق</span>
          </div>
          <div className="hidden sm:block text-right leading-none">
            <span className="block text-xl font-cairo font-black text-gradient">قدّها</span>
            <span className="block text-[10px] text-off-white/45 mt-1">اللعبة تبدأ من هنا</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => playSound('click')}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5',
                  isActive
                    ? 'bg-purple/20 text-purple'
                    : 'text-off-white/70 hover:text-off-white hover:bg-white/5'
                )
              }
            >
              <DynamicIcon name={item.icon} size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { playSound('click'); navigate('/categories'); }}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="التصنيفات"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => { playSound('click'); toggleTheme(); }}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="تبديل الوضع"
          >
            {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-yellow" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
