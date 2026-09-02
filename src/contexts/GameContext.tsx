import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GameConfig, Player, GameResult } from '@/types';
import { getQuestions } from '@/data/questions';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

interface GameContextValue {
  gameConfig: GameConfig | null;
  gameResult: GameResult | null;
  startGame: (config: Omit<GameConfig, 'currentQuestionIndex' | 'currentPlayerIndex' | 'questions' | 'startTime'>) => void;
  endGame: (result: GameResult) => void;
  clearGame: () => void;
  updatePlayerScore: (playerIndex: number, updates: Partial<Player>) => void;
  markPowerUsed: (playerIndex: number, power: 'eliminate' | 'extraTime' | 'doublePoints') => void;
  nextQuestion: () => void;
  nextPlayer: () => void;
  currentPlayer: Player | null;
  currentQuestion: import('@/types').Question | null;
  isLastQuestion: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const startGame = useCallback((config: Omit<GameConfig, 'currentQuestionIndex' | 'currentPlayerIndex' | 'questions' | 'startTime'>) => {
    const questions = getQuestions(config.categories, config.difficulty, config.questionCount, config.mode);
    const newConfig: GameConfig = {
      ...config,
      currentQuestionIndex: 0,
      currentPlayerIndex: 0,
      questions,
      startTime: Date.now(),
    };
    setGameConfig(newConfig);
    setGameResult(null);
  }, []);

  const endGame = useCallback((result: GameResult) => {
    setGameResult(result);
    setGameConfig(null);
    const history = loadFromStorage<GameResult[]>('gameHistory', []);
    saveToStorage('gameHistory', [result, ...history].slice(0, 50));
  }, []);

  const clearGame = useCallback(() => {
    setGameConfig(null);
    setGameResult(null);
  }, []);

  const updatePlayerScore = useCallback((playerIndex: number, updates: Partial<Player>) => {
    setGameConfig((prev) => {
      if (!prev) return prev;
      const players = [...prev.players];
      players[playerIndex] = { ...players[playerIndex], ...updates };
      return { ...prev, players };
    });
  }, []);

  const markPowerUsed = useCallback((playerIndex: number, power: 'eliminate' | 'extraTime' | 'doublePoints') => {
    setGameConfig((prev) => {
      if (!prev) return prev;
      const players = [...prev.players];
      players[playerIndex] = {
        ...players[playerIndex],
        powersUsed: {
          ...players[playerIndex].powersUsed,
          [power]: true,
        },
      };
      return { ...prev, players };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setGameConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
    });
  }, []);

  const nextPlayer = useCallback(() => {
    setGameConfig((prev) => {
      if (!prev) return prev;
      const nextIdx = (prev.currentPlayerIndex + 1) % prev.players.length;
      return { ...prev, currentPlayerIndex: nextIdx };
    });
  }, []);

  const currentPlayer = gameConfig ? gameConfig.players[gameConfig.currentPlayerIndex] : null;
  const currentQuestion = gameConfig && gameConfig.currentQuestionIndex < gameConfig.questions.length
    ? gameConfig.questions[gameConfig.currentQuestionIndex]
    : null;
  const isLastQuestion = gameConfig ? gameConfig.currentQuestionIndex >= gameConfig.questions.length - 1 : false;

  return (
    <GameContext.Provider
      value={{
        gameConfig,
        gameResult,
        startGame,
        endGame,
        clearGame,
        updatePlayerScore,
        markPowerUsed,
        nextQuestion,
        nextPlayer,
        currentPlayer,
        currentQuestion,
        isLastQuestion,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
