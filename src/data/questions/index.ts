import type { Question, Difficulty } from '@/types';
import { generalQuestions } from './general';
import { islamicQuestions } from './islamic';
import { sportsQuestions, footballQuestions } from './sports';
import { historyQuestions, geographyQuestions } from './history_geography';
import { scienceQuestions, techQuestions } from './science_tech';
import { moviesQuestions, gamesQuestions } from './movies_games';
import { puzzlesQuestions, animalsQuestions, famousQuestions } from './puzzles_animals_famous';
import { saudiQuestions, worldQuestions, trueFalseQuestions } from './saudi_world_truefalse';

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
];

export const QUESTIONS_BY_CATEGORY: Record<string, Question[]> = {
  general: generalQuestions,
  islamic: islamicQuestions,
  sports: sportsQuestions,
  football: footballQuestions,
  history: historyQuestions,
  geography: geographyQuestions,
  science: scienceQuestions,
  tech: techQuestions,
  movies: moviesQuestions,
  games: gamesQuestions,
  puzzles: puzzlesQuestions,
  animals: animalsQuestions,
  famous: famousQuestions,
  saudi: saudiQuestions,
  world: worldQuestions,
  truefalse: trueFalseQuestions,
};

export function getQuestions(
  categories: string[],
  difficulty: Difficulty,
  count: number,
  mode: string
): Question[] {
  let pool: Question[] = [];

  if (mode === 'truefalse') {
    pool = [...trueFalseQuestions];
  } else if (mode === 'multiple') {
    pool = ALL_QUESTIONS.filter((q) => q.type === 'multiple');
  } else if (categories.length === 0) {
    pool = [...ALL_QUESTIONS];
  } else {
    categories.forEach((cat) => {
      if (QUESTIONS_BY_CATEGORY[cat]) {
        pool = [...pool, ...QUESTIONS_BY_CATEGORY[cat]];
      }
    });
  }

  if (difficulty !== 'mixed') {
    const filtered = pool.filter((q) => q.difficulty === difficulty);
    if (filtered.length >= count) {
      pool = filtered;
    }
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
