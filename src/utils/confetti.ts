import confetti from 'canvas-confetti';

export function celebrateWin(): void {
  const colors = ['#7056E8', '#FFC83D', '#FF625F', '#35D1C5', '#F7F7FB'];
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }), 400);
  setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors }), 600);
  setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { x: 0.5, y: 0.8 }, colors }), 900);
}
