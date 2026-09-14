import { publishSessionGameResult, readPendingSessionGame } from './sessionBridge';

type ParsedScore = { teamA: string; teamB: string; scoreA: number; scoreB: number };

let lastPublished = '';
let queued = false;

function parseNumber(value: string | null | undefined) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseGenericResult(): ParsedScore | null {
  const rows = Array.from(document.querySelectorAll<HTMLElement>('.new-result .new-result-scores > span'));
  if (rows.length < 2) return null;
  const read = (row: HTMLElement) => ({
    name: row.querySelector('b')?.textContent?.trim() || '',
    score: parseNumber(row.querySelector('strong')?.textContent),
  });
  const first = read(rows[0]);
  const second = read(rows[1]);
  if (!first.name || !second.name) return null;
  return { teamA: first.name, teamB: second.name, scoreA: first.score, scoreB: second.score };
}

function parseHuroofResult(): ParsedScore | null {
  const result = document.querySelector<HTMLElement>('.huroof-result.match-winner');
  if (!result) return null;
  const rows = Array.from(result.querySelectorAll<HTMLElement>('.result-summary > span'));
  if (rows.length < 3) return null;
  const firstName = rows[0].querySelector('small')?.textContent?.trim() || '';
  const secondName = rows[2].querySelector('small')?.textContent?.trim() || '';
  if (!firstName || !secondName) return null;
  return {
    teamA: firstName,
    teamB: secondName,
    scoreA: parseNumber(rows[0].childNodes[0]?.textContent),
    scoreB: parseNumber(rows[2].childNodes[0]?.textContent),
  };
}

function captureResult() {
  queued = false;
  const pending = readPendingSessionGame();
  if (!pending) return;
  const parsed = parseGenericResult() || parseHuroofResult();
  if (!parsed) return;

  const scoreByName = new Map([
    [parsed.teamA.trim(), parsed.scoreA],
    [parsed.teamB.trim(), parsed.scoreB],
  ]);
  const scoreA = scoreByName.get(pending.teamA.trim()) ?? parsed.scoreA;
  const scoreB = scoreByName.get(pending.teamB.trim()) ?? parsed.scoreB;
  const signature = `${pending.gameId}|${pending.launchedAt}|${scoreA}|${scoreB}`;
  if (signature === lastPublished) return;

  const winner = scoreA === scoreB ? 'تعادل' : scoreA > scoreB ? pending.teamA : pending.teamB;
  if (publishSessionGameResult({
    gameId: pending.gameId,
    teamA: pending.teamA,
    teamB: pending.teamB,
    scoreA,
    scoreB,
    winner,
    signature,
  })) {
    lastPublished = signature;
  }
}

function scheduleCapture() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(captureResult);
}

if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
  const start = () => {
    const observer = new MutationObserver(scheduleCapture);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    scheduleCapture();
    window.addEventListener('pageshow', scheduleCapture);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
