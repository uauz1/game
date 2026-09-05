import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Sparkles,
  Users,
  Trophy,
  Zap,
  Crown,
  Brain,
  Image as ImageIcon,
  Timer,
  Laugh,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&fm=jpg&q=88&w=2200';

const games = [
  {
    title: 'قدّها؟',
    subtitle: 'فريقين • فئات • نقاط',
    icon: Crown,
    accent: '#ffb23f',
    route: '/play',
    tag: 'الأشهر',
  },
  {
    title: 'خمن الصورة',
    subtitle: 'صور تتكشف شوي شوي',
    icon: ImageIcon,
    accent: '#7dd3fc',
    route: '/games',
    tag: 'جديدة',
  },
  {
    title: 'مين أسرع؟',
    subtitle: 'جاوب قبل الفريق الثاني',
    icon: Timer,
    accent: '#fb7185',
    route: '/games',
    tag: 'حماس',
  },
  {
    title: 'فكّر صح',
    subtitle: 'أسئلة تخدعك بذكاء',
    icon: Brain,
    accent: '#c084fc',
    route: '/games',
    tag: 'تحدي',
  },
];

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const go = (path: string) => {
    playSound('click');
    navigate(path);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#07090d] text-white" dir="rtl">
      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-white/10 lg:min-h-[760px]">
        <div className="absolute inset-0 -z-30 bg-[#07090d]" />
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,9,13,.9)_0%,rgba(7,9,13,.72)_35%,rgba(7,9,13,.92)_68%,#07090d_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_34%,rgba(255,178,63,.22),transparent_25%),radial-gradient(circle_at_18%_70%,rgba(88,101,242,.14),transparent_25%)]" />
        <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-[#ffb23f]/15 bg-[#ffb23f]/5 blur-3xl" />

        <div className="mx-auto grid min-h-[680px] max-w-[1500px] items-center gap-10 px-5 py-14 sm:px-8 lg:min-h-[760px] lg:grid-cols-[1.1fr_.9fr] lg:px-12 xl:px-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ffb23f]/25 bg-[#ffb23f]/10 px-4 py-2 text-sm font-black text-[#ffc867] backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              جمعتكم صارت لها لعبة
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#ffb23f]/25 bg-[#ffb23f]/10 shadow-[0_0_40px_rgba(255,178,63,.12)]">
                <Crown className="h-8 w-8 text-[#ffb23f]" />
              </div>
              <h1 className="font-cairo text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl xl:text-[108px]">قدّها</h1>
            </div>

            <h2 className="mt-7 max-w-2xl font-cairo text-3xl font-black leading-tight sm:text-5xl lg:text-[58px]">
              لا تقولون <span className="text-[#ffb23f]">طفشنا</span>
              <br />
              دام قدّها معكم.
            </h2>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/58 sm:text-lg">
              ألعاب جماعية سريعة، تحديات فريقين، وأسئلة ما تتكرر. افتح اللعبة، قسم الفرق، وابدأ التحدي في ثواني.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => go('/play')}
                className="group inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-[#ffd06f] to-[#f5a936] px-8 text-lg font-black text-[#17130d] shadow-[0_12px_50px_rgba(255,178,63,.22)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105"
              >
                <Gamepad2 className="h-5 w-5" />
                ابدأ اللعب
                <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-1" />
              </button>
              <button
                onClick={() => go('/games')}
                className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[.04] px-8 text-lg font-black backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[.07]"
              >
                استعرض الألعاب
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm font-bold text-white/55">
              <MiniFeature icon={<Users className="h-4 w-4" />} text="2–20 لاعب" />
              <MiniFeature icon={<Zap className="h-4 w-4" />} text="بدون تعقيد" />
              <MiniFeature icon={<Laugh className="h-4 w-4" />} text="للجلسات والطلعات" />
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[520px] lg:block">
            <div className="absolute -inset-10 rounded-full bg-[#ffb23f]/10 blur-3xl" />
            <div className="relative rotate-[-3deg] rounded-[34px] border border-white/12 bg-black/45 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white/40">الجولة الحالية</p>
                  <p className="mt-1 text-lg font-black">رياضة × أفلام</p>
                </div>
                <div className="rounded-xl bg-[#ffb23f]/12 px-3 py-2 text-sm font-black text-[#ffbf54]">05:00</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ScoreCard team="الصقور" score="1,250" icon="⚡" />
                <ScoreCard team="الذئاب" score="1,100" icon="🔥" />
              </div>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[.045] p-5">
                <div className="mb-4 flex items-center justify-between text-sm font-bold text-white/45">
                  <span>سؤال بـ 400 نقطة</span>
                  <span className="text-[#ffb23f]">رياضة</span>
                </div>
                <p className="text-2xl font-black leading-relaxed">من هو اللاعب الأكثر تسجيلاً في تاريخ كأس العالم؟</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-l from-[#ffb23f] to-[#ffd479]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#ffb23f]">اختَر مودك</p>
            <h3 className="mt-2 font-cairo text-3xl font-black sm:text-4xl">ألعاب للجلسة كلها</h3>
            <p className="mt-3 text-white/45">كل لعبة بفكرة مختلفة، وكل جولة لها حماسها.</p>
          </div>
          <button onClick={() => go('/games')} className="inline-flex items-center gap-2 self-start text-sm font-black text-white/65 transition hover:text-white">
            كل الألعاب <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.title}
                onClick={() => go(game.route)}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1016] p-5 text-right transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg,transparent,${game.accent},transparent)` }} />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04]" style={{ color: game.accent }}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="rounded-full border border-white/8 bg-white/[.035] px-3 py-1.5 text-xs font-black text-white/45">{game.tag}</span>
                </div>
                <h4 className="mt-7 text-2xl font-black">{game.title}</h4>
                <p className="mt-2 text-sm font-bold text-white/42">{game.subtitle}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-black" style={{ color: game.accent }}>
                  العب الآن <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8 lg:px-12">
        <div className="grid gap-4 rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,178,63,.08),rgba(255,255,255,.025))] p-6 sm:grid-cols-3 sm:p-8">
          <Stat icon={<Gamepad2 className="h-5 w-5" />} value="+16" label="لعبة متنوعة" />
          <Stat icon={<Users className="h-5 w-5" />} value="+10" label="فئات وأساليب لعب" />
          <Stat icon={<Trophy className="h-5 w-5" />} value="∞" label="جولات بدون ملل" />
        </div>
      </section>
    </div>
  );
}

function MiniFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-lg">
      <span className="text-[#ffb23f]">{icon}</span>
      {text}
    </div>
  );
}

function ScoreCard({ team, score, icon }: { team: string; score: string; icon: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[.045] p-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold text-white/35">فريق</span>
      </div>
      <div className="mt-5 text-lg font-black">{team}</div>
      <div className="mt-1 text-2xl font-black text-[#ffb23f]">{score}</div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-black/20 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb23f]/10 text-[#ffb23f]">{icon}</div>
      <div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-sm font-bold text-white/40">{label}</div>
      </div>
    </div>
  );
}
