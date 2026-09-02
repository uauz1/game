export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type QuestionType = 'multiple' | 'truefalse';

export interface Question {
  id: string;
  category: string;
  text: string;
  choices: string[];
  correctAnswer: number;
  difficulty: Exclude<Difficulty, 'mixed'>;
  explanation?: string;
  type: QuestionType;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  questionCount: number;
}

export type GameMode =
  | 'single'
  | 'team'
  | 'friends'
  | 'quick'
  | 'truefalse'
  | 'multiple';

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  powersUsed: {
    eliminate: boolean;
    extraTime: boolean;
    doublePoints: boolean;
  };
  categoryStats: Record<string, { correct: number; wrong: number }>;
}

export interface GameConfig {
  mode: GameMode;
  players: Player[];
  categories: string[];
  difficulty: Difficulty;
  questionCount: number;
  timerSeconds: number;
  currentQuestionIndex: number;
  currentPlayerIndex: number;
  questions: Question[];
  startTime: number;
}

export interface GameResult {
  players: Player[];
  winner: Player | null;
  totalQuestions: number;
  date: number;
  config: Pick<GameConfig, 'mode' | 'categories' | 'difficulty' | 'questionCount' | 'timerSeconds'>;
}

export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  theme: 'dark' | 'light';
  defaultTimer: number;
  language: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (stats: ProfileStats) => boolean;
}

export interface ProfileStats {
  totalGames: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  bestScore: number;
  favoriteCategory: string | null;
  achievements: Achievement[];
  gamesHistory: GameResult[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: number;
  accuracy: number;
  category: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const GAME_MODES: { id: GameMode; name: string; description: string; icon: string; color: string }[] = [
  { id: 'single', name: 'لعب فردي', description: 'العب بمفردك وتحدّ نفسك', icon: 'User', color: '#7056E8' },
  { id: 'team', name: 'فريق ضد فريق', description: 'تنافس بين فريقين أو أكثر', icon: 'Users', color: '#35D1C5' },
  { id: 'friends', name: 'تحدي الأصدقاء', description: 'العب مع أصدقائك على نفس الجهاز', icon: 'UserPlus', color: '#FFC83D' },
  { id: 'quick', name: 'تحدي سريع', description: '5 أسئلة سريعة بدون إعداد', icon: 'Zap', color: '#FF625F' },
  { id: 'truefalse', name: 'صح أو خطأ', description: 'أسئلة صح أو خطأ فقط', icon: 'CheckCircle', color: '#35D1C5' },
  { id: 'multiple', name: 'اختير من متعدد', description: 'أسئلة اختيار من متعدد', icon: 'ListChecks', color: '#7056E8' },
];

export const DIFFICULTIES: { id: Difficulty; name: string; icon: string; color: string }[] = [
  { id: 'easy', name: 'سهل', icon: 'Smile', color: '#35D1C5' },
  { id: 'medium', name: 'متوسط', icon: 'Meh', color: '#FFC83D' },
  { id: 'hard', name: 'صعب', icon: 'Frown', color: '#FF625F' },
  { id: 'mixed', name: 'مختلط', icon: 'Shuffle', color: '#7056E8' },
];

export const QUESTION_COUNTS = [10, 15, 20, 30];

export const TIMER_OPTIONS = [
  { value: 0, label: 'بدون مؤقت' },
  { value: 15, label: '15 ثانية' },
  { value: 30, label: '30 ثانية' },
  { value: 60, label: '60 ثانية' },
];

export const PLAYER_COLORS = [
  '#7056E8', '#FFC83D', '#FF625F', '#35D1C5',
  '#FF8FA3', '#5B8DEF', '#FFB347', '#6BCB77',
];

export const PLAYER_AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🦉', '🐸', '🐵', '🐨',
  '🦄', '🐲', '🦅', '🐺', '🦝', '🐰', '🐻', '🐱',
];

export const POWER_UPS = [
  { id: 'eliminate' as const, name: 'حذف إجابتين', icon: 'Scissors', description: 'احذف إجابتين خاطئتين' },
  { id: 'extraTime' as const, name: 'وقت إضافي', icon: 'Clock', description: 'احصل على 15 ثانية إضافية' },
  { id: 'doublePoints' as const, name: 'مضاعفة النقاط', icon: 'Star', description: 'ضاعف نقاط هذا السؤال' },
];
