import type { Question, Difficulty } from '@/types';
import { generalQuestions } from './general';
import { islamicQuestions } from './islamic';
import { sportsQuestions, footballQuestions } from './sports';
import { historyQuestions, geographyQuestions } from './history_geography';
import { scienceQuestions, techQuestions } from './science_tech';
import { moviesQuestions, gamesQuestions } from './movies_games';
import { puzzlesQuestions, animalsQuestions, famousQuestions } from './puzzles_animals_famous';
import { saudiQuestions, worldQuestions, trueFalseQuestions } from './saudi_world_truefalse';
import { extraQuestions } from './extra';
import { themedQuestions } from './themed';
import { vaultQuestions } from './vault';
import { vaultExpansionQuestions } from './vault_expansion';
import { vaultPlusQuestions } from './vault_plus';
import { difficultyExpansionQuestions } from './difficulty_expansion';

const extrasFor = (category: string) => extraQuestions.filter((q) => q.category === category);
const themedFor = (category: string) => themedQuestions.filter((q) => q.category === category);
const difficultyFor = (category: string) => difficultyExpansionQuestions.filter((q) => q.category === category);
const activePlusQuestions = vaultPlusQuestions.filter((q) => q.id !== 'vp-space-001');
const timelessSpaceReplacement: Question = {
  id: 'vp-space-001-stable', category: 'space', difficulty: 'hard', type: 'multiple',
  text: 'ما اسم المنطقة الواقعة بعد مدار نبتون وتضم أجرامًا جليدية كثيرة مثل بلوتو؟',
  choices: ['حزام كايبر', 'حزام الكويكبات', 'سحابة ماجلان', 'حزام فان ألن'], correctAnswer: 0,
};
const fullVault = [...vaultQuestions, ...vaultExpansionQuestions, ...activePlusQuestions, timelessSpaceReplacement];
const vaultFor = (category: string) => fullVault.filter((q) => q.category === category);
const trueFalsePool = [...trueFalseQuestions, ...extraQuestions.filter((q) => q.type === 'truefalse')];

export const ALL_QUESTIONS: Question[] = [
  ...generalQuestions,
  ...islamicQuestions,
  ...sportsQuestions,
  ...footballQuestions,
  ...historyQuestions,
  ...geographyQuestions,
  ...scienceQuestions,
  ...techQuestions,
  ...moviesQuestions,
  ...gamesQuestions,
  ...puzzlesQuestions,
  ...animalsQuestions,
  ...famousQuestions,
  ...saudiQuestions,
  ...worldQuestions,
  ...trueFalseQuestions,
  ...extraQuestions,
  ...themedQuestions,
  ...difficultyExpansionQuestions,
  ...fullVault,
];

const withVault = (category: string, base: Question[]) => [
  ...base,
  ...extrasFor(category),
  ...vaultFor(category),
  ...difficultyFor(category),
];

const themedPool = (category: string) => [
  ...themedFor(category),
  ...vaultFor(category),
  ...difficultyFor(category),
];

export const QUESTIONS_BY_CATEGORY: Record<string, Question[]> = {
  general: withVault('general', generalQuestions),
  islamic: withVault('islamic', islamicQuestions),
  sports: withVault('sports', sportsQuestions),
  football: withVault('football', footballQuestions),
  history: withVault('history', historyQuestions),
  geography: withVault('geography', geographyQuestions),
  science: withVault('science', scienceQuestions),
  tech: withVault('tech', techQuestions),
  movies: withVault('movies', moviesQuestions),
  games: withVault('games', gamesQuestions),
  puzzles: withVault('puzzles', puzzlesQuestions),
  animals: withVault('animals', animalsQuestions),
  famous: withVault('famous', famousQuestions),
  saudi: withVault('saudi', saudiQuestions),
  world: withVault('world', worldQuestions),
  truefalse: [...trueFalsePool, ...vaultFor('truefalse'), ...difficultyFor('truefalse')],
  food: themedPool('food'),
  cars: themedPool('cars'),
  space: themedPool('space'),
  medicine: themedPool('medicine'),
  languages: themedPool('languages'),
  books: themedPool('books'),
  music: themedPool('music'),
  nature: themedPool('nature'),
  inventions: themedPool('inventions'),
  economy: themedPool('economy'),
  architecture: themedPool('architecture'),
  flags: themedPool('flags'),
};

const HISTORY_KEY = 'qaddha_question_history_v4';
const SITE_PREFS_KEY = 'qaddha_site_prefs_v1';
type HistoryEntry = { id: string; category: string; at: number };
type RepeatProtection = 'standard' | 'strict' | 'maximum';

type DifficultyBucket = Exclude<Difficulty, 'mixed'>;
const DIFFICULTY_BUCKETS: DifficultyBucket[] = ['easy', 'medium', 'hard'];

function readRepeatProtection(): RepeatProtection {
  try {
    const value = JSON.parse(localStorage.getItem(SITE_PREFS_KEY) || '{}')?.repeatProtection;
    if (value === 'standard' || value === 'maximum') return value;
    return 'strict';
  } catch {
    return 'strict';
  }
}

function historyLimit() {
  const protection = readRepeatProtection();
  if (protection === 'maximum') return 6000;
  if (protection === 'standard') return 1600;
  return 3000;
}

function normalizeArabic(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/[^\u0621-\u063a\u0641-\u064a0-9a-z]/g, '');
}

function readHistory(): HistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is HistoryEntry => Boolean(entry && typeof entry.id === 'string' && typeof entry.at === 'number'));
  } catch {
    return [];
  }
}

function persistHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-historyLimit())));
  } catch {
    // Storage is optional; the selector still works for the active session.
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function semanticDedupe(pool: Question[]) {
  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();
  return pool.filter((question) => {
    const promptKey = normalizeArabic(question.text);
    if (seenIds.has(question.id) || seenPrompts.has(promptKey)) return false;
    seenIds.add(question.id);
    seenPrompts.add(promptKey);
    return true;
  });
}

function rankByHistory(pool: Question[], history: HistoryEntry[]) {
  const lastSeen = new Map<string, number>();
  history.forEach((entry, index) => lastSeen.set(entry.id, index));
  const neverSeen = shuffle(pool.filter((q) => !lastSeen.has(q.id)));
  const recycled = pool
    .filter((q) => lastSeen.has(q.id))
    .sort((a, b) => (lastSeen.get(a.id) ?? -1) - (lastSeen.get(b.id) ?? -1));
  return [...neverSeen, ...recycled];
}

function diversify(pool: Question[], count: number) {
  const remaining = [...pool];
  const selected: Question[] = [];
  let previousCategory = '';
  let categoryStreak = 0;

  while (selected.length < count && remaining.length) {
    const candidateWindow = remaining.slice(0, Math.min(24, remaining.length));
    let candidateIndex = candidateWindow.findIndex((q) => q.category !== previousCategory);
    if (candidateIndex < 0 || categoryStreak < 2) candidateIndex = 0;
    const [picked] = remaining.splice(candidateIndex, 1);
    selected.push(picked);
    if (picked.category === previousCategory) categoryStreak += 1;
    else {
      previousCategory = picked.category;
      categoryStreak = 1;
    }
  }

  return selected;
}

function exactDifficultySelection(
  pool: Question[],
  difficulty: DifficultyBucket,
  count: number,
  history: HistoryEntry[],
) {
  const exact = pool.filter((q) => q.difficulty === difficulty);
  const needed = Math.min(count, exact.length);
  return diversify(rankByHistory(exact, history), needed);
}

function mixedDifficultySelection(pool: Question[], count: number, history: HistoryEntry[]) {
  const target = Math.min(count, pool.length);
  if (target <= 0) return [] as Question[];

  const bucketOrder = shuffle(DIFFICULTY_BUCKETS);
  const baseQuota = Math.floor(target / DIFFICULTY_BUCKETS.length);
  const remainder = target % DIFFICULTY_BUCKETS.length;
  const selected: Question[] = [];

  bucketOrder.forEach((difficulty, index) => {
    const desired = baseQuota + (index < remainder ? 1 : 0);
    const bucket = rankByHistory(pool.filter((q) => q.difficulty === difficulty), history);
    selected.push(...bucket.slice(0, desired));
  });

  const selectedIds = new Set(selected.map((q) => q.id));
  if (selected.length < target) {
    const remaining = rankByHistory(pool.filter((q) => !selectedIds.has(q.id)), history);
    selected.push(...remaining.slice(0, target - selected.length));
  }

  // Random means random: no hidden medium/hard bias. We still diversify categories
  // after shuffling so one topic cannot dominate a session.
  return diversify(shuffle(selected), target);
}

function selectQuestionsByDifficulty(
  pool: Question[],
  difficulty: Difficulty,
  count: number,
  history: HistoryEntry[],
) {
  if (difficulty === 'mixed') return mixedDifficultySelection(pool, count, history);
  return exactDifficultySelection(pool, difficulty, count, history);
}

export function getQuestions(
  categories: string[],
  difficulty: Difficulty,
  count: number,
  mode: string
): Question[] {
  let pool: Question[] = [];

  if (mode === 'truefalse') {
    pool = [...trueFalsePool, ...vaultFor('truefalse'), ...difficultyFor('truefalse')];
  } else if (mode === 'multiple') {
    pool = ALL_QUESTIONS.filter((q) => q.type === 'multiple');
  } else if (categories.length === 0) {
    pool = [...ALL_QUESTIONS];
  } else {
    categories.forEach((cat) => {
      if (QUESTIONS_BY_CATEGORY[cat]) pool.push(...QUESTIONS_BY_CATEGORY[cat]);
    });
  }

  pool = semanticDedupe(pool);
  const history = readHistory();
  const selected = selectQuestionsByDifficulty(pool, difficulty, count, history);

  const now = Date.now();
  const updated = [...history];
  for (const question of selected) {
    const existing = updated.findIndex((entry) => entry.id === question.id);
    if (existing >= 0) updated.splice(existing, 1);
    updated.push({ id: question.id, category: question.category, at: now });
  }
  persistHistory(updated);

  return selected;
}
