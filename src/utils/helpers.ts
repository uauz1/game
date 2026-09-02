export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-EG').format(n);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function calculatePoints(
  difficulty: string,
  remainingTime: number,
  totalTime: number,
  doubled: boolean
): number {
  const basePoints: Record<string, number> = {
    easy: 100,
    medium: 150,
    hard: 200,
  };
  const base = basePoints[difficulty] ?? 100;
  let timeBonus = 0;
  if (totalTime > 0 && remainingTime > 0) {
    timeBonus = Math.round((remainingTime / totalTime) * 50);
  }
  const total = base + timeBonus;
  return doubled ? total * 2 : total;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getBestCategory(categoryStats: Record<string, { correct: number; wrong: number }>): string | null {
  let best: string | null = null;
  let bestRate = -1;
  for (const [cat, stats] of Object.entries(categoryStats)) {
    const total = stats.correct + stats.wrong;
    if (total === 0) continue;
    const rate = stats.correct / total;
    if (rate > bestRate) {
      bestRate = rate;
      best = cat;
    }
  }
  return best;
}
