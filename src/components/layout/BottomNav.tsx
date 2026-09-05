import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '@/data/navigation';
import { DynamicIcon } from '@/components/ui/CategoryIcon';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

export function BottomNav() {
  const { playSound } = useSettings();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#f6b94f]/15 bg-[#090b0f]/94 pb-safe backdrop-blur-2xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => playSound('click')}
            className={({ isActive }) => cn('flex min-w-[60px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-all', isActive ? 'text-[#f6b94f]' : 'text-off-white/45')}
          >
            {({ isActive }) => (
              <>
                <div className={cn('rounded-xl p-1.5 transition-all', isActive && 'bg-[#f6b94f]/10 ring-1 ring-[#f6b94f]/15')}>
                  <DynamicIcon name={item.icon} size={20} />
                </div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}