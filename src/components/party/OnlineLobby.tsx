import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, Gamepad2, LogIn, Radio, RefreshCw, Send, ShieldCheck, Swords, UserRound, Users, Wifi, WifiOff, Zap } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { speedQuestions } from '../../data/newPartyGames';
import {
  closeOnlineRoomChannel,
  createPrivateOnlineRoom,
  findMyActiveOnlineRoom,
  findQuickOnlineMatch,
  getMyOnlineProfile,
  getOnlineRoomSnapshot,
  joinPrivateOnlineRoom,
  leaveOnlineRoom,
  markOnlineRoomStatus,
  openOnlineRoomChannel,
  saveOnlineGameState,
  recordOnlineDuelResult,
  type OnlineRoomSnapshot,
} from '../../utils/onlinePlay';

type DuelState = {
  round: number;
  questionIndex: number;
  scores: Record<string, number>;
  buzzUserId: string | null;
  reveal: boolean;
  feedback: string;
  answer: string;
  finished: boolean;
};

const MAX_ROUNDS = 7;

function normalize(value:string){
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ـ/g,'').replace(/[^\u0621-\u063a\u0641-\u064aA-Za-z0-9]/g,'');
}

function seedIndex(roomId:string, round=0){
  let hash=0;
  for(const ch of roomId) hash=(hash*31+ch.charCodeAt(0))>>>0;
  return (hash + round*17) % Math.max(1,speedQuestions.length);
}

function readDuel(snapshot:OnlineRoomSnapshot|null):DuelState|null{
  const raw=snapshot?.gameState?.state;
  if(!raw||typeof raw!=='object'||typeof raw.round!=='number'||typeof raw.questionIndex!=='number')return null;
  return {
    round:raw.round,
    questionIndex:raw.questionIndex,
    scores:raw.scores&&typeof raw.scores==='object'?raw.scores as Record<string,number>:{},
    buzzUserId:typeof raw.buzzUserId==='string'?raw.buzzUserId:null,
    reveal:Boolean(raw.reveal),
    feedback:typeof raw.feedback==='string'?raw.feedback:'',
    answer:typeof raw.answer==='string'?raw.answer:'',
    finished:Boolean(raw.finished),
  };
}

export default function OnlineLobby({ onBack, onRequireAuth, initialCode = '' }: { onBack:()=>void; onRequireAuth:()=>void; initialCode?:string }) {
  const auth=useAuth();
  const [profile,setProfile]=useState<{display_name:string}|null>(null);
  const [snapshot,setSnapshot]=useState<OnlineRoomSnapshot|null>(null);
  const [code,setCode]=useState(initialCode.trim().toUpperCase().slice(0,6));
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [onlineIds,setOnlineIds]=useState<string[]>([]);
  const [connection,setConnection]=useState('CLOSED');
  const [answer,setAnswer]=useState('');
  const [copied,setCopied]=useState(false);
  const channelRef=useRef<RealtimeChannel|null>(null);
  const snapshotRef=useRef<OnlineRoomSnapshot|null>(null);
  const duelRef=useRef<DuelState|null>(null);
  snapshotRef.current=snapshot;
  duelRef.current=readDuel(snapshot);

  const userId=auth.session?.user.id||'';
  const isHost=Boolean(snapshot&&userId&&snapshot.room.host_user_id===userId);
  const me=snapshot?.members.find(member=>member.user_id===userId);
  const opponent=snapshot?.members.find(member=>member.user_id!==userId);
  const duel=readDuel(snapshot);
  const question=duel?speedQuestions[duel.questionIndex]:null;

  const refresh=useCallback(async(roomId:string)=>{
    try{const next=await getOnlineRoomSnapshot(roomId);setSnapshot(next);setNotice('');}
    catch{setNotice('تعذر تحديث الغرفة. نحاول إعادة الاتصال تلقائيًا.');}
  },[]);

  const persist=useCallback(async(next:DuelState)=>{
    const room=snapshotRef.current?.room;
    if(!room||room.host_user_id!==userId)return;
    await saveOnlineGameState(room.id,next.finished?'finished':'playing',next,Date.now());
    if(room.status!=='playing'&&!next.finished)await markOnlineRoomStatus(room.id,'playing');
    if(next.finished&&room.status!=='finished')await markOnlineRoomStatus(room.id,'finished');
    await refresh(room.id);
  },[refresh,userId]);

  useEffect(()=>{
    if(!auth.session)return;
    let active=true;
    void (async()=>{
      try{
        const p=await getMyOnlineProfile();
        if(!active)return;
        setProfile({display_name:p.display_name});
        if(initialCode){
          try{
            const joined=await joinPrivateOnlineRoom(initialCode);
            if(active)await refresh(joined.room_id);
            return;
          }catch{
            if(active)setNotice('تعذر فتح الغرفة المطلوبة. تقدر تدخل بكود آخر أو ترجع لرومك السابق.');
          }
        }
        const resume=await findMyActiveOnlineRoom();
        if(active&&resume)setSnapshot(resume);
      }catch{if(active)setNotice('تعذر تحميل حساب الأونلاين الآن.');}
    })();
    return()=>{active=false;};
  },[auth.session?.user.id]);

  useEffect(()=>{
    const roomId=snapshot?.room.id;
    if(!roomId||!userId)return;
    let disposed=false;
    void (async()=>{
      await closeOnlineRoomChannel(channelRef.current);
      if(disposed)return;
      const channel=await openOnlineRoomChannel(roomId,userId,async(_event,payload)=>{
        const current=snapshotRef.current;
        const state=duelRef.current;
        if(!current||current.room.host_user_id!==userId||!state||state.finished)return;
        if(payload.kind==='buzz'&&typeof payload.userId==='string'&&payload.round===state.round&&!state.buzzUserId&&!state.reveal){
          await persist({...state,buzzUserId:payload.userId,feedback:`${String(payload.displayName||'لاعب')} ضغط أول`});
        }
        if(payload.kind==='answer'&&typeof payload.userId==='string'&&typeof payload.value==='string'&&payload.userId===state.buzzUserId&&payload.round===state.round){
          const currentQuestion=speedQuestions[state.questionIndex];
          const correct=normalize(payload.value)===normalize(currentQuestion?.[1]||'');
          if(correct){
            const scores={...state.scores,[payload.userId]:(state.scores[payload.userId]||0)+100};
            await persist({...state,scores,reveal:true,feedback:`إجابة صحيحة · +100`,answer:currentQuestion?.[1]||''});
          }else{
            await persist({...state,buzzUserId:null,reveal:false,feedback:'إجابة غير صحيحة · الفرصة مفتوحة',answer:''});
          }
        }
      },setOnlineIds,setConnection);
      if(!disposed)channelRef.current=channel;
    })();
    const timer=window.setInterval(()=>void refresh(roomId),1400);
    return()=>{disposed=true;window.clearInterval(timer);void closeOnlineRoomChannel(channelRef.current);channelRef.current=null;};
  },[snapshot?.room.id,userId,persist,refresh]);

  useEffect(()=>{
    if(snapshot?.room.status!=='cancelled')return;
    void closeOnlineRoomChannel(channelRef.current);
    channelRef.current=null;
    setSnapshot(null);
    setOnlineIds([]);
    setNotice('تم إنهاء الغرفة من الإدارة. تقدر تبدأ غرفة جديدة الآن.');
  },[snapshot?.room.status]);

  useEffect(()=>{
    if(!snapshot||!isHost||snapshot.members.length<2||duel)return;
    const scores=Object.fromEntries(snapshot.members.map(member=>[member.user_id,0]));
    void persist({round:0,questionIndex:seedIndex(snapshot.room.id,0),scores,buzzUserId:null,reveal:false,feedback:'بدأت المواجهة',answer:'',finished:false});
  },[snapshot?.members.length,isHost,duel?.round]);

  const run=async(task:()=>Promise<{room_id:string}>)=>{
    if(!auth.session){onRequireAuth();return;}
    setBusy(true);setNotice('');
    try{const result=await task();await refresh(result.room_id);}
    catch(error){const message=String((error as {message?:string})?.message||error);setNotice(message.includes('ROOM_NOT_FOUND')?'الغرفة غير موجودة أو انتهت.':message.includes('ROOM_FULL')?'الغرفة ممتلئة.':'تعذر فتح الأونلاين الآن.');}
    finally{setBusy(false);}
  };

  const join=(event:FormEvent)=>{event.preventDefault();if(code.length===6)void run(()=>joinPrivateOnlineRoom(code));};
  const leave=async()=>{if(!snapshot)return;setBusy(true);try{await leaveOnlineRoom(snapshot.room.id);setSnapshot(null);setOnlineIds([]);setNotice('');}finally{setBusy(false);}};

  const sendDuel=async(payload:Record<string,unknown>)=>{
    if(!channelRef.current)return;
    await channelRef.current.send({type:'broadcast',event:'duel',payload});
  };
  const buzz=()=>{if(!duel||duel.buzzUserId||duel.reveal||!me)return;void sendDuel({kind:'buzz',userId,displayName:me.display_name,round:duel.round,at:Date.now()});};
  const submit=(event:FormEvent)=>{event.preventDefault();if(!duel||duel.buzzUserId!==userId||!answer.trim())return;const value=answer.trim();setAnswer('');void sendDuel({kind:'answer',userId,displayName:me?.display_name||'',round:duel.round,value,at:Date.now()});};
  const nextRound=()=>{if(!duel||!snapshot||!isHost)return;const nextRound=duel.round+1;const finished=nextRound>=MAX_ROUNDS;const next={...duel,round:nextRound,questionIndex:seedIndex(snapshot.room.id,nextRound),buzzUserId:null,reveal:false,feedback:finished?'انتهت المواجهة':'جولة جديدة',answer:'',finished};void (async()=>{await persist(next);if(finished)await recordOnlineDuelResult(snapshot.room.id);})().catch(()=>setNotice('تم حفظ الجولة، لكن تعذر تحديث سجل الحساب الآن.'));};

  const shareUrl=useMemo(()=>{
    if(!snapshot)return'';
    const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('online',snapshot.room.code);return url.toString();
  },[snapshot?.room.code]);
  const copy=async()=>{try{await navigator.clipboard.writeText(shareUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1400);}catch{/* code remains visible */}};

  if(!auth.session)return <section className="online-page" dir="rtl"><button className="online-back" onClick={onBack}><ArrowRight/> رجوع لقدّها</button><div className="online-auth-gate"><ShieldCheck/><span>قدّها أونلاين</span><h1>حسابك هو مفتاح اللعب الأونلاين.</h1><p>سجّل دخولك بالبريد أو Google. بعدها نحفظ اسمك، سجلّك، وروماتك بحيث تقدر ترجع للمواجهة حتى لو حدّثت الصفحة.</p><button className="primary" onClick={onRequireAuth}><LogIn/> تسجيل الدخول أو إنشاء حساب</button></div></section>;

  if(!snapshot)return <section className="online-page" dir="rtl"><div className="online-top"><button className="online-back" onClick={onBack}><ArrowRight/> رجوع لقدّها</button><span className="online-secure"><ShieldCheck/> حساب موثّق · بيانات محفوظة</span></div><div className="online-hero"><div><span><Radio/> قدّها أونلاين</span><h1>خصم حقيقي.<br/>غرفة حقيقية.<br/><em>والجولة ما تضيع.</em></h1><p>ابدأ بحثًا سريعًا عن لاعب، أو افتح غرفة خاصة وأرسل الكود لصاحبك. النسخة الأولى من المواجهات مبنية على «مين أسرع؟» لأنها الأنسب لتزامن سريع وعادل بين جهازين.</p></div><div className="online-player-chip"><UserRound/><small>داخل باسم</small><b>{profile?.display_name||auth.session.user.email?.split('@')[0]||'لاعب'}</b><span><Check/> محفوظ على الحساب</span></div></div><div className="online-actions-grid"><button className="online-primary-card" disabled={busy} onClick={()=>void run(()=>findQuickOnlineMatch('fast'))}><Zap/><div><small>مطابقة تلقائية</small><h2>{busy?'نبحث…':'ابحث عن خصم الآن'}</h2><p>نضعك مع أول لاعب مناسب ونجهز المواجهة تلقائيًا.</p></div></button><button disabled={busy} onClick={()=>void run(()=>createPrivateOnlineRoom('fast'))}><Users/><div><small>غرفة خاصة</small><h2>العب مع شخص تعرفه</h2><p>ينشئ لك قدّها كودًا ورابطًا خاصًا للمواجهة.</p></div></button><form onSubmit={join}><Gamepad2/><div><small>عندك كود؟</small><h2>ادخل غرفة</h2><input value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6))} placeholder="ABC234" maxLength={6}/></div><button disabled={busy||code.length!==6}>دخول</button></form></div>{notice&&<div className="online-notice">{notice}</div>}</section>;

  const connected=connection==='SUBSCRIBED';
  if(snapshot.members.length<2)return <section className="online-page" dir="rtl"><div className="online-top"><button className="online-back" onClick={leave}><ArrowRight/> خروج</button><span className={connected?'online-live':'online-off'}>{connected?<Wifi/>:<WifiOff/>}{connected?'متصل بالخادم':'نعيد الاتصال…'}</span></div><div className="online-wait"><div className="online-code"><small>كود الغرفة</small><strong>{snapshot.room.code}</strong><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'تم النسخ':'نسخ الرابط'}</button></div><div className="online-radar"><span/><Users/><b>بانتظار الخصم</b><small>الغرفة محفوظة حتى لو حدّثت الصفحة</small></div><div className="online-seats"><article className="ready"><UserRound/><b>{me?.display_name||profile?.display_name}</b><span><Check/> جاهز</span></article><article><RefreshCw className="spin"/><b>المقعد الثاني</b><span>بانتظار لاعب…</span></article></div></div>{notice&&<div className="online-notice">{notice}</div>}</section>;

  if(!duel||!question)return <section className="online-page" dir="rtl"><div className="online-wait"><RefreshCw className="spin"/><h1>نجهّز المواجهة…</h1><p>تم العثور على الخصم ونزامن الجولة الآن.</p></div></section>;

  const myScore=duel.scores[userId]||0;
  const opponentScore=opponent?(duel.scores[opponent.user_id]||0):0;
  const iBuzzed=duel.buzzUserId===userId;
  return <section className="online-page online-duel" dir="rtl"><div className="online-duel-head"><div><span className={connected?'online-live':'online-off'}>{connected?<Wifi/>:<WifiOff/>}{connected?'مباشر':'إعادة اتصال'}</span><small>{snapshot.room.code}</small></div><div className="online-score"><article><b>{me?.display_name}</b><strong>{myScore}</strong><span>{onlineIds.includes(userId)?'متصل':'يعيد الاتصال'}</span></article><i>VS</i><article><b>{opponent?.display_name}</b><strong>{opponentScore}</strong><span>{opponent&&onlineIds.includes(opponent.user_id)?'متصل':'يعيد الاتصال'}</span></article></div><button onClick={leave}>خروج</button></div>{duel.finished?<div className="online-finish"><Swords/><span>انتهت المواجهة</span><h1>{myScore===opponentScore?'تعادل قوي':myScore>opponentScore?'فزت بالمواجهة!':'المواجهة انتهت للخصم'}</h1><p>{myScore} — {opponentScore}</p><button className="primary" onClick={leave}>العودة للأونلاين</button></div>:<div className="online-round"><div className="online-round-meta"><span>الجولة {duel.round+1} / {MAX_ROUNDS}</span><b>مين أسرع؟</b></div><h1>{question[0]}</h1><button className={`online-buzzer ${iBuzzed?'active':''}`} disabled={Boolean(duel.buzzUserId)||duel.reveal||!connected} onClick={buzz}><Zap/><b>{iBuzzed?'أنت الأول!':duel.buzzUserId?'الخصم ضغط أول':'أنا أول!'}</b><small>{duel.buzzUserId?'انتظر الإجابة':'اضغط فور ما تعرف الحل'}</small></button>{iBuzzed&&!duel.reveal&&<form className="online-answer" onSubmit={submit}><input autoFocus value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={90} placeholder="اكتب إجابتك…"/><button><Send/> إرسال</button></form>}{duel.feedback&&<div className={`online-feedback ${duel.reveal?'correct':''}`}>{duel.feedback}{duel.reveal&&duel.answer?<small>الإجابة: {duel.answer}</small>:null}</div>}{duel.reveal&&isHost&&<button className="primary online-next" onClick={nextRound}>الجولة التالية</button>}</div>}</section>;
}
