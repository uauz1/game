import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Gamepad2, Send, Sparkles, Wifi, WifiOff, Zap } from 'lucide-react';
import { createPublicLobbyPresenceChannel, isValidPartyCode, normalizePartyCode, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { readMultiplayerPlayerId, readMultiplayerPlayerName, saveMultiplayerPlayerName, type MultiplayerInput, type MultiplayerTeam } from '../../utils/multiplayerSession';

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
  const [buzzLocked,setBuzzLocked] = useState(false);
  const [buzzWinner,setBuzzWinner] = useState('');
  const [choices,setChoices] = useState<string[]>([]);
  const [choiceMode,setChoiceMode] = useState<'single'|'sequence'|'multi'>('single');
  const [requiredSelections,setRequiredSelections] = useState(0);
  const [sequence,setSequence] = useState<string[]>([]);
  const [team,setTeam] = useState<MultiplayerTeam>(()=>{try{return localStorage.getItem('qaddha.multiplayer-team.v1')==='1'?1:0}catch{return 0}});
  const [ready,setReady] = useState(false);
  const [teamNames,setTeamNames] = useState<[string,string]>(['الفريق 1','الفريق 2']);
  const channelRef = useRef<ReturnType<typeof createPublicLobbyPresenceChannel> | null>(null);
  const playerId = useRef(readMultiplayerPlayerId());
  const joinedAtRef=useRef(Date.now());
  const readyRef=useRef(ready);readyRef.current=ready;
  const teamRef=useRef(team);teamRef.current=team;
  const hostMissingTimer=useRef<number|undefined>(undefined);

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
      const syncHost=()=>{const state=channel.presenceState<{id?:string;name?:string;role?:string}>();const present=Object.values(state).flat();const hostOnline=present.some(member=>member?.role==='host');const otherPlayers=present.filter(member=>member?.role==='player'&&member.id!==playerId.current);const duplicate=otherPlayers.some(member=>member.name?.trim().localeCompare(clean,'ar',{sensitivity:'base'})===0);if(duplicate){setStatus('error');setReady(false);setNotice('الاسم مستخدم داخل الغرفة. اختر اسمًا مختلفًا.');void channel.untrack();return;}if(otherPlayers.length>=11){setStatus('error');setReady(false);setNotice('الغرفة ممتلئة حاليًا.');void channel.untrack();return;}if(hostOnline){if(hostMissingTimer.current)window.clearTimeout(hostMissingTimer.current);hostMissingTimer.current=undefined;setStatus('connected');setNotice(current=>current==='الغرفة غير موجودة أو المضيف غير متصل.'?'':current);}else if(!hostMissingTimer.current){hostMissingTimer.current=window.setTimeout(()=>{setStatus('error');setNotice('الغرفة غير موجودة أو المضيف غير متصل.');hostMissingTimer.current=undefined;},4500);}};
      channel
        .on('presence',{event:'sync'},syncHost)
        .on('presence',{event:'join'},syncHost)
        .on('presence',{event:'leave'},syncHost)
        .on('broadcast',{event:'game'},({payload})=>{
          const incoming = payload as { gameId?: string } | null;
          if (incoming?.gameId) { setGameId(incoming.gameId); setBuzzed(false); setNotice(''); }
        })
        .on('broadcast',{event:'round-reset'},()=>{ setBuzzed(false); setBuzzLocked(false); setBuzzWinner(''); setAnswer(''); setChoices([]); setChoiceMode('single'); setRequiredSelections(0); setSequence([]); setNotice('جولة جديدة'); window.setTimeout(()=>setNotice(''),1400); })
        .on('broadcast',{event:'round-ui'},({payload})=>{const incoming=payload as {gameId?:string;choices?:unknown;mode?:unknown;requiredSelections?:unknown}|null;if(incoming?.gameId)setGameId(incoming.gameId);if(Array.isArray(incoming?.choices))setChoices(incoming.choices.filter((value):value is string=>typeof value==='string').slice(0,12));setChoiceMode(incoming?.mode==='sequence'?'sequence':incoming?.mode==='multi'?'multi':'single');setRequiredSelections(typeof incoming?.requiredSelections==='number'?incoming.requiredSelections:0);setSequence([]);})
        .on('broadcast',{event:'buzz-lock'},({payload})=>{const incoming=payload as {playerId?:string;playerName?:string}|null;setBuzzLocked(true);setBuzzed(incoming?.playerId===playerId.current);setBuzzWinner(incoming?.playerName||'');})
        .on('broadcast',{event:'buzz-unlock'},()=>{setBuzzLocked(false);setBuzzed(false);setBuzzWinner('');})
        .on('broadcast',{event:'team-info'},({payload})=>{const incoming=payload as {teams?:unknown}|null;if(Array.isArray(incoming?.teams)&&incoming.teams.length>=2){const names=incoming.teams.filter((value):value is string=>typeof value==='string').slice(0,2);if(names.length===2)setTeamNames([names[0],names[1]]);}})
        .on('broadcast',{event:'team-assign'},({payload})=>{const incoming=payload as {assignments?:Record<string,unknown>}|null;const value=incoming?.assignments?.[playerId.current];if(value===0||value===1){const next=value as MultiplayerTeam;teamRef.current=next;readyRef.current=false;setTeam(next);setReady(false);try{localStorage.setItem('qaddha.multiplayer-team.v1',String(next));}catch{/* optional */}void channel.track({id:playerId.current,name:clean,team:next,ready:false,joinedAt:joinedAtRef.current,role:'player'});setNotice('تم توزيع الفرق · اضغط جاهز');}})
        .on('broadcast',{event:'player-remove'},({payload})=>{const incoming=payload as {playerId?:string}|null;if(incoming?.playerId===playerId.current){setStatus('error');setReady(false);setNotice('أزالك المضيف من الغرفة.');void channel.untrack();}})
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
            setStatus('connecting');
            const presence={id:playerId.current,name:clean,team:teamRef.current,ready:readyRef.current,joinedAt:joinedAtRef.current,role:'player'} as const;void channel.track(presence);
          } else if(next==='CHANNEL_ERROR'||next==='TIMED_OUT'){
            setStatus('error'); setNotice('تعذر الاتصال بالغرفة.');
          }
        });
    } catch { setStatus('error'); setNotice('تعذر الاتصال بالغرفة.'); }
  };

  useEffect(()=>()=>{if(hostMissingTimer.current)window.clearTimeout(hostMissingTimer.current);void disconnect();},[]);
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
    if(!channel||status!=='connected'||!readyRef.current)return;
    const payload: MultiplayerInput={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,playerId:playerId.current,playerName:name,team,kind,value:value?.trim(),sentAt:Date.now()};
    void channel.send({type:'broadcast',event:'player-input',payload});
    if(kind==='buzz'){setBuzzed(true);setNotice('تم تسجيل ضغطتك ⚡');}
    else {setAnswer('');setNotice('وصلت إجابتك ✅');}
    window.setTimeout(()=>setNotice(''),1500);
  };

  const changeTeam=(next:MultiplayerTeam)=>{teamRef.current=next;readyRef.current=false;setTeam(next);setReady(false);try{localStorage.setItem('qaddha.multiplayer-team.v1',String(next));}catch{/* optional */}const channel=channelRef.current;if(channel){void channel.track({id:playerId.current,name,team:next,ready:false,joinedAt:joinedAtRef.current,role:'player'});}setBuzzed(false);};
  const toggleReady=()=>{const next=!readyRef.current;readyRef.current=next;setReady(next);const channel=channelRef.current;if(channel){void channel.track({id:playerId.current,name,team:teamRef.current,ready:next,joinedAt:joinedAtRef.current,role:'player'});}setNotice(next?'جاهز! انتظر المضيف':'تم إلغاء الجاهزية');window.setTimeout(()=>setNotice(''),1400);};

  if(!name) return <main className="mp-player" dir="rtl"><section className="mp-join-card"><div className="mp-logo"><Gamepad2/></div><span>قدّها أونلاين</span><h1>ادخل الغرفة</h1><p>الكود <b>{roomCode}</b></p><form onSubmit={join}><input autoFocus maxLength={18} placeholder="اسمك" value={draftName} onChange={e=>setDraftName(e.target.value)}/><button className="primary" type="submit"><Sparkles/> دخول</button></form></section></main>;

  return <main className="mp-player" dir="rtl"><section className="mp-controller">
    <header><div><span>{status==='connected'?<Wifi/>:<WifiOff/>}{status==='connected'?'متصل بالغرفة':status==='error'?'الاتصال متوقف':'جاري الاتصال'}</span><strong>{roomCode}</strong></div><div className="mp-score"><small>نقاطك</small><b>{score.score}</b></div></header>
    <div className="mp-team-picker" role="group" aria-label="اختيار الفريق"><button className={team===0?'active':''} aria-pressed={team===0} onClick={()=>changeTeam(0)}>{teamNames[0]}</button><button className={team===1?'active':''} aria-pressed={team===1} onClick={()=>changeTeam(1)}>{teamNames[1]}</button></div>
    <button className={`mp-ready-toggle ${ready?'ready':''}`} disabled={status!=='connected'} onClick={toggleReady}><CheckCircle2/><b>{ready?'جاهز ✓':'أنا جاهز'}</b><span>{ready?'المضيف شايف جاهزيتك':'اختر فريقك ثم أكد جاهزيتك'}</span></button>
    <div className="mp-game-now"><small>اللعبة الحالية</small><h1>{gameId?GAME_NAMES[gameId]||'اللعبة الحالية':'بانتظار المضيف…'}</h1><p>{!ready?'اضغط «أنا جاهز» قبل اللعب.':gameId?'اضغط بسرعة أو أرسل إجابتك من هنا.':'أنت جاهز، المضيف بيبدأ اللعبة.'}</p></div>
    <button className={`mp-buzzer ${buzzed?'buzzed':''}`} disabled={status!=='connected'||!ready||buzzLocked||gameId!=='fast'} onClick={()=>sendInput('buzz')}><Zap/><b>{buzzed?'تم!':'أنا أول!'}</b><span>{gameId!=='fast'?'يتفعل في مين أسرع؟':buzzLocked?(buzzed?'أنت ضغطت أول':`${buzzWinner||'لاعب'} ضغط أول`):'زر السرعة'}</span></button>
    {choices.length>0&&choiceMode==='single'&&<div className="mp-choice-grid">{choices.map((choice,index)=><button key={`${choice}-${index}`} disabled={status!=='connected'||!ready} onClick={()=>sendInput('answer',String(index+1))}><span>{index+1}</span><b>{choice}</b></button>)}</div>}
    {choices.length>0&&(choiceMode==='sequence'||choiceMode==='multi')&&<><div className="mp-sequence-preview">{Array.from({length:requiredSelections||choices.length}).map((_,index)=><span key={index}>{sequence[index]||'؟'}</span>)}</div><div className="mp-choice-grid">{choices.map((choice,index)=><button key={`${choice}-${index}`} disabled={status!=='connected'||sequence.includes(choice)||sequence.length>=(requiredSelections||choices.length)} onClick={()=>setSequence(current=>[...current,choice])}><span>{index+1}</span><b>{choice}</b></button>)}</div><div className="mp-sequence-actions"><button type="button" onClick={()=>setSequence([])} disabled={!sequence.length}>مسح الترتيب</button><button type="button" className="primary" disabled={status!=='connected'||sequence.length!==(requiredSelections||choices.length)} onClick={()=>{sendInput('answer',sequence.join('\u001f'));setSequence([]);}}>إرسال الترتيب</button></div></>}
    {choiceMode==='single'&&<form className="mp-answer" onSubmit={event=>{event.preventDefault(); if(answer.trim())sendInput('answer',answer);}}><label>إجابتك<input maxLength={120} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={choices.length?'أو اكتب الإجابة هنا…':'اكتب الإجابة هنا…'}/></label><button disabled={!answer.trim()||status!=='connected'||!ready}><Send/> إرسال</button></form>}
    {status==='error'&&<button className="mp-retry" onClick={()=>void connect(name)}><Wifi/> إعادة الاتصال</button>}
    {notice&&<div className="mp-notice"><CheckCircle2/>{notice}</div>}
    <footer><span>{name}</span><small>الغرفة {roomCode}</small></footer>
  </section></main>;
}
