import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, RotateCcw, Home, Share2, Gamepad2, Star, Target,
  TrendingUp, Award, Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getCategoryById } from '@/data/categories';
import { GAME_MODES, DIFFICULTIES } from '@/types';
import { celebrateWin } from '@/utils/confetti';
import { cn, getBestCategory } from '@/utils/helpers';

export function Results() {
  const navigate = useNavigate();
  const { gameResult } = useGame();
  const { playSound } = useSettings();

  useEffect(() => {
    if (gameResult?.winner) {
      celebrateWin();
      playSound('win');
    } else if (gameResult) {
      playSound('wrong');
    }
  }, [gameResult, playSound]);

  useEffect(() => {
    if (!gameResult) {
      navigate('/');
    }
  }, [gameResult, navigate]);

  if (!gameResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
      </div>
    );
  }

  const { players, winner, totalQuestions, config } = gameResult;
  const modeName = GAME_MODES.find((m) => m.id === config.mode)?.name || '';
  const diffName = DIFFICULTIES.find((d) => d.id === config.difficulty)?.name || '';

  function handleShare() {
    if (!gameResult) return;
    const winnerName = gameResult.winner?.name || 'تعادل';
    const topScore = gameResult.players[0]?.score || 0;
    const text = `تحدّي - الفائز: ${winnerName} بـ ${topScore} نقطة! هل تستطيع التغلب عليه؟`;

    if (navigator.share) {
      navigator.share({ title: 'نتيجة تحدّي', text }).catch(() => {
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      playSound('correct');
    }).catch(() => {
      // fallback
    });
  }

  function handleReplay() {
    playSound('click');
    navigate('/game');
  }

  function handleNewGame() {
    playSound('click');
    navigate('/play');
  }

  function handleHome() {
    playSound('click');
    navigate('/');
  }

  const podiumColors = ['#FFC83D', '#C0C0C0', '#CD7F32'];

  return (
    <div className="min-h-screen px-4 py-6 lg:py-10 max-w-3xl mx-auto">
      {/* Winner banner */}
      <div className="text-center mb-8 animate-slide-up">
        {winner ? (
          <>
            <div className="inline-block mb-4">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-2 shadow-glow-yellow"
                style={{ backgroundColor: winner.color + '30' }}
              >
                {winner.avatar}
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-cairo font-black mb-2">
              <span className="text-gradient-yellow">الفائز هو</span>
            </h1>
            <p className="text-2xl font-bold mb-1" style={{ color: winner.color }}>{winner.name}</p>
            <p className="text-lg text-off-white/60">{winner.score} نقطة</p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-3xl bg-yellow/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-yellow" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-cairo font-black mb-2">تعادل!</h1>
            <p className="text-lg text-off-white/60">لا يوجد فائز واضح هذه المرة</p>
          </>
        )}
      </div>

      {/* Podium (for multiplayer) */}
      {players.length > 1 && (
        <div className="flex items-end justify-center gap-2 mb-8">
          {players.slice(0, 3).map((player, i) => {
            const height = i === 0 ? 'h-32' : i === 1 ? 'h-24' : 'h-20';
            const order = i === 0 ? 1 : i === 1 ? 0 : 2;
            return (
              <div key={player.id} className="flex flex-col items-center" style={{ order }}>
                <div className="text-3xl mb-1">{player.avatar}</div>
                <p className="text-sm font-bold truncate max-w-[80px]">{player.name}</p>
                <p className="text-xs text-off-white/60">{player.score}</p>
                <div
                  className={cn('w-20 rounded-t-xl flex items-center justify-center text-2xl font-black mt-2', height)}
                  style={{ backgroundColor: podiumColors[i] + '30', color: podiumColors[i] }}
                >
                  {i + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final ranking */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">الترتيب النهائي</h2>
        <div className="space-y-2">
          {players.map((player, i) => {
            const total = player.correctAnswers + player.wrongAnswers;
            const accuracy = total > 0 ? Math.round((player.correctAnswers / total) * 100) : 0;
            return (
              <Card
                key={player.id}
                className={cn('p-4 flex items-center gap-3', i === 0 && winner && 'border-yellow/30')}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
                  style={{ backgroundColor: podiumColors[i] + '20', color: podiumColors[i] }}
                >
                  {i + 1}
                </div>
                <div className="text-2xl shrink-0">{player.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{player.name}</p>
                  <div className="flex items-center gap-3 text-xs text-off-white/60">
                    <span className="text-turquoise">{player.correctAnswers} صحيحة</span>
                    <span className="text-coral">{player.wrongAnswers} خاطئة</span>
                    <span>{accuracy}% دقة</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xl font-cairo font-black" style={{ color: player.color }}>{player.score}</p>
                  <p className="text-xs text-off-white/40">نقطة</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats for single player or winner */}
      {players.length === 1 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatBox icon={<Target className="w-6 h-6" />} label="الإجابات الصحيحة" value={`${players[0].correctAnswers}`} color="#35D1C5" />
          <StatBox icon={<Target className="w-6 h-6" />} label="الإجابات الخاطئة" value={`${players[0].wrongAnswers}`} color="#FF625F" />
          <StatBox
            icon={<TrendingUp className="w-6 h-6" />}
            label="نسبة الدقة"
            value={`${players[0].correctAnswers + players[0].wrongAnswers > 0
              ? Math.round((players[0].correctAnswers / (players[0].correctAnswers + players[0].wrongAnswers)) * 100)
              : 0}%`}
            color="#7056E8"
          />
          <StatBox
            icon={<Star className="w-6 h-6" />}
            label="إجمالي النقاط"
            value={`${players[0].score}`}
            color="#FFC83D"
          />
        </div>
      )}

      {/* Best category */}
      {(() => {
        const allPlayersStats = players.reduce((acc, p) => {
          for (const [cat, stats] of Object.entries(p.categoryStats)) {
            if (!acc[cat]) acc[cat] = { correct: 0, wrong: 0 };
            acc[cat].correct += stats.correct;
            acc[cat].wrong += stats.wrong;
          }
          return acc;
        }, {} as Record<string, { correct: number; wrong: number }>);

        const bestCat = getBestCategory(allPlayersStats);
        const catInfo = bestCat ? getCategoryById(bestCat) : null;
        if (!catInfo) return null;
        return (
          <Card className="mb-6 flex items-center gap-3 bg-purple/5 border-purple/20">
            <Award className="w-10 h-10 text-yellow shrink-0" />
            <div>
              <p className="text-sm text-off-white/60">أفضل تصنيف</p>
              <p className="font-bold text-lg" style={{ color: catInfo.color }}>{catInfo.name}</p>
            </div>
          </Card>
        );
      })()}

      {/* Game info */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="نمط اللعب" value={modeName} />
          <InfoRow label="الصعوبة" value={diffName} />
          <InfoRow label="عدد الأسئلة" value={`${totalQuestions}`} />
          <InfoRow label="المؤقت" value={config.timerSeconds > 0 ? `${config.timerSeconds} ثانية` : 'بدون'} />
        </div>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button variant="primary" size="lg" onClick={handleReplay}>
          <RotateCcw className="w-5 h-5" />
          إعادة اللعب
        </Button>
        <Button variant="secondary" size="lg" onClick={handleNewGame}>
          <Gamepad2 className="w-5 h-5" />
          لعبة جديدة
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" size="lg" onClick={handleHome}>
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </Button>
        <Button variant="outline" size="lg" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
          مشاركة النتيجة
        </Button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="text-center py-4">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <div className="text-2xl font-cairo font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-off-white/60 mt-1">{label}</div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-off-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
