import {
  Volume2, VolumeX, Moon, Sun, Clock, Music, Globe,
  Bell, Palette, RotateCcw, Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { TIMER_OPTIONS, type Settings as SettingsType } from '@/types';
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/storage';
import { cn } from '@/utils/helpers';

export function Settings() {
  const { settings, updateSettings, toggleSound, toggleTheme, playSound } = useSettings();
  const { showToast } = useToast();

  function handleClearHistory() {
    removeFromStorage('gameHistory');
    removeFromStorage('leaderboard');
    showToast('تم مسح السجل بنجاح', 'success');
    playSound('correct');
  }

  function handleReset() {
    updateSettings({
      soundEnabled: true,
      musicEnabled: false,
      theme: 'dark',
      defaultTimer: 30,
      language: 'ar',
    });
    showToast('تمت استعادة الإعدادات الافتراضية', 'info');
    playSound('click');
  }

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-cairo font-black mb-6">الإعدادات</h1>

      {/* Sound */}
      <Section title="الصوت" icon={<Volume2 className="w-5 h-5" />}>
        <ToggleRow
          icon={<Volume2 className="w-5 h-5" />}
          title="المؤثرات الصوتية"
          desc="أصوات الإجابات والأزرار"
          value={settings.soundEnabled}
          onChange={() => { toggleSound(); playSound('click'); }}
        />
        <ToggleRow
          icon={<Music className="w-5 h-5" />}
          title="الموسيقى الخلفية"
          desc="موسيقى خلفية أثناء اللعب"
          value={settings.musicEnabled}
          onChange={() => { updateSettings({ musicEnabled: !settings.musicEnabled }); playSound('click'); }}
        />
      </Section>

      {/* Appearance */}
      <Section title="المظهر" icon={<Palette className="w-5 h-5" />}>
        <div className="p-4">
          <p className="text-sm font-semibold mb-3">المظهر</p>
          <div className="grid grid-cols-2 gap-3">
            <ThemeOption
              icon={<Moon className="w-6 h-6" />}
              label="الوضع الليلي"
              active={settings.theme === 'dark'}
              onClick={() => { if (settings.theme !== 'dark') toggleTheme(); }}
            />
            <ThemeOption
              icon={<Sun className="w-6 h-6" />}
              label="الوضع النهاري"
              active={settings.theme === 'light'}
              onClick={() => { if (settings.theme !== 'light') toggleTheme(); }}
            />
          </div>
        </div>
      </Section>

      {/* Timer */}
      <Section title="المؤقت" icon={<Clock className="w-5 h-5" />}>
        <div className="p-4">
          <p className="text-sm font-semibold mb-3">المؤقت الافتراضي للأسئلة</p>
          <div className="grid grid-cols-2 gap-2">
            {TIMER_OPTIONS.map((timer) => (
              <button
                key={timer.value}
                onClick={() => { updateSettings({ defaultTimer: timer.value }); playSound('select'); }}
                className={cn(
                  'py-3 rounded-xl font-semibold transition-all text-sm',
                  settings.defaultTimer === timer.value
                    ? 'bg-purple text-white'
                    : 'bg-white/5 hover:bg-white/10 text-off-white/70'
                )}
              >
                {timer.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Language (structure ready) */}
      <Section title="اللغة" icon={<Globe className="w-5 h-5" />}>
        <div className="p-4">
          <p className="text-sm font-semibold mb-3">لغة الواجهة</p>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2.5 rounded-xl bg-purple text-white font-semibold text-sm cursor-default"
            >
              العربية
            </button>
            <span className="text-xs text-off-white/40">لغات أخرى قريباً</span>
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section title="البيانات" icon={<RotateCcw className="w-5 h-5" />}>
        <button
          onClick={handleClearHistory}
          className="w-full p-4 flex items-center gap-3 rounded-xl hover:bg-coral/10 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-coral/20 text-coral flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">مسح السجل ولوحة المتصدرين</p>
            <p className="text-xs text-off-white/50">حذف جميع البيانات المحفوظة محلياً</p>
          </div>
        </button>
      </Section>

      {/* About */}
      <Section title="حول التطبيق" icon={<Info className="w-5 h-5" />}>
        <div className="p-4 space-y-2">
          <InfoRow label="اسم التطبيق" value="تحدّي" />
          <InfoRow label="الإصدار" value="1.0.0" />
          <InfoRow label="النوع" value="لعبة أسئلة جماعية" />
          <InfoRow label="اللغة" value="العربية" />
        </div>
      </Section>

      {/* Reset button */}
      <div className="mt-6">
        <Button variant="outline" fullWidth onClick={handleReset}>
          <RotateCcw className="w-5 h-5" />
          استعادة الإعدادات الافتراضية
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
        <span className="text-purple">{icon}</span>
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </Card>
  );
}

function ToggleRow({ icon, title, desc, value, onChange }: {
  icon: React.ReactNode; title: string; desc: string; value: boolean; onChange: () => void;
}) {
  return (
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-off-white/70">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-off-white/50">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'w-12 h-7 rounded-full transition-all relative',
          value ? 'bg-turquoise' : 'bg-white/10'
        )}
        aria-label={title}
      >
        <div
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
            value ? 'right-1' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

function ThemeOption({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all',
        active ? 'border-purple bg-purple/10 text-purple' : 'border-white/10 hover:border-white/20'
      )}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-off-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
