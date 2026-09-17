import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Minus, Plus, RotateCcw, Users, Wifi, X, Zap } from 'lucide-react';
import { createPublicLobbyChannel, removeRealtimeChannel } from '../../utils/qaddhaRealtime';
import { buildMultiplayerJoinUrl, clearActiveHostRoom, readActiveHostRoom, type MultiplayerInput } from '../../utils/multiplayerSession';

type Member={id:string;name:string;joinedAt:number};
type ScoreMap=Record<string,number>;

export default function MultiplayerHostLayer(){
  const [room,setRoom]=useState(readActiveHostRoom);
  const [connected,setConnected]=useState(false);
  const [members,setMembers]=useState<Member[]>([]);
  const [inputs,setInputs]=useState<MultiplayerInput[]>([]);
  const [scores,setScores]=useState<ScoreMap>({});
  const [collapsed,setCollapsed]=useState(true);
  const [copied,setCopied]=useState(false);
  const channelRef=useRef<ReturnType<typeof createPublicLobbyChannel>|null>(null);
  const gameRef=useRef('');
  const joinUrl=useMemo(()=>room?buildMultiplayerJoinUrl(room.code):'',[room]);

  useEffect(()=>{
    const refresh=()=>setRoom(readActiveHostRoom());
    window.addEventListener('qaddha:multiplayer-room-changed',refresh);
    return()=>window.removeEventListener('qaddha:multiplayer-room-changed',refresh);
  },[]);

  useEffect(()=>{
    const code=room?.code;
    if(!code)return;
    let disposed=false;
    const channel=createPublicLobbyChannel(code);
    channelRef.current=channel;
    const upsert=(member:Member)=>setMembers(current=>{
      const next=[...current.filter(item=>item.id!==member.id),member].sort((a,b)=>a.joinedAt-b.joinedAt);
      return next.slice(0,32);
    });
    channel
      .on('broadcast',{event:'hello'},({payload})=>{
        const member=payload as Partial<Member>;
        if(typeof member.id==='string'&&typeof member.name==='string'){
          upsert({id:member.id,name:member.name.slice(0,18),joinedAt:typeof member.joinedAt==='number'?member.joinedAt:Date.now()});
          void channel.send({type:'broadcast',event:'host-message',payload:{text:'تم الاتصال بالمضيف'}});
          if(gameRef.current)void channel.send({type:'broadcast',event:'game',payload:{gameId:gameRef.current}});
        }
      })
      .on('broadcast',{event:'player-input'},({payload})=>{
        const incoming=payload as MultiplayerInput;
        if(!incoming||typeof incoming.id!=='string'||typeof incoming.playerId!=='string'||typeof incoming.playerName!=='string')return;
        setInputs(current=>[incoming,...current.filter(item=>item.id!==incoming.id)].slice(0,20));
        setCollapsed(false);
      })
      .subscribe(status=>{
        if(disposed)return;
        setConnected(status==='SUBSCRIBED');
      });
    return()=>{disposed=true;channelRef.current=null;void removeRealtimeChannel(channel);};
  },[room?.code]);

  useEffect(()=>{
    if(!room)return;
    const detect=()=>{
      try{
        const player=JSON.parse(localStorage.getItem('qaddha.player.v1')||'{}');
        const latest=Array.isArray(player.recent)?player.recent[0]:null;
        const gameId=typeof latest?.gameId==='string'?latest.gameId:'';
        if(gameId&&gameId!==gameRef.current){
          gameRef.current=gameId;
          setInputs([]);
          void channelRef.current?.send({type:'broadcast',event:'game',payload:{gameId}});
          void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{gameId}});
        }
      }catch{/* optional */}
    };
    detect(); const timer=window.setInterval(detect,900); return()=>window.clearInterval(timer);
  },[room]);

  if(!room)return null;

  const award=(input:MultiplayerInput,delta:number)=>{
    const next=Math.max(0,(scores[input.playerId]||0)+delta);
    setScores(current=>({...current,[input.playerId]:next}));
    void channelRef.current?.send({type:'broadcast',event:'score',payload:{playerId:input.playerId,score:next,delta}});
  };
  const resetRound=()=>{setInputs([]);void channelRef.current?.send({type:'broadcast',event:'round-reset',payload:{at:Date.now()}});};
  const copy=async()=>{try{await navigator.clipboard.writeText(joinUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1500);}catch{/* url visible through code */}};
  const close=()=>{clearActiveHostRoom();setRoom(null);setInputs([]);setMembers([]);setScores({});};

  return <aside className={`mp-host ${collapsed?'collapsed':''}`} dir="rtl">
    <div className="mp-host-head"><button className="mp-host-toggle" onClick={()=>setCollapsed(value=>!value)}><span className={connected?'live':''}><Wifi/></span><b>{room.code}</b><small>{members.length} لاعبين</small></button><button onClick={close} aria-label="إغلاق الغرفة"><X/></button></div>
    {!collapsed&&<div className="mp-host-body">
      <div className="mp-host-share"><div><small>دخول اللاعبين</small><strong>{room.code}</strong></div><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'تم':'نسخ الرابط'}</button></div>
      <div className="mp-host-actions"><button onClick={resetRound}><RotateCcw/> جولة جديدة</button><span><Users/> {members.length} متصل</span></div>
      <div className="mp-input-feed">{inputs.length?inputs.map((input,index)=><article key={input.id} className={input.kind==='buzz'?'is-buzz':''}><span className="mp-place">{index+1}</span><div><b>{input.playerName}</b><small>{input.kind==='buzz'?<><Zap/> ضغط أول</>:input.value||'إجابة'}</small></div><strong>{scores[input.playerId]||0}</strong><div className="mp-score-buttons"><button onClick={()=>award(input,100)}><Plus/></button><button onClick={()=>award(input,-100)}><Minus/></button></div></article>):<div className="mp-feed-empty"><Zap/><p>بانتظار ضغطات وإجابات اللاعبين…</p></div>}</div>
    </div>}
  </aside>;
}
