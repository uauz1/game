import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, TrendingUp, Users, Trophy, Crown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1603481546238-487240415921?auto=format&fit=crop&fm=jpg&q=88&w=1800';

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const go = (path: string) => {
    playSound('click');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white" dir="rtl">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#080a0f]">
        <div className="mx-auto grid min-h-[500px] max-w-[1500px] grid-cols-1 lg:grid-cols-[.9fr_1fr_.72fr]">
          <div className="relative hidden min-h-[500px] overflow-hidden lg:block">
            <img src={HERO_IMAGE} alt="جلسة ألعاب" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,15,.08)_0%,rgba(8,10,15,.22)_55%,#080a0f_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.14))]" />
          </div>

          <div className="relative flex min-h-[500px] items-center justify-center px-6 py-12 text-center lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(246,185,79,.11),transparent_34%)]" />
            <div className="relative z-10">
              <Crown className="mx-auto mb-1 h-12 w-12 text-[#f6b94f] drop-shadow-[0_0_18px_rgba(246,185,79,.28)]" />
              <h1 className="font-cairo text-[76px] font-black leading-none tracking-tight sm:text-[94px] lg:text-[108px]">قدّها</h1>
              <p className="mt-5 text-2xl font-black sm:text-3xl">
                <span className="text-[#f6c35e]">جلسة ممتعة</span>
                <span className="text-white"> .. تبدأ من هنا</span>
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => go('/play')}
                  className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-[#ffd06c] to-[#f2ad3d] px-8 text-lg font-black text-[#151515] shadow-[0_12px_40px_rgba(246,185,79,.2)] transition hover:brightness-105"
                >
                  <Gamepad2 className="h-5 w-5" />
                  ابدأ اللعب الآن
                </button>
                <button
                  onClick={() => go('/games')}
                  className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/24 bg-white/[.025] px-8 text-lg font-black text-white backdrop-blur-md transition hover:border-[#f6b94f]/65 hover:bg-white/[.05]"
                >
                  استعرض الألعاب
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center px-5 pb-10 lg:px-8 lg:pb-0">
            <div className="mx-auto flex w-full max-w-[330px] flex-col gap-4">
              <StatCard icon={<TrendingUp className="h-6 w-6" />} value="+16" label="لعبة" />
              <StatCard icon={<Users className="h-6 w-6" />} value="+10" label="فئات" />
              <StatCard icon={<Trophy className="h-6 w-6" />} value="لا حدود" label="للمتعة" compact />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_35%,rgba(246,185,79,.08),transparent_27%)]" />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <p className="text-sm font-bold text-[#f6b94f]">قدّها للجلسات اللي ما تنسى</p>
        <h2 className="mt-3 font-cairo text-3xl font-black sm:text-4xl">اختار اللعبة، كوّن فريقك، وابدأ التحدي</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/55">واجهة بسيطة وواضحة، تركّز على اللعب مباشرة بدون تشتيت.</p>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, compact = false }: { icon: React.ReactNode; value: string; label: string; compact?: boolean }) {
  return (
    <div className="flex min-h-[98px] items-center gap-4 rounded-[20px] border border-[#f6b94f]/28 bg-[linear-gradient(90deg,rgba(246,185,79,.07),rgba(255,255,255,.02))] px-5 py-4 shadow-[inset_0_0_24px_rgba(246,185,79,.025)] backdrop-blur-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f6b94f]/10 text-[#f6b94f] ring-1 ring-[#f6b94f]/12">{icon}</div>
      <div className="text-right">
        <div className={compact ? 'text-xl font-black' : 'text-3xl font-black'}>{value}</div>
        <div className="mt-1 text-sm font-bold text-white/50">{label}</div>
      </div>
    </div>
  );
}
