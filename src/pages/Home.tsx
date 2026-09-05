import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, TrendingUp, Users, Trophy, Crown } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1603481546238-487240415921?auto=format&fit=crop&fm=jpg&q=90&w=1800';

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const go = (path: string) => {
    playSound('click');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#25242a] pb-10 text-white" dir="rtl">
      <section className="relative mx-auto min-h-[690px] max-w-[1600px] overflow-hidden rounded-b-[42px] border border-t-0 border-white/12 bg-[#080b11] shadow-[0_30px_90px_rgba(0,0,0,.36)]">
        <div className="absolute inset-0 bg-[#080b11]" />

        <div className="absolute inset-y-0 left-0 w-full lg:w-[49%]">
          <img src={HERO_IMAGE} alt="جلسة ألعاب قدّها" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,17,.08)_0%,rgba(8,11,17,.12)_52%,rgba(8,11,17,.62)_76%,#080b11_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.18))]" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_43%,rgba(255,184,61,.13),transparent_24%)]" />
        <div className="absolute right-[-130px] top-[80px] h-[560px] w-[560px] rounded-full bg-[#f3a82c]/[.035] blur-3xl" />

        <div className="relative z-10 grid min-h-[690px] grid-cols-1 items-center px-6 pb-16 pt-10 sm:px-10 lg:grid-cols-[.92fr_1.08fr_.66fr] lg:px-12 xl:px-16" dir="ltr">
          <div className="hidden lg:block" />

          <div className="flex items-center justify-center text-center" dir="rtl">
            <div className="w-full max-w-[650px]">
              <Crown className="mx-auto mb-0 h-[82px] w-[82px] text-[#ffba38] drop-shadow-[0_0_22px_rgba(255,184,56,.36)]" strokeWidth={2.2} />

              <h1 className="font-cairo text-[92px] font-black leading-[.82] tracking-[-.055em] text-white drop-shadow-[0_10px_22px_rgba(0,0,0,.35)] sm:text-[118px] xl:text-[142px]">
                قدّها
              </h1>

              <p className="mt-7 text-[26px] font-black leading-tight sm:text-[32px] xl:text-[37px]">
                <span className="text-[#f6b94f]">جلسة ممتعة</span>
                <span className="text-white"> .. تبدأ من هنا</span>
              </p>

              <div className="mt-11 flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => go('/play')}
                  className="inline-flex min-h-[76px] min-w-[265px] items-center justify-center gap-3 rounded-[20px] border border-[#ffd67a] bg-[linear-gradient(180deg,#ffd36c_0%,#ffb63f_100%)] px-8 text-xl font-black text-[#1c160d] shadow-[0_0_26px_rgba(255,183,57,.28),inset_0_1px_0_rgba(255,255,255,.45)] transition hover:brightness-105 active:scale-[.99]"
                >
                  <Gamepad2 className="h-6 w-6" />
                  ابدأ اللعب الآن
                </button>

                <button
                  onClick={() => go('/games')}
                  className="inline-flex min-h-[76px] min-w-[240px] items-center justify-center gap-3 rounded-[20px] border border-white/42 bg-black/20 px-8 text-xl font-black text-white shadow-[inset_0_0_20px_rgba(255,255,255,.015)] backdrop-blur-md transition hover:border-[#f6b94f]/70 hover:bg-white/[.04]"
                >
                  استعرض الألعاب
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center lg:mt-0" dir="rtl">
            <div className="flex w-full max-w-[330px] flex-col gap-5">
              <StatCard icon={<TrendingUp className="h-7 w-7" />} value="+16" label="لعبة" />
              <StatCard icon={<Users className="h-7 w-7" />} value="+10" label="فئات" />
              <StatCard icon={<Trophy className="h-7 w-7" />} value="لا حدود للمتعة" compact />
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-8 z-20 hidden items-center gap-4 text-xs font-bold text-white/48 lg:flex" dir="rtl">
          <span>كل جلسة حكاية جديدة</span>
          <span className="h-px w-14 bg-[#f6b94f]" />
        </div>

        <div className="absolute bottom-7 right-9 z-20 hidden items-center gap-2 text-xs font-bold text-white/40 lg:flex" dir="rtl">
          <span>قدّها</span>
          <Crown className="h-4 w-4 text-[#f6b94f]" />
          <span>×</span>
          <span>اللعب يجمعنا</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, compact = false }: { icon: React.ReactNode; value: string; label?: string; compact?: boolean }) {
  return (
    <button className="group flex min-h-[118px] w-full items-center justify-between rounded-[24px] border border-[#d9982f]/55 bg-[linear-gradient(105deg,rgba(255,188,75,.08),rgba(255,255,255,.02))] px-5 text-right shadow-[inset_0_0_26px_rgba(246,185,79,.03),0_10px_28px_rgba(0,0,0,.18)] backdrop-blur-lg transition hover:border-[#f6b94f]/80 hover:bg-[#f6b94f]/[.055]">
      <ArrowLeft className="h-5 w-5 text-[#f6b94f]/80" />
      <div className="flex flex-1 items-center justify-end gap-4">
        <div>
          <div className={compact ? 'text-[19px] font-black leading-tight' : 'text-[34px] font-black leading-none'}>{value}</div>
          {label && <div className="mt-2 text-base font-black text-white/55">{label}</div>}
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[#f6b94f]/12 bg-[#f6b94f]/10 text-[#f6b94f] shadow-[inset_0_0_18px_rgba(246,185,79,.04)]">
          {icon}
        </div>
      </div>
    </button>
  );
}
