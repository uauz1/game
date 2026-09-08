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

const extrasFor = (category: string) => extraQuestions.filter((q) => q.category === category);
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
];

export const QUESTIONS_BY_CATEGORY: Record<string, Question[]> = {
  general: [...generalQuestions, ...extrasFor('general')],
  islamic: [...islamicQuestions, ...extrasFor('islamic')],
  sports: [...sportsQuestions, ...extrasFor('sports')],
  football: [...footballQuestions, ...extrasFor('football')],
  history: [...historyQuestions, ...extrasFor('history')],
  geography: [...geographyQuestions, ...extrasFor('geography')],
  science: [...scienceQuestions, ...extrasFor('science')],
  tech: [...techQuestions, ...extrasFor('tech')],
  movies: [...moviesQuestions, ...extrasFor('movies')],
  games: [...gamesQuestions, ...extrasFor('games')],
  puzzles: [...puzzlesQuestions, ...extrasFor('puzzles')],
  animals: [...animalsQuestions, ...extrasFor('animals')],
  famous: [...famousQuestions, ...extrasFor('famous')],
  saudi: [...saudiQuestions, ...extrasFor('saudi')],
  world: [...worldQuestions, ...extrasFor('world')],
  truefalse: trueFalsePool,
};

const USED_KEY = 'qaddha_used_question_ids_v1';

function readUsedIds(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(USED_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function persistUsedIds(ids: Set<string>) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify(Array.from(ids).slice(-1500)));
  } catch {}
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getQuestions(
  categories: string[],
  difficulty: Difficulty,
  count: number,
  mode: string
): Question[] {
  let pool: Question[] = [];

  if (mode === 'truefalse') {
    pool = [...trueFalsePool];
  } else if (mode === 'multiple') {
    pool = ALL_QUESTIONS.filter((q) => q.type === 'multiple');
  } else if (categories.length === 0) {
    pool = [...ALL_QUESTIONS];
  } else {
    categories.forEach((cat) => {
      if (QUESTIONS_BY_CATEGORY[cat]) pool.push(...QUESTIONS_BY_CATEGORY[cat]);
    });
  }

  pool = Array.from(new Map(pool.map((q) => [q.id, q])).values());

  if (difficulty !== 'mixed') {
    const filtered = pool.filter((q) => q.difficulty === difficulty);
    if (filtered.length >= Math.min(count, pool.length)) pool = filtered;
  }

  const usedIds = readUsedIds();
  let fresh = pool.filter((q) => !usedIds.has(q.id));

  if (fresh.length < count) {
    const needed = Math.min(count, pool.length);
    if (fresh.length < needed) {
      const freshIds = new Set(fresh.map((q) => q.id));
      const recycled = shuffle(pool.filter((q) => !freshIds.has(q.id)));
      fresh = [...shuffle(fresh), ...recycled];
    }
  } else {
    fresh = shuffle(fresh);
  }

  const selected = fresh.slice(0, Math.min(count, pool.length));
  selected.forEach((q) => usedIds.add(q.id));
  persistUsedIds(usedIds);

  return selected;
}
