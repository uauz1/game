import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '@/data/navigation';
import { DynamicIcon } from '@/components/ui/CategoryIcon';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/utils/helpers';

export function BottomNav() {
  const { playSound } = useSettings();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => playSound('click')}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive ? 'text-purple' : 'text-off-white/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('p-1 rounded-xl transition-all', isActive && 'bg-purple/20')}>
                  <DynamicIcon name={item.icon} size={20} />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
