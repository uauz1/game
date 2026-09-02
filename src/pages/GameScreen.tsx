import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Clock, Scissors, Star, Volume2, VolumeX, Check, ChevronLeft,
  AlertCircle, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { getCategoryById } from '@/data/categories';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { POWER_UPS, type Player } from '@/types';
import { calculatePoints, cn } from '@/utils/helpers';
import { loadFromStorage, saveToStorage } from '@/utils/storage';
import type { GameResult, LeaderboardEntry } from '@/types';
import * as Icons from 'lucide-react';

function DynamicIcon({ name, size = 24 }: { name: string; size?: number }) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!IconComponent) return null;
  return <IconComponent style={{ width: size, height: size }} />;
}

export function GameScreen() {
  const navigate = useNavigate();
  const {
    gameConfig, currentQuestion, currentPlayer, isLastQuestion,
    updatePlayerScore, markPowerUsed, nextQuestion, nextPlayer, endGame, clearGame,
  } = useGame();
  const { settings, toggleSound, playSound } = useSettings();
  const { showToast } = useToast();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(gameConfig?.timerSeconds || 0);
  const [eliminatedChoices, setEliminatedChoices] = useState<number[]>([]);
  const [doublePointsActive, setDoublePointsActive] = useState(false);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasTimer = gameConfig && gameConfig.timerSeconds > 0;
  const totalTime = gameConfig?.timerSeconds || 0;

  // Redirect if no game
  useEffect(() => {
    if (!gameConfig || !currentQuestion) {
      navigate('/play');
    }
  }, [gameConfig, currentQuestion, navigate]);

  // Reset state on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setIsLocked(false);
    setEliminatedChoices([]);
    setDoublePointsActive(false);
    setExtraTimeUsed(false);
    setTimeLeft(gameConfig?.timerSeconds || 0);
    setQuestionKey((k) => k + 1);
  }, [gameConfig?.currentQuestionIndex]);

  // Timer
  useEffect(() => {
    if (!hasTimer || isLocked || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (timeLeft <= 0 && hasTimer && !isLocked && currentQuestion) {
        setIsLocked(true);
        playSound('wrong');
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 5) playSound('tick');
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasTimer, isLocked, timeLeft, currentQuestion, playSound]);

  const handleAnswer = useCallback((index: number) => {
    if (isLocked || !currentQuestion || !gameConfig || !currentPlayer) return;

    setSelectedAnswer(index);
    setIsLocked(true);

    const isCorrect = index === currentQuestion.correctAnswer;
    const playerIndex = gameConfig.currentPlayerIndex;

    if (isCorrect) {
      playSound('correct');
      const points = calculatePoints(
        currentQuestion.difficulty,
        timeLeft,
        totalTime,
        doublePointsActive
      );

      const catStats = { ...currentPlayer.categoryStats };
      const catKey = currentQuestion.category;
      if (!catStats[catKey]) catStats[catKey] = { correct: 0, wrong: 0 };
      catStats[catKey].correct += 1;

      updatePlayerScore(playerIndex, {
        score: currentPlayer.score + points,
        correctAnswers: currentPlayer.correctAnswers + 1,
        categoryStats: catStats,
      });

      showToast(`+${points} نقطة!`, 'success');
    } else {
      playSound('wrong');
      const catStats = { ...currentPlayer.categoryStats };
      const catKey = currentQuestion.category;
      if (!catStats[catKey]) catStats[catKey] = { correct: 0, wrong: 0 };
      catStats[catKey].wrong += 1;

      updatePlayerScore(playerIndex, {
        wrongAnswers: currentPlayer.wrongAnswers + 1,
        categoryStats: catStats,
      });
    }
  }, [isLocked, currentQuestion, gameConfig, currentPlayer, timeLeft, totalTime, doublePointsActive, updatePlayerScore, playSound, showToast]);

  const handleNext = () => {
    if (!gameConfig) return;
    playSound('whoosh');

    // In multiplayer modes, rotate players
    if (gameConfig.players.length > 1) {
      nextPlayer();
    }

    if (isLastQuestion) {
      handleGameEnd();
    } else {
      nextQuestion();
    }
  };

  function handleGameEnd() {
    if (!gameConfig) return;
    const sortedPlayers = [...gameConfig.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0].score > 0 ? sortedPlayers[0] : null;

    // Check for tie
    const topScore = sortedPlayers[0].score;
    const winners = sortedPlayers.filter((p) => p.score === topScore);
    const finalWinner = winners.length === 1 ? winners[0] : null;

    const result: GameResult = {
      players: sortedPlayers,
      winner: finalWinner,
      totalQuestions: gameConfig.questions.length,
      date: Date.now(),
      config: {
        mode: gameConfig.mode,
        categories: gameConfig.categories,
        difficulty: gameConfig.difficulty,
        questionCount: gameConfig.questionCount,
        timerSeconds: gameConfig.timerSeconds,
      },
    };

    // Save to leaderboard
    const leaderboard = loadFromStorage<LeaderboardEntry[]>('leaderboard', []);
    sortedPlayers.forEach((p) => {
      const total = p.correctAnswers + p.wrongAnswers;
      const accuracy = total > 0 ? Math.round((p.correctAnswers / total) * 100) : 0;
      leaderboard.push({
        id: `${p.id}-${Date.now()}`,
        name: p.name,
        score: p.score,
        date: Date.now(),
        accuracy,
        category: gameConfig.categories[0] || 'mixed',
      });
    });
    saveToStorage('leaderboard', leaderboard.sort((a, b) => b.score - a.score).slice(0, 100));

    endGame(result);
    navigate('/results');
  }

  function handleExit() {
    clearGame();
    navigate('/');
  }

  function usePowerUp(power: 'eliminate' | 'extraTime' | 'doublePoints') {
    if (!currentPlayer || !currentQuestion || isLocked) return;
    if (currentPlayer.powersUsed[power]) {
      showToast('استخدمت هذه القوة بالفعل', 'warning');
      return;
    }

    playSound('powerUp');
    markPowerUsed(gameConfig!.currentPlayerIndex, power);

    if (power === 'eliminate') {
      const wrongIndices = currentQuestion.choices
        .map((_, i) => i)
        .filter((i) => i !== currentQuestion.correctAnswer && currentQuestion.choices[i] !== '');
      const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
      setEliminatedChoices(toEliminate);
      showToast('تم حذف إجابتين خاطئتين', 'info');
    } else if (power === 'extraTime') {
      setTimeLeft((prev) => prev + 15);
      setExtraTimeUsed(true);
      showToast('+15 ثانية إضافية', 'info');
    } else if (power === 'doublePoints') {
      setDoublePointsActive(true);
      showToast('مضاعفة النقاط مفعّلة!', 'info');
    }
  }

  // Keyboard support
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!currentQuestion || isLocked) return;
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const idx = parseInt(key) - 1;
        if (currentQuestion.choices[idx] && !eliminatedChoices.includes(idx)) {
          handleAnswer(idx);
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentQuestion, isLocked, eliminatedChoices, handleAnswer]);

  if (!gameConfig || !currentQuestion || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-off-white/60 mb-4">جاري التحميل...</p>
          <Button onClick={() => navigate('/play')}>العودة لإعداد اللعبة</Button>
        </div>
      </div>
    );
  }

  const category = getCategoryById(currentQuestion.category);
  const isTrueFalse = currentQuestion.type === 'truefalse';
  const activeChoices = currentQuestion.choices.map((choice, i) => ({
    text: choice,
    index: i,
    isCorrect: i === currentQuestion.correctAnswer,
    isSelected: i === selectedAnswer,
    isEliminated: eliminatedChoices.includes(i),
  })).filter((c) => c.text !== '');

  const timerColor = timeLeft <= 5 ? '#FF625F' : timeLeft <= 15 ? '#FFC83D' : '#35D1C5';
  const timerPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;

  return (
    <div className="min-h-screen px-4 py-4 lg:py-6 max-w-3xl mx-auto" key={questionKey}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-coral/20 transition-colors text-sm font-semibold"
        >
          <X className="w-4 h-4" />
          خروج
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-off-white/60">
            السؤال {gameConfig.currentQuestionIndex + 1} / {gameConfig.questions.length}
          </span>
          <button
            onClick={() => { toggleSound(); playSound('click'); }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        current={gameConfig.currentQuestionIndex + 1}
        total={gameConfig.questions.length}
        className="mb-4"
      />

      {/* Current player & scores */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {gameConfig.players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-2xl transition-all shrink-0',
              i === gameConfig.currentPlayerIndex ? 'ring-2' : 'bg-white/5'
            )}
            style={i === gameConfig.currentPlayerIndex ? {
              backgroundColor: p.color + '20',
              borderColor: p.color,
              boxShadow: `0 0 12px ${p.color}40`,
            } : undefined}
          >
            <span className="text-lg">{p.avatar}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate max-w-[80px]">{p.name}</p>
              <p className="text-xs" style={{ color: i === gameConfig.currentPlayerIndex ? p.color : '#ffffff80' }}>
                {p.score} نقطة
              </p>
            </div>
            {i === gameConfig.currentPlayerIndex && (
              <span className="text-[10px] bg-purple/30 text-purple px-1.5 py-0.5 rounded-full font-bold shrink-0">دوره</span>
            )}
          </div>
        ))}
      </div>

      {/* Timer */}
      {hasTimer && (
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke={timerColor} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - timerPercent / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-cairo font-black" style={{ color: timerColor }}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Question card */}
      <div className="glass card-base rounded-3xl p-5 lg:p-8 mb-4 animate-slide-up">
        {/* Category & difficulty */}
        <div className="flex items-center gap-2 mb-4">
          {category && <CategoryIcon category={category} size={20} />}
          {category && <span className="text-sm font-semibold" style={{ color: category.color }}>{category.name}</span>}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              backgroundColor: currentQuestion.difficulty === 'easy' ? '#35D1C520' : currentQuestion.difficulty === 'medium' ? '#FFC83D20' : '#FF625F20',
              color: currentQuestion.difficulty === 'easy' ? '#35D1C5' : currentQuestion.difficulty === 'medium' ? '#FFC83D' : '#FF625F',
            }}
          >
            {currentQuestion.difficulty === 'easy' ? 'سهل' : currentQuestion.difficulty === 'medium' ? 'متوسط' : 'صعب'}
          </span>
        </div>

        {/* Question text */}
        <h2 className="text-xl lg:text-2xl font-cairo font-bold leading-relaxed mb-2">
          {currentQuestion.text}
        </h2>

        {/* Player indicator */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <span className="text-2xl">{currentPlayer.avatar}</span>
          <span className="text-sm font-bold" style={{ color: currentPlayer.color }}>
            {currentPlayer.name} - دورك!
          </span>
        </div>
      </div>

      {/* Answer choices */}
      <div className={cn('grid gap-3 mb-4', isTrueFalse ? 'grid-cols-2' : 'grid-cols-1')}>
        {activeChoices.map((choice) => {
          const showResult = isLocked;
          const isCorrectAnswer = choice.isCorrect;
          const isWrongSelection = choice.isSelected && !choice.isCorrect;

          return (
            <button
              key={choice.index}
              onClick={() => handleAnswer(choice.index)}
              disabled={isLocked || choice.isEliminated}
              className={cn(
                'relative text-right p-4 lg:p-5 rounded-2xl font-semibold text-lg transition-all duration-300 border-2',
                !showResult && !choice.isEliminated && 'glass border-white/10 hover:border-purple hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
                !showResult && choice.isEliminated && 'opacity-30 bg-white/5 border-white/5',
                showResult && isCorrectAnswer && 'bg-turquoise/20 border-turquoise text-turquoise',
                showResult && isWrongSelection && 'bg-coral/20 border-coral text-coral animate-shake',
                showResult && !isCorrectAnswer && !isWrongSelection && 'opacity-40 border-white/10'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex-1">{choice.text}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {showResult && isCorrectAnswer && <Check className="w-6 h-6 text-turquoise" />}
                  {showResult && isWrongSelection && <X className="w-6 h-6 text-coral" />}
                  {choice.isEliminated && <span className="text-xs text-off-white/40">محذوفة</span>}
                  {!showResult && !choice.isEliminated && (
                    <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                      {isTrueFalse ? (choice.index === 0 ? '✓' : '✗') : choice.index + 1}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Power-ups */}
      {!isLocked && (
        <div className="flex items-center gap-2 mb-4">
          {POWER_UPS.map((power) => {
            const used = currentPlayer.powersUsed[power.id];
            return (
              <button
                key={power.id}
                onClick={() => usePowerUp(power.id)}
                disabled={used}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all',
                  used
                    ? 'opacity-30 border-white/5 bg-white/5 cursor-not-allowed'
                    : 'border-purple/30 bg-purple/10 hover:bg-purple/20 cursor-pointer'
                )}
              >
                <DynamicIcon name={power.icon} size={20} />
                <span className="text-xs font-semibold">{power.name}</span>
                {used && <span className="text-[10px] text-off-white/40">مُستخدمة</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation + Next button */}
      {isLocked && (
        <div className="animate-slide-up space-y-3">
          {currentQuestion.explanation && (
            <div className="glass card-base rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow shrink-0 mt-0.5" />
              <p className="text-sm text-off-white/80 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          <Button
            variant={isLastQuestion ? 'success' : 'primary'}
            size="lg"
            fullWidth
            onClick={handleNext}
          >
            {isLastQuestion ? (
              <>عرض النتائج <Zap className="w-5 h-5" /></>
            ) : (
              <>السؤال التالي <ChevronLeft className="w-5 h-5" /></>
            )}
          </Button>
        </div>
      )}

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative glass card-base rounded-3xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="text-xl font-bold mb-2">إنهاء اللعبة؟</h3>
            <p className="text-sm text-off-white/60 mb-6">سيتم فقدان تقدمك الحالي في اللعبة.</p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowExitConfirm(false)}>
                متابعة اللعب
              </Button>
              <Button variant="danger" fullWidth onClick={handleExit}>
                إنهاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
