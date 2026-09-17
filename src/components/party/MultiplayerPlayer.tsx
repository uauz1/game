import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Gamepad2, Send, Sparkles, Wifi, WifiOff, Zap } from 'lucide-react';
import { createPublicLobbyPresenceChannel, isValidPartyCode, normalizePartyCode, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { readMultiplayerPlayerName, saveMultiplayerPlayerName, type MultiplayerInput, type MultiplayerTeam } from '../../utils/multiplayerSession';

type Status = 'idle' | 'connecting' | 'connected' | 'error';
type ScoreState = { score: number; delta?: number };

const GAME_NAMES: Record<string,string> = {
  teams:'قدّها فرق',letters:'حروف مع عزيز',who:'من أنا؟',photo:'تحدي الصور',words:'بنك الكلمات',fast:'مين أسرع؟',character:'خمن الشخصية',riddles:'فوازير',family:'تحدي العائلة',connection:'وش الرابط؟',auction:'المزاد',order:'رتّبها',memory:'ذاكرة البرق',missing:'وش الناقص؟',acting:'مثّلها',secret:'الكلمة السرّية',pressure:'تحت الضغط',intruder:'الدخيل'
};

export default function MultiplayerPlayer({ code }: { code: string }) {
  const roomCode = useMemo(() => normalizePartyCode(code), [code]);
  const [name,setName] = useState(readMultiplayerPlayerName);
  const [draftName,setDraftName] = useState(readMultiplayerPlayerName);
  const [status,setStatus] = useState<Status>('idle');
  const [gameId,setGameId] = useState('');
  const [answer,setAnswer] = useState('');
  const [notice,setNotice] = useState('');
  const [score,setScore] = useState<ScoreState>({ score: 0 });
  const [buzzed,setBuzzed] = useState(false);
  const [choices,setChoices] = useState<string[]>([]);
  const [choiceMode,setChoiceMode] = useState<'single'|'sequence'|'multi'>('single');
  const [requiredSelections,setRequiredSelections] = useState(0);
  const [sequence,setSequence] = useState<string[]>([]);
  const [team,setTeam] = useState<MultiplayerTeam>(()=>{try{return localStorage.getItem('qaddha.multiplayer-team.v1')==='1'?1:0}catch{return 0}});
  const [teamNames,setTeamNames] = useState<[string,string]>(['الفريق 1','الفريق 2']);
  const channelRef = useRef<ReturnType<typeof createPublicLobbyPresenceChannel> | null>(null);
  const playerId = useRef(`p-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`);

  const disconnect = async () => {
    if (channelRef.current) { await channelRef.current.untrack().catch(()=>undefined); await removeRealtimeChannel(channelRef.current); }
    channelRef.current = null;
  };

  const connect = async (playerName: string) => {
    if (!isValidPartyCode(roomCode)) { setStatus('error'); setNotice('كود الغرفة غير صحيح.'); return; }
    await disconnect();
    setStatus('connecting');
    const clean = playerName.trim().slice(0,18);
    if (!clean) return;
    try {
      const channel = createPublicLobbyPresenceChannel(roomCode, playerId.current);
      channelRef.current = channel;
      channel
        .on('broadcast',{event:'game'},({payload})=>{
          const incoming = payload as { gameId?: string } | null;
          if (incoming?.gameId) { setGameId(incoming.gameId); setBuzzed(false); setNotice(''); }
        })
        .on('broadcast',{event:'round-reset'},()=>{ setBuzzed(false); setAnswer(''); setChoices([]); setChoiceMode('single'); setRequiredSelections(0); setSequence([]); setNotice('جولة جديدة'); window.setTimeout(()=>setNotice(''),1400); })
        .on('broadcast',{event:'round-ui'},({payload})=>{const incoming=payload as {gameId?:string;choices?:unknown;mode?:unknown;requiredSelections?:unknown}|null;if(incoming?.gameId)setGameId(incoming.gameId);if(Array.isArray(incoming?.choices))setChoices(incoming.choices.filter((value):value is string=>typeof value==='string').slice(0,12));setChoiceMode(incoming?.mode==='sequence'?'sequence':incoming?.mode==='multi'?'multi':'single');setRequiredSelections(typeof incoming?.requiredSelections==='number'?incoming.requiredSelections:0);setSequence([]);})
        .on('broadcast',{event:'team-info'},({payload})=>{const incoming=payload as {teams?:unknown}|null;if(Array.isArray(incoming?.teams)&&incoming.teams.length>=2){const names=incoming.teams.filter((value):value is string=>typeof value==='string').slice(0,2);if(names.length===2)setTeamNames([names[0],names[1]]);}})
        .on('broadcast',{event:'score'},({payload})=>{
          const incoming = payload as { playerId?: string; score?: number; delta?: number } | null;
          if (incoming?.playerId===playerId.current && typeof incoming.score==='number') {
            setScore({score:incoming.score,delta:incoming.delta});
            setNotice(incoming.delta && incoming.delta>0 ? `+${incoming.delta} نقطة` : `${incoming.delta || 0} نقطة`);
            window.setTimeout(()=>setNotice(''),1700);
          }
        })
        .on('broadcast',{event:'host-message'},({payload})=>{
          const incoming = payload as { text?: string } | null;
          if (incoming?.text) setNotice(incoming.text.slice(0,80));
        })
        .subscribe(next=>{
          if(next==='SUBSCRIBED'){
            setStatus('connected');
            const presence={id:playerId.current,name:clean,team,joinedAt:Date.now(),role:'player'} as const;await channel.track(presence);void channel.send({type:'broadcast',event:'hello',payload:presence});
          } else if(next==='CHANNEL_ERROR'||next==='TIMED_OUT'){
            setStatus('error'); setNotice('تعذر الاتصال بالغرفة.');
          }
        });
    } catch { setStatus('error'); setNotice('تعذر الاتصال بالغرفة.'); }
  };

  useEffect(()=>()=>{ void disconnect(); },[]);
  useEffect(()=>{ if(name) void connect(name); },[]);
  useEffect(()=>{if(!name)return;const retry=()=>{if(navigator.onLine&&status==='error')void connect(name);};window.addEventListener('online',retry);const visible=()=>{if(document.visibilityState==='visible')retry();};document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('online',retry);document.removeEventListener('visibilitychange',visible);};},[name,status]);

  const join = (event:FormEvent) => {
    event.preventDefault();
    const clean=draftName.trim().slice(0,18);
    if(!clean)return;
    saveMultiplayerPlayerName(clean); setName(clean); void connect(clean);
  };
  const sendInput = (kind: MultiplayerInput['kind'], value?: string) => {
    const channel=channelRef.current;
    if(!channel||status!=='connected')return;
    const payload: MultiplayerInput={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,playerId:playerId.current,playerName:name,team,kind,value:value?.trim(),sentAt:Date.now()};
    void channel.send({type:'broadcast',event:'player-input',payload});
    if(kind==='buzz'){setBuzzed(true);setNotice('تم تسجيل ضغطتك ⚡');}
    else {setAnswer('');setNotice('وصلت إجابتك ✅');}
    window.setTimeout(()=>setNotice(''),1500);
  };

  const changeTeam=(next:MultiplayerTeam)=>{setTeam(next);try{localStorage.setItem('qaddha.multiplayer-team.v1',String(next));}catch{/* optional */}const channel=channelRef.current;if(channel){void channel.track({id:playerId.current,name,team:next,joinedAt:Date.now(),role:'player'});void channel.send({type:'broadcast',event:'team-change',payload:{id:playerId.current,name,team:next}});}setBuzzed(false);};

  if(!name) return <main className="mp-player" dir="rtl"><section className="mp-join-card"><div className="mp-logo"><Gamepad2/></div><span>قدّها أونلاين</span><h1>ادخل الغرفة</h1><p>الكود <b>{roomCode}</b></p><form onSubmit={join}><input autoFocus maxLength={18} placeholder="اسمك" value={draftName} onChange={e=>setDraftName(e.target.value)}/><button className="primary" type="submit"><Sparkles/> دخول</button></form></section></main>;

  return <main className="mp-player" dir="rtl"><section className="mp-controller">
    <header><div><span>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالغرفة':status==='error'?'الاتصال متوقف':'جاري الاتصال'}</span><strong>{roomCode}</strong></div><div className="mp-score"><small>نقاطك</small><b>{score.score}</b></div></header>
    <div className="mp-team-picker" role="group" aria-label="اختيار الفريق"><button className={team===0?'active':''} aria-pressed={team===0} onClick={()=>changeTeam(0)}>{teamNames[0]}</button><button className={team===1?'active':''} aria-pressed={team===1} onClick={()=>changeTeam(1)}>{teamNames[1]}</button></div>
    <div className="mp-game-now"><small>اللعبة الحالية</small><h1>{gameId?GAME_NAMES[gameId]||'اللعبة الحالية':'بانتظار المضيف…'}</h1><p>{gameId?'اضغط بسرعة أو أرسل إجابتك من هنا.':'خلك جاهز، المضيف بيبدأ اللعبة.'}</p></div>
    <button className={`mp-buzzer ${buzzed?'buzzed':''}`} disabled={status!=='connected'||buzzed} onClick={()=>sendInput('buzz')}><Zap/><b>{buzzed?'تم!':'أنا أول!'}</b><span>زر السرعة</span></button>
    {choices.length>0&&choiceMode==='single'&&<div className="mp-choice-grid">{choices.map((choice,index)=><button key={`${choice}-${index}`} disabled={status!=='connected'} onClick={()=>sendInput('answer',String(index+1))}><span>{index+1}</span><b>{choice}</b></button>)}</div>}
    {choices.length>0&&(choiceMode==='sequence'||choiceMode==='multi')&&<><div className="mp-sequence-preview">{Array.from({length:requiredSelections||choices.length}).map((_,index)=><span key={index}>{sequence[index]||'؟'}</span>)}</div><div className="mp-choice-grid">{choices.map((choice,index)=><button key={`${choice}-${index}`} disabled={status!=='connected'||sequence.includes(choice)||sequence.length>=(requiredSelections||choices.length)} onClick={()=>setSequence(current=>[...current,choice])}><span>{index+1}</span><b>{choice}</b></button>)}</div><div className="mp-sequence-actions"><button type="button" onClick={()=>setSequence([])} disabled={!sequence.length}>مسح الترتيب</button><button type="button" className="primary" disabled={status!=='connected'||sequence.length!==(requiredSelections||choices.length)} onClick={()=>{sendInput('answer',sequence.join('\u001f'));setSequence([]);}}>إرسال الترتيب</button></div></>}
    {choiceMode==='single'&&<form className="mp-answer" onSubmit={event=>{event.preventDefault(); if(answer.trim())sendInput('answer',answer);}}><label>إجابتك<input maxLength={120} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={choices.length?'أو اكتب الإجابة هنا…':'اكتب الإجابة هنا…'}/></label><button disabled={!answer.trim()||status!=='connected'}><Send/> إرسال</button></form>}
    {status==='error'&&<button className="mp-retry" onClick={()=>void connect(name)}><Wifi/> إعادة الاتصال</button>}
    {notice&&<div className="mp-notice"><CheckCircle2/>{notice}</div>}
    <footer><span>{name}</span><small>الغرفة {roomCode}</small></footer>
  </section></main>;
}
