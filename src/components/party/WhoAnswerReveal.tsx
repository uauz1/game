import { useEffect, useState } from 'react';
import { Check, ImageOff, X } from 'lucide-react';

type PortraitCard = { answer: string; category: string };
type Portrait = { src: string; sourceUrl: string };

const SKIP_IMAGE_CATEGORY = /خيالية|رسوم|أفلام وروايات/i;

async function fetchWikipediaPortrait(card: PortraitCard): Promise<Portrait | null> {
  if (SKIP_IMAGE_CATEGORY.test(card.category)) return null;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: card.answer,
    gsrnamespace: '0',
    gsrlimit: '1',
    prop: 'pageimages|info',
    pithumbsize: '720',
    inprop: 'url',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`https://ar.wikipedia.org/w/api.php?${params.toString()}`, { mode: 'cors' });
  if (!response.ok) return null;
  const data = await response.json() as { query?: { pages?: Record<string, { thumbnail?: { source?: string }; fullurl?: string }> } };
  const page = data.query?.pages ? Object.values(data.query.pages)[0] : undefined;
  const src = page?.thumbnail?.source;
  const sourceUrl = page?.fullurl;
  if (!src || !sourceUrl || !src.startsWith('https://')) return null;
  return { src, sourceUrl };
}

export default function WhoAnswerReveal({ card, teamName, onClose }: { card: PortraitCard; teamName: string; onClose: () => void }) {
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setPortrait(null);
    setLoading(true);
    void fetchWikipediaPortrait(card)
      .then(result => { if (active) setPortrait(result); })
      .catch(() => { if (active) setPortrait(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [card]);

  return <div className="who-answer-reveal" role="dialog" aria-modal="true" aria-label={`الإجابة الصحيحة ${card.answer}`}>
    <div className="who-answer-reveal-card">
      <button className="who-answer-close" onClick={onClose} aria-label="إغلاق"><X/></button>
      <div className="who-answer-badge"><Check/> إجابة صحيحة · {teamName}</div>
      <div className="who-answer-portrait">
        {portrait ? <img src={portrait.src} alt={`صورة ${card.answer}`} loading="eager" referrerPolicy="no-referrer"/> : loading ? <div className="who-answer-image-loading"><span/></div> : <div className="who-answer-image-fallback"><ImageOff/><small>لا توجد صورة حقيقية مناسبة من المصدر المفتوح</small></div>}
      </div>
      <small className="who-answer-category">{card.category}</small>
      <h2>{card.answer}</h2>
      {portrait ? <a href={portrait.sourceUrl} target="_blank" rel="noreferrer">الصورة من ويكيبيديا / ويكيميديا</a> : <span className="who-answer-source-note">نعرض صورًا حقيقية من المصادر المفتوحة فقط، ولا نولّد صورة بديلة.</span>}
    </div>
  </div>;
}
