import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BadgeCheck, Gamepad2, Gauge, Globe2, KeyRound, LockKeyhole, LogIn, Megaphone, Power, QrCode, RefreshCw, Save, Settings2, ShieldCheck, Swords, UsersRound, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_GAME_IDS, DEFAULT_QADDHA_CONFIG, QaddhaRemoteConfig, fetchQaddhaRemoteConfig, isCurrentUserQaddhaAdmin, saveQaddhaRemoteConfig } from '../../utils/adminConfig';

const GAME_NAMES: Record<string,string> = {
  teams:'قدّها فرق', letters:'حروف مع عزيز', who:'من أنا؟', photo:'تحدي الصور', words:'بنك الكلمات', fast:'مين أسرع؟', character:'خمن الشخصية', riddles:'فوازير', family:'تحدي العائلة', connection:'وش الرابط؟', auction:'المزاد', order:'رتّبها', memory:'ذاكرة البرق', missing:'وش الناقص؟', acting:'مثّلها', secret:'الكلمة السرّية'
};

type Health = 'idle'|'checking'|'ok'|'error';

function Toggle({value,onChange}:{value:boolean;onChange:(v:boolean)=>void}){
  return <button onClick={()=>onChange(!value)} className={`relative h-7 w-12 rounded-full border transition ${value?'bg-amber-400 border-amber-300':'bg-zinc-800 border-zinc-700'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value?'left-1':'left-6'}`}/></button>;
}

export default function QaddhaAdminDashboard(){
  const auth = useAuth();
  const [config,setConfig]=useState<QaddhaRemoteConfig>(DEFAULT_QADDHA_CONFIG);
  const [saved,setSaved]=useState<QaddhaRemoteConfig>(DEFAULT_QADDHA_CONFIG);
  const [allowed,setAllowed]=useState(false);
  const [checking,setChecking]=useState(true);
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [signingIn,setSigningIn]=useState(false);
  const [health,setHealth]=useState<{site:Health;supabase:Health;content:Health;sessions:Health}>({site:'idle',supabase:'idle',content:'idle',sessions:'idle'});
  const changed=useMemo(()=>JSON.stringify(config)!==JSON.stringify(saved),[config,saved]);

  useEffect(()=>{void (async()=>{
    if(!auth.session){setAllowed(false);setChecking(false);return;}
    setChecking(true);
    const ok=await isCurrentUserQaddhaAdmin();
    setAllowed(ok);
    if(ok){const remote=await fetchQaddhaRemoteConfig();setConfig(remote);setSaved(remote);}
    setChecking(false);
  })()},[auth.session?.user.id]);

  const login=async(event:FormEvent)=>{
    event.preventDefault();
    if(!email.trim()||!password){setMessage('اكتب البريد وكلمة المرور.');return;}
    setSigningIn(true);setMessage('');
    const result=await auth.signIn(email.trim(),password);
    setMessage(result.message);
    setSigningIn(false);
  };
  const loginGoogle=async()=>{setSigningIn(true);setMessage('');const result=await auth.signInWithGoogle();setMessage(result.message);setSigningIn(false);};

  const save=async()=>{setSaving(true);setMessage('');try{const next=await saveQaddhaRemoteConfig(config);setConfig(next);setSaved(next);setMessage('تم حفظ التغييرات ونشرها على قدّها ✅');}catch{setMessage('تعذر الحفظ. تحقق من اتصال Supabase وصلاحية الإدارة.');}finally{setSaving(false)}};
  const setBool=(key:keyof QaddhaRemoteConfig,value:boolean)=>setConfig(prev=>({...prev,[key]:value}));
  const toggleGame=(id:string)=>setConfig(prev=>({...prev,enabled_games:prev.enabled_games.includes(id)?prev.enabled_games.filter(x=>x!==id):[...prev.enabled_games,id]}));

  const runHealth=async()=>{
    setHealth({site:'checking',supabase:'checking',content:'checking',sessions:'checking'});
    const origin=window.location.origin;
    const check=async(url:string):Promise<Health>=>{try{const r=await fetch(url,{cache:'no-store'});return r.ok?'ok':'error'}catch{return'error'}};
    const [site,supabase,content]=await Promise.all([check(origin),isCurrentUserQaddhaAdmin().then(v=>v?'ok' as Health:'error' as Health),check(`${origin}/`)]);
    setHealth({site,supabase,content,sessions:config.sessions_enabled?'ok':'error'});
  };

  if(checking||auth.loading)return <main dir="rtl" className="min-h-screen bg-[#080808] text-white grid place-items-center"><div className="text-center"><RefreshCw className="mx-auto mb-3 animate-spin text-amber-300"/><p>جاري تجهيز لوحة قدّها…</p></div></main>;

  if(!auth.session)return <main dir="rtl" className="min-h-screen bg-[#080808] text-white grid place-items-center p-5"><section className="w-full max-w-md rounded-[28px] border border-amber-400/20 bg-[#111] p-7 shadow-2xl"><div className="text-center"><LockKeyhole className="mx-auto mb-4 text-amber-300" size={34}/><h1 className="text-2xl font-black mb-2">لوحة تحكم قدّها</h1><p className="text-sm text-zinc-400 mb-6">سجّل دخولك بحساب الإدارة.</p></div><form onSubmit={login} className="space-y-3"><label className="block text-sm font-bold text-zinc-300">البريد الإلكتروني<input dir="ltr" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-white outline-none focus:border-amber-400/50" placeholder="name@example.com"/></label><label className="block text-sm font-bold text-zinc-300">كلمة المرور<input dir="ltr" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-white outline-none focus:border-amber-400/50" placeholder="••••••••"/></label><button disabled={signingIn} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3.5 font-black text-black disabled:opacity-50"><LogIn size={18}/>{signingIn?'جاري الدخول…':'دخول لوحة التحكم'}</button></form><div className="my-4 flex items-center gap-3 text-xs text-zinc-600"><span className="h-px flex-1 bg-white/10"/><span>أو</span><span className="h-px flex-1 bg-white/10"/></div><button disabled={signingIn} onClick={loginGoogle} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold"><KeyRound size={17}/>الدخول بحساب Google</button>{message&&<p className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-sm">{message}</p>}<a href="/" className="mt-5 block text-center text-sm text-zinc-500 hover:text-amber-300">العودة إلى قدّها</a></section></main>;
  if(!allowed)return <main dir="rtl" className="min-h-screen bg-[#080808] text-white grid place-items-center p-5"><section className="w-full max-w-md rounded-[28px] border border-red-500/20 bg-[#111] p-7 text-center"><ShieldCheck className="mx-auto mb-4 text-red-300" size={34}/><h1 className="text-2xl font-black mb-2">غير مصرح</h1><p className="text-sm text-zinc-400 mb-4">الحساب الحالي ليس ضمن مديري قدّها.</p><button onClick={()=>void auth.signOut()} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold">تسجيل الخروج وتجربة حساب آخر</button></section></main>;

  const cards=[['الموقع',health.site,Globe2],['Supabase',health.supabase,ShieldCheck],['المحتوى',health.content,Swords],['الجلسات',health.sessions,UsersRound]] as const;
  return <main dir="rtl" className="min-h-screen bg-[#070707] text-white pb-28">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl"><div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-amber-300">CONTROL CENTER</p><h1 className="text-xl sm:text-2xl font-black">لوحة تحكم قدّها</h1></div><div className="flex gap-2"><a href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold">فتح الموقع</a><button onClick={runHealth} className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-black text-black">فحص شامل</button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
      <section className="rounded-[30px] border border-amber-400/20 bg-gradient-to-br from-[#17130b] to-[#0d0d0d] p-6"><div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between"><div><div className="flex gap-2 flex-wrap mb-3"><span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">Supabase متصل</span><span className={`rounded-full px-3 py-1 text-xs font-bold border ${changed?'bg-amber-500/10 border-amber-500/20 text-amber-300':'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>{changed?'تغييرات غير محفوظة':'الإعدادات متزامنة'}</span></div><h2 className="text-3xl font-black">مركز إدارة قدّها</h2><p className="mt-2 text-sm text-zinc-400">إدارة التشغيل، الألعاب، الجلسات، QR، الصيانة والصعوبة من مكان واحد.</p></div><div className="flex gap-2"><button disabled={!changed||saving} onClick={save} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-black disabled:opacity-40"><Save size={18}/>{saving?'جاري الحفظ…':'حفظ ونشر'}</button></div></div>{message&&<p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">{message}</p>}</section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(([label,state,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-[#111] p-4"><div className="flex items-center justify-between"><Icon className="text-amber-300" size={20}/><span className={`h-2 w-2 rounded-full ${state==='ok'?'bg-emerald-400':state==='error'?'bg-red-400':state==='checking'?'bg-amber-300 animate-pulse':'bg-zinc-600'}`}/></div><p className="mt-4 text-xs text-zinc-500">{label}</p><p className="mt-1 font-black">{state==='ok'?'سليم':state==='error'?'مشكلة':state==='checking'?'جاري الفحص':'لم يُفحص'}</p></div>)}</section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5"><div className="flex items-center gap-3 mb-4"><Megaphone className="text-amber-300"/><div><h3 className="font-black">رسالة أعلى الموقع</h3><p className="text-xs text-zinc-500">إعلان يظهر للمستخدمين مباشرة.</p></div></div><div className="flex justify-between items-center rounded-2xl bg-black/30 p-3 mb-3"><span className="font-bold">إظهار الرسالة</span><Toggle value={config.announcement_enabled} onChange={v=>setBool('announcement_enabled',v)}/></div><textarea value={config.announcement_text} onChange={e=>setConfig({...config,announcement_text:e.target.value})} className="w-full min-h-28 rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-amber-400/40"/></div>
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-5"><div className="flex items-center gap-3 mb-4"><Wrench className="text-amber-300"/><div><h3 className="font-black">وضع الصيانة</h3><p className="text-xs text-zinc-500">إيقاف الموقع مؤقتًا برسالة واضحة.</p></div></div><div className="flex justify-between items-center rounded-2xl bg-black/30 p-3 mb-3"><span className="font-bold">تفعيل الصيانة</span><Toggle value={config.maintenance_mode} onChange={v=>setBool('maintenance_mode',v)}/></div><textarea value={config.maintenance_message} onChange={e=>setConfig({...config,maintenance_message:e.target.value})} className="w-full min-h-28 rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-amber-400/40"/></div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[['المحتوى',config.content_enabled,'content_enabled',Power],['الجلسات الأونلاين',config.sessions_enabled,'sessions_enabled',UsersRound],['QR والمضيف',config.qr_enabled,'qr_enabled',QrCode]].map(([label,value,key,Icon])=>{const I=Icon as typeof Power;return <div key={String(key)} className="rounded-[24px] border border-white/10 bg-[#111] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><I className="text-amber-300"/><span className="font-black">{String(label)}</span></div><Toggle value={Boolean(value)} onChange={v=>setBool(key as keyof QaddhaRemoteConfig,v)}/></div></div>})}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5"><div className="flex items-center gap-3 mb-5"><Gauge className="text-amber-300"/><div><h3 className="font-black">مستوى الصعوبة العام</h3><p className="text-xs text-zinc-500">الافتراضي لأسئلة قدّها.</p></div></div><div className="grid sm:grid-cols-3 gap-2">{[['medium','متوسط'],['medium-hard','متوسط → صعب'],['hard','صعب']].map(([value,label])=><button key={value} onClick={()=>setConfig({...config,difficulty:value as QaddhaRemoteConfig['difficulty']})} className={`rounded-2xl border p-3 font-black ${config.difficulty===value?'bg-amber-400 text-black border-amber-300':'bg-black/30 border-white/10 text-zinc-300'}`}>{label}</button>)}</div></section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5"><div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-3"><Gamepad2 className="text-amber-300"/><div><h3 className="font-black">إدارة الألعاب</h3><p className="text-xs text-zinc-500">تشغيل أو إخفاء أي لعبة من الموقع.</p></div></div><span className="text-xs text-zinc-500">{config.enabled_games.length}/{ALL_GAME_IDS.length} مفعلة</span></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">{ALL_GAME_IDS.map(id=>{const on=config.enabled_games.includes(id);return <button key={id} onClick={()=>toggleGame(id)} className={`rounded-2xl border p-4 text-right transition ${on?'border-amber-400/30 bg-amber-400/10':'border-white/10 bg-black/30 opacity-55'}`}><div className="flex items-center justify-between gap-2"><span className="font-black text-sm">{GAME_NAMES[id]}</span>{on?<BadgeCheck className="text-emerald-300" size={18}/>:<AlertTriangle className="text-zinc-500" size={18}/>}</div><p className="mt-2 text-[11px] text-zinc-500">{on?'مفعلة وتظهر للمستخدمين':'موقوفة ومخفية'}</p></button>})}</div></section>

      <section className="rounded-[28px] border border-white/10 bg-[#111] p-5"><div className="flex items-center gap-3 mb-4"><Settings2 className="text-amber-300"/><h3 className="font-black">أدوات سريعة</h3></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2"><a href="/" target="_blank" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">فتح قدّها</a><a href="https://github.com/uauz1/game" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">GitHub</a><a href="https://supabase.com/dashboard/project/uhbtcjlapgpsohbkotpd" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/30 p-4 font-bold">Supabase</a><button onClick={runHealth} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-right font-bold"><Activity className="inline ml-2 text-amber-300" size={17}/>تشغيل الفحص</button></div></section>
    </div>
  </main>;
}
