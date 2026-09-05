import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Trophy, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1786577341324-bb415d916948?auto=format&fit=crop&fm=jpg&q=82&w=2200';

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const go = (path: string) => {
    playSound('click');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white" dir="rtl">
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[#07090d]" />
        <div
          className="absolute inset-y-0 left-0 hidden w-[58%] bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 lg:hidden"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,13,.02)_0%,rgba(7,9,13,.10)_24%,rgba(7,9,13,.62)_52%,rgba(7,9,13,.95)_73%,#07090d_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_59%_50%,rgba(255,178,71,.13),transparent_28%)]" />
        <div className="absolute inset-y-0 left-[43%] hidden w-40 bg-gradient-to-r from-transparent via-[#07090d]/45 to-[#07090d] blur-xl lg:block" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-[1500px] grid-cols-1 items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.02fr_1.1fr_.72fr] lg:px-12 xl:px-16">
          <div className="hidden lg:block" />

          <div className="text-center lg:text-right">
            <div className="mb-3 inline-flex items-center gap-2 text-[#ffb23f] drop-shadow-[0_0_18px_rgba(255,178,63,.45)]">
              <span className="text-5xl leading-none">♛</span>
            </div>
            <h1 className="font-cairo text-[68px] font-black leading-[.88] tracking-tight drop-shadow-[0_0_32px_rgba(255,255,255,.08)] sm:text-[86px] xl:text-[118px]">قدّها</h1>
            <p className="mt-6 text-2xl font-bold sm:text-3xl xl:text-[34px]">
              <span className="text-[#ffb23f]">جلسة ممتعة</span>
              <span className="text-white"> .. تبدأ من هنا</span>
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button onClick={() => go('/play')} className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-[#ffc35a] to-[#f5a936] px-8 text-lg font-black text-[#151515] shadow-[0_0_34px_rgba(255,178,63,.23)] transition hover:brightness-105 active:scale-[.99]">
                <Gamepad2 className="h-5 w-5" /> ابدأ اللعب الآن
              </button>
              <button onClick={() => go('/games')} className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-black/35 px-8 text-lg font-black text-white backdrop-blur-md transition hover:border-[#ffb23f]/60 hover:bg-white/5">
                استعرض الألعاب <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[340px] flex-col gap-4 lg:mr-auto">
            <StatCard icon={<TrendingUp className="h-7 w-7" />} value="+16" label="لعبة" />
            <StatCard icon={<Users className="h-7 w-7" />} value="+10" label="فئات" />
            <StatCard icon={<Trophy className="h-7 w-7" />} value="لا حدود" label="للمتعة" compact />
          </div>
        </div>

        <button onClick={() => document.getElementById('more')?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/45 transition hover:text-white md:flex">
          <span className="flex h-7 w-5 items-start justify-center rounded-full border border-white/30 pt-1"><span className="h-1.5 w-1 rounded-full bg-white/70" /></span>
          اكتشف المزيد
          <ChevronDown className="h-4 w-4" />
        </button>
      </section>

      <section id="more" className="mx-auto max-w-6xl px-5 py-16 text-center">
        <p className="text-sm font-bold text-[#ffb23f]">قدّها للجلسات اللي ما تنسى</p>
        <h2 className="mt-3 font-cairo text-3xl font-black sm:text-4xl">اختار اللعبة، كوّن فريقك، وابدأ التحدي</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/55">واجهة أبسط وأفخم، ونفس روح التصميم الداكن البرتقالي اللي اعتمدناها، مع وصول سريع للألعاب والفئات.</p>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, compact = false }: { icon: React.ReactNode; value: string; label: string; compact?: boolean }) {
  return (
    <div className="group flex min-h-[104px] items-center gap-4 rounded-[22px] border border-[#ffb23f]/35 bg-[linear-gradient(90deg,rgba(255,178,63,.08),rgba(255,255,255,.025))] px-5 py-4 shadow-[inset_0_0_30px_rgba(255,178,63,.025)] backdrop-blur-md transition hover:border-[#ffb23f]/65 hover:bg-[#ffb23f]/[.06]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffb23f]/10 text-[#ffb23f] ring-1 ring-[#ffb23f]/15">{icon}</div>
      <div className="text-right">
        <div className={compact ? 'text-xl font-black' : 'text-3xl font-black'}>{value}</div>
        <div className="mt-1 text-sm font-bold text-white/55">{label}</div>
      </div>
    </div>
  );
}
