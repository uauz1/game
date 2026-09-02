import { useNavigate } from 'react-router-dom';
import {
  Gamepad2, LayoutGrid, Sparkles, Trophy, Users, Zap,
  Brain, Target, Star, ChevronLeft, Play, Award, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { GAME_MODES } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { loadFromStorage } from '@/utils/storage';
import { formatNumber } from '@/utils/helpers';
import type { GameResult } from '@/types';

export function Home() {
  const navigate = useNavigate();
  const { playSound } = useSettings();

  const gameHistory = loadFromStorage<GameResult[]>('gameHistory', []);
  const gamesPlayed = gameHistory.length;
  const totalQuestions = 240;
  const totalCategories = CATEGORIES.length;

  const popularCategories = CATEGORIES.slice(0, 6);
  const featuredChallenges = GAME_MODES.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:pt-20 lg:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple/20 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-turquoise/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-yellow/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div className="text-center lg:text-right animate-slide-up">
              {/* Logo badge */}
              <div className="inline-flex items-center gap-2 bg-purple/20 border border-purple/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-yellow" />
                <span className="text-sm font-semibold text-off-white/90">لعبة الأسئلة الجماعية الأولى عربياً</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cairo font-black leading-tight mb-4">
                جمعتكم أحلى
                <span className="block text-gradient mt-2">مع التحدي</span>
              </h1>

              <p className="text-lg text-off-white/70 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                لعبة أسئلة وأجوبة جماعية ممتعة، تنافس مع أصدقائك وعائلتك في مختلف التصنيفات، واكتشف من هو الأذكى بينكم!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  variant="primary"
                  size="xl"
                  onClick={() => { playSound('click'); navigate('/play'); }}
                >
                  <Play className="w-5 h-5" />
                  ابدأ اللعب
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => { playSound('click'); navigate('/categories'); }}
                >
                  <LayoutGrid className="w-5 h-5" />
                  استكشف التصنيفات
                </Button>
              </div>
            </div>

            {/* Visual - floating cards */}
            <div className="relative h-[400px] hidden lg:block">
              <FloatingCard
                className="top-0 right-8 animate-float"
                color="#7056E8"
                icon={<Brain className="w-8 h-8" />}
                title="معلومات عامة"
                subtitle="240+ سؤال"
                delay="0s"
              />
              <FloatingCard
                className="top-24 left-0 animate-float"
                color="#FFC83D"
                icon={<Trophy className="w-8 h-8" />}
                title="تنافس ممتع"
                subtitle="فريق ضد فريق"
                delay="0.5s"
              />
              <FloatingCard
                className="bottom-16 right-16 animate-float"
                color="#FF625F"
                icon={<Zap className="w-8 h-8" />}
                title="تحدي سريع"
                subtitle="5 أسئلة"
                delay="1s"
              />
              <FloatingCard
                className="bottom-0 left-12 animate-float"
                color="#35D1C5"
                icon={<Users className="w-8 h-8" />}
                title="العب مع أصدقائك"
                subtitle="على نفس الجهاز"
                delay="1.5s"
              />

              {/* Center logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-4xl bg-gradient-to-br from-purple to-turquoise flex items-center justify-center shadow-glow-purple animate-pulse-ring">
                  <span className="text-white font-cairo font-black text-6xl">ت</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-3 lg:gap-6">
          <StatCard icon={<Brain className="w-6 h-6" />} value={formatNumber(totalQuestions)} label="سؤال متنوع" color="#7056E8" />
          <StatCard icon={<LayoutGrid className="w-6 h-6" />} value={formatNumber(totalCategories)} label="تصنيف مختلف" color="#35D1C5" />
          <StatCard icon={<Gamepad2 className="w-6 h-6" />} value={formatNumber(gamesPlayed)} label="لعبة مكتملة" color="#FFC83D" />
        </div>
      </section>

      {/* Popular Categories */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-cairo font-black">تصنيفات شهيرة</h2>
          <button
            onClick={() => { playSound('click'); navigate('/categories'); }}
            className="flex items-center gap-1 text-purple hover:gap-2 transition-all font-semibold"
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
          {popularCategories.map((cat, i) => (
            <Card
              key={cat.id}
              hoverable
              onClick={() => { playSound('select'); navigate('/play'); }}
              className={`animate-slide-up animate-delay-${(i + 1) * 100}`}
            >
              <div className="flex items-center gap-3">
                <CategoryIcon category={cat} size={28} />
                <div className="min-w-0">
                  <h3 className="font-bold text-base lg:text-lg truncate">{cat.name}</h3>
                  <p className="text-xs text-off-white/50 truncate">{cat.questionCount} سؤال</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works - 3 steps */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-cairo font-black text-center mb-8">كيف تلعب؟</h2>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          <StepCard
            step={1}
            icon={<Users className="w-8 h-8" />}
            color="#7056E8"
            title="اختر نمط اللعب"
            description="العب بمفردك أو مع فريقك أو تحدّ أصدقاءك على نفس الجهاز"
          />
          <StepCard
            step={2}
            icon={<LayoutGrid className="w-8 h-8" />}
            color="#FFC83D"
            title="حدد التصنيف والصعوبة"
            description="اختر من 16 تصنيفاً مختلفاً وحدد مستوى الصعوبة المناسب لك"
          />
          <StepCard
            step={3}
            icon={<Trophy className="w-8 h-8" />}
            color="#35D1C5"
            title="تنافس وافوز"
            description="أجب على الأسئلة، استخدم القوى الخاصة، وتوّج بطل التحدي!"
          />
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="px-4 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-cairo font-black mb-6">تحديات مميزة</h2>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {featuredChallenges.map((mode) => (
            <Card key={mode.id} hoverable onClick={() => { playSound('select'); navigate('/play'); }} className="relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: mode.color }}
              />
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: mode.color + '20', color: mode.color }}
                >
                  <DynamicIconSafe name={mode.icon} />
                </div>
                <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                <p className="text-sm text-off-white/60 mb-4">{mode.description}</p>
                <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: mode.color }}>
                  ابدأ الآن
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <Card className="text-center py-12 bg-gradient-to-br from-purple/20 to-turquoise/10 border-purple/20">
          <Award className="w-16 h-16 text-yellow mx-auto mb-4" />
          <h2 className="text-2xl lg:text-3xl font-cairo font-black mb-3">جاهز للتحدي؟</h2>
          <p className="text-off-white/70 mb-6 max-w-md mx-auto">
            ابدأ رحلتك الآن واكتشف مدى معرفتك في مختلف المجالات
          </p>
          <Button
            variant="primary"
            size="xl"
            onClick={() => { playSound('click'); navigate('/play'); }}
          >
            <Play className="w-5 h-5" />
            ابدأ اللعب الآن
          </Button>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <Card className="text-center py-4 lg:py-6" glow>
      <div className="flex justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <div className="text-2xl lg:text-3xl font-cairo font-black" style={{ color }}>
        {value}
      </div>
      <div className="text-xs lg:text-sm text-off-white/60 mt-1">{label}</div>
    </Card>
  );
}

function StepCard({ step, icon, color, title, description }: {
  step: number; icon: React.ReactNode; color: string; title: string; description: string;
}) {
  return (
    <Card className="text-center relative">
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ backgroundColor: color }}>
        {step}
      </div>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-off-white/60 leading-relaxed">{description}</p>
    </Card>
  );
}

function FloatingCard({ className, color, icon, title, subtitle, delay }: {
  className: string; color: string; icon: React.ReactNode; title: string; subtitle: string; delay: string;
}) {
  return (
    <div
      className={`absolute card-base glass rounded-2xl p-4 w-44 ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{title}</p>
          <p className="text-xs text-off-white/50 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

import * as Icons from 'lucide-react';
function DynamicIconSafe({ name }: { name: string }) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!IconComponent) return null;
  return <IconComponent className="w-7 h-7" />;
}
