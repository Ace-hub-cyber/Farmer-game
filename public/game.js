;(function () {
  if (window.__ladangReady) return;
  window.__ladangReady = true;

  "use strict";
  /* ============ MAP DATA ============ */
  const OROWS=[
  "TTTTTTTTPTTTTTTTTTTT",
  "TRRRRGGGPGGGGGGGGGGT",
  "TRRRRGGGPGGGGWWGGGGT",
  "THHDHGGGPGGGWWWWGGGT",
  "TGGPGGGGPGGGWWWWWGGT",
  "TGGPGFFFFFFFFGWWGGGT",
  "TGGPGsssssssGGGLGGGT",
  "TGGPGsssssssGGGGGGGT",
  "TGGPGsssssssGGGGGGGT",
  "TGGPGFFFFFFFFGGGGGGT",
  "TGGPPPPPPPPPPPPPPPPP",
  "PPPGGGGLGGGGGGPGGGGT",
  "TGGGGGGGGGGGGGPGLGGT",
  "TTTTTTTTTTTTTTPTTTTT"];
  const IROWS=[
  "XXXXXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXX",
  "XXXXBBBBBBBBBBBBXXXX",
  "XXXXBKKVKKOOOZOBXXXX",
  "XXXXBOOOOOOOOzOBXXXX",
  "XXXXBOOOOOOOOOOBXXXX",
  "XXXXBOOOOOOOOOOBXXXX",
  "XXXXBOOOOOOOOOOBXXXX",
  "XXXXBOOOOOOOOOOBXXXX",
  "XXXXBOOOOOOOOOOBXXXX",
  "XXXXBBBBBEBBBBBBXXXX",
  "XXXXXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXX"];
  const TROWS=[
  "TTTTTTTTTTTTTTTTTTTT",
  "TGGGGGGGGGGGGGeGGGGT",
  "TGQQQQQQQQQQQQQQQGGT",
  "TGUUUUUQQQQuuuuuQGGT",
  "TGUUUUUQQQQuuuuuQGGT",
  "TGHH1HHQQQQHH2HHQGGT",
  "TGLQQQQlQQlQQQQLQGGT",
  "TGQQQQQQQQQQQQQQQGGT",
  "TGQQQQkQAAAQkQQQQGGT",
  "TGQQQQQQA3AQQQQQQGGT",
  "TGQQQQQQQQQQQQQQQGGT",
  "TGGLGGGGGGGGGGGGLGGT",
  "TGGGGGGGGGGGGGGGGGGT",
  "TTTTTTTTTTTTTTTTTTTT"];
  const W=20,H=14,TS=16;
  const omap=OROWS.map(r=>r.split("")),imap=IROWS.map(r=>r.split("")),tmap=TROWS.map(r=>r.split(""));

  /* ============ GAME DATA ============ */
  const SEEDS={
  lobak:{nama:"Bibit Lobak",harga:20,jual:15,t:8000,d:"Cepat tumbuh, untung tipis"},
  jagung:{nama:"Bibit Jagung",harga:35,jual:30,t:12000,d:"Standar, untung lumayan"},
  semangka:{nama:"Bibit Semangka",harga:60,jual:55,t:16000,d:"Lama, tapi paling untung"}};
  const TOOLS=[
  {id:"watercan",nama:"Alat Siram",harga:40,d:"Wajib untuk menyiram tanaman"},
  {id:"cangkul",nama:"Cangkul Baja",harga:100,d:"Hasil panen jadi dobel"},
  {id:"prorod",nama:"Pancingan Pro",harga:120,d:"Marker mancing lebih pelan"},
  {id:"sepatu",nama:"Sepatu Kilat",harga:150,d:"Jalan lebih cepat"}];
  const HARGA_IKAN=25,HARGA_MASAK=60;
  const COST={tanam:5,siram:2,panen:2,pancing:3,masak:2,cangkul:3};
  const DAY_START=360,DAY_END=1440,MIN_MS=450;

  /* ============ STATE ============ */
  let scene="out",px=5,py=10,dir="down";
  let gold=20,score=0,panenVal=0,nfish=0,ncook=0,stamina=100;
  let day=1,gameMin=DAY_START,weather="cerah";
  const seedsInv={lobak:0,jagung:0,semangka:0};
  let activeSeed="lobak";
  const owned={watercan:false,cangkul:false,prorod:false,sepatu:false};
  const cropType={},watered={};
  let sleeping=false,fishing=false,castT=0,mpos=0,bx=-1,by=-1,shopKind=null,busy=false;
  let pose=null,poseT=0,poseDur=0,anims=[],grow={};
  let resetArm=false,prevT=0,minAcc=0,lastActive=0,lastActionT=0;
  const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cv=document.getElementById("map"),cx=cv.getContext("2d");
  cx.imageSmoothingEnabled=false;
  const el=id=>document.getElementById(id);
  const msg=el("msg"),rod=el("rod"),marker=el("marker"),panel=el("shop");

  /* ============ SAVE SYSTEM ============ */
  function save(){
  try{
  const field=[];
  for(let r=6;r<=8;r++)for(let c=5;c<=11;c++){
  const k=r+","+c;
  field.push({r,c,t:omap[r][c],ct:cropType[k]||null,w:!!watered[k]});}
  localStorage.setItem("ladang_save",JSON.stringify({
  gold,score,panenVal,nfish,ncook,stamina,day,gameMin,weather,
  seedsInv,activeSeed,owned,field}));
  }catch(e){}
  }
  function load(){
  try{
  const raw=localStorage.getItem("ladang_save");
  if(!raw)return false;
  const s=JSON.parse(raw);
  gold=s.gold??gold;score=s.score??0;panenVal=s.panenVal??0;nfish=s.nfish??0;ncook=s.ncook??0;
  stamina=s.stamina??100;day=s.day??1;gameMin=s.gameMin??DAY_START;weather=s.weather??weather;
  if(s.seedsInv)Object.assign(seedsInv,s.seedsInv);
  if(s.activeSeed)activeSeed=s.activeSeed;
  if(s.owned)Object.assign(owned,s.owned);
  for(const f of s.field){
  const k=f.r+","+f.c;
  omap[f.r][f.c]=f.t;
  if(f.ct)cropType[k]=f.ct;else delete cropType[k];
  if(f.w)watered[k]=true;else delete watered[k];
  if(f.t==="C"&&f.w){
  const st=f.ct||"lobak";
  grow[k]=setTimeout(()=>{if(omap[f.r][f.c]==="C"){omap[f.r][f.c]="M";delete watered[k];}},SEEDS[st].t);}
  }
  return true;
  }catch(e){return false;}
  }
  function wipe(){try{localStorage.removeItem("ladang_save");}catch(e){}location.reload();}

  /* ============ HUD ============ */
  function pad(n){return n<10?"0"+n:""+n;}
  function hud(){
  el("gold").textContent=gold;
  el("seed").textContent=seedsInv.lobak+seedsInv.jagung+seedsInv.semangka;
  el("score").textContent=score;
  el("fish").textContent=nfish;
  el("cook").textContent=ncook;
  el("day").textContent="HARI "+day;
  el("clock").textContent=pad(Math.floor(gameMin/60))+":"+pad(Math.floor(gameMin%60));
  el("weather").textContent=weather==="cerah"?"Cerah":weather==="berawan"?"Berawan":"Hujan";
  const f=el("staFill");
  f.style.width=stamina+"%";
  f.classList.toggle("low",stamina<=25);
  }
  function spend(n){
  if(stamina<n){say("Stamina habis! Makan masakan atau tidur dulu.");return false;}
  stamina=Math.max(0,stamina-n);hud();return true;
  }
  function say(t){msg.textContent=t;}

  /* ============ WEATHER & DAY ============ */
  function rollWeather(){
  const r=Math.random();
  weather=r<0.5?"cerah":r<0.8?"berawan":"hujan";
  }
  function morning(){
  if(weather==="hujan"){
  for(let r=6;r<=8;r++)for(let c=5;c<=11;c++){
  const k=r+","+c;
  if(omap[r][c]==="C"&&!watered[k]){
  watered[k]=true;
  const st=cropType[k]||"lobak";
  clearTimeout(grow[k]);
  grow[k]=setTimeout(()=>{if(omap[r][c]==="C"){omap[r][c]="M";delete watered[k];}},SEEDS[st].t);}
  }
  say("Pagi! Hujan turun — semua tanaman tersiram otomatis.");
  }else if(weather==="berawan"){
  say("Pagi! Langit berawan, hari yang adem buat kerja.");
  }else{
  say("Pagi yang cerah! Tanaman yang disiram kemarin sudah matang.");
  }
  }
  function newDay(full){
  day++;gameMin=DAY_START;
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){
  const k=r+","+c;
  if(omap[r][c]==="C"&&watered[k]){omap[r][c]="M";delete watered[k];}
  }
  Object.values(grow).forEach(clearTimeout);grow={};
  stamina=full?100:70;
  rollWeather();
  morning();
  hud();save();
  }
  function doSleep(full,where){
  if(sleeping)return;
  sleeping=true;closeShop();
  if(fishing)stopFishing();
  say(where==="forced"?"Kemalaman... ketiduran di tempat.":"Tidur dulu...");
  setTimeout(()=>{
  sleeping=false;
  scene="out";px=12;py=4;dir="down";updateAction();
  newDay(full);
  },1200);
  }

  /* ============ DRAW HELPERS ============ */
  function rect(c,x,y,w,h){cx.fillStyle=c;cx.fillRect(x,y,w,h);}
  function cur(){return scene==="out"?omap:scene==="in"?imap:tmap;}
  function tile(t,c,r){
  const x=c*TS,y=r*TS;
  if(scene==="in"){
  rect("#191613",x,y,TS,TS);
  if(t==="X")return;
  if(t==="B"){rect("#7a4a22",x,y,TS,TS);rect("#693d1b",x+7,y,2,TS);rect("#5e3717",x,y+13,TS,3);return;}
  rect("#c9955c",x,y,TS,TS);rect("#b9854c",x,y+7,TS,1);rect("#b9854c",x,y+15,TS,1);
  if(t==="O")return;
  if(t==="Z"){rect("#7a4a22",x+1,y+1,14,15);rect("#ffffff",x+3,y+2,10,5);rect("#e6e6e6",x+3,y+6,10,1);rect("#d85a30",x+3,y+8,10,8);return;}
  if(t==="z"){rect("#7a4a22",x+1,y,14,15);rect("#d85a30",x+3,y,10,11);rect("#b9441f",x+3,y+4,10,1);rect("#b9441f",x+3,y+8,10,1);rect("#f0997b",x+3,y+11,10,2);return;}
  if(t==="K"){rect("#8a5a2b",x+1,y+5,14,11);rect("#b4b2a9",x,y+2,TS,5);rect("#d3d1c7",x+1,y+3,14,2);return;}
  if(t==="V"){rect("#444441",x+1,y+2,14,14);rect("#2c2c2a",x+3,y+4,4,4);rect("#2c2c2a",x+9,y+4,4,4);rect("#e24b4a",x+4,y+5,2,2);rect("#e24b4a",x+10,y+5,2,2);rect("#5f5e5a",x+2,y+11,12,3);return;}
  if(t==="E"){rect("#5e3717",x+2,y+2,12,12);rect("#7a4a22",x+4,y+4,8,8);rect("#f2c14e",x+7,y+9,2,2);return;}
  return;}
  rect("#6abe30",x,y,TS,TS);
  if((c+r)%2===0)rect("#5fb12a",x,y,TS,TS);
  rect("#74cc38",x+3,y+4,2,2);rect("#74cc38",x+10,y+11,2,2);
  if(t==="G")return;
  if(t==="T"){rect("#5a3a1e",x+6,y+9,4,6);rect("#2e6b1e",x+1,y+1,14,9);rect("#3c8527",x+3,y+2,10,6);rect("#4fa332",x+5,y+3,5,3);return;}
  if(t==="P"||t==="e"){rect("#d9b380",x,y,TS,TS);rect("#c9a06a",x+2,y+3,3,2);rect("#c9a06a",x+9,y+8,3,2);rect("#e6c697",x+6,y+12,3,2);
  if(t==="e"){rect("#7a4a22",x+7,y+4,2,8);rect("#7a4a22",x+5,y+6,2,2);rect("#7a4a22",x+9,y+6,2,2);}return;}
  if(t==="Q"){rect("#b4b2a9",x,y,TS,TS);rect("#a3a199",x+1,y+1,6,6);rect("#a3a199",x+9,y+9,6,6);rect("#c4c2b9",x+9,y+1,6,6);rect("#c4c2b9",x+1,y+9,6,6);return;}
  if(t==="W"){rect("#3f7fd1",x,y,TS,TS);rect("#5e9ce6",x+2,y+3,5,2);rect("#5e9ce6",x+9,y+9,4,2);rect("#7db8f0",x+4,y+11,3,1);return;}
  if(t==="F"){rect("#8a5a2b",x+1,y+6,14,3);rect("#8a5a2b",x+1,y+11,14,2);rect("#6e451f",x+2,y+4,3,10);rect("#6e451f",x+11,y+4,3,10);return;}
  if(t==="R"){rect("#b1452f",x,y,TS,TS);rect("#933722",x,y+5,TS,2);rect("#933722",x,y+11,TS,2);return;}
  if(t==="U"){rect("#3c8527",x,y,TS,TS);rect("#4fa332",x,y,TS,2);rect("#2e6b1e",x,y+5,TS,2);rect("#2e6b1e",x,y+11,TS,2);return;}
  if(t==="u"){rect("#185FA5",x,y,TS,TS);rect("#378ADD",x,y,TS,2);rect("#0C447C",x,y+5,TS,2);rect("#0C447C",x,y+11,TS,2);return;}
  if(t==="H"){rect("#e7d3a5",x,y,TS,TS);rect("#cdb482",x,y+13,TS,3);rect("#9ad0e8",x+4,y+4,8,6);rect("#ffffff",x+4,y+4,8,1);rect("#7ab6d4",x+4,y+9,8,1);rect("#8a5a2b",x+3,y+3,1,8);rect("#8a5a2b",x+12,y+3,1,8);return;}
  if(t==="1"||t==="2"||t==="D"){rect("#e7d3a5",x,y,TS,TS);rect("#7a4a22",x+3,y+3,10,13);rect("#5e3717",x+3,y+3,10,2);rect("#f2c14e",x+10,y+9,2,2);
  if(t==="1"){rect("#3c8527",x-2,y,20,3);rect("#97C459",x+2,y,4,3);rect("#97C459",x+10,y,4,3);}
  if(t==="2"){rect("#185FA5",x-2,y,20,3);rect("#85B7EB",x+2,y,4,3);rect("#85B7EB",x+10,y,4,3);}return;}
  if(t==="A"){rect("#8a5a2b",x+6,y+8,4,8);rect("#e24b4a",x,y+2,TS,5);rect("#ffffff",x+4,y+2,4,5);rect("#ffffff",x+12,y+2,4,5);rect("#a32d2d",x,y+6,TS,1);return;}
  if(t==="3"){rect("#8a5a2b",x,y+6,TS,10);rect("#c9955c",x+1,y+7,14,3);rect("#f2c14e",x+3,y+11,4,4);rect("#d85a30",x+9,y+11,4,4);return;}
  if(t==="l"){rect("#444441",x+7,y+4,2,12);rect("#2c2c2a",x+5,y+14,6,2);rect("#f2c14e",x+5,y+1,6,5);rect("#ffe08a",x+6,y+2,4,3);return;}
  if(t==="k"){rect("#8a5a2b",x+2,y+5,12,11);rect("#a06a35",x+3,y+6,10,9);rect("#6e451f",x+2,y+9,12,1);rect("#6e451f",x+7,y+5,2,11);return;}
  if(t==="L"){rect("#e85d75",x+6,y+5,4,4);rect("#f2a0ae",x+7,y+6,2,2);rect("#3c8527",x+7,y+9,2,5);return;}
  /* untilled farm plot — tan with small weeds */
  if(t==="s"){
  rect("#b09870",x,y,TS,TS);
  rect("#a08860",x,y+5,TS,2);rect("#a08860",x,y+11,TS,2);
  rect("#6abe30",x+3,y+1,2,4);rect("#6abe30",x+10,y+6,2,4);rect("#6abe30",x+6,y+11,2,3);
  return;}
  /* tilled soil — dark brown with furrow marks */
  if(t==="S"){
  rect("#7a4a22",x,y,TS,TS);
  rect("#5e3717",x,y+3,TS,2);rect("#5e3717",x,y+9,TS,2);rect("#5e3717",x,y+14,TS,2);
  return;}
  const wet=watered[r+","+c];
  rect(wet?"#5e3717":"#7a4a22",x,y,TS,TS);
  rect(wet?"#4d2c11":"#693d1b",x,y+4,TS,1);rect(wet?"#4d2c11":"#693d1b",x,y+9,TS,1);rect(wet?"#4d2c11":"#693d1b",x,y+14,TS,1);
  if(t==="C"){rect("#4fa332",x+7,y+8,2,5);rect("#6abe30",x+5,y+7,2,2);rect("#6abe30",x+9,y+7,2,2);}
  if(t==="M"){
  const ct=cropType[r+","+c]||"lobak";
  rect("#3c8527",x+7,y+6,2,8);rect("#3c8527",x+4,y+8,3,2);rect("#3c8527",x+9,y+8,3,2);
  if(ct==="lobak"){rect("#f5f0e6",x+5,y+2,6,5);rect("#ffffff",x+6,y+3,2,2);rect("#97C459",x+7,y,2,3);}
  else if(ct==="jagung"){rect("#EF9F27",x+5,y+1,6,7);rect("#FAC775",x+6,y+2,2,4);rect("#4fa332",x+4,y+1,1,6);rect("#4fa332",x+11,y+1,1,6);}
  else{rect("#27500A",x+4,y+1,8,7);rect("#639922",x+5,y+2,2,5);rect("#639922",x+9,y+2,2,5);}
  }
  }
  function sign(x,w,y,text){
  rect("#5e3717",x,y,w,12);rect("#7a4a22",x+1,y+1,w-2,10);rect("#3d2510",x,y+11,w,1);
  cx.fillStyle="#ffe08a";cx.font="8px monospace";cx.textAlign="center";
  cx.fillText(text,x+w/2,y+9);cx.textAlign="left";
  }
  function outDeco(){
  sign(102,56,20,"MANCING");
  sign(248,56,148,"MINING");
  sign(20,48,160,"HUTAN");
  sign(196,44,188,"KOTA");
  }
  function townDeco(){
  rect("#3d2510",40,34,240,1);
  const cols=["#D85A30","#1D9E75","#EF9F27","#D4537E"];
  for(let i=0;i<20;i++){
  const x=42+i*12;cx.fillStyle=cols[i%4];
  cx.beginPath();cx.moveTo(x,35);cx.lineTo(x+8,35);cx.lineTo(x+4,42);cx.closePath();cx.fill();}
  sign(36,72,62,"TOKO BIBIT");sign(180,72,62,"TOKO ALAT");sign(130,44,124,"LAPAK JUAL");
  }
  function fishSprite(x,y,kind,flip){
  const b=kind==="arwana"?"#E24B4A":kind==="mas"?"#EF9F27":"#5F5E5A";
  const f=kind==="arwana"?"#f2c14e":kind==="mas"?"#FAC775":"#888780";
  rect(b,x,y+2,9,5);rect(f,x+(flip?9:-3),y+3,3,3);
  rect("#ffffff",x+(flip?1:6),y+3,2,2);rect("#2c1c10",x+(flip?1:7),y+3,1,1);
  if(kind==="lele")rect("#2c2c2a",x+(flip?-2:9),y+4,2,1);
  }
  function player(now){
  const x=px*TS,y=py*TS;
  const afk=!sleeping&&!busy&&!fishing&&(now-lastActive>8000);
  rect("#00000033",x+3,y+13,10,3);
  rect("#2b5fad",x+5,y+8,6,6);
  rect("#f3c89b",x+5,y+4,6,5);
  rect("#c9542f",x+3,y+2,10,3);rect("#c9542f",x+5,y+1,6,2);
  if(!afk&&dir!=="up"){rect("#2c1c10",x+6,y+6,1,1);rect("#2c1c10",x+9,y+6,1,1);}
  if(afk&&dir!=="up"){rect("#2c1c10",x+6,y+7,2,1);rect("#2c1c10",x+9,y+7,2,1);}
  rect("#5e3717",x+5,y+13,2,2);rect("#5e3717",x+9,y+13,2,2);
  if(afk){cx.fillStyle="#ffe08a";cx.font="bold 7px monospace";cx.fillText("z",x+12,y+3);cx.fillText("Z",x+15,y-2);}
  if(pose&&now-poseT>poseDur)pose=null;
  const p=pose?(now-poseT)/poseDur:0;
  if(pose==="hoe"){
  if(p<0.5){rect("#6e451f",x+11,y-4,2,9);rect("#b4b2a9",x+9,y-7,6,4);}
  else{rect("#6e451f",x+11,y+5,2,8);rect("#b4b2a9",x+9,y+12,6,4);}
  }else if(pose==="water"){
  rect("#888780",x+10,y+7,7,6);rect("#b4b2a9",x+16,y+8,3,2);rect("#5f5e5a",x+11,y+5,4,2);
  }else if(pose==="cast"||fishing){
  rect("#6e451f",x+10,y+4,2,7);
  if(fishing&&now-castT>350){
  cx.strokeStyle="#2c1c10";cx.lineWidth=1;
  const bob=Math.sin(now/200)*1.5;
  cx.beginPath();cx.moveTo(x+12,y+2);cx.lineTo(bx*TS+8,by*TS+7+bob);cx.stroke();
  }
  }
  }
  function drawBobber(now){
  if(!fishing||bx<0)return;
  const p=Math.min(1,(now-castT)/350);
  const sx=px*TS+8,sy=py*TS+2,tx=bx*TS+8,ty=by*TS+8;
  const x=sx+(tx-sx)*p,y=sy+(ty-sy)*p-Math.sin(p*Math.PI)*14+(p>=1?Math.sin(now/200)*1.5:0);
  rect("#e24b4a",x-2,y-2,4,3);rect("#ffffff",x-2,y+1,4,2);
  }
  function drawAnims(now){
  anims=anims.filter(a=>{
  const p=(now-a.t0)/a.dur;
  if(p>=1)return false;
  if(a.type==="dirt"){
  for(let i=0;i<6;i++){const ang=i*1.05,d=p*9;
  rect("#8a5a2b",a.x+8+Math.cos(ang)*d,a.y+10-Math.sin(ang)*d*0.7+p*p*8,2,2);}
  }else if(a.type==="seedfall"){
  rect("#f2c14e",a.x+7,a.y+2+p*9,2,2);rect("#f2c14e",a.x+10,a.y+p*11,2,2);rect("#f2c14e",a.x+4,a.y+1+p*10,2,2);
  }else if(a.type==="drops"){
  for(let i=0;i<5;i++){const ph=(p+i*0.18)%1;
  rect("#5e9ce6",a.x+4+i*2,a.y+2+ph*11,2,2);}
  }else if(a.type==="splash"){
  cx.globalAlpha=1-p;const d=2+p*8;
  rect("#ffffff",a.x+8-d,a.y+8,2,2);rect("#ffffff",a.x+6+d,a.y+8,2,2);
  rect("#7db8f0",a.x+7,a.y+8-d*0.6,2,2);rect("#7db8f0",a.x+7,a.y+7+d*0.6,2,2);
  cx.globalAlpha=1;
  }else if(a.type==="spark"){
  cx.globalAlpha=1-p;const d=3+p*6;
  rect("#ffe08a",a.x+7,a.y+7-d,2,2);rect("#ffe08a",a.x+7,a.y+5+d,2,2);
  rect("#ffe08a",a.x+7-d,a.y+6,2,2);rect("#ffe08a",a.x+5+d,a.y+6,2,2);
  cx.globalAlpha=1;
  }else if(a.type==="fishjump"){
  const fx=a.x+(a.tx-a.x)*p,fy=a.y+(a.ty-a.y)*p-Math.sin(p*Math.PI)*22;
  fishSprite(fx,fy,a.kind,a.tx<a.x);
  }
  return true;});
  }
  function weatherFx(now){
  if(scene==="in")return;
  if(weather==="berawan"){
  cx.globalAlpha=0.10;rect("#3a4456",0,0,320,224);cx.globalAlpha=1;
  }else if(weather==="hujan"){
  cx.globalAlpha=0.12;rect("#23304a",0,0,320,224);cx.globalAlpha=1;
  cx.globalAlpha=0.55;
  for(let i=0;i<26;i++){
  const off=reduceMotion?0:(now/4);
  const x=((i*53+off)%340)-10,y=(i*97+(reduceMotion?0:now/3))%234-5;
  rect("#7db8f0",x,y,1,6);}
  cx.globalAlpha=1;
  }
  if(gameMin>1200){
  const d=Math.min(0.4,(gameMin-1200)/240*0.4);
  cx.globalAlpha=d;rect("#0a0e1c",0,0,320,224);cx.globalAlpha=1;
  }
  }
  function draw(now){
  const m=cur();
  for(let r=0;r<H;r++)for(let c=0;c<W;c++)tile(m[r][c],c,r);
  if(scene==="town")townDeco();
  if(scene==="out")outDeco();
  player(now);
  if(scene==="out")drawBobber(now);
  drawAnims(now);
  weatherFx(now);
  if(sleeping){rect("#000000d9",0,0,320,224);cx.fillStyle="#ffffff";cx.font="12px monospace";cx.fillText("Zzz...",140,110);}
  }

  /* ============ MAIN LOOP ============ */
  function tick(now){
  if(!prevT)prevT=now;
  const dt=now-prevT;prevT=now;
  if(!sleeping){
  minAcc+=dt;
  while(minAcc>=MIN_MS){
  minAcc-=MIN_MS;gameMin++;
  if(gameMin%10===0)hud();
  if(gameMin>=DAY_END){doSleep(false,"forced");break;}
  }
  }
  if(fishing&&now-castT>350){
  mpos=(Math.sin(now/(owned.prorod?500:300))+1)/2*100;
  marker.style.left=mpos+"%";
  }
  draw(now);
  requestAnimationFrame(tick);
  }

  /* ============ ACTIONS ============ */
  function setPose(p,d){pose=p;poseT=performance.now();poseDur=d;}
  function addAnim(o){o.t0=performance.now();anims.push(o);}

  function neighbors(m,ch){
  const n=[[0,-1],[0,1],[-1,0],[1,0]];
  return n.some(([dx,dy])=>{const x=px+dx,y=py+dy;
  return x>=0&&y>=0&&x<W&&y<H&&m[y][x]===ch;});
  }
  function waterNeighbor(){
  const n=[[0,-1],[0,1],[-1,0],[1,0]];
  for(const[dx,dy]of n){const x=px+dx,y=py+dy;
  if(x>=0&&y>=0&&x<W&&y<H&&omap[y][x]==="W")return[x,y];}
  return null;
  }
  function stopFishing(text){
  fishing=false;bx=-1;pose=null;
  if(text)say(text);
  updateAction();
  }

  /* ============ DYNAMIC ACTION BUTTON ============ */
  function updateAction(){
  if(fishing){
  rod.style.display="";
  rod.innerHTML='<span class="big">❗</span>Tarik!';
  return;
  }
  let label="",show=false;
  if(scene==="out"){
  const t=omap[py][px];
  const k=py+","+px;
  const w=waterNeighbor();
  if(t==="s"){
  show=true;
  label=owned.cangkul?'<span class="big">⛏️</span>Cangkul':'<span class="big">⛏️</span>Cangkul<br><small>Butuh Cangkul</small>';
  }else if(t==="S"){
  show=true;
  const hasSeed=Object.values(seedsInv).some(v=>v>0);
  label=hasSeed?'<span class="big">🌱</span>Tanam':'<span class="big">🌱</span>Tanam<br><small>Butuh bibit</small>';
  }else if(t==="C"&&!watered[k]){
  show=true;
  label=owned.watercan?'<span class="big">💧</span>Siram':'<span class="big">💧</span>Siram<br><small>Butuh Alat Siram</small>';
  }else if(t==="M"){
  show=true;label='<span class="big">📦</span>Panen';
  }else if(w){
  show=true;label='<span class="big">🎣</span>Mancing';
  }
  }else if(scene==="in"){
  if(neighbors(imap,"V")){show=true;label='<span class="big">🍳</span>Masak';}
  }else if(scene==="town"){
  if(neighbors(tmap,"1")||neighbors(tmap,"2")||neighbors(tmap,"3")){show=true;label='<span class="big">🏪</span>Toko';}
  }
  rod.style.display=show?"":"none";
  if(show)rod.innerHTML=label;
  }

  rod.addEventListener("click",()=>{
  const now0=performance.now();
  lastActive=now0;
  if(sleeping||busy)return;
  if(now0-lastActionT<350)return;
  lastActionT=now0;

  /* reel in fish */
  if(fishing){
  const d=Math.abs(mpos-50);
  const rare=weather==="hujan"?5:3;
  let t,kind=null;
  if(d<=rare){t="Mantap! Dapat Arwana langka!";kind="arwana";}
  else if(d<=12){t="Dapat Ikan Mas!";kind="mas";}
  else if(d<=25){t="Dapat Lele. Lumayan!";kind="lele";}
  else t="Yah, ikannya lolos...";
  addAnim({type:"splash",x:bx*TS,y:by*TS,dur:400});
  if(kind){nfish++;addAnim({type:"fishjump",x:bx*TS+4,y:by*TS+4,tx:px*TS+4,ty:py*TS,kind,dur:500});}
  hud();save();
  stopFishing(t);
  return;
  }

  if(scene==="out"){
  const t=omap[py][px];
  const cy=py,cx2=px;
  const k=cy+","+cx2;

  /* hoe untilled soil */
  if(t==="s"){
  if(!owned.cangkul){say("Beli Cangkul di Toko Alat dulu!");return;}
  if(!spend(COST.cangkul))return;
  busy=true;rod.disabled=true;
  setPose("hoe",450);
  addAnim({type:"dirt",x:cx2*TS,y:cy*TS,dur:450});
  setTimeout(()=>{omap[cy][cx2]="S";busy=false;rod.disabled=false;lastActionT=performance.now();save();updateAction();say("Tanah dicangkul. Siap untuk ditanam!");},450);
  return;
  }

  /* plant on tilled soil */
  if(t==="S"){
  let st=seedsInv[activeSeed]>0?activeSeed:Object.keys(seedsInv).find(k2=>seedsInv[k2]>0);
  if(!st){say("Bibit habis. Beli di Toko Bibit di kota.");return;}
  if(!spend(COST.tanam))return;
  busy=true;
  setPose("hoe",450);
  addAnim({type:"dirt",x:cx2*TS,y:cy*TS,dur:450});
  setTimeout(()=>{
  addAnim({type:"seedfall",x:cx2*TS,y:cy*TS,dur:300});
  setTimeout(()=>{
  seedsInv[st]--;hud();omap[cy][cx2]="C";cropType[k]=st;
  if(weather==="hujan"){
  watered[k]=true;
  clearTimeout(grow[k]);
  grow[k]=setTimeout(()=>{if(omap[cy][cx2]==="C"){omap[cy][cx2]="M";delete watered[k];}},SEEDS[st].t);
  say(SEEDS[st].nama+" ditanam — hujan langsung menyiramnya!");
  }else{
  watered[k]=false;
  say(SEEDS[st].nama+" ditanam. Siram agar tumbuh!");
  }
  busy=false;save();updateAction();
  },300);
  },450);
  return;
  }

  /* water planted crop */
  if(t==="C"&&!watered[k]){
  if(weather==="hujan"){say("Sedang hujan — tanaman tersiram otomatis.");return;}
  if(!owned.watercan){say("Beli Alat Siram di Toko Alat dulu!");return;}
  if(!spend(COST.siram))return;
  busy=true;
  setPose("water",600);
  addAnim({type:"drops",x:cx2*TS,y:cy*TS,dur:600});
  setTimeout(()=>{
  watered[k]=true;busy=false;
  const st=cropType[k]||"lobak";
  clearTimeout(grow[k]);
  grow[k]=setTimeout(()=>{if(omap[cy][cx2]==="C"){omap[cy][cx2]="M";delete watered[k];}},SEEDS[st].t);
  say("Disiram! Tunggu sebentar atau tidur agar langsung matang.");
  save();updateAction();
  },600);
  return;
  }

  /* harvest mature crop */
  if(t==="M"){
  if(!spend(COST.panen))return;
  const ct=cropType[k]||"lobak";
  const n=owned.cangkul?2:1;
  omap[cy][cx2]="S";score+=n;panenVal+=SEEDS[ct].jual*n;
  delete cropType[k];delete watered[k];
  hud();save();updateAction();
  addAnim({type:"spark",x:cx2*TS,y:cy*TS,dur:450});
  say((owned.cangkul?"Panen dobel: ":"Panen: ")+SEEDS[ct].nama.replace("Bibit ","")+"!");
  return;
  }

  /* start fishing */
  const w=waterNeighbor();
  if(w){
  if(!spend(COST.pancing))return;
  [bx,by]=w;fishing=true;castT=performance.now();
  setPose("cast",350);
  setTimeout(()=>{if(fishing)addAnim({type:"splash",x:bx*TS,y:by*TS,dur:400});},350);
  updateAction();
  say("Tarik saat marker kena zona hijau!");
  return;
  }
  }

  if(scene==="in"){
  if(!neighbors(imap,"V")){say("Mendekatlah ke kompor dulu.");return;}
  if(nfish<1){say("Tidak ada ikan untuk dimasak. Pancing dulu!");return;}
  if(!spend(COST.masak))return;
  nfish--;ncook++;hud();save();
  say("Sreng sreng... ikan bakar siap!");
  return;
  }

  if(scene==="town"){
  if(neighbors(tmap,"1")){openShop("bibit");return;}
  if(neighbors(tmap,"2")){openShop("alat");return;}
  if(neighbors(tmap,"3")){openShop("jual");return;}
  say("Dekati Toko Bibit, Toko Alat, atau Lapak Jual.");
  return;
  }
  });

  el("eat").addEventListener("click",()=>{
  if(sleeping)return;
  if(ncook<1){say("Belum punya masakan. Masak ikan dulu di dapur rumah.");return;}
  ncook--;stamina=Math.min(100,stamina+40);hud();save();
  say("Nyam! Stamina pulih +40.");
  });
  el("reset").addEventListener("click",()=>{
  if(!resetArm){resetArm=true;el("reset").textContent="Yakin? Tekan lagi";
  setTimeout(()=>{resetArm=false;el("reset").textContent="Hapus save";},2500);
  return;}
  wipe();
  });

  /* ============ SHOPS ============ */
  function srow(act,arg,nama,desc,btn,dis){
  return '<div class="srow"><div class="info"><div class="nm">'+nama+'</div><div class="ds">'+desc+'</div></div>'
  +'<button data-act="'+act+'" data-arg="'+arg+'"'+(dis?" disabled":"")+'>'+btn+'</button></div>';
  }
  function openShop(kind){shopKind=kind;renderShop();rod.style.display="none";}
  function closeShop(){shopKind=null;panel.style.display="none";updateAction();}
  function renderShop(){
  if(!shopKind){panel.style.display="none";return;}
  let h='<div class="shop-head"><h3 id="shoptitle"></h3><button class="shop-close" data-act="close" aria-label="tutup">✕</button></div>';
  let title="";
  if(shopKind==="bibit"){
  title="TOKO BIBIT";
  for(const k in SEEDS){const s=SEEDS[k];
  h+=srow("seed",k,s.nama+" · punya "+seedsInv[k],s.d+" · laku "+s.jual+"G",s.harga+"G",gold<s.harga);}
  h+='<p class="note">Bibit terakhir yang dibeli jadi bibit aktif untuk menanam.</p>';
  }else if(shopKind==="alat"){
  title="TOKO ALAT";
  for(const t of TOOLS){h+=srow("tool",t.id,t.nama,t.d,owned[t.id]?"Punya":t.harga+"G",owned[t.id]||gold<t.harga);}
  }else{
  title="LAPAK JUAL";
  h+=srow("sell","panen","Hasil Panen × "+score,"Total nilai "+panenVal+"G",panenVal+"G",panenVal<1);
  h+=srow("sell","ikan","Ikan × "+nfish,HARGA_IKAN+"G per ekor",(nfish*HARGA_IKAN)+"G",nfish<1);
  h+=srow("sell","masak","Masakan × "+ncook,HARGA_MASAK+"G per porsi",(ncook*HARGA_MASAK)+"G",ncook<1);
  const all=panenVal+nfish*HARGA_IKAN+ncook*HARGA_MASAK;
  h+=srow("sell","semua","Jual Semua","Borongan langsung",all+"G",all<1);
  }
  panel.innerHTML=h;
  panel.querySelector("#shoptitle").textContent=title;
  panel.style.display="block";
  }
  panel.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const act=b.dataset.act,arg=b.dataset.arg;
  if(act==="close"){closeShop();return;}
  if(act==="seed"){
  const s=SEEDS[arg];if(gold<s.harga)return;
  gold-=s.harga;seedsInv[arg]++;activeSeed=arg;hud();renderShop();save();
  say(s.nama+" dibeli (−"+s.harga+"G). Jadi bibit aktif.");}
  if(act==="tool"){
  const t=TOOLS.find(t=>t.id===arg);
  if(owned[arg]||gold<t.harga)return;
  gold-=t.harga;owned[arg]=true;hud();renderShop();save();
  say(t.nama+" dibeli! "+t.d+".");}
  if(act==="sell"){
  let g=0;
  if(arg==="panen"||arg==="semua"){g+=panenVal;score=0;panenVal=0;}
  if(arg==="ikan"||arg==="semua"){g+=nfish*HARGA_IKAN;nfish=0;}
  if(arg==="masak"||arg==="semua"){g+=ncook*HARGA_MASAK;ncook=0;}
  if(g<1)return;
  gold+=g;hud();renderShop();save();
  say("Laku! +"+g+"G.");}
  });

  /* ============ MOVEMENT ============ */
  function go(s,x,y,d,text){
  if(fishing)stopFishing();
  closeShop();
  scene=s;px=x;py=y;dir=d;
  say(text);
  updateAction();
  }
  const SOLID={out:"TWFHR",in:"XBKV",town:"TUuHA123lk"};
  function move(dx,dy,d){
  if(sleeping||busy)return;
  if(fishing)stopFishing("Mancing batal.");
  if(shopKind)closeShop();
  dir=d;
  const m=cur(),nx=px+dx,ny=py+dy;
  if(nx<0||ny<0||nx>=W||ny>=H)return;
  const t=m[ny][nx];
  if(scene==="out"&&t==="P"&&ny===0){say("Spot Mancing Premium — segera hadir!");return;}
  if(scene==="out"&&t==="P"&&nx===19){say("Tambang Mineral — segera hadir!");return;}
  if(scene==="out"&&t==="P"&&nx===0){say("Hutan Penebangan — segera hadir!");return;}
  if(scene==="out"&&t==="D"){go("in",9,9,"up","Selamat datang di rumah.");return;}
  if(scene==="out"&&t==="P"&&ny===13){go("town",14,2,"down","Selamat datang di kota! Tekan Toko di depan toko untuk belanja.");return;}
  if(scene==="in"&&t==="E"){go("out",3,4,"down","Kembali ke ladang.");return;}
  if(scene==="town"&&t==="e"){go("out",14,12,"up","Kembali ke ladang.");return;}
  if(SOLID[scene].includes(t))return;
  px=nx;py=ny;
  if(scene==="in"&&(t==="Z"||t==="z")){doSleep(true,"bed");return;}
  updateAction();
  }
  const dirs={up:[0,-1,"up"],down:[0,1,"down"],left:[-1,0,"left"],right:[1,0,"right"]};
  Object.keys(dirs).forEach(id=>{
  const b=el(id);let t;
  const g=()=>move(...dirs[id]);
  const start=e=>{e.preventDefault();lastActive=performance.now();g();t=setInterval(g,owned.sepatu?110:160);};
  const stop=()=>clearInterval(t);
  b.addEventListener("touchstart",start,{passive:false});
  b.addEventListener("touchend",stop);b.addEventListener("touchcancel",stop);
  b.addEventListener("mousedown",start);
  b.addEventListener("mouseup",stop);b.addEventListener("mouseleave",stop);
  });
  document.addEventListener("keydown",e=>{
  lastActive=performance.now();
  const m={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right"};
  if(m[e.key]){e.preventDefault();move(...dirs[m[e.key]]);}
  if((e.key===" "||e.key==="Enter")&&!e.repeat){e.preventDefault();if(rod.style.display!=="none")rod.click();}
  });

  /* ============ BOOT ============ */
  const loaded=load();
  if(!loaded)rollWeather();
  hud();
  if(loaded){say("Save dimuat. Lanjutkan petualanganmu — Hari "+day+", cuaca "+(weather==="hujan"?"hujan":weather)+".");}
  updateAction();
  setInterval(()=>{save();},60000);
  requestAnimationFrame(tick);
})();
