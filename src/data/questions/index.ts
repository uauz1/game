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

const extrasFor = (category: string) => extraQuestions.filter((q) => q.category === category);
const themedFor = (category: string) => themedQuestions.filter((q) => q.category === category);
const vaultFor = (category: string) => vaultQuestions.filter((q) => q.category === category);
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
  ...vaultQuestions,
];

const withVault = (category: string, base: Question[]) => [...base, ...extrasFor(category), ...vaultFor(category)];

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
  truefalse: [...trueFalsePool, ...vaultFor('truefalse')],
  food: [...themedFor('food'), ...vaultFor('food')],
  cars: [...themedFor('cars'), ...vaultFor('cars')],
  space: [...themedFor('space'), ...vaultFor('space')],
  medicine: [...themedFor('medicine'), ...vaultFor('medicine')],
  languages: [...themedFor('languages'), ...vaultFor('languages')],
  books: [...themedFor('books'), ...vaultFor('books')],
  music: [...themedFor('music'), ...vaultFor('music')],
  nature: [...themedFor('nature'), ...vaultFor('nature')],
  inventions: [...themedFor('inventions'), ...vaultFor('inventions')],
  economy: [...themedFor('economy'), ...vaultFor('economy')],
  architecture: [...themedFor('architecture'), ...vaultFor('architecture')],
  flags: [...themedFor('flags'), ...vaultFor('flags')],
};

const HISTORY_KEY = 'qaddha_question_history_v2';
const MAX_HISTORY = 2200;
type HistoryEntry = { id: string; category: string; at: number };

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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch {
    // Storage is optional; the selector still works for this session.
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
  return pool.filter(question => {
    const promptKey = normalizeArabic(question.text);
    if (seenIds.has(question.id) || seenPrompts.has(promptKey)) return false;
    seenIds.add(question.id);
    seenPrompts.add(promptKey);
    return true;
  });
}

function weightedDifficultyPool(pool: Question[], difficulty: Difficulty, targetCount: number) {
  if (difficulty !== 'mixed') {
    const exact = pool.filter(q => q.difficulty === difficulty);
    return exact.length >= Math.min(targetCount, pool.length) ? exact : pool;
  }

  // Qaddha's default identity is deliberately competitive: easy questions are
  // only used as emergency overflow when medium/hard inventory is insufficient.
  const medium = shuffle(pool.filter(q => q.difficulty === 'medium'));
  const hard = shuffle(pool.filter(q => q.difficulty === 'hard'));
  const easy = shuffle(pool.filter(q => q.difficulty === 'easy'));
  const desiredMedium = Math.ceil(targetCount * 0.42);
  const desiredHard = Math.max(0, targetCount - desiredMedium);
  const chosen = [...medium.slice(0, desiredMedium), ...hard.slice(0, desiredHard)];
  const chosenIds = new Set(chosen.map(q => q.id));
  const overflow = [...medium.slice(desiredMedium), ...hard.slice(desiredHard), ...easy].filter(q => !chosenIds.has(q.id));
  return [...chosen, ...overflow];
}

function rankByHistory(pool: Question[], history: HistoryEntry[]) {
  const lastSeen = new Map<string, number>();
  history.forEach((entry, index) => lastSeen.set(entry.id, index));
  const neverSeen = shuffle(pool.filter(q => !lastSeen.has(q.id)));
  const recycled = pool
    .filter(q => lastSeen.has(q.id))
    .sort((a, b) => (lastSeen.get(a.id) ?? -1) - (lastSeen.get(b.id) ?? -1));
  return [...neverSeen, ...recycled];
}

function diversify(pool: Question[], count: number) {
  const remaining = [...pool];
  const selected: Question[] = [];
  let previousCategory = '';
  let categoryStreak = 0;

  while (selected.length < count && remaining.length) {
    const candidateWindow = remaining.slice(0, Math.min(14, remaining.length));
    let candidateIndex = candidateWindow.findIndex(q => q.category !== previousCategory);
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

export function getQuestions(
  categories: string[],
  difficulty: Difficulty,
  count: number,
  mode: string
): Question[] {
  let pool: Question[] = [];

  if (mode === 'truefalse') {
    pool = [...trueFalsePool, ...vaultFor('truefalse')];
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
  const needed = Math.min(count, pool.length);
  const history = readHistory();
  const difficultyRanked = weightedDifficultyPool(pool, difficulty, needed);
  const historyRanked = rankByHistory(difficultyRanked, history);
  const selected = diversify(historyRanked, needed);

  const now = Date.now();
  const updated = [...history];
  for (const question of selected) {
    const existing = updated.findIndex(entry => entry.id === question.id);
    if (existing >= 0) updated.splice(existing, 1);
    updated.push({ id: question.id, category: question.category, at: now });
  }
  persistHistory(updated);

  return selected;
}
