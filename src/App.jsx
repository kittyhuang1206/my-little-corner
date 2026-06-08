import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBTWsMPiwx14Akdv-1_aFotTCT0FIRvEU8",
  authDomain: "my-little-corner-a8975.firebaseapp.com",
  projectId: "my-little-corner-a8975",
  storageBucket: "my-little-corner-a8975.firebasestorage.app",
  messagingSenderId: "902972779337",
  appId: "1:902972779337:web:7a44ad5f92ebc080258898",
};
let _fbAuth=null,_fbDb=null,_fbProvider=null;
try{ const _fbApp=initializeApp(firebaseConfig); _fbAuth=getAuth(_fbApp); _fbDb=getFirestore(_fbApp); _fbProvider=new GoogleAuthProvider(); }catch(e){ if(typeof console!=="undefined")console.warn("Firebase init failed",e); }
const P = {
  bg:"#F5F0E8", card:"#FFFDF8", border:"#DED3C2",
  text:"#2F343A", sub:"#6B7280", muted:"#A09080",
  brown:"#B89B72", peach:"#E7A985", sage:"#8CA98D", blue:"#8FA6B8",
  light:"#EFE6D5", paper:"#FFF9EE", lined:"#EDE3D0", warm:"#F8F2E6",
};
const SEASONS = {
  spring:{ accent:"#D99BB0", a2:"#EDC6D4", glow:"rgba(217,155,176,.16)", pc:["#F2A7C3","#F7C5D5","#E8A0BB","#FAD4E0","#F4B8CC"], pt:"petals" },
  summer:{ accent:P.sage, a2:"#C8D8A8", glow:"rgba(140,169,141,.15)", pc:["#C8D8A8","#D4ECC0","#B8CC98","#E0EFC8"], pt:"fireflies" },
  autumn:{ accent:P.brown, a2:"#D8A070", glow:"rgba(184,155,114,.15)", pc:["#C87030","#D88840","#E8A050","#B05820","#E8C080"], pt:"leaves" },
  winter:{ accent:P.blue, a2:"#B8CCD8", glow:"rgba(143,166,184,.15)", pc:["#DAEAF8","#EAF2FC","#C8DCF0","#F0F6FF"], pt:"snow" },
};
const getSeason=()=>{const m=new Date().getMonth();return m>=2&&m<=4?"spring":m>=5&&m<=7?"summer":m>=8&&m<=10?"autumn":"winter";};
const S={
  get:(k,fb=null)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{const s=JSON.stringify(v);const prev=localStorage.getItem(k);localStorage.setItem(k,s);if(prev===s)return;if(k!=="mlc_ts")localStorage.setItem("mlc_ts",String(Date.now()));if(typeof window!=="undefined"&&window.__mlcPush)window.__mlcPush();}catch{}},
};
const SYNC_DUMP=()=>{const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("mlc_")===0)o[k]=localStorage.getItem(k);}}catch{}return o;};
const SYNC_WRITE=(o)=>{try{Object.keys(o||{}).forEach(k=>{if(k.indexOf("mlc_")===0&&typeof o[k]==="string")localStorage.setItem(k,o[k]);});}catch{}};
const LOCAL_TS=()=>{try{return Number(localStorage.getItem("mlc_ts")||0);}catch{return 0;}};
const todayKey=()=>new Date().toISOString().slice(0,10);
const dAgo=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const getHistory=()=>S.get("mlc_h",{});
const saveDay=d=>{const h=getHistory();h[d.date]=d;S.set("mlc_h",h);};
const getStreak=()=>S.get("mlc_streak",{count:0,last:""});
const bumpStreak=()=>{const t=new Date().toDateString(),{count:c,last:l}=getStreak(),y=new Date(Date.now()-864e5).toDateString();const n=l===t?c:l===y?c+1:1;S.set("mlc_streak",{count:n,last:t});return n;};
const getFriendship=()=>S.get("mlc_friend",{points:0,level:1,lastOpen:""});
const addFriendPoints=(pts)=>{const f=getFriendship();const np=f.points+pts;const nl=np>=350?4:np>=150?3:np>=50?2:1;const r={points:np,level:nl,lastOpen:f.lastOpen};S.set("mlc_friend",r);return r;};
const checkDailyOpen=()=>{const t=todayKey();const f=getFriendship();if(f.lastOpen!==t){const r=addFriendPoints(3);r.lastOpen=t;S.set("mlc_friend",r);}};
const ACCESSORIES={
  cat:[{pts:0,name:"",emoji:""},{pts:50,name:"Flower Crown",emoji:"🌸"},{pts:150,name:"Scarf",emoji:"🧣"},{pts:350,name:"Little Hat",emoji:"🎩"}],
  dog:[{pts:0,name:"",emoji:""},{pts:50,name:"Bandana",emoji:"🎀"},{pts:150,name:"Tennis Ball",emoji:"🎾"},{pts:350,name:"Backpack",emoji:"🎒"}],
  bunny:[{pts:0,name:"",emoji:""},{pts:50,name:"Flower",emoji:"🌼"},{pts:150,name:"Carrot",emoji:"🥕"},{pts:350,name:"Ribbon",emoji:"🎀"}],
  fox:[{pts:0,name:"",emoji:""},{pts:50,name:"Leaf Crown",emoji:"🍂"},{pts:150,name:"Lantern",emoji:"🏮"},{pts:350,name:"Cape",emoji:"🦊"}],
  bear:[{pts:0,name:"",emoji:""},{pts:50,name:"Honey Pot",emoji:"🍯"},{pts:150,name:"Cozy Mug",emoji:"☕"},{pts:350,name:"Chef Hat",emoji:"👨‍🍳"}],
  plant:[{pts:0,name:"",emoji:""},{pts:50,name:"Dewdrop",emoji:"💧"},{pts:150,name:"Butterfly",emoji:"🦋"},{pts:350,name:"Sun Hat",emoji:"☀️"}],
};
const getAccessory=(cid,pts)=>{const list=ACCESSORIES[cid]||ACCESSORIES.cat;let best=list[0];for(const a of list){if(pts>=a.pts)best=a;}return best;};
const TRACKS={
  cafe:[
    {t:"Coffee with Jazz",u:"/audio/coffee-jazz.mp3"},
    {t:"Morning Coffee",u:"/audio/morning-coffee.mp3"},
    {t:"Coffee Time",u:"/audio/coffee-time.mp3"},
    {t:"Bossa Nova Cafe",u:"/audio/bossa-nova.mp3"},
  ],
  piano:[
    {t:"Emotional Piano",u:"/audio/emotional-piano.mp3"},
    {t:"Mountain Piano",u:"/audio/mountain-piano.mp3"},
    {t:"Hope",u:"/audio/hope-piano.mp3"},
    {t:"Classical Piano Waltz",u:"/audio/piano-waltz.mp3"},
    {t:"Piano & Violin",u:"/audio/piano-violin.mp3"},
    {t:"Quiet Keys",u:"/audio/quiet-keys.mp3"},
    {t:"Soft Reverie",u:"/audio/soft-piano-3.mp3"},
  ],
  rainy:[
    {t:"Guitar in the Rain",u:"/audio/guitar-rain.mp3"},
    {t:"Cozy Rainfall",u:"/audio/cozy-rainfall.mp3"},
  ],
  bookstore:[
    {t:"Acoustic Afternoon",u:"/audio/acoustic-1.mp3"},
    {t:"Guitar Strolls",u:"/audio/acoustic-2.mp3"},
    {t:"Sunlit Strings",u:"/audio/acoustic-3.mp3"},
  ],
  evening:[
    {t:"Warm Guitars by the Fire",u:"/audio/fireplace-guitars.mp3"},
    {t:"Sunset Lofi",u:"/audio/lofi-sunset.mp3"},
    {t:"Night Circuit",u:"/audio/night-circuit.mp3"},
  ],
  forest:[
    {t:"Enchanted Forest",u:"/audio/enchanted-forest.mp3"},
  ],
  calm:[
    {t:"Whispers on the Horizon",u:"/audio/whispers-horizon.mp3"},
    {t:"Sun Beneath a Song",u:"/audio/sun-beneath.mp3"},
    {t:"Soft Daydream",u:"/audio/soft-daydream.mp3"},
    {t:"Calm & Soft",u:"/audio/calm-soft.mp3"},
    {t:"Gentle Drift",u:"/audio/gentle-drift.mp3"},
    {t:"Little Dolphin",u:"/audio/little-dolphin.mp3"},
    {t:"Quiet Hours",u:"/audio/quiet-hours.mp3"},
    {t:"Just Relax",u:"/audio/just-relax.mp3"},
    {t:"Golden Hours",u:"/audio/golden-hours.mp3"},
    {t:"Stillness",u:"/audio/stillness.mp3"},
  ],
};
const ALL_T=Object.values(TRACKS).flat();
const MCATS=[
  {id:"random",label:"Random",labelZh:"隨機",icon:"✦"},
  {id:"cafe",label:"Cozy Cafe",labelZh:"溫馨咖啡廳",icon:"☕"},
  {id:"piano",label:"Soft Piano",labelZh:"輕柔鋼琴",icon:"♪"},
  {id:"rainy",label:"Rainy Study",labelZh:"雨天讀書",icon:"~"},
  {id:"bookstore",label:"Acoustic Guitar",labelZh:"木吉他",icon:"♬"},
  {id:"evening",label:"Evening Lofi",labelZh:"夜晚氛圍",icon:"◌"},
  {id:"calm",label:"Calm & Dreamy",labelZh:"放鬆療癒",icon:"☁"},
  {id:"forest",label:"Forest Morning",labelZh:"森林早晨",icon:"✿"},
];
let _recent=[];
const pickT=(cat,ex)=>{
  const pool=(cat==="random"?ALL_T:TRACKS[cat]||ALL_T);
  let cand=pool.filter(t=>t!==ex && !_recent.includes(t.u));
  if(cand.length===0) cand=pool.filter(t=>t!==ex);
  if(cand.length===0) cand=pool;
  const pick=cand[Math.floor(Math.random()*cand.length)]||pool[0];
  if(pick){ _recent.push(pick.u);
    const keep=Math.max(1,Math.min(pool.length-1,Math.floor(pool.length*0.7)));
    while(_recent.length>keep) _recent.shift();
  }
  return pick;
};
const T={
  en:{
    appName:"My Little Corner",appSub:"A cozy place for your thoughts.",
    langQ:"Choose your language",
    nameQ:"What should I call you?",namePh:"Your name…",nameSub:"e.g. Kitty, Alex, Morgan",
    compQ:"Choose your companion",compSub:"Who will keep you company?",
    welcomeBack:"Welcome back,",enterBtn:"Enter My Little Corner",
    ritual:"Today's ritual",vibe:"Today's vibe",
    tasks:"Today's tasks",addTask:"+ Add a task",taskPh:"What needs to get done?",
    win:"Today's win",winPh:"One small thing I'm proud of today…",
    focusPh:"Today I want to focus on…",
    photo:"Today's photo",addPhoto:"Add a photo for today",
    yesterday:"Yesterday",journal:"Journal",nextDay:"New day",home:"Home",
    closeQ:"Ready to close today?",doneToday:"Completed",
    save:"Save",cancel:"Cancel",done:"Done",edit:"Edit",
    yourName:"Your name",companion:"Companion",season:"Season",
    fontStyle:"Font style",prefs:"Preferences",language:"Language",
    noHistory:"No entries yet. Your little moments will appear here.",
    nothingYet:"Nothing planned yet. What matters most today?",
    completed:"Completed",unfinished:"Unfinished",focus:"Focus",
    saveNew:"Save & begin new day",notYet:"Not yet",
    closeTitle:"Close today?",closeSub:"Today's entry will be saved. Completed tasks will clear.",
    streakLabel:"day streak",friendLabel:"Friendship",
    friendLevels:["New Friends","Good Friends","Close Friends","Best Friends"],
    musicNA:"Music unavailable",skipping:"Skipping…",
    vibeOpts:["Calm","Focus","Cozy","Creative"],vibeIds:["calm","focus","cozy","creative"],
    catOpts:["Work","Personal","Health","Creative","Errands"],catIds:["work","personal","health","creative","errands"],
    priOpts:["Low","Medium","High"],priIds:["low","medium","high"],
    journalTitle:"My Journal",journalSub:"A record of your little moments",
    compNames:{cat:"Hazel",dog:"Latte",bunny:"Mochi",fox:"Maple",bear:"Cocoa",plant:"Sprout"},
    compDesc:{cat:"Curious and thoughtful",dog:"Energetic and cheerful",bunny:"Gentle and calm",fox:"Sharp and warm",bear:"Cozy and steady",plant:"Patient and growing"},
    seasonNames:{spring:"Spring",summer:"Summer",autumn:"Autumn",winter:"Winter"},
    fontNames:{dm:"Elegant",nunito:"Friendly",noto_serif:"Literary",kiwi:"Journal",zen:"Storybook",noto_sans:"Modern"},
    resetBtn:"Reset all data",resetConfirm:"Are you sure? This will erase everything.",
    backupTitle:"Backup & Restore",backupDesc:"Move your data to another device: tap Export, copy the code, then paste it on the other device and tap Restore.",backupPh:"Your backup code appears here…",exportBtn:"Export",restoreBtn:"Restore",system:"System",wardrobe:"Wardrobe",wardrobeSub:"Tap an unlocked item to wear it.",noneLabel:"None",
    greet:(h)=>h<12?"Good morning":h<17?"Good afternoon":"Good evening",
  },
  zh:{
    appName:"我的小角落",appSub:"記錄生活的小角落，屬於你的溫暖空間",
    langQ:"選擇語言",
    nameQ:"我該怎麼稱呼你呢？",namePh:"你的名字…",nameSub:"例如：小美、David、媽媽",
    compQ:"選擇你的小夥伴",compSub:"誰來陪伴你的每一天？",
    welcomeBack:"歡迎回來，",enterBtn:"進入我的小角落",
    ritual:"今日儀式",vibe:"今天的心情",
    tasks:"今天的任務",addTask:"＋ 新增任務",taskPh:"今天要完成什麼？",
    win:"今天的小成就",winPh:"今天讓我感到驕傲的一件事…",
    focusPh:"今天我想專注在…",
    photo:"今天的照片",addPhoto:"為今天新增一張照片",
    yesterday:"昨天",journal:"日記",nextDay:"新的一天",home:"首頁",
    closeQ:"準備結束今天了嗎？",doneToday:"今天完成的",
    save:"儲存",cancel:"取消",done:"完成",edit:"編輯",
    yourName:"你的名字",companion:"小夥伴",season:"季節",
    fontStyle:"字體風格",prefs:"個人設定",language:"語言 Language",
    noHistory:"還沒有記錄，你的小角落故事將在這裡慢慢展開。",
    nothingYet:"還沒有任務，今天最重要的事是什麼呢？",
    completed:"已完成",unfinished:"未完成",focus:"專注目標",
    saveNew:"儲存並開始新的一天",notYet:"再等等",
    closeTitle:"結束今天？",closeSub:"今天的記錄將被保存，已完成的任務會清除。",
    streakLabel:"天連續",friendLabel:"友好度",
    friendLevels:["新朋友","好朋友","好閨密","靈魂好友"],
    musicNA:"預覽中無法播放音樂",skipping:"跳過中…",
    vibeOpts:["平靜","專注","舒適","創意"],vibeIds:["calm","focus","cozy","creative"],
    catOpts:["工作","個人","健康","創意","雜事"],catIds:["work","personal","health","creative","errands"],
    priOpts:["低","中","高"],priIds:["low","medium","high"],
    journalTitle:"我的日記",journalSub:"記錄每一個小小的時刻",
    compNames:{cat:"榛子",dog:"拿鐵",bunny:"麻糬",fox:"楓楓",bear:"可可",plant:"小芽"},
    compDesc:{cat:"好奇又細心",dog:"活力充沛，開朗陽光",bunny:"溫柔平靜",fox:"敏銳又溫暖",bear:"舒適穩重",plant:"耐心成長中"},
    seasonNames:{spring:"春天",summer:"夏天",autumn:"秋天",winter:"冬天"},
    fontNames:{dm:"優雅 Elegant",nunito:"親切 Friendly",noto_serif:"文學 Literary",kiwi:"日記 Journal",zen:"故事書 Storybook",noto_sans:"現代 Modern"},
    resetBtn:"重置所有資料",resetConfirm:"確定嗎？這將清除所有資料。",
    backupTitle:"備份與還原",backupDesc:"把資料搬到另一台裝置：按「匯出」複製代碼，到另一台裝置貼上後按「還原」。",backupPh:"備份代碼會出現在這裡…",exportBtn:"匯出",restoreBtn:"還原",system:"系統設定",wardrobe:"裝扮衣櫥",wardrobeSub:"點一下已解鎖的配件就能換上。",noneLabel:"不戴",
    greet:(h)=>h<12?"早安":h<17?"午安":"晚安",
  },
};
const FONTS=[
  {id:"dm",url:"https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@300;400;500;600&display=swap",serif:"'DM Serif Display',serif",sans:"'Manrope',sans-serif"},
  {id:"nunito",url:"https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;1,400&display=swap",serif:"'Nunito',sans-serif",sans:"'Nunito',sans-serif"},
  {id:"noto_serif",url:"https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600&family=Noto+Sans+TC:wght@300;400;500&display=swap",serif:"'Noto Serif TC',serif",sans:"'Noto Sans TC',sans-serif"},
  {id:"kiwi",url:"https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@300;400;500&display=swap",serif:"'Kiwi Maru',serif",sans:"'Kiwi Maru',sans-serif"},
  {id:"zen",url:"https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500&display=swap",serif:"'Zen Maru Gothic',sans-serif",sans:"'Zen Maru Gothic',sans-serif"},
  {id:"noto_sans",url:"https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500&display=swap",serif:"'Noto Sans TC',sans-serif",sans:"'Noto Sans TC',sans-serif"},
];
function renderComp(id,accent,size=60,accessory=""){
  const s=size;
  const body={
    cat:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="42" rx="15" ry="13" fill="#E8DDD0"/>
        <ellipse cx="31" cy="24" rx="14" ry="13" fill="#EDE4D8"/>
        <polygon points="18,16 15,7 23,14" fill="#EDE4D8"/>
        <polygon points="44,16 47,7 39,14" fill="#EDE4D8"/>
        <polygon points="18.5,15 16.5,9 22,13.5" fill="#D8C4B0"/>
        <polygon points="43.5,15 45.5,9 40,13.5" fill="#D8C4B0"/>
        <circle cx="26" cy="24.5" r="2.8" fill="#5C4A3A"/>
        <circle cx="36" cy="24.5" r="2.8" fill="#5C4A3A"/>
        <circle cx="27" cy="23.8" r=".9" fill="white"/>
        <circle cx="37" cy="23.8" r=".9" fill="white"/>
        <ellipse cx="31" cy="28" rx="1.3" ry="1" fill="#C9A08A"/>
        <path d="M28.5 30 Q31 31.5 33.5 30" stroke="#C9A08A" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <line x1="16" y1="27.5" x2="24" y2="28.5" stroke="#B09880" strokeWidth=".9" opacity=".5"/>
        <line x1="38" y1="28.5" x2="46" y2="27.5" stroke="#B09880" strokeWidth=".9" opacity=".5"/>
        <path d="M46 46 Q55 41 53 32" stroke="#D8C4B0" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <ellipse cx="22" cy="54" rx="5.5" ry="3.5" fill="#E8DDD0"/>
        <ellipse cx="40" cy="54" rx="5.5" ry="3.5" fill="#E8DDD0"/>
        {accessory==="🌸"&&<g><path d="M18 14 Q31 8.5 44 14" stroke="#A6C285" strokeWidth="1.6" fill="none"/><g fill="#F2A7C3"><ellipse cx="22" cy="10.6" rx="1.5" ry="2.4"/><ellipse cx="22" cy="14.4" rx="1.5" ry="2.4"/><ellipse cx="19.9" cy="12.5" rx="2.4" ry="1.5"/><ellipse cx="24.1" cy="12.5" rx="2.4" ry="1.5"/></g><circle cx="22" cy="12.5" r="1.3" fill="#F6D34A"/><g fill="#F7C5D5"><ellipse cx="31" cy="8.4" rx="1.6" ry="2.6"/><ellipse cx="31" cy="13" rx="1.6" ry="2.6"/><ellipse cx="28.6" cy="10.7" rx="2.6" ry="1.6"/><ellipse cx="33.4" cy="10.7" rx="2.6" ry="1.6"/></g><circle cx="31" cy="10.7" r="1.4" fill="#F6D34A"/><g fill="#F2A7C3"><ellipse cx="40" cy="10.6" rx="1.5" ry="2.4"/><ellipse cx="40" cy="14.4" rx="1.5" ry="2.4"/><ellipse cx="37.9" cy="12.5" rx="2.4" ry="1.5"/><ellipse cx="42.1" cy="12.5" rx="2.4" ry="1.5"/></g><circle cx="40" cy="12.5" r="1.3" fill="#F6D34A"/><circle cx="26.5" cy="11.6" r="1.6" fill="#FAD4E0"/><circle cx="35.5" cy="11.6" r="1.6" fill="#FAD4E0"/></g>}
        {accessory==="🎩"&&<rect x="20" y="4" width="22" height="9" rx="2" fill="#3A2818" opacity=".85"/>}
        {accessory==="🎩"&&<rect x="16" y="11" width="30" height="3" rx="1.5" fill="#3A2818" opacity=".7"/>}
        {accessory==="🧣"&&<path d="M16 38 Q31 44 46 38" stroke="#E8906A" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6"/>}
      </svg>
    ),
    dog:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="43" rx="16" ry="12" fill="#E8D8C0"/>
        <ellipse cx="31" cy="25" rx="15" ry="14" fill="#DEC8A8"/>
        <ellipse cx="14" cy="22" rx="6" ry="10" fill="#D4B890" transform="rotate(15,14,22)"/>
        <ellipse cx="48" cy="22" rx="6" ry="10" fill="#D4B890" transform="rotate(-15,48,22)"/>
        <circle cx="26" cy="24" r="3" fill="#3A2C1C"/>
        <circle cx="36" cy="24" r="3" fill="#3A2C1C"/>
        <circle cx="27.2" cy="23" r="1" fill="white"/>
        <circle cx="37.2" cy="23" r="1" fill="white"/>
        <ellipse cx="31" cy="33" rx="6" ry="4.5" fill="#E8D0B0"/>
        <ellipse cx="31" cy="29.5" rx="2.5" ry="2" fill="#C09878"/>
        <path d="M27 32.5 Q31 35 35 32.5" stroke="#C09878" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M45 48 Q56 44 54 34" stroke="#D4B890" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <ellipse cx="21" cy="54" rx="6" ry="4" fill="#E8D8C0"/>
        <ellipse cx="41" cy="54" rx="6" ry="4" fill="#E8D8C0"/>
        {accessory==="🎀"&&<g><path d="M31 37 Q21 31 21 37 Q21 43 31 37Z" fill="#E89BB5"/><path d="M31 37 Q41 31 41 37 Q41 43 31 37Z" fill="#E89BB5"/><path d="M29 38 L26 43" stroke="#E89BB5" strokeWidth="2" strokeLinecap="round"/><path d="M33 38 L36 43" stroke="#E89BB5" strokeWidth="2" strokeLinecap="round"/><circle cx="31" cy="37" r="2.4" fill="#D98AA6"/></g>}
        {accessory==="🎒"&&<rect x="37" y="32" width="14" height="18" rx="4" fill="#7888A8" opacity=".6"/>}
        {accessory==="🎾"&&<g><circle cx="46" cy="50" r="5" fill="#C6D63E"/><path d="M42.5 47 Q46 50 49.5 47" stroke="#fff" strokeWidth="0.8" fill="none" opacity=".85"/><path d="M42.5 53 Q46 50 49.5 53" stroke="#fff" strokeWidth="0.8" fill="none" opacity=".85"/></g>}
      </svg>
    ),
    bunny:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="43" rx="14" ry="12" fill="#EDE8E0"/>
        <ellipse cx="31" cy="27" rx="13" ry="12" fill="#F0EBE3"/>
        <ellipse cx="22" cy="10" rx="5" ry="12" fill="#EDE8E0"/>
        <ellipse cx="40" cy="10" rx="5" ry="12" fill="#EDE8E0"/>
        <ellipse cx="22" cy="10" rx="3" ry="9" fill={accent} opacity=".3"/>
        <ellipse cx="40" cy="10" rx="3" ry="9" fill={accent} opacity=".3"/>
        <circle cx="26" cy="27" r="2.5" fill="#5C4A3A"/>
        <circle cx="36" cy="27" r="2.5" fill="#5C4A3A"/>
        <circle cx="27" cy="26.3" r=".8" fill="white"/>
        <circle cx="37" cy="26.3" r=".8" fill="white"/>
        <ellipse cx="31" cy="30" rx="1.8" ry="1.3" fill="#D4A8A0"/>
        <path d="M29 32 Q31 33.5 33 32" stroke="#D4A8A0" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
        <ellipse cx="22" cy="54" rx="5" ry="3" fill="#EDE8E0"/>
        <ellipse cx="40" cy="54" rx="5" ry="3" fill="#EDE8E0"/>
        {accessory==="🌼"&&<g><line x1="45" y1="55" x2="45" y2="45" stroke="#6FA052" strokeWidth="1.5" strokeLinecap="round"/><ellipse cx="42" cy="50" rx="2.6" ry="1.4" fill="#6FA052" transform="rotate(-30 42 50)"/><ellipse cx="45" cy="38" rx="2" ry="3.1" fill="#FBD94B"/><ellipse cx="45" cy="46" rx="2" ry="3.1" fill="#FBD94B"/><ellipse cx="41" cy="42" rx="3.1" ry="2" fill="#FBD94B"/><ellipse cx="49" cy="42" rx="3.1" ry="2" fill="#FBD94B"/><ellipse cx="42.2" cy="39.2" rx="2.6" ry="1.7" fill="#FCE070" transform="rotate(45 42.2 39.2)"/><ellipse cx="47.8" cy="39.2" rx="2.6" ry="1.7" fill="#FCE070" transform="rotate(-45 47.8 39.2)"/><ellipse cx="42.2" cy="44.8" rx="2.6" ry="1.7" fill="#FCE070" transform="rotate(-45 42.2 44.8)"/><ellipse cx="47.8" cy="44.8" rx="2.6" ry="1.7" fill="#FCE070" transform="rotate(45 47.8 44.8)"/><circle cx="45" cy="42" r="2.3" fill="#F0A828"/><circle cx="45" cy="42" r="1" fill="#D98A1A"/></g>}
        {accessory==="🎀"&&<ellipse cx="31" cy="8" rx="10" ry="4" fill="#E8A0C0" opacity=".75"/>}
        {accessory==="🥕"&&<g><path d="M40 40 L47 51 L43 52 Z" fill="#E8843C"/><path d="M40 40 l-2.5 -3M40.5 39.5 l0 -3.5M41 40 l3 -3" stroke="#7CAA5A" strokeWidth="1.6" strokeLinecap="round"/></g>}
      </svg>
    ),
    fox:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="42" rx="15" ry="12" fill="#E8C8A0"/>
        <ellipse cx="31" cy="25" rx="14" ry="13" fill="#D4905A"/>
        <polygon points="17,15 12,4 24,14" fill="#D4905A"/>
        <polygon points="45,15 50,4 38,14" fill="#D4905A"/>
        <polygon points="18,14.5 13.5,7 22.5,13.5" fill="#E8C090"/>
        <polygon points="44,14.5 48.5,7 39.5,13.5" fill="#E8C090"/>
        <circle cx="26" cy="25" r="2.8" fill="#3A2010"/>
        <circle cx="36" cy="25" r="2.8" fill="#3A2010"/>
        <circle cx="27" cy="24.3" r=".9" fill="white"/>
        <circle cx="37" cy="24.3" r=".9" fill="white"/>
        <ellipse cx="31" cy="32" rx="5" ry="4" fill="#F0D8C0"/>
        <ellipse cx="31" cy="29" rx="1.5" ry="1.1" fill="#C07050"/>
        <path d="M28.5 31 Q31 32.5 33.5 31" stroke="#C07050" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <path d="M44 46 Q53 42 52 34" stroke="#D4905A" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="22" cy="54" rx="5" ry="3.5" fill="#E8C8A0"/>
        <ellipse cx="40" cy="54" rx="5" ry="3.5" fill="#E8C8A0"/>
        {accessory==="🏮"&&<g><circle cx="48" cy="15" r="11" fill="#F26B4E" opacity=".16"/><line x1="48" y1="2.5" x2="48" y2="6" stroke="#7A5230" strokeWidth="1" strokeLinecap="round"/><rect x="44" y="5.6" width="8" height="2.6" rx="1.1" fill="#7A5230"/><ellipse cx="48" cy="15" rx="7" ry="8.2" fill="#E8503C"/><ellipse cx="44.6" cy="13" rx="2" ry="5" fill="#F8A07E" opacity=".55"/><line x1="45.4" y1="8.2" x2="45.4" y2="21.8" stroke="#B8331F" strokeWidth="0.6" opacity=".5"/><line x1="48" y1="7.4" x2="48" y2="22.6" stroke="#B8331F" strokeWidth="0.6" opacity=".5"/><line x1="50.6" y1="8.2" x2="50.6" y2="21.8" stroke="#B8331F" strokeWidth="0.6" opacity=".5"/><rect x="44.6" y="20.8" width="6.8" height="2.6" rx="1.1" fill="#7A5230"/><line x1="48" y1="23.4" x2="48" y2="26.5" stroke="#E8C84A" strokeWidth="1" strokeLinecap="round"/><circle cx="48" cy="27.4" r="1.5" fill="#F4D75E"/></g>}
        {accessory==="🍂"&&<g><path d="M19 15 Q31 10 43 15" stroke="#9A7B48" strokeWidth="1.4" fill="none"/><path d="M21 14 q-2.6 -3 -0.4 -6.4 q2.6 2.8 0.4 6.4 Z" fill="#C87030" transform="rotate(-16 21 14)"/><path d="M26.5 12.5 q-2.6 -3 -0.4 -6.4 q2.6 2.8 0.4 6.4 Z" fill="#E8A050" transform="rotate(-7 26.5 12.5)"/><path d="M31 11.6 q-2.6 -3 -0.4 -6.6 q2.6 2.9 0.4 6.6 Z" fill="#D88840"/><path d="M35.5 12.5 q2.6 -3 0.4 -6.4 q-2.6 2.8 -0.4 6.4 Z" fill="#E8A050" transform="rotate(7 35.5 12.5)"/><path d="M41 14 q2.6 -3 0.4 -6.4 q-2.6 2.8 -0.4 6.4 Z" fill="#B05820" transform="rotate(16 41 14)"/></g>}
        {accessory==="🦊"&&<path d="M22 33 Q31 39 40 33 L43 41 Q31 45 19 41 Z" fill="#9A4A2A" opacity=".55"/>}
      </svg>
    ),
    bear:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="44" rx="16" ry="13" fill="#D8C8B0"/>
        <ellipse cx="31" cy="26" rx="16" ry="15" fill="#C8B8A0"/>
        <circle cx="17" cy="14" r="7" fill="#C8B8A0"/>
        <circle cx="45" cy="14" r="7" fill="#C8B8A0"/>
        <circle cx="17" cy="14" r="4.5" fill="#B8A890"/>
        <circle cx="45" cy="14" r="4.5" fill="#B8A890"/>
        <circle cx="26" cy="26" r="3" fill="#4A3828"/>
        <circle cx="36" cy="26" r="3" fill="#4A3828"/>
        <circle cx="27.2" cy="25" r="1" fill="white"/>
        <circle cx="37.2" cy="25" r="1" fill="white"/>
        <ellipse cx="31" cy="34" rx="7" ry="5.5" fill="#D8C8B0"/>
        <ellipse cx="31" cy="30.5" rx="3" ry="2.2" fill="#A08870"/>
        <path d="M28 33 Q31 35 34 33" stroke="#A08870" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
        <ellipse cx="20" cy="55" rx="6" ry="4" fill="#D8C8B0"/>
        <ellipse cx="42" cy="55" rx="6" ry="4" fill="#D8C8B0"/>
        {accessory==="☕"&&<g><path d="M45 30 q-1.6 -2.6 0.6 -4.2" stroke="#CFC3AE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".75"/><path d="M49 29.5 q-1.6 -2.6 0.6 -4.2" stroke="#CFC3AE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".75"/><path d="M53.5 34 q4 0.2 4 3.6 t-4 3.6" stroke="#C9B79C" strokeWidth="1.8" fill="none"/><rect x="42" y="32.5" width="12" height="11" rx="2.4" fill="#F3EEE4" stroke="#C2AE92" strokeWidth="1"/><path d="M43.2 34.5 h9.6 v1.4 q-4.8 1.4 -9.6 0 Z" fill="#6F4A2E"/></g>}
        {accessory==="🍯"&&<g><rect x="43" y="30" width="13" height="2.8" rx="1.4" fill="#CE9038"/><path d="M44 32.6 Q43.4 41 49.5 42.4 Q55.6 41 55 32.6 Z" fill="#E2A24E"/><path d="M44.5 35.2 Q49.5 37 54.5 35.2" stroke="#C6852F" strokeWidth="0.8" fill="none" opacity=".55"/><rect x="48.7" y="25" width="1.6" height="5.5" rx="0.8" fill="#9A6B3A"/><circle cx="49.5" cy="24.5" r="2" fill="#B07C44"/><path d="M49.5 26.4 q-0.9 2 0 3.8 q0.9 -1.8 0 -3.8 Z" fill="#F4C24E"/></g>}
        {accessory==="👨‍🍳"&&<g><ellipse cx="31" cy="7" rx="9" ry="5.5" fill="#FBFAF6"/><ellipse cx="23" cy="9" rx="4.5" ry="4" fill="#FBFAF6"/><ellipse cx="39" cy="9" rx="4.5" ry="4" fill="#FBFAF6"/><rect x="23" y="10.5" width="16" height="4.5" rx="1.5" fill="#ECE6DA"/></g>}
      </svg>
    ),
    plant:(
      <svg width={s} height={s} viewBox="0 0 62 62" fill="none">
        <ellipse cx="31" cy="50" rx="9" ry="6" fill="#C4A870"/>
        <rect x="28.5" y="28" width="5" height="22" rx="2.5" fill="#8CAA78"/>
        <ellipse cx="31" cy="28" rx="12" ry="14" fill={accent}/>
        <ellipse cx="22" cy="34" rx="8" ry="10" fill={accent} opacity=".7" transform="rotate(-20,22,34)"/>
        <ellipse cx="40" cy="34" rx="8" ry="10" fill={accent} opacity=".7" transform="rotate(20,40,34)"/>
        <ellipse cx="31" cy="17" rx="7" ry="9" fill={accent} opacity=".85"/>
        {accessory==="🦋"&&<g><ellipse cx="46" cy="15" rx="1.1" ry="4.2" fill="#5B4A66"/><path d="M46 12 C40 6 37 11 39 14 C40.5 16 44 15.5 46 14 Z" fill="#8FB8E6"/><path d="M46 12 C52 6 55 11 53 14 C51.5 16 48 15.5 46 14 Z" fill="#8FB8E6"/><path d="M46 15 C42 18 40 21 42.5 22 C44.5 22.6 46 18.5 46 16.5 Z" fill="#B6D4F2"/><path d="M46 15 C50 18 52 21 49.5 22 C47.5 22.6 46 18.5 46 16.5 Z" fill="#B6D4F2"/><circle cx="42" cy="11" r="1.2" fill="#FBFAF6" opacity=".85"/><circle cx="50" cy="11" r="1.2" fill="#FBFAF6" opacity=".85"/><circle cx="43.2" cy="19.5" r="0.9" fill="#FBFAF6" opacity=".8"/><circle cx="48.8" cy="19.5" r="0.9" fill="#FBFAF6" opacity=".8"/><path d="M46 11.5 Q44 8 42.6 7.6" stroke="#5B4A66" strokeWidth="0.6" fill="none" strokeLinecap="round"/><path d="M46 11.5 Q48 8 49.4 7.6" stroke="#5B4A66" strokeWidth="0.6" fill="none" strokeLinecap="round"/><circle cx="42.6" cy="7.5" r="0.7" fill="#5B4A66"/><circle cx="49.4" cy="7.5" r="0.7" fill="#5B4A66"/></g>}
        {accessory==="💧"&&<ellipse cx="50" cy="18" rx="4" ry="6" fill="#A8D8F0" opacity=".7"/>}
        {accessory==="☀️"&&<g><ellipse cx="31" cy="13" rx="13" ry="3.4" fill="#E8C878"/><ellipse cx="31" cy="9.5" rx="6" ry="4" fill="#E0BC68"/><path d="M25 11 Q31 13.5 37 11" stroke="#C89850" strokeWidth="1.4" fill="none"/></g>}
      </svg>
    ),
  };
  return body[id]||body.cat;
}
function RoomScene({season,friendLevel,accent,compId,compAnim,compMsg,accessory,font,onPetClick}){
  const wallColor={spring:"#F7F0F2",summer:"#F7F0E8",autumn:"#F2ECE4",winter:"#EEEEF6"}[season];
  const floorColor={spring:"#EAE2D6",summer:"#EAE0D2",autumn:"#E2D6C6",winter:"#DEE0E8"}[season];
  const showPoster=friendLevel>=2, showRug=friendLevel>=3, showFairy=friendLevel>=4;
  const ss=SEASONS[season];
  const seasonDesk={
    spring:(<><div style={{position:"absolute",bottom:40,right:48,width:11,height:26,background:"#7AAA68",borderRadius:"5px 5px 0 0",opacity:.75}}/><div style={{position:"absolute",bottom:62,right:43,width:22,height:22,borderRadius:"50%",background:accent,opacity:.55}}/></>),
    summer:(<><div style={{position:"absolute",bottom:40,right:44,width:18,height:32,background:"#A8CCE8",borderRadius:"3px 3px 10px 10px",opacity:.75}}/><div style={{position:"absolute",bottom:70,right:47,width:14,height:6,background:"#88B0D0",borderRadius:3,opacity:.6}}/></>),
    autumn:(<><div style={{position:"absolute",bottom:40,right:42,width:28,height:28,background:"#C8A070",borderRadius:"0 0 6px 6px",opacity:.7}}/><div style={{position:"absolute",bottom:65,right:42,width:26,height:8,background:"#B89060",borderRadius:"50% 50% 0 0",opacity:.65}}/></>),
    winter:(<><div style={{position:"absolute",bottom:40,right:42,width:24,height:32,background:"#C8A870",borderRadius:"0 0 6px 6px",opacity:.65}}/><div style={{position:"absolute",bottom:70,right:43,width:22,height:8,background:"#B89060",borderRadius:"50% 50% 0 0",opacity:.6}}/><div style={{position:"absolute",bottom:40,right:68,width:32,height:14,borderRadius:7,background:"#D0C4C0",opacity:.55}}/></>),
  }[season];
  return(
    <div style={{position:"relative",borderRadius:"18px 18px 0 0",overflow:"hidden",background:wallColor,height:188}}>
      <div style={{position:"absolute",top:14,left:18,width:60,height:52,background:"#D8EAF8",borderRadius:5,border:`1.5px solid ${P.border}`,overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"50%",width:1.5,height:"100%",background:P.border,opacity:.4,transform:"translateX(-50%)"}}/>
        <div style={{position:"absolute",top:"50%",left:0,width:"100%",height:1.5,background:P.border,opacity:.4,transform:"translateY(-50%)"}}/>
        {season==="spring"&&<><div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:"#C8D8A8",opacity:.55}}/><div style={{position:"absolute",top:5,left:8,width:12,height:12,borderRadius:"50%",background:"#F4C8D8",opacity:.6}}/></>}
        {season==="summer"&&<><div style={{position:"absolute",top:5,right:5,width:16,height:16,borderRadius:"50%",background:"#F8E060",opacity:.55}}/><div style={{position:"absolute",bottom:0,left:0,right:0,height:14,background:"#C8D8A8",opacity:.4}}/></>}
        {season==="autumn"&&<><div style={{position:"absolute",bottom:0,left:0,right:0,height:18,background:"#C87030",opacity:.35}}/><div style={{position:"absolute",top:6,right:6,width:10,height:10,borderRadius:"50%",background:"#E8C870",opacity:.45}}/></>}
        {season==="winter"&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#E0ECF8",opacity:.35}}/>}
      </div>
      {showPoster&&<div style={{position:"absolute",top:12,left:88,width:38,height:46,background:P.paper,borderRadius:3,border:`1.5px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.65}}>{season==="spring"?"🌸":season==="summer"?"🌻":season==="autumn"?"🍂":"❄️"}</div>}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:44,background:floorColor,borderTop:`1.5px solid ${P.border}`,opacity:.85}}/>
      {showRug&&<div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",width:210,height:20,borderRadius:10,background:accent,opacity:.14}}/>}
      <div style={{position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)",width:270,height:13,background:"#C8A870",borderRadius:3,opacity:.7}}/>
      <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-196px)",width:10,height:24,background:"#C8A870",borderRadius:2,opacity:.55}}/>
      <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(186px)",width:10,height:24,background:"#C8A870",borderRadius:2,opacity:.55}}/>
      <div style={{position:"absolute",bottom:43,left:"50%",transform:"translateX(-108px)"}}>
        <div style={{display:"flex",gap:2,alignItems:"flex-end"}}>
          <div style={{width:13,height:30,background:"#B89B72",borderRadius:"2px 2px 0 0",opacity:.7}}/>
          <div style={{width:11,height:24,background:"#8CA98D",borderRadius:"2px 2px 0 0",opacity:.7}}/>
          <div style={{width:10,height:28,background:"#8FA6B8",borderRadius:"2px 2px 0 0",opacity:.7}}/>
        </div>
      </div>
      {seasonDesk}
      <div style={{position:"absolute",bottom:44,right:16,transform:"scale(.45)",transformOrigin:"bottom right"}}>{renderComp("plant",accent,60)}</div>
      <div style={{position:"absolute",bottom:38,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <div onClick={onPetClick} className={`pet ${compAnim}`} style={{color:accent,filter:"drop-shadow(0 2px 4px rgba(0,0,0,.07))",cursor:"pointer"}}>{renderComp(compId,accent,56,accessory)}</div>
        <div style={{background:"rgba(255,253,248,.9)",borderRadius:10,padding:"4px 11px",maxWidth:185,border:`1px solid ${P.border}`}}>
          <p key={compMsg} className="comp-msg" style={{fontSize:11,color:P.sub,fontStyle:"italic",fontFamily:font.sans,lineHeight:1.45,textAlign:"center"}}>"{compMsg}"</p>
        </div>
      </div>
      {showFairy&&<div style={{position:"absolute",top:8,left:100,right:14,height:18,display:"flex",gap:12,alignItems:"center"}}>{[...Array(9)].map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:["#F4B8CC","#F8E060","#A8CCE8","#C8D8A8"][i%4],opacity:.75}}/>)}</div>}
    </div>
  );
}
function Particles({season}){
  const ref=useRef(null);
  useEffect(()=>{
    const ss=SEASONS[season],cv=ref.current;if(!cv)return;
    const ctx=cv.getContext("2d");cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;
    const type=ss.pt,cols=ss.pc,n=type==="fireflies"?10:type==="snow"?25:15;
    const pts=Array.from({length:n},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,sz:type==="fireflies"?1.5+Math.random()*2:type==="snow"?1.5+Math.random()*3:3+Math.random()*4,vx:(Math.random()-.5)*.25,vy:type==="fireflies"?(Math.random()-.5)*.18:.15+Math.random()*.28,col:cols[Math.floor(Math.random()*cols.length)],op:.12+Math.random()*.35,rot:Math.random()*Math.PI*2,rv:(Math.random()-.5)*.015,ph:Math.random()*Math.PI*2}));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);const t2=Date.now()/1000;
      pts.forEach(p=>{ctx.save();
        if(type==="fireflies"){const g=.25+.65*Math.abs(Math.sin(t2*1.1+p.ph));ctx.globalAlpha=g*.4;ctx.shadowColor=p.col;ctx.shadowBlur=7;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();p.x+=p.vx+Math.sin(t2*.5+p.ph)*.18;p.y+=p.vy+Math.cos(t2*.4+p.ph)*.1;}
        else if(type==="snow"){ctx.globalAlpha=p.op*.6;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();p.x+=p.vx+Math.sin(t2*.25+p.ph)*.18;p.y+=p.vy;}
        else if(type==="petals"){ctx.globalAlpha=p.op*.45;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*.5,0,0,Math.PI*2);ctx.fill();p.x+=p.vx+Math.sin(t2*.35+p.ph)*.28;p.y+=p.vy;p.rot+=p.rv;}
        else{ctx.globalAlpha=p.op*.48;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.beginPath();ctx.moveTo(0,-p.sz);ctx.bezierCurveTo(p.sz*.6,-p.sz*.6,p.sz*.6,0,0,p.sz*.4);ctx.bezierCurveTo(-p.sz*.6,0,-p.sz*.6,-p.sz*.6,0,-p.sz);ctx.fill();p.x+=p.vx+Math.sin(t2*.25+p.ph)*.22;p.y+=p.vy;p.rot+=p.rv;}
        ctx.restore();
        if(p.y>cv.height+20){p.y=-20;p.x=Math.random()*cv.width;}
        if(p.x<-20)p.x=cv.width+20;if(p.x>cv.width+20)p.x=-20;
      });raf=requestAnimationFrame(draw);};
    draw();return()=>cancelAnimationFrame(raf);
  },[season]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1}}/>;
}
const MSGS={
  cat:{open:{en:["Ready to make today count?","A fresh page, just for you."],zh:["準備好讓今天充實了嗎？","嶄新的一頁，就為你而開。"]},morning:{en:["What matters most today?"],zh:["今天最重要的事是什麼？"]},afternoon:{en:["You're doing wonderfully."],zh:["你做得很好。"]},evening:{en:["What went well today?"],zh:["今天有什麼進展？"]},addTask:{en:["Great. Let's get that done."],zh:["好的，我們來完成它。"]},complete:{en:["Everything done. So proud of you."],zh:["全部完成了，為你感到驕傲。"]},win:{en:["That's worth remembering."],zh:["這值得記住。"]},nextDay:{en:["See you tomorrow."],zh:["明天見。"]}},
  dog:{open:{en:["So happy you're here!"],zh:["超開心你來了！"]},morning:{en:["What are we doing today?"],zh:["今天要做什麼呢？"]},afternoon:{en:["Still going strong!"],zh:["繼續加油！"]},evening:{en:["You deserve all the rest."],zh:["你值得好好休息。"]},addTask:{en:["On it!"],zh:["記住了！"]},complete:{en:["All done! Amazing!"],zh:["全部完成！太棒了！"]},win:{en:["That's wonderful!"],zh:["太棒了！"]},nextDay:{en:["See you tomorrow!"],zh:["明天見！"]}},
  bunny:{open:{en:["A new hop forward!"],zh:["又向前跳了一步！"]},morning:{en:["What's your first hop today?"],zh:["今天第一步是什麼？"]},afternoon:{en:["You're closer than you think."],zh:["你比想像中更接近目標。"]},evening:{en:["A cozy evening for reflection."],zh:["舒適的夜晚值得回顧。"]},addTask:{en:["Added!"],zh:["加上了！"]},complete:{en:["You hopped through everything!"],zh:["你完成了所有的事！"]},win:{en:["Moments like this matter."],zh:["這樣的時刻很重要。"]},nextDay:{en:["Rest well."],zh:["好好休息。"]}},
  fox:{open:{en:["Sharp mind, warm heart."],zh:["清晰的思維，溫暖的心。"]},morning:{en:["What matters most right now?"],zh:["現在最重要的是什麼？"]},afternoon:{en:["Trust your process."],zh:["相信你的過程。"]},evening:{en:["What did today teach you?"],zh:["今天教了你什麼？"]},addTask:{en:["Noted."],zh:["記下了。"]},complete:{en:["Sharp work. Every task handled."],zh:["精彩的表現，每個任務都完成了。"]},win:{en:["That's the kind of thing that stays."],zh:["這是值得珍藏的時刻。"]},nextDay:{en:["Rest well."],zh:["好好休息。"]}},
  bear:{open:{en:["A warm hug for you."],zh:["給你一個溫暖的擁抱。"]},morning:{en:["Start warm. Stay cozy."],zh:["溫暖地開始，舒適地進行。"]},afternoon:{en:["Every step counts."],zh:["每一步都算數。"]},evening:{en:["Be soft with yourself."],zh:["對自己溫柔一點。"]},addTask:{en:["Got it."],zh:["記下了。"]},complete:{en:["Done with care. So proud."],zh:["用心完成了，好驕傲。"]},win:{en:["Hold onto that warmth."],zh:["緊握那份溫暖。"]},nextDay:{en:["Sleep well."],zh:["好好睡覺。"]}},
  plant:{open:{en:["A new day to grow."],zh:["新的一天，繼續成長。"]},morning:{en:["What will you grow toward?"],zh:["今天要往哪個方向成長？"]},afternoon:{en:["Growing quietly, steadily."],zh:["安靜地，穩定地成長中。"]},evening:{en:["Rest is growth too."],zh:["休息也是成長的一部分。"]},addTask:{en:["Planting a seed."],zh:["種下了一顆種子。"]},complete:{en:["Full bloom today!"],zh:["今天全開花了！"]},win:{en:["Growth you can see."],zh:["看得見的成長。"]},nextDay:{en:["Rest and grow."],zh:["休息，然後繼續成長。"]}},
};
const getMsg=(id,key,l)=>{const d=MSGS[id]?.[key];if(!d)return"";const a=d[l]||d.en;return a[Math.floor(Math.random()*a.length)];};
const QUOTES={en:["Small steps every day lead to big changes.","Progress, not perfection.","Keep growing, little by little.","Breathe. You are doing better than you think.","Kindness to yourself is productivity too.","You are enough, exactly as you are.","Be gentle with yourself today."],zh:["今天的一小步，就是明天的一大步。","你比自己想像中更棒。","慢慢來，也是在前進。","相信自己，你可以做到。","對自己溫柔，也是一種勇氣。","今天的努力是明天的驕傲。"]};
const FQS={en:["What is one thing that would make today feel successful?","What small act of care can you give yourself today?","What would make today feel meaningful?"],zh:["什麼事情會讓今天感覺成功？","你今天能給自己什麼小小的關心？","什麼事情會讓今天感覺有意義？"]};
function MusicPlayer({track,playing,loading,errMsg,muted,volume,cat,onPlay,onPrev,onNext,onMute,onVol,onCat,accent,font,l}){
  const [mini,setMini]=useState(false);
  const [showC,setShowC]=useState(false);
  const [pos,setPos]=useState(null);
  const rootRef=useRef(null);
  const dragRef=useRef(null);
  const cur=MCATS.find(c=>c.id===cat)||MCATS[0];
  const onMove=(e)=>{const d=dragRef.current;if(!d)return;let x=e.clientX-d.dx,y=e.clientY-d.dy;x=Math.max(6,Math.min(window.innerWidth-d.w-6,x));y=Math.max(6,Math.min(window.innerHeight-d.h-6,y));setPos({x,y});};
  const endDrag=()=>{dragRef.current=null;window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",endDrag);};
  const startDrag=(e)=>{const el=rootRef.current;if(!el)return;const r=el.getBoundingClientRect();dragRef.current={dx:e.clientX-r.left,dy:e.clientY-r.top,w:r.width,h:r.height};window.addEventListener("pointermove",onMove);window.addEventListener("pointerup",endDrag);};
  const W=mini?56:252;
  const posStyle=pos?{left:pos.x,top:pos.y}:{right:14,bottom:14};
  const ctrlBtn={background:"none",border:"none",cursor:"pointer",color:P.sub,fontSize:19,lineHeight:1,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12};
  return(
    <div ref={rootRef} style={{position:"fixed",zIndex:300,background:P.card,border:`1px solid ${P.border}`,borderRadius:18,width:W,boxShadow:"0 4px 22px rgba(47,52,58,.1)",overflow:"hidden",...posStyle}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:mini?"8px":"9px 10px",borderBottom:mini?"none":`1px solid ${P.border}`}}>
        <div onPointerDown={startDrag} style={{flex:1,display:"flex",alignItems:"center",gap:7,minWidth:0,cursor:"grab",touchAction:"none"}}>
          {mini?<svg width="22" height="22" viewBox="0 0 24 24" style={{color:accent}}><path d="M9 18V6l10-2v10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="16.5" cy="16" r="2.6" fill="currentColor"/></svg>:<span style={{color:P.muted,fontSize:14,letterSpacing:-2,userSelect:"none"}}>⠿</span>}
          {!mini&&<div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:11.5,fontWeight:500,color:P.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:font.sans}}>{track.t}</p>
            <p style={{fontSize:9.5,color:errMsg?"#C07060":loading?"#B89B72":P.muted,fontFamily:font.sans}}>{errMsg||(loading?"…":cur.icon+" "+(l==="zh"?cur.labelZh:cur.label))}</p>
          </div>}
        </div>
        <button onClick={()=>setMini(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,padding:5,fontSize:13,flexShrink:0}}>{mini?"↗":"↙"}</button>
      </div>
      {!mini&&<>
        <div style={{padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:9}}>
            <button onClick={onPrev} style={ctrlBtn}><svg width="19" height="19" viewBox="0 0 24 24"><path d="M7.5 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 5.5L9.5 12 19 18.5z" fill="currentColor"/></svg></button>
            <button onClick={onPlay} style={{background:accent,border:"none",cursor:"pointer",color:"#FFFDF8",width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{playing?<svg width="15" height="15" viewBox="0 0 24 24"><rect x="6" y="5" width="4.2" height="14" rx="1.3" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.3" fill="currentColor"/></svg>:<svg width="15" height="15" viewBox="0 0 24 24" style={{marginLeft:"2px"}}><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg>}</button>
            <button onClick={onNext} style={ctrlBtn}><svg width="19" height="19" viewBox="0 0 24 24"><path d="M16.5 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 5.5L14.5 12 5 18.5z" fill="currentColor"/></svg></button>
            <button onClick={onMute} style={ctrlBtn}>{muted?<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/><path d="M16 9.5l4 5M20 9.5l-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>:<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9.2a4 4 0 010 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{color:P.muted,flexShrink:0}}><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/></svg>
            <input type="range" min="0" max="1" step=".05" value={volume} onChange={e=>onVol(parseFloat(e.target.value))} style={{flex:1,accentColor:accent,height:6,cursor:"pointer"}}/>
          </div>
          <button onClick={()=>setShowC(v=>!v)} style={{background:P.light,border:`1px solid ${P.border}`,borderRadius:8,padding:"6px 10px",fontSize:11,color:P.sub,cursor:"pointer",width:"100%",fontFamily:font.sans}}>{cur.icon} {l==="zh"?cur.labelZh:cur.label} ▾</button>
        </div>
        {showC&&<div style={{padding:"4px 8px 8px",borderTop:`1px solid ${P.border}`,maxHeight:180,overflowY:"auto"}}>
          {MCATS.map(c=><button key={c.id} onClick={()=>{onCat(c.id);setShowC(false);}} style={{display:"block",width:"100%",textAlign:"left",background:cat===c.id?P.light:"none",border:"none",borderRadius:7,padding:"7px 9px",fontSize:11.5,color:cat===c.id?P.text:P.muted,cursor:"pointer",fontFamily:font.sans}}>{c.icon} {l==="zh"?c.labelZh:c.label}</button>)}
        </div>}
      </>}
    </div>
  );
}
function JournalModal({onClose,font,accent,t,l}){
  const hist=getHistory();
  const now=new Date();
  const [view,setView]=useState({y:now.getFullYear(),m:now.getMonth()});
  const [sel,setSel]=useState(null);
  const pad=n=>String(n).padStart(2,"0");
  const keyOf=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
  const {y,m}=view;
  const firstDow=new Date(y,m,1).getDay();
  const daysIn=new Date(y,m+1,0).getDate();
  const todayK=new Date().toISOString().slice(0,10);
  const wdLabels=l==="zh"?["日","一","二","三","四","五","六"]:["Su","Mo","Tu","We","Th","Fr","Sa"];
  const monthLabel=new Date(y,m,1).toLocaleDateString(l==="zh"?"zh-TW":"en-US",{year:"numeric",month:"long"});
  const curY=now.getFullYear(),curM=now.getMonth();
  const atCurrent=(y>curY)||(y===curY&&m>=curM);
  const prevM=()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1});
  const nextM=()=>{if(atCurrent)return;setView(v=>v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1});};
  const cells=[];for(let i=0;i<firstDow;i++)cells.push(null);for(let d=1;d<=daysIn;d++)cells.push(d);
  const selData=sel?hist[sel]:null;
  const lblS={fontSize:10,fontWeight:600,letterSpacing:1.2,color:P.muted,textTransform:"uppercase",fontFamily:font.sans};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(47,52,58,.25)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}} onClick={onClose}>
      <div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:22,padding:24,maxWidth:420,width:"94%",maxHeight:"82vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div><p style={{fontFamily:font.serif,fontSize:20,color:P.text}}>{t.journalTitle}</p><p style={{fontSize:11,color:P.muted,fontFamily:font.sans,marginTop:2}}>{t.journalSub}</p></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:18}}>✕</button>
        </div>
        {sel?(()=>{
          const parts=sel.split("-").map(Number);const dt=new Date(parts[0],parts[1]-1,parts[2]);
          const d=selData||{};const done=(d.tasks||[]).filter(x=>x.done);
          const empty=done.length===0&&!d.win&&!d.photo;
          return(
            <div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",color:accent,fontFamily:font.sans,fontSize:12,fontWeight:600,marginBottom:12,padding:0}}>‹ {l==="zh"?"返回月曆":"Back to calendar"}</button>
              <div style={{background:P.paper,border:`1px solid ${P.lined}`,borderRadius:14,padding:"14px 16px",borderLeft:`3px solid ${accent}`}}>
                <p style={{fontSize:12,fontWeight:600,color:P.text,fontFamily:font.sans,marginBottom:8}}>{dt.toLocaleDateString(l==="zh"?"zh-TW":"en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
                {d.photo&&<div style={{marginBottom:10}}><img src={d.photo} alt="" style={{width:"100%",maxHeight:170,objectFit:"cover",borderRadius:10,border:`1px solid ${P.border}`}}/></div>}
                {done.length>0&&<div style={{marginBottom:8}}><p style={{...lblS,marginBottom:5}}>{t.completed}</p>{done.map(x=><div key={x.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{color:P.sage,fontSize:11}}>✓</span><span style={{fontSize:13,color:P.sub,fontFamily:font.sans}}>{x.name}</span></div>)}</div>}
                {d.win&&<div style={{borderTop:`1px dashed ${P.border}`,paddingTop:8,marginTop:6}}><p style={{fontFamily:font.serif,fontSize:14,color:P.text,fontStyle:"italic",lineHeight:1.65}}>"{d.win}"</p></div>}
                {empty&&<p style={{fontFamily:font.serif,fontSize:13,color:P.muted,fontStyle:"italic"}}>{t.noHistory}</p>}
              </div>
            </div>
          );
        })():(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button onClick={prevM} style={{background:P.light,border:`1px solid ${P.border}`,borderRadius:8,cursor:"pointer",color:P.sub,width:28,height:28,fontSize:14}}>‹</button>
              <p style={{fontFamily:font.serif,fontSize:15,color:P.text}}>{monthLabel}</p>
              <button onClick={nextM} disabled={atCurrent} style={{background:P.light,border:`1px solid ${P.border}`,borderRadius:8,cursor:atCurrent?"default":"pointer",color:P.sub,width:28,height:28,fontSize:14,opacity:atCurrent?.35:1}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
              {wdLabels.map((w,i)=><div key={i} style={{textAlign:"center",fontSize:9.5,color:P.muted,fontFamily:font.sans,fontWeight:600}}>{w}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {cells.map((d,i)=>{
                if(d===null)return<div key={i}/>;
                const k=keyOf(y,m,d);const entry=hist[k];
                const hasData=!!(entry&&((entry.tasks||[]).some(x=>x.done)||entry.win||entry.photo));
                const isToday=k===todayK;const future=k>todayK;
                return(
                  <button key={i} disabled={!hasData} onClick={()=>setSel(k)} style={{position:"relative",aspectRatio:"1",border:isToday?`1.5px solid ${accent}`:`1px solid ${hasData?P.border:"transparent"}`,background:hasData?P.light:"transparent",borderRadius:9,cursor:hasData?"pointer":"default",color:future?P.border:P.sub,fontFamily:font.sans,fontSize:12,fontWeight:hasData?600:400,display:"flex",alignItems:"center",justifyContent:"center",opacity:future?.5:1}}>
                    {d}
                    {hasData&&<span style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:accent}}/>}
                  </button>
                );
              })}
            </div>
            <p style={{fontSize:10,color:P.muted,fontFamily:font.sans,marginTop:12,textAlign:"center"}}>{l==="zh"?"點選有圓點的日子查看日記":"Tap a dotted day to read its journal"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(){
  const [lang,setLang]=useState(()=>S.get("mlc_lang",""));
  const [userName,setUserName]=useState(()=>S.get("mlc_name",""));
  const [compId,setCompId]=useState(()=>S.get("mlc_companion","cat"));
  const [onbStep,setOnbStep]=useState(0);
  const [nameInput,setNameInput]=useState("");
  const [entered,setEntered]=useState(false);
  const [season,setSeason]=useState(()=>S.get("mlc_season")||getSeason());
  const [fontId,setFontId]=useState(()=>S.get("mlc_font","dm"));
  const [tasks,setTasks]=useState(()=>S.get("mlc_tasks",[]));
  const [win,setWin]=useState(()=>S.get("mlc_win",""));
  const [winDraft,setWinDraft]=useState("");
  const [editingWin,setEditingWin]=useState(false);
  const [focus,setFocus]=useState(()=>S.get("mlc_focus",""));
  const [focusDraft,setFocusDraft]=useState("");
  const [editingFocus,setEditingFocus]=useState(false);
  const [vibe,setVibe]=useState(()=>S.get("mlc_vibe",""));
  const [photo,setPhoto]=useState(()=>S.get("mlc_photo",""));
  const [compMsg,setCompMsg]=useState("");
  const [compAnim,setCompAnim]=useState("float");
  const [showReward,setShowReward]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [newTask,setNewTask]=useState("");
  const [newPri,setNewPri]=useState("medium");
  const [newCat,setNewCat]=useState("personal");
  const [showSettings,setShowSettings]=useState(false);
  const [showJournal,setShowJournal]=useState(false);
  const [showNextDay,setShowNextDay]=useState(false);
  const [editingName,setEditingName]=useState(false);
  const [showReset,setShowReset]=useState(false);
  const [backupText,setBackupText]=useState("");
  const [syncUser,setSyncUser]=useState(null);
  const [syncMsg,setSyncMsg]=useState("");
  const [showSystem,setShowSystem]=useState(false);
  const [showWardrobe,setShowWardrobe]=useState(false);
  const [editingTaskId,setEditingTaskId]=useState(null);
  const [editTaskDraft,setEditTaskDraft]=useState("");
  const [checkFx,setCheckFx]=useState(0);
  const [chosenAcc,setChosenAcc]=useState(()=>S.get("mlc_acc","auto"));
  const [streak,setStreak]=useState(()=>getStreak().count||1);
  const [friendship,setFriendship]=useState(()=>getFriendship());
  const [musicCat,setMusicCat]=useState(()=>S.get("mlc_mcat","random"));
  const [track,setTrack]=useState(()=>pickT(S.get("mlc_mcat","random")));
  const [playing,setPlaying]=useState(false);
  const [audioLoading,setAudioLoading]=useState(false);
  const [audioErr,setAudioErr]=useState("");
  const [muted,setMuted]=useState(false);
  const [volume,setVolume]=useState(.45);
  const cf=useRef(0),audioRef=useRef(null),animT=useRef(null),rwdT=useRef(null),asT=useRef(null),photoRef=useRef(null),fxT=useRef(null),pushT=useRef(null);
  const l=lang==="zh"?"zh":"en";
  const t=T[l];
  const ss=SEASONS[season];
  const font=FONTS.find(f=>f.id===fontId)||FONTS[0];
  const accent=ss.accent;
  const name=userName||"Friend";
  const hour=new Date().getHours();
  const tod=hour<12?"morning":hour<17?"afternoon":"evening";
  const timeName=t.greet(hour);
  const dateStr=new Date().toLocaleDateString(l==="zh"?"zh-TW":"en-US",{weekday:"long",month:"long",day:"numeric"});
  const [quote]=useState(()=>{const q=QUOTES[l]||QUOTES.en;return q[Math.floor(Math.random()*q.length)];});
  const [focusQ]=useState(()=>{const q=FQS[l]||FQS.en;return q[Math.floor(Math.random()*q.length)];});
  const accessory=useMemo(()=>{const list=ACCESSORIES[compId]||ACCESSORIES.cat;const unlocked=list.filter(a=>friendship.points>=a.pts);if(chosenAcc&&chosenAcc!=="none"&&chosenAcc!=="auto"&&unlocked.some(a=>a.emoji===chosenAcc))return chosenAcc;return "";},[compId,friendship.points,chosenAcc]);
  const yesterday=useMemo(()=>{const h=getHistory();return h[dAgo(1)]||null;},[]);
  const yesterdayDone=useMemo(()=>yesterday?(yesterday.tasks||[]).filter(x=>x.done):[],[yesterday]);
  const companions=["cat","dog","bunny","fox","bear","plant"];
  useEffect(()=>{
    if(!lang){setOnbStep(0);}
    else if(!userName){setOnbStep(1);}
    else if(!S.get("mlc_cset",false)){setOnbStep(2);}
    else if(!entered){setOnbStep(3);}
    else{setOnbStep(4);}
  },[lang,userName,entered]);
  useEffect(()=>{S.set("mlc_tasks",tasks);},[tasks]);
  useEffect(()=>{S.set("mlc_win",win);},[win]);
  useEffect(()=>{S.set("mlc_focus",focus);},[focus]);
  useEffect(()=>{S.set("mlc_vibe",vibe);},[vibe]);
  useEffect(()=>{S.set("mlc_photo",photo);},[photo]);
  useEffect(()=>{S.set("mlc_font",fontId);},[fontId]);
  useEffect(()=>{S.set("mlc_season",season);},[season]);
  useEffect(()=>{S.set("mlc_companion",compId);},[compId]);
  useEffect(()=>{S.set("mlc_acc",chosenAcc);},[chosenAcc]);
  useEffect(()=>{S.set("mlc_mcat",musicCat);},[musicCat]);
  useEffect(()=>{let el=document.getElementById("mlc-font");if(!el){el=document.createElement("link");el.id="mlc-font";el.rel="stylesheet";document.head.appendChild(el);}el.href=font.url;},[font]);
  useEffect(()=>{if(audioRef.current)audioRef.current.volume=muted?0:volume;},[volume,muted]);
  useEffect(()=>{clearTimeout(asT.current);asT.current=setTimeout(()=>saveDay({date:todayKey(),tasks,win,focus,vibe,photo,quote,companion:compId,season}),800);},[tasks,win,focus,vibe,photo]);
  useEffect(()=>{setCompMsg(getMsg(compId,"open",l));},[compId,l]);
  const triggerComp=(key,anim="bounce")=>{setCompMsg(getMsg(compId,key,l));setCompAnim(anim);clearTimeout(animT.current);animT.current=setTimeout(()=>setCompAnim("float"),1800);};
  const earnPoints=(pts,key)=>{const f=addFriendPoints(pts);setFriendship(f);triggerComp(key,"bounce");};
  const priOrder={high:0,medium:1,low:2};
  const done=tasks.filter(x=>x.done).length,total=tasks.length,pct=total===0?0:Math.round((done/total)*100),allDone=total>0&&done===total;
  const active=tasks.filter(x=>!x.done).sort((a,b)=>(priOrder[a.priority]??1)-(priOrder[b.priority]??1));
  const doneT=tasks.filter(x=>x.done);
  useEffect(()=>{if(allDone){earnPoints(10,"complete");setShowReward(true);rwdT.current=setTimeout(()=>setShowReward(false),4000);}else setShowReward(false);},[allDone]);
  const doPlay=()=>{if(!audioRef.current)return;setAudioLoading(true);setAudioErr("");audioRef.current.play().then(()=>{setAudioLoading(false);setPlaying(true);cf.current=0;}).catch(()=>{setAudioLoading(false);setPlaying(false);});};
  const enterCorner=()=>{checkDailyOpen();setFriendship(getFriendship());setStreak(bumpStreak());setEntered(true);setTimeout(doPlay,400);};
  const togglePlay=()=>{if(!audioRef.current)return;if(playing){audioRef.current.pause();setPlaying(false);}else doPlay();};
  const loadTr=tr=>{setTrack(tr);setAudioErr("");setAudioLoading(true);setTimeout(doPlay,80);};
  const onAErr=()=>{cf.current+=1;setAudioLoading(false);setPlaying(false);if(cf.current>=3){setAudioErr(t.musicNA);return;}setAudioErr(t.skipping);setTimeout(()=>{setAudioErr("");loadTr(pickT(musicCat,track));},1400);};
  const addTask=()=>{if(!newTask.trim())return;setTasks(p=>[{id:Date.now(),name:newTask.trim(),priority:newPri,category:newCat,done:false},...p]);setNewTask("");setShowAdd(false);earnPoints(2,"addTask");};
  const toggleTask=id=>{const tk=tasks.find(x=>x.id===id);const becomingDone=tk&&!tk.done;setTasks(p=>p.map(x=>x.id===id?{...x,done:!x.done}:x));triggerComp(tod,"bounce");if(becomingDone){setCheckFx(Date.now());clearTimeout(fxT.current);fxT.current=setTimeout(()=>setCheckFx(0),1100);}};
  const deleteTask=id=>setTasks(p=>p.filter(x=>x.id!==id));
  const saveTaskEdit=id=>{const v=editTaskDraft.trim();if(v)setTasks(p=>p.map(x=>x.id===id?{...x,name:v}:x));setEditingTaskId(null);};
  const saveWin=()=>{setWin(winDraft);setEditingWin(false);earnPoints(5,"win");};
  const saveFocus=()=>{setFocus(focusDraft);setEditingFocus(false);};
  const confirmNextDay=()=>{saveDay({date:todayKey(),tasks,win,focus,vibe,photo,quote,companion:compId,season});triggerComp("nextDay","bounce");setTasks(p=>p.filter(x=>!x.done));setWin("");setWinDraft("");setFocus("");setFocusDraft("");setVibe("");setPhoto("");setShowNextDay(false);loadTr(pickT(musicCat));};
  const pdot=p=>({low:P.sage,medium:P.brown,high:P.peach}[p]||P.muted);
  const handlePhoto=e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(file);};
  const saveName=n=>{if(n.trim()){setUserName(n.trim());S.set("mlc_name",n.trim());setEditingName(false);}};
  const doReset=()=>{try{Object.keys(localStorage).filter(k=>k.startsWith("mlc_")).forEach(k=>localStorage.removeItem(k));}catch{}setLang("");setUserName("");setCompId("cat");setOnbStep(0);setEntered(false);setTasks([]);setWin("");setFocus("");setVibe("");setPhoto("");setStreak(1);setFriendship({points:0,level:1,lastOpen:""});setShowReset(false);setShowSettings(false);};
  const exportData=()=>{try{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("mlc_")===0)o[k]=localStorage.getItem(k);}const code=btoa(unescape(encodeURIComponent(JSON.stringify(o))));setBackupText(code);try{navigator.clipboard.writeText(code);}catch(e){}}catch(e){}};
  const importData=()=>{try{const json=decodeURIComponent(escape(atob(backupText.trim())));const o=JSON.parse(json);Object.keys(o).forEach(k=>{if(k.indexOf("mlc_")===0)localStorage.setItem(k,o[k]);});location.reload();}catch(e){alert(l==="zh"?"代碼無效，請確認貼上完整的代碼。":"Invalid code — please paste the full backup code.");}};
  useEffect(()=>{ if(!_fbAuth)return; try{getRedirectResult(_fbAuth).catch(()=>{});}catch{} const unsub=onAuthStateChanged(_fbAuth,u=>setSyncUser(u||null)); return ()=>{try{unsub&&unsub();}catch{}}; },[]);
  useEffect(()=>{ if(!_fbDb||!syncUser){if(typeof window!=="undefined")window.__mlcPush=null;return;} const ref=doc(_fbDb,"states",syncUser.uid); const isEmpty=(o)=>{try{const tk=JSON.parse((o&&o["mlc_tasks"])||"[]");const h=JSON.parse((o&&o["mlc_h"])||"{}");return (!tk||tk.length===0)&&(!h||Object.keys(h).length===0);}catch(e){return true;}}; const push=()=>{setDoc(ref,{data:SYNC_DUMP(),ts:LOCAL_TS(),uid:syncUser.uid},{merge:true}).then(()=>setSyncMsg("ok")).catch(()=>setSyncMsg("err"));}; window.__mlcPush=()=>{clearTimeout(pushT.current);pushT.current=setTimeout(push,1200);}; let firstSnap=true; const unsub=onSnapshot(ref,snap=>{ const d=snap.exists()?snap.data():null; const cloud=d&&d.data?d.data:null; const local=SYNC_DUMP(); const same=cloud&&JSON.stringify(cloud)===JSON.stringify(local); if(firstSnap){ firstSnap=false; if(!cloud||isEmpty(cloud)){push();return;} if(same){setSyncMsg("ok");return;} if(isEmpty(local)){SYNC_WRITE(cloud);location.reload();return;} push(); return; } if(!cloud||same){setSyncMsg("ok");return;} if(Number(d.ts||0)>LOCAL_TS()){SYNC_WRITE(cloud);location.reload();}else{push();} },()=>setSyncMsg("err")); return ()=>{if(typeof window!=="undefined")window.__mlcPush=null;try{unsub&&unsub();}catch{}}; },[syncUser]);
  const doSignIn=()=>{ if(!_fbAuth||!_fbProvider)return; setSyncMsg("…"); const m=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); try{ if(m){signInWithRedirect(_fbAuth,_fbProvider);} else {signInWithPopup(_fbAuth,_fbProvider).catch(()=>setSyncMsg("err"));} }catch(e){setSyncMsg("err");} };
  const doSignOut=()=>{ if(!_fbAuth)return; try{signOut(_fbAuth);}catch(e){} };
  const friendMax=friendship.level===1?25:friendship.level===2?55:120;
  const friendBase=friendship.level===1?0:friendship.level===2?25:friendship.level===3?80:200;
  const friendPct=Math.min(100,Math.round(((friendship.points-friendBase)/friendMax)*100));
  const css=`
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes floatA{0%,100%{transform:translateY(0) rotate(-.4deg);}50%{transform:translateY(-5px) rotate(.4deg);}}
    @keyframes bounceA{0%{transform:scale(1);}30%{transform:scale(1.16) rotate(2.5deg);}60%{transform:scale(.97);}100%{transform:scale(1) rotate(0);}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-7px);}to{opacity:1;transform:translateX(0);}}
    @keyframes msgFade{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:translateY(0);}}
    @keyframes onbIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
    @keyframes glowP{0%,100%{box-shadow:0 0 0 0 transparent;}50%{box-shadow:0 0 20px 5px ${ss.glow};}}
    @keyframes popIn{0%{opacity:0;transform:scale(.6) translateY(10px);}60%{transform:scale(1.06) translateY(0);}100%{opacity:1;transform:scale(1);}}
    @keyframes rewardBounce{0%,100%{transform:translateY(0) rotate(0deg);}25%{transform:translateY(-15px) rotate(-7deg);}50%{transform:translateY(0) rotate(0deg);}75%{transform:translateY(-9px) rotate(7deg);}}
    .check-fx{position:fixed;left:0;right:0;bottom:46%;height:0;z-index:560;pointer-events:none;text-align:center;}
    .cfx{position:absolute;bottom:0;font-size:19px;animation:cfxUp 1.05s ease-out forwards;}
    @keyframes cfxUp{0%{opacity:0;transform:translateY(0) scale(.5) rotate(0deg);}25%{opacity:1;}100%{opacity:0;transform:translateY(-78px) scale(1.15) rotate(12deg);}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:0;}12%{opacity:1;}100%{transform:translateY(250px) rotate(420deg);opacity:0;}}
    @keyframes confettiFallFull{0%{transform:translateY(-10vh) rotate(0deg);opacity:0;}8%{opacity:1;}100%{transform:translateY(110vh) rotate(540deg);opacity:0;}}
    .reward-pop{animation:popIn .42s cubic-bezier(.2,.8,.3,1.2);}
    .reward-bounce{display:inline-block;animation:rewardBounce 1.1s ease-in-out infinite;}
    *{box-sizing:border-box;margin:0;padding:0;}
    .app{min-height:100vh;background:${P.bg};font-family:${font.sans};color:${P.text};}
    .serif{font-family:${font.serif};}
    .card{background:${P.card};border:1px solid ${P.border};border-radius:18px;padding:18px 20px;}
    .paper-card{background:${P.paper};border:1px solid ${P.lined};border-radius:14px;padding:17px 18px 17px 38px;position:relative;}
    .paper-card::before{content:"";position:absolute;left:30px;top:0;bottom:0;width:1px;background:${P.lined};opacity:.6;}
    .lbl{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${P.muted};margin-bottom:9px;font-family:${font.sans};}
    .task-row{display:flex;align-items:flex-start;gap:9px;padding:8px 0;border-bottom:1px solid ${P.border};animation:slideIn .2s ease;}
    .task-row:last-child{border-bottom:none;}
    .done-r{opacity:.34;}
    .chk{width:19px;height:19px;border-radius:50%;border:1.5px solid ${P.border};background:transparent;cursor:pointer;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .18s;}
    .chk:hover{border-color:${accent};}
    .chk.on{background:${accent};border-color:${accent};}
    .tname{font-size:13.5px;line-height:1.5;color:${P.text};font-family:${font.sans};}
    .done-r .tname{color:${P.muted};text-decoration:line-through;}
    .pill{font-size:10px;color:${P.muted};border:1px solid ${P.border};border-radius:50px;padding:1px 7px;font-family:${font.sans};}
    .del{background:none;border:none;cursor:pointer;color:${P.border};font-size:16px;padding:1px 4px;border-radius:5px;transition:color .2s;margin-left:auto;flex-shrink:0;line-height:1;}
    .del:hover{color:#C07060;}
    .edt{background:none;border:none;cursor:pointer;color:${P.border};font-size:13px;padding:1px 4px;border-radius:5px;transition:color .2s;margin-left:auto;flex-shrink:0;line-height:1;margin-top:3px;}
    .edt:hover{color:${accent};}
    .edit-inp{width:100%;border:1px solid ${accent};border-radius:7px;padding:4px 7px;font-size:13.5px;font-family:inherit;color:${P.text};background:${P.card};outline:none;box-sizing:border-box;}
    .btn{background:${accent};color:#FFFDF8;border:none;border-radius:10px;padding:9px 20px;font-family:${font.sans};font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;}
    .btn:hover{filter:brightness(.92);transform:translateY(-1px);}
    .btn-o{background:transparent;color:${P.sub};border:1px solid ${P.border};border-radius:10px;padding:8px 16px;font-family:${font.sans};font-size:13px;cursor:pointer;transition:all .18s;}
    .btn-o:hover{border-color:${accent};color:${P.text};}
    .inp{border:1px solid ${P.border};border-radius:10px;padding:8px 12px;font-family:${font.sans};font-size:14px;background:${P.card};color:${P.text};outline:none;transition:border .18s;width:100%;}
    .inp:focus{border-color:${accent};}
    .inp::placeholder{color:${P.muted};opacity:.65;}
    .sel{border:1px solid ${P.border};border-radius:10px;padding:7px 12px;font-family:${font.sans};font-size:13px;background:${P.card};color:${P.text};outline:none;cursor:pointer;}
    .ta{border:1px solid ${P.lined};border-radius:10px;padding:9px 12px;font-family:${font.serif};font-size:14.5px;font-style:italic;background:${P.paper};color:${P.text};outline:none;resize:none;width:100%;line-height:1.9;}
    .ta:focus{border-color:${accent};}
    .ta::placeholder{color:${P.muted};opacity:.65;}
    .overlay{position:fixed;inset:0;background:rgba(47,52,58,.25);display:flex;align-items:center;justify-content:center;z-index:400;animation:fadeIn .18s;}
    .modal{background:${P.card};border-radius:22px;padding:24px;max-width:410px;width:92%;border:1px solid ${P.border};animation:fadeUp .28s ease;}
    .pt{height:3px;background:${P.border};border-radius:50px;overflow:hidden;}
    .pf{height:100%;background:${accent};border-radius:50px;transition:width .7s ease;}
    .pet{display:inline-block;}
    .pet.float{animation:floatA 5.5s ease-in-out infinite;}
    .pet.bounce{animation:bounceA .5s ease;}
    .tbtn{border:1px solid ${P.border};border-radius:8px;padding:4px 10px;font-family:${font.sans};font-size:12px;background:transparent;color:${P.muted};cursor:pointer;transition:all .18s;}
    .tbtn.on{border-color:${accent};background:${P.light};color:${P.text};}
    .nbtn{display:flex;align-items:center;gap:5px;background:transparent;border:1px solid ${P.border};border-radius:9px;padding:7px 14px;font-family:${font.sans};font-size:13px;color:${P.sub};cursor:pointer;transition:all .18s;}
    .nbtn:hover{border-color:${accent};color:${P.text};}
    .ibtn{background:none;border:none;cursor:pointer;color:${P.muted};padding:4px;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:color .18s;}
    .ibtn:hover{color:${P.text};}
    .csel{border:1.5px solid ${P.border};border-radius:14px;padding:12px 8px;background:transparent;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:5px;}
    .csel:hover{border-color:${accent};}
    .csel.on{border-color:${accent};background:${P.light};}
    .vibe-btn{border:1px solid ${P.border};border-radius:50px;padding:4px 11px;font-family:${font.sans};font-size:11px;background:transparent;cursor:pointer;transition:all .18s;color:${P.sub};}
    .vibe-btn.on{border-color:${accent};background:${P.light};color:${P.text};}
    .glw{animation:glowP 3s ease-in-out infinite;}
    .comp-msg{animation:msgFade .38s ease;}
    .add-t-btn{background:none;border:1px dashed ${P.border};border-radius:10px;width:100%;padding:7px;font-family:${font.sans};font-size:13px;color:${P.muted};cursor:pointer;transition:all .18s;display:block;text-align:center;}
    .add-t-btn:hover{border-color:${accent};color:${P.text};}
    .onb{min-height:100vh;background:${P.bg};display:flex;align-items:center;justify-content:center;padding:20px;}
    .onb-c{background:${P.card};border:1px solid ${P.border};border-radius:24px;padding:34px 26px;max-width:430px;width:100%;text-align:center;animation:onbIn .45s ease;}
    .reset-btn{background:none;border:1px solid #E0B8B8;border-radius:10px;color:#C09090;padding:7px 14px;font-family:${font.sans};font-size:12px;cursor:pointer;width:100%;transition:all .18s;margin-top:8px;}
    .reset-btn:hover{background:#FDF0F0;border-color:#C08080;color:#A06060;}
  `;
  // ── ONBOARDING ────────────────────────────────────────────────────────────
  if(onbStep<4){
    if(onbStep===0) return(
      <div className="onb" style={{background:P.bg}}><style>{css}</style>
        <div className="onb-c">
          <div style={{marginBottom:18,display:"flex",justifyContent:"center"}}><div className="pet float" style={{color:P.sage}}>{renderComp("cat",P.sage,64)}</div></div>
          <h1 style={{fontFamily:font.serif,fontSize:27,fontWeight:500,color:P.text,marginBottom:4}}>My Little Corner</h1>
          <p style={{fontFamily:font.serif,fontSize:15,color:P.muted,marginBottom:5}}>我的小角落</p>
          <p style={{fontSize:12.5,color:P.muted,fontFamily:font.sans,marginBottom:24,lineHeight:1.7}}>A cozy place to be calm and productive<br/>— your gentle daily to-do list.<br/>一個可愛又有效率的小角落<br/>幫助你完成每日目標</p>
          <p style={{fontSize:13,color:P.sub,fontFamily:font.sans,marginBottom:12,fontWeight:500}}>Choose your language / 選擇語言</p>
          <div style={{display:"flex",gap:10}}>
            {[["en","English"],["zh","繁體中文"]].map(([lid,label])=>(
              <button key={lid} onClick={()=>{setLang(lid);S.set("mlc_lang",lid);setOnbStep(1);}} style={{flex:1,border:`2px solid ${P.border}`,borderRadius:14,padding:"16px 10px",background:"transparent",cursor:"pointer",transition:"all .22s",fontFamily:font.sans}}>
                <div style={{fontSize:14,fontWeight:600,color:P.text}}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
    if(onbStep===1) return(
      <div className="onb" style={{background:P.bg}}><style>{css}</style>
        <div className="onb-c">
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><div className="pet float" style={{color:accent}}>{renderComp(compId,accent,64)}</div></div>
          <h2 style={{fontFamily:font.serif,fontSize:21,fontWeight:500,color:P.text,marginBottom:5}}>{t.nameQ}</h2>
          <p style={{fontSize:11.5,color:P.muted,fontFamily:font.sans,marginBottom:20}}>{t.nameSub}</p>
          <input className="inp" placeholder={t.namePh} value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&(()=>{setUserName(nameInput.trim());S.set("mlc_name",nameInput.trim());setOnbStep(2);})()}  autoFocus style={{marginBottom:13,textAlign:"center",fontSize:16}}/>
          <button className="btn" style={{width:"100%",padding:"11px",fontSize:14}} onClick={()=>{if(nameInput.trim()){setUserName(nameInput.trim());S.set("mlc_name",nameInput.trim());setOnbStep(2);}}} disabled={!nameInput.trim()}>{l==="zh"?"繼續 →":"Continue →"}</button>
        </div>
      </div>
    );
    if(onbStep===2) return(
      <div className="onb" style={{background:P.bg}}><style>{css}</style>
        <div className="onb-c" style={{maxWidth:490}}>
          <h2 style={{fontFamily:font.serif,fontSize:21,fontWeight:500,color:P.text,marginBottom:3,textAlign:"center"}}>{t.compQ}</h2>
          <p style={{fontSize:11.5,color:P.muted,fontFamily:font.sans,marginBottom:20,textAlign:"center"}}>{t.compSub}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:20}}>
            {companions.map(cid=>(
              <button key={cid} className={`csel${compId===cid?" on":""}`} onClick={()=>setCompId(cid)} style={{borderColor:compId===cid?accent:P.border}}>
                <div style={{transform:"scale(.8)",height:50,display:"flex",alignItems:"center",justifyContent:"center"}}>{renderComp(cid,accent,62)}</div>
                <p style={{fontSize:12,fontWeight:600,color:compId===cid?P.text:P.sub,fontFamily:font.sans}}>{t.compNames[cid]}</p>
                <p style={{fontSize:10,color:P.muted,fontFamily:font.sans,lineHeight:1.4,textAlign:"center"}}>{t.compDesc[cid]}</p>
              </button>
            ))}
          </div>
          <button className="btn" style={{width:"100%",padding:"11px",fontSize:14}} onClick={()=>{S.set("mlc_cset",true);setOnbStep(3);}}>{l==="zh"?"選好了 →":"Choose this companion →"}</button>
        </div>
      </div>
    );
    if(onbStep===3) return(
      <div className="onb" style={{background:P.bg}}><style>{css}</style>
        <div className="onb-c">
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><div className="pet bounce" style={{color:accent}}>{renderComp(compId,accent,70)}</div></div>
          <p style={{fontSize:12,color:P.muted,fontFamily:font.sans,marginBottom:3}}>{l==="zh"?"歡迎來到你的小角落":"Welcome to your little corner"}</p>
          <h2 style={{fontFamily:font.serif,fontSize:24,fontWeight:500,color:P.text,marginBottom:3}}>{t.welcomeBack}</h2>
          <h2 style={{fontFamily:font.serif,fontSize:28,fontWeight:500,color:accent,marginBottom:14}}>{userName}</h2>
          <div style={{background:P.light,borderRadius:12,padding:"12px 16px",marginBottom:16,borderLeft:`3px solid ${accent}`,textAlign:"left"}}>
            <p style={{fontFamily:font.serif,fontSize:14,color:P.text,lineHeight:1.9,fontStyle:"italic"}}>"{quote}"</p>
          </div>
          <p style={{fontSize:12,color:P.sub,fontFamily:font.sans,marginBottom:18,fontStyle:"italic"}}>{getMsg(compId,"open",l)}</p>
          <button className="btn" style={{width:"100%",padding:"12px",fontSize:14}} onClick={enterCorner}>{t.enterBtn}</button>
        </div>
      </div>
    );
  }
  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return(
    <div style={{background:P.bg,minHeight:"100vh"}}>
      <style>{css}</style>
      <audio ref={audioRef} src={track.u} onEnded={()=>loadTr(pickT(musicCat,track))} onError={onAErr}/>
      {checkFx>0&&<div key={checkFx} className="check-fx" aria-hidden="true">{["✦","♥","✓","✿","✦","♥"].map((s,i)=><span key={i} className="cfx" style={{left:`${24+i*10}%`,animationDelay:`${i*0.05}s`,color:i%2?P.peach:accent}}>{s}</span>)}</div>}
      <Particles season={season}/>
      {showReward&&(
        <div className="overlay" style={{background:"rgba(47,52,58,.18)",zIndex:600}} onClick={()=>setShowReward(false)}>
          <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:1}}>
            {[...Array(42)].map((_,i)=>(<div key={i} style={{position:"absolute",left:`${(i*37)%100}%`,top:"-6%",width:`${7+(i%3)*3}px`,height:`${7+(i%3)*3}px`,borderRadius:i%2?"50%":"2px",background:ss.pc[i%ss.pc.length],animation:`confettiFallFull ${2.4+(i%6)*0.4}s linear ${(i%10)*0.18}s infinite`}}/>))}
          </div>
          <div className="modal reward-pop" style={{textAlign:"center",position:"relative",overflow:"hidden",maxWidth:340,zIndex:2}}>
            <div className="reward-bounce" style={{color:accent,marginTop:6,marginBottom:6}}>{renderComp(compId,accent,108,accessory)}</div>
            <p className="serif" style={{fontSize:22,color:P.text,marginBottom:4}}>{l==="zh"?"全部完成！":"All done!"}</p>
            <p style={{fontSize:13.5,color:P.sub,fontFamily:font.sans,fontStyle:"italic",marginBottom:10,lineHeight:1.6}}>{getMsg(compId,"complete",l)}</p>
            <div style={{display:"inline-block",background:P.light,border:`1px solid ${P.border}`,borderRadius:50,padding:"3px 13px",fontSize:11,color:P.sub,fontFamily:font.sans}}>♥ +10 {t.friendLabel}</div>
          </div>
        </div>
      )}
      {showNextDay&&(
        <div className="overlay"><div className="modal" style={{textAlign:"center"}}>
          <p className="serif" style={{fontSize:19,color:P.text,marginBottom:7}}>{t.closeTitle}</p>
          <p style={{fontSize:13,color:P.sub,marginBottom:18,lineHeight:1.65,fontFamily:font.sans}}>{t.closeSub}</p>
          <div style={{display:"flex",gap:9,justifyContent:"center"}}>
            <button className="btn-o" onClick={()=>setShowNextDay(false)}>{t.notYet}</button>
            <button className="btn" onClick={confirmNextDay}>{t.saveNew}</button>
          </div>
        </div></div>
      )}
      {showReset&&(
        <div className="overlay"><div className="modal" style={{textAlign:"center"}}>
          <p className="serif" style={{fontSize:17,color:P.text,marginBottom:8}}>{t.resetBtn}</p>
          <p style={{fontSize:13,color:P.sub,marginBottom:18,lineHeight:1.6,fontFamily:font.sans}}>{t.resetConfirm}</p>
          <div style={{display:"flex",gap:9,justifyContent:"center"}}>
            <button className="btn-o" onClick={()=>setShowReset(false)}>{t.cancel}</button>
            <button style={{background:"#C07060",color:"white",border:"none",borderRadius:10,padding:"9px 20px",fontSize:13,cursor:"pointer"}} onClick={doReset}>{l==="zh"?"確定清除":"Yes, reset"}</button>
          </div>
        </div></div>
      )}
      {showSettings&&(
        <div className="overlay" onClick={()=>setShowSettings(false)}>
          <div className="modal" style={{maxWidth:410,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:15}}>
              <p className="serif" style={{fontSize:18,color:P.text}}>{t.prefs}</p>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:18}}>✕</button>
            </div>
            <p className="lbl" style={{marginBottom:7}}>{t.yourName}</p>
            {editingName?(
              <div style={{display:"flex",gap:7,marginBottom:16}}>
                <input className="inp" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveName(nameInput)} autoFocus style={{flex:1}}/>
                <button className="btn" onClick={()=>saveName(nameInput)} style={{padding:"7px 13px",fontSize:12}}>{t.save}</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,background:P.light,borderRadius:10,padding:"7px 11px"}}>
                <p style={{fontSize:14,color:P.text,fontFamily:font.sans}}>{name}</p>
                <button className="ibtn" onClick={()=>{setNameInput(name);setEditingName(true);}}>✎</button>
              </div>
            )}
            <p className="lbl" style={{marginBottom:7}}>{t.language}</p>
            <div style={{display:"flex",gap:7,marginBottom:16}}>
              {[["en","English"],["zh","繁體中文"]].map(([lid,label])=>(
                <button key={lid} className={`tbtn${lang===lid?" on":""}`} onClick={()=>{setLang(lid);S.set("mlc_lang",lid);}}>{label}</button>
              ))}
            </div>
            <p className="lbl" style={{marginBottom:9}}>{t.companion} <span style={{textTransform:"none",letterSpacing:0,fontWeight:400,color:P.muted}}>· {l==="zh"?"點選打開衣櫥":"tap to open wardrobe"}</span></p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:16}}>
              {companions.map(k=>(
                <button key={k} className={`csel${compId===k?" on":""}`} onClick={()=>{setCompId(k);setShowWardrobe(true);}} style={{padding:"8px 5px"}}>
                  <div style={{transform:"scale(.72)",height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>{renderComp(k,accent,58)}</div>
                  <span style={{fontSize:10.5,color:compId===k?P.text:P.muted,fontFamily:font.sans,fontWeight:500}}>{t.compNames[k]}</span>
                </button>
              ))}
            </div>
            <p className="lbl" style={{marginBottom:7}}>{t.season}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {["spring","summer","autumn","winter"].map(k=><button key={k} className={`tbtn${season===k?" on":""}`} onClick={()=>setSeason(k)}>{t.seasonNames[k]}</button>)}
            </div>
            <p className="lbl" style={{marginBottom:7}}>{t.fontStyle}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
              {FONTS.map(f=><button key={f.id} className={`tbtn${fontId===f.id?" on":""}`} onClick={()=>setFontId(f.id)} style={{fontFamily:f.serif,fontSize:11}}>{t.fontNames[f.id]||f.id}</button>)}
            </div>
            <button className="btn" style={{width:"100%",marginBottom:8}} onClick={()=>setShowSettings(false)}>{t.done}</button>
          </div>
        </div>
      )}
      {showSystem&&(
        <div className="overlay" onClick={()=>setShowSystem(false)}>
          <div className="modal" style={{maxWidth:410,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:15}}>
              <p className="serif" style={{fontSize:18,color:P.text}}>{t.system}</p>
              <button onClick={()=>setShowSystem(false)} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:18}}>✕</button>
            </div>
            <p className="lbl" style={{marginBottom:7}}>{l==="zh"?"雲端同步":"Cloud Sync"}</p>
            <p style={{fontSize:11,color:P.muted,fontFamily:font.sans,lineHeight:1.6,marginBottom:8}}>{l==="zh"?"用 Google 登入，資料就會自動在你的裝置之間同步。":"Sign in with Google and your data syncs automatically across your devices."}</p>
            {syncUser?(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:18,background:P.paper,border:`1px solid ${P.border}`,borderRadius:10,padding:"9px 11px"}}>
                <div style={{minWidth:0}}><p style={{fontSize:11,color:P.text,fontFamily:font.sans,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>✓ {syncUser.email||(l==="zh"?"已登入":"Signed in")}</p><p style={{fontSize:10,color:P.muted,fontFamily:font.sans}}>{l==="zh"?"同步已開啟":"Syncing is on"}</p></div>
                <button className="btn-o" style={{fontSize:11,flexShrink:0}} onClick={doSignOut}>{l==="zh"?"登出":"Sign out"}</button>
              </div>
            ):(
              <button className="btn" style={{width:"100%",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={doSignIn}>{l==="zh"?"使用 Google 登入":"Sign in with Google"}</button>
            )}
            <p className="lbl" style={{marginBottom:7}}>{t.backupTitle}</p>
            <p style={{fontSize:11,color:P.muted,fontFamily:font.sans,lineHeight:1.6,marginBottom:8}}>{t.backupDesc}</p>
            <textarea value={backupText} onChange={e=>setBackupText(e.target.value)} placeholder={t.backupPh} rows={3} style={{width:"100%",border:`1px solid ${P.border}`,borderRadius:10,padding:"8px 10px",fontFamily:font.sans,fontSize:11,color:P.sub,background:P.paper,outline:"none",resize:"none",wordBreak:"break-all",marginBottom:8}}/>
            <div style={{display:"flex",gap:7,marginBottom:18}}>
              <button className="btn-o" style={{flex:1,fontSize:12}} onClick={exportData}>{t.exportBtn}</button>
              <button className="btn" style={{flex:1,fontSize:12}} onClick={importData}>{t.restoreBtn}</button>
            </div>
            <button className="btn" style={{width:"100%",marginBottom:8}} onClick={()=>setShowSystem(false)}>{t.done}</button>
            <button className="reset-btn" onClick={()=>{setShowSystem(false);setTimeout(()=>setShowReset(true),150);}}>{t.resetBtn}</button>
          </div>
        </div>
      )}
      {showWardrobe&&(
        <div className="overlay" style={{zIndex:560}} onClick={()=>setShowWardrobe(false)}>
          <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <p className="serif" style={{fontSize:18,color:P.text}}>{t.wardrobe}</p>
              <button onClick={()=>setShowWardrobe(false)} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:18}}>✕</button>
            </div>
            <p style={{fontSize:11,color:P.muted,fontFamily:font.sans,marginBottom:14,lineHeight:1.6}}>{t.compNames[compId]} · {t.wardrobeSub} · ♥ {friendship.points} {l==="zh"?"點":"pts"}</p>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",justifyContent:"center"}}>
              {Object.keys(ACCESSORIES).map(cid=>(
                <button key={cid} onClick={()=>setCompId(cid)} title={t.compNames[cid]} style={{border:`1.5px solid ${compId===cid?accent:P.border}`,background:compId===cid?P.light:"transparent",borderRadius:12,padding:0,cursor:"pointer",width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>{renderComp(cid,accent,36)}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {(ACCESSORIES[compId]||ACCESSORIES.cat).map((a,idx)=>{
                const isNone=idx===0;
                const unlocked=friendship.points>=a.pts;
                const worn=isNone?(accessory===""):(accessory===a.emoji);
                return(
                  <button key={idx} disabled={!unlocked} onClick={()=>setChosenAcc(isNone?"none":a.emoji)} style={{border:`1.5px solid ${worn?accent:P.border}`,background:worn?P.light:"transparent",borderRadius:12,padding:"10px 6px",cursor:unlocked?"pointer":"default",opacity:unlocked?1:.45,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{height:46,width:46,display:"flex",alignItems:"center",justifyContent:"center"}}>{renderComp(compId,accent,46,isNone?"":a.emoji)}</div>
                    <span style={{fontSize:9.5,color:P.sub,fontFamily:font.sans,textAlign:"center"}}>{unlocked?(isNone?t.noneLabel:a.name):("🔒 "+a.pts)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showJournal&&<JournalModal onClose={()=>setShowJournal(false)} font={font} accent={accent} t={t} l={l}/>}
      <div className="app" style={{position:"relative",zIndex:2}}>
        <div style={{maxWidth:530,margin:"0 auto",padding:"0 0 90px"}}>
          {/* ROOM */}
          <div className={allDone?"glw":""} style={{borderRadius:18,overflow:"hidden",boxShadow:"0 4px 20px rgba(47,52,58,.07)"}}>
            <RoomScene season={season} friendLevel={friendship.level} accent={accent} compId={compId} compAnim={compAnim} compMsg={compMsg} accessory={accessory} font={font} onPetClick={()=>setShowWardrobe(true)}/>
            <div style={{background:P.card,borderTop:`1px solid ${P.border}`,padding:"11px 17px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:10,fontWeight:600,letterSpacing:1.3,textTransform:"uppercase",color:P.muted,fontFamily:font.sans,marginBottom:1}}>{timeName}, {name}</p>
                <p style={{fontFamily:font.serif,fontSize:18,fontWeight:500,color:P.text,lineHeight:1.2}}>{t.appName}</p>
                <p style={{fontSize:11,color:P.muted,fontFamily:font.sans,marginTop:2}}>{dateStr}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <div style={{background:P.light,border:`1px solid ${P.border}`,borderRadius:50,padding:"2px 8px",fontSize:10,color:P.sub,fontFamily:font.sans}}>{streak} {t.streakLabel}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{color:P.peach,fontSize:11}}>♥</span>
                  <div style={{width:55,height:4,background:P.border,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${friendPct}%`,background:P.peach,borderRadius:2,transition:"width .7s ease"}}/>
                  </div>
                  <span style={{fontSize:9,color:P.muted,fontFamily:font.sans,whiteSpace:"nowrap"}}>{t.friendLevels[friendship.level-1]}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:"13px 14px 0"}}>
            {/* NAV */}
            <div style={{display:"flex",gap:8,marginBottom:13,flexWrap:"wrap"}}>
              <button className="nbtn" onClick={()=>setShowNextDay(true)}>↻ {t.nextDay}</button>
              <button className="nbtn" onClick={()=>setShowJournal(true)}>◎ {t.journal}</button>
              <button className="nbtn" onClick={()=>setShowSettings(true)}>✿ {t.prefs}</button>
              <button className="nbtn" onClick={()=>setShowSystem(true)}>⚙ {t.system}</button>
            </div>
            {/* 1. RITUAL */}
            <div style={{marginBottom:13,animation:"fadeUp .42s ease"}}>
              <p className="lbl">{t.ritual}</p>
              <div className="card">
                <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                  <p style={{fontSize:11,color:P.muted,fontFamily:font.sans,fontWeight:500,flexShrink:0}}>{t.vibe}</p>
                  {t.vibeOpts.map((v,i)=>{const vid=t.vibeIds[i];return(<button key={vid} className={`vibe-btn${vibe===vid?" on":""}`} onClick={()=>setVibe(vibe===vid?"":vid)}>{v}</button>);})}
                </div>
                <div style={{background:P.light,borderRadius:10,padding:"10px 14px",marginBottom:12,borderLeft:`3px solid ${accent}`}}>
                  <p className="serif" style={{fontSize:14,color:P.text,lineHeight:1.9,fontStyle:"italic"}}>"{quote}"</p>
                </div>
                <p style={{fontSize:11.5,color:P.muted,marginBottom:6,fontFamily:font.sans,fontStyle:"italic"}}>{focusQ}</p>
                {!editingFocus&&!focus
                  ?<button className="add-t-btn" style={{textAlign:"left",padding:"7px 11px"}} onClick={()=>{setFocusDraft("");setEditingFocus(true);}}><span className="serif" style={{fontSize:13.5,color:P.muted,fontStyle:"italic"}}>{t.focusPh}</span></button>
                  :editingFocus
                    ?<div><input className="inp" placeholder={t.focusPh} value={focusDraft} onChange={e=>setFocusDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveFocus()} autoFocus style={{marginBottom:7}}/><div style={{display:"flex",gap:7}}><button className="btn" onClick={saveFocus} style={{fontSize:12,padding:"5px 14px"}}>{t.save}</button><button className="btn-o" onClick={()=>setEditingFocus(false)} style={{fontSize:12,padding:"5px 12px"}}>{t.cancel}</button></div></div>
                    :<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:7}}><p className="serif" style={{fontSize:14,color:P.text,lineHeight:1.75,fontStyle:"italic",flex:1}}>{focus}</p><button onClick={()=>{setFocusDraft(focus);setEditingFocus(true);}} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:14,marginTop:1}}>✎</button></div>}
              </div>
            </div>
            {/* 2. TASKS */}
            <div style={{marginBottom:13,animation:"fadeUp .46s ease"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <p className="lbl" style={{margin:0}}>{t.tasks}</p>
                {total>0&&<span style={{fontSize:11,color:P.muted,fontFamily:font.sans}}>{done} / {total}</span>}
              </div>
              {total>0&&<div className="pt" style={{marginBottom:10}}><div className="pf" style={{width:`${pct}%`}}/></div>}
              <div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:18,padding:"11px 17px"}}>
                {showAdd?(
                  <div style={{marginBottom:11,paddingBottom:11,borderBottom:active.length>0||doneT.length>0?`1px solid ${P.border}`:"none",animation:"fadeUp .18s ease"}}>
                    <input className="inp" placeholder={t.taskPh} value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} autoFocus style={{marginBottom:8}}/>
                    <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                      {t.priOpts.map((p,i)=>{const pid=t.priIds[i];return(<button key={pid} className={`tbtn${newPri===pid?" on":""}`} onClick={()=>setNewPri(pid)}><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:pdot(pid),marginRight:4,verticalAlign:"middle"}}/>{p}</button>);})}
                    </div>
                    <select className="sel" value={newCat} onChange={e=>setNewCat(e.target.value)} style={{marginBottom:8,width:"100%"}}>
                      {t.catOpts.map((c,i)=><option key={t.catIds[i]} value={t.catIds[i]}>{c}</option>)}
                    </select>
                    <div style={{display:"flex",gap:7}}><button className="btn" onClick={addTask} style={{flex:1}}>{t.save}</button><button className="btn-o" onClick={()=>setShowAdd(false)}>{t.cancel}</button></div>
                  </div>
                ):(
                  <button className="add-t-btn" style={{marginBottom:active.length>0||doneT.length>0?9:0}} onClick={()=>setShowAdd(true)}>{t.addTask}</button>
                )}
                {active.length===0&&doneT.length===0&&!showAdd&&(
                  <p className="serif" style={{fontSize:13.5,color:P.muted,fontStyle:"italic",textAlign:"center",padding:"11px 0"}}>{t.nothingYet}</p>
                )}
                {active.map(x=>(
                  <div key={x.id} className="task-row">
                    <div style={{width:6,height:6,borderRadius:"50%",background:pdot(x.priority),flexShrink:0,marginTop:6}}/>
                    <button className="chk" onClick={()=>toggleTask(x.id)}/>
                    <div style={{flex:1}}>{editingTaskId===x.id?(
                      <input autoFocus className="edit-inp" value={editTaskDraft} onChange={e=>setEditTaskDraft(e.target.value)} onBlur={()=>saveTaskEdit(x.id)} onKeyDown={e=>{if(e.key==="Enter")saveTaskEdit(x.id);else if(e.key==="Escape")setEditingTaskId(null);}}/>
                    ):(<span className="tname">{x.name}</span>)}<div style={{marginTop:2}}><span className="pill">{t.catOpts[t.catIds.indexOf(x.category)]||x.category}</span></div></div>
                    <button className="edt" onClick={()=>{setEditingTaskId(x.id);setEditTaskDraft(x.name);}} title={l==="zh"?"編輯":"Edit"}>✎</button>
                    <button className="del" onClick={()=>deleteTask(x.id)}>×</button>
                  </div>
                ))}
                {doneT.length>0&&(
                  <div style={{marginTop:active.length>0?7:0,paddingTop:active.length>0?7:0,borderTop:active.length>0?`1px dashed ${P.border}`:"none"}}>
                    <p style={{fontSize:10,fontWeight:600,letterSpacing:1.2,color:P.muted,textTransform:"uppercase",marginBottom:5,fontFamily:font.sans,opacity:.65}}>{t.doneToday}</p>
                    {doneT.map(x=>(
                      <div key={x.id} className="task-row done-r">
                        <div style={{width:6,height:6,borderRadius:"50%",background:pdot(x.priority),flexShrink:0,marginTop:6,opacity:.4}}/>
                        <button className="chk on" onClick={()=>toggleTask(x.id)} style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white"}}>✓</button>
                        <div style={{flex:1}}><span className="tname">{x.name}</span></div>
                        <button className="del" onClick={()=>deleteTask(x.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {allDone&&<p className="serif" style={{marginTop:8,textAlign:"center",fontSize:14,color:accent,fontStyle:"italic",animation:"fadeIn .45s ease"}}>{getMsg(compId,"complete",l)}</p>}
            </div>
            {/* 3. PHOTO */}
            <div style={{marginBottom:13,animation:"fadeUp .50s ease"}}>
              <p className="lbl">{t.photo}</p>
              <div className="card" style={{padding:photo?"11px":"18px 20px"}}>
                {photo?(
                  <div style={{position:"relative"}}>
                    <img src={photo} alt="today" style={{width:"100%",maxHeight:210,objectFit:"cover",borderRadius:10,border:`1px solid ${P.border}`}}/>
                    <button onClick={()=>setPhoto("")} style={{position:"absolute",top:8,right:8,background:"rgba(47,52,58,.58)",border:"none",borderRadius:6,color:"white",cursor:"pointer",padding:"3px 8px",fontSize:12}}>✕</button>
                  </div>
                ):(
                  <button onClick={()=>photoRef.current?.click()} style={{background:"none",border:`1px dashed ${P.border}`,borderRadius:10,width:"100%",padding:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .18s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;}}>
                    <span style={{color:P.muted,fontSize:16}}>⊕</span>
                    <span style={{fontSize:13,color:P.muted,fontFamily:font.sans}}>{t.addPhoto}</span>
                  </button>
                )}
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
              </div>
            </div>
            {/* 4. WIN */}
            <div style={{marginBottom:13,animation:"fadeUp .54s ease"}}>
              <p className="lbl">{t.win}</p>
              <div className="paper-card">
                {!editingWin&&!win
                  ?<button onClick={()=>{setWinDraft("");setEditingWin(true);}} style={{background:"none",border:"none",cursor:"pointer",width:"100%",textAlign:"left",padding:0}}><p className="serif" style={{fontSize:14.5,color:P.muted,fontStyle:"italic",lineHeight:1.9}}>{t.winPh}</p></button>
                  :editingWin
                    ?<div><textarea className="ta" rows={3} placeholder={t.winPh} value={winDraft} onChange={e=>setWinDraft(e.target.value)} autoFocus/><div style={{display:"flex",gap:7,marginTop:8}}><button className="btn" onClick={saveWin}>{t.save}</button><button className="btn-o" onClick={()=>setEditingWin(false)}>{t.cancel}</button></div></div>
                    :<div><p className="serif" style={{fontSize:14.5,color:P.text,lineHeight:1.9,fontStyle:"italic"}}>"{win}"</p><button onClick={()=>{setWinDraft(win);setEditingWin(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:P.muted,marginTop:6,fontFamily:font.sans,padding:0,textDecoration:"underline"}}>{t.edit}</button></div>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:7,borderTop:`1px solid ${P.border}`}}>
              <p style={{fontSize:11,color:P.muted,fontFamily:font.sans}}>{t.closeQ}</p>
              <button className="btn-o" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>setShowNextDay(true)}>{t.nextDay}</button>
            </div>
          </div>
        </div>
      </div>
      <MusicPlayer track={track} playing={playing} loading={audioLoading} errMsg={audioErr}
        muted={muted} volume={volume} cat={musicCat} accent={accent} font={font} l={l}
        onPlay={togglePlay}
        onPrev={()=>loadTr(pickT(musicCat,track))}
        onNext={()=>loadTr(pickT(musicCat,track))}
        onMute={()=>setMuted(m=>!m)}
        onVol={v=>setVolume(v)}
        onCat={c=>{setMusicCat(c);loadTr(pickT(c));}}/>
    </div>
  );
}

