import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DEFAULT_QADDHA_CONFIG, QaddhaRemoteConfig, subscribeQaddhaRemoteConfig } from '../../utils/adminConfig';

const GAME_LABELS: Record<string, string[]> = {
  teams: ['قدّها فرق', 'فريق ضد فريق', 'ابدأ تحدّي الفرق'],
  letters: ['حروف مع عزيز'],
  who: ['من أنا؟'],
  photo: ['تحدي الصور'],
  words: ['بنك الكلمات'],
  fast: ['مين أسرع؟', 'حماس سريع'],
  character: ['خمن الشخصية'],
  riddles: ['فوازير'],
  family: ['تحدي العائلة', 'جو عائلي'],
  connection: ['وش الرابط؟', 'تحدي ذكاء'],
  auction: ['المزاد'],
  order: ['رتّبها'],
  memory: ['ذاكرة البرق'],
  missing: ['وش الناقص؟'],
  acting: ['مثّلها'],
  secret: ['الكلمة السرّية'],
};

export default function QaddhaRemoteControl({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<QaddhaRemoteConfig>(DEFAULT_QADDHA_CONFIG);
  const [blockedMessage, setBlockedMessage] = useState('');

  useEffect(() => subscribeQaddhaRemoteConfig(setConfig), []);

  const disabledGames = useMemo(
    () => Object.keys(GAME_LABELS).filter((id) => !config.enabled_games.includes(id)),
    [config.enabled_games],
  );

  useEffect(() => {
    if (!disabledGames.length && config.sessions_enabled) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const clickable = target?.closest('button, a') as HTMLElement | null;
      if (!clickable) return;
      const text = (clickable.textContent || '').replace(/\s+/g, ' ').trim();

      if (!config.sessions_enabled && ['رتّب لنا جلسة', 'رتّب كل الجلسة', 'خلّ قدّها يرتب الجلسة'].some((label) => text.includes(label))) {
        event.preventDefault();
        event.stopPropagation();
        setBlockedMessage('الجلسات الجماعية موقوفة مؤقتًا من لوحة التحكم.');
        window.setTimeout(() => setBlockedMessage(''), 3200);
        return;
      }

      const blocked = disabledGames.find((id) => GAME_LABELS[id].some((label) => text.includes(label)));
      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
        setBlockedMessage(`${GAME_LABELS[blocked][0]} موقوفة مؤقتًا من لوحة التحكم.`);
        window.setTimeout(() => setBlockedMessage(''), 3200);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [disabledGames, config.sessions_enabled]);

  const hiddenCss = useMemo(() => {
    const selectors = disabledGames.map((id) => `.game-card-shell:has(.game-${id})`).join(',');
    const sessionSelectors = config.sessions_enabled ? '' : '.smart-session-cta,.quick-session';
    const joined = [selectors, sessionSelectors].filter(Boolean).join(',');
    return joined ? `${joined}{display:none!important}` : '';
  }, [disabledGames, config.sessions_enabled]);

  if (config.maintenance_mode) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070707] text-white grid place-items-center p-6">
        <section className="w-full max-w-xl rounded-[30px] border border-amber-400/20 bg-[#111] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-3xl">✦</div>
          <h1 className="text-3xl font-black text-amber-300">قدّها</h1>
          <p className="mt-4 leading-8 text-zinc-300">{config.maintenance_message}</p>
        </section>
      </main>
    );
  }

  if (!config.content_enabled) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070707] text-white grid place-items-center p-6">
        <section className="w-full max-w-xl rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
          <h1 className="text-3xl font-black text-amber-300">قدّها</h1>
          <p className="mt-4 leading-8 text-zinc-300">المحتوى موقوف مؤقتًا من لوحة التحكم.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <style>{hiddenCss}</style>
      {config.announcement_enabled && config.announcement_text.trim() && (
        <div dir="rtl" className="sticky top-0 z-[90] border-b border-amber-300/30 bg-amber-400 px-4 py-2 text-center text-sm font-black text-black shadow-lg">
          {config.announcement_text}
        </div>
      )}
      {children}
      {blockedMessage && (
        <div dir="rtl" className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-2xl border border-amber-400/30 bg-black/95 px-5 py-3 text-sm font-bold text-amber-200 shadow-2xl">
          {blockedMessage}
        </div>
      )}
    </>
  );
}
