import {createInteractions} from './interactions.js';
import {init,GameLoop} from './vendor/kontra.js';
import {createGame,foodStage} from './model.js';
const {canvas,context:c}=init('game');
const game=createGame(),s=game.state,$=id=>document.getElementById(id);
const backgroundFiles={living:'assets/living-v2.png',bedroom:'assets/bedroom-v2.png',yard:'assets/yard-v2.png'};
const backgrounds={};
for(const [room,src]of Object.entries(backgroundFiles)){const img=new Image();img.src=src;backgrounds[room]=img;}
function paintRoom(){const bg=backgrounds[s.room];if(bg.complete&&bg.naturalWidth){c.drawImage(bg,0,0,480,300);}else{({living,yard,bedroom}[s.room])();decor(s.room);}
 if(s.room==='living'){
  text('沙发',194,87,'#754956',7);text('饮水机',350,109,'#754956',6);text('饭盆',408,164,'#754956',6);
  if(s.food)for(let i=0;i<foodStage(s.food.elapsed)*5;i++){const x=402+(i*5)%13,y=140+Math.floor(i/5)*1.2;rect(x,y,2,1,'#ba834b');}
 }else if(s.room==='yard')for(const p of s.poops){ellipse(p.x,p.y+2,7,2,'#3d4e3338');rect(p.x-5,p.y-4,10,5,'#795139');rect(p.x-3,p.y-8,7,5,'#956341');rect(p.x-1,p.y-10,3,3,'#b28655');}
}
function bedCovers(){
 if(s.room!=='bedroom')return;
 const sleepers=s.people.filter(p=>['bed','hug'].includes(p.pose));if(!sleepers.length)return;
 const bg=backgrounds.bedroom;if(!bg.complete||!bg.naturalWidth)return;
 // The cloth texture is stretched over a softly raised silhouette. Its bottom
 // edge stays on the mattress while shoulder peaks breathe with the sleepers.
 c.imageSmoothingEnabled=true;for(let x=177;x<303;x+=2){
  const bump=Math.max(...sleepers.map((p,i)=>(20+Math.sin(s.time*1.8+i*.45)*.35)*Math.exp(-Math.pow((x-p.x)/16,2))));
  const top=128-bump;
  c.drawImage(bg,bg.naturalWidth*x/480,bg.naturalHeight*128/300,bg.naturalWidth*2.25/480,bg.naturalHeight*82/300,x,top,2.25,210-top);
 }
 c.save();
 for(const p of sleepers){
  // Long, soft folds describe shoulders, hips and legs under the floral quilt.
  const breathing=Math.sin(s.time*1.8)*.35;
  c.save();c.translate(p.x,155+breathing);c.scale(1,2.15);
  let light=c.createRadialGradient(-3,-2,1,0,0,16);light.addColorStop(0,'#ffeddc22');light.addColorStop(.7,'#fff3df09');light.addColorStop(1,'#fff0df00');c.fillStyle=light;c.fillRect(-18,-20,36,42);c.restore();
  c.strokeStyle='#7a3e5524';c.lineWidth=.65;c.beginPath();c.moveTo(p.x+14,131);c.bezierCurveTo(p.x+18,144,p.x+12,169,p.x+7,183);c.stroke();
  c.strokeStyle='#fff0dd35';c.beginPath();c.moveTo(p.x-9,132);c.bezierCurveTo(p.x-14,143,p.x-8,158,p.x-7,175);c.stroke();
 }
 c.restore();
 c.imageSmoothingEnabled=false;if(s.bed==='hug')text('♥',239,79,'#eeadbb',9);
}

let sound=true,audio,menu=null,lastMessage='',effect=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tone(f=440,d=.12,type='sine',to=f){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),audio.currentTime+d);g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}catch{}}
function say(text){$('message').textContent=text;lastMessage=text;}
function close(){menu=null;$('bubbles').hidden=true;}
function options(title,items){menu=title;const box=$('bubbles');box.replaceChildren();const heading=document.createElement('b');heading.textContent=title;box.append(heading);for(const [label,fn] of items){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{tone(640,.07);close();fn();};box.append(b);}box.hidden=false;}
function select(i){s.selected=i;document.querySelectorAll('.character-bar button').forEach((b,n)=>b.classList.toggle('selected',i===n));}
function move(p,x,y,action,shared=false){if(!shared)interactions.cancelForMove(p);releaseLap(p);p.busy=0;p.after=null;p.phoneTimer=0;p.hit=0;p.target={x,y};p.action=action;p.pose='walk';}
function sofa(){if(s.room!=='living')return;const p=s.people[s.selected],i=s.selected;move(p,174+i*65,151,()=>{p.pose='sit';sofaMenu(p);});say(p.name+'走向沙发，找个舒服的位置。');}
function sofaMenu(p){setSofaPose(p,'sit');options(p.name+' · 沙发时间',[['看手机',()=>{setSofaPose(p,'sitPhone');say('刷到好笑的视频，忍不住一起笑。');}],['和小狗玩',()=>{if(s.food?.eating){say('小白正在吃饭，吃饱再抱抱。');return;}if(s.dog.pose==='lap')setSofaPose(s.people[s.dog.owner],'sit');setSofaPose(p,'pet');s.dog.pose='lap';s.dog.target=null;s.dog.owner=s.people.indexOf(p);say('小白窝在腿上，舒服得眯起了眼睛。');}],['躺一会儿',()=>lie(p)],['和白雪梓玩闹',()=>interactions.startLiving()]]);}
function lie(p){setSofaPose(p,'lie');options(p.name+' · 躺平也很好',[['玩手机',()=>{setSofaPose(p,'lie');game.phone(p);say('举高手机，开始快乐摸鱼。');}],['眯觉觉',()=>{setSofaPose(p,'sleep');say('侧过身，眯一个软乎乎的午觉。');}]]);}
function water(){if(s.room!=='living')return;close();if(s.food?.eating){say('小白正在吃饭，吃完再喝水吧。');return;}releaseLap();s.dog.target={x:350,y:148};s.dog.pose='walkWater';say('听到水声，小白跑去喝水。');}
function feed(){if(s.food){say('饭盆里还有粮，等小白慢慢吃完。');return;}const p=s.people[s.selected];move(p,416,176,()=>{p.pose='pour';p.busy=1.3;p.after=()=>{p.pose='stand';releaseLap();game.feed();s.dog.pose='walkFood';s.dog.target={x:408,y:148};};});say(p.name+'拿起粮袋，给小白添饭。');}
function rest(){interactions.stop();close();s.bed='enter';let arrived=0;s.people.forEach((p,i)=>move(p,218+i*44,132,()=>{p.pose='bed';arrived++;if(arrived===2){s.bed='rest';say('钻进被窝啦。点齐特，看看今晚做什么。');}}));}
function bedMenu(){if(s.playScene)interactions.stop();options('白雪梓 · 被窝里的小日常',[['踹下床',()=>{s.bed='kick';s.people[0].pose='fall';s.people[0].anim=0;s.people[1].pose='kick';tone(220,.35,'triangle',55);say('嘿呀！齐特裹着睡裤滚下了床。');}],['打屁屁（睡裤版）',()=>interactions.startBed()],['抱着睡觉觉',()=>{s.bed='hug';s.cinematic=.01;s.people.forEach(p=>p.pose='hug');$('wake').hidden=false;say('晚安。齐特把白雪梓抱在怀里，偷偷扬起嘴角。');tone(392,1.5,'sine',262);}]]);}
function bury(poop){const p=s.people[s.selected];move(p,clamp(poop.x-18,25,450),poop.y,()=>{p.pose='dig';p.busy=2;p.after=()=>{s.poops=s.poops.filter(v=>v!==poop);p.pose='stand';effect={x:poop.x,y:poop.y,left:1.5,type:'soil'};say('铲一铲，埋好啦。院子又干干净净。');tone(160,.15,'triangle');};});say(p.name+'拿着小铲子来收拾啦。');}
function roomActions(){const a=$('actions');a.replaceChildren();const add=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{tone(500,.06);f();};a.append(b);};if(s.room==='living'){add('喝水',water);add('添粮',feed);add('和齐特玩闹',()=>interactions.startLiving());}if(s.room==='yard')add('遛狗',()=>options('小白 · 出门撒欢吧',[['遛狗',()=>{if(!game.walk())say('小白还在奔跑，等这一圈结束吧。');}]]));if(s.room==='yard')add('秋千',()=>interactions.swingMenu());if(s.room==='bedroom')add('一起休息',rest);}
function travel(room){interactions.stop();close();game.travel(room);effect=null;$('wake').hidden=true;document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('active',b.dataset.room===room));$('room-title').textContent={living:'我们的客厅',yard:'阳光小院',bedroom:'晚安卧室'}[room];roomActions();}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>travel(b.dataset.room));
s.people.forEach((_,i)=>$('select-'+i).onclick=()=>{select(i);close();});$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♫ 声音开':'♫ 声音关';tone();};$('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=$('understood').onclick=()=>$('help-dialog').close();$('wake').onclick=()=>{s.cinematic=0;s.bed='rest';s.people.forEach(p=>p.pose='bed');$('wake').hidden=true;say('睡饱了，今天也要抱抱你。');};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();tone(520,.035);const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*480/r.width,y=(e.clientY-r.top)*300/r.height;if(s.cinematic)return;close();if(s.room==='yard'){const poop=s.poops.find(p=>Math.hypot(x-p.x,y-p.y)<18);if(poop){bury(poop);return;}}
 if(interactions.tap(x,y))return;
 for(let i=1;i>=0;i--){const p=s.people[i];if(personContains(p,i,x,y)){select(i);if(s.room==='yard'&&p.pose==='swing'){interactions.swingMenu();return;}if(s.room==='bedroom'&&s.bed){if(i===0&&s.bed==='pat'){interactions.queueHit();}else if(i===0)bedMenu();return;}if(s.room==='living'&&i===0&&!onSofa(p)){interactions.startLiving();return;}if(['sit','sitPhone','pet'].includes(p.pose))lie(p);else if(['lie','liePhone','sleep'].includes(p.pose))sofaMenu(p);else say('选中了'+p.name+'，点地面走动，或点家具互动。');return;}}
 if(s.room==='living'){if(x>94&&x<287&&y>89&&y<168){sofa();return;}if(x>330&&x<377&&y>106&&y<159){water();return;}if(x>390&&x<433&&y>132&&y<173){feed();return;}}
 if(s.room==='bedroom'&&x>163&&x<304&&y>90&&y<203){if(s.bed==='rest')bedMenu();else rest();return;}
 if(s.room==='yard'&&Math.hypot(x-s.dog.x,y-s.dog.y)<23){options('小白摇着尾巴看着你',[['遛狗',()=>game.walk()]]);return;}
 if(y<174&&s.room!=='yard'){say('点前面的空地走动，家具可以直接点击互动。');return;}if(s.bed){s.bed=null;s.people.forEach((p,i)=>Object.assign(p,{x:210+i*65,y:227,pose:'stand',target:null}));}move(s.people[s.selected],clamp(x,30,450),clamp(y,s.room==='yard'?135:181,277));});
function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function line(x,y,w,h,color){rect(x,y,w,h,color);}
function ellipse(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(str,x,y,color='#5f624f',size=7){c.font=`${size}px "Microsoft YaHei",sans-serif`;c.fillStyle=color;c.textAlign='center';c.fillText(str,Math.round(x),Math.round(y));}
function plant(x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);rect(-7,-12,14,12,'#bc8567');rect(-9,-14,18,4,'#d1a280');rect(-1,-37,2,24,'#637b50');[[-8,-29],[5,-38],[-10,-42],[7,-23]].forEach(([a,b])=>{rect(a,b,9,6,'#789564');rect(a+2,b-3,5,4,'#91a976');});c.restore();}
function windowArt(x,y,night=false){rect(x-4,y-4,80,66,'#baa780');rect(x,y,72,57,night?'#555e7c':'#b7d1c2');rect(x+4,y+4,64,49,night?'#666f8d':'#d4e2cb');if(night){rect(x+44,y+10,10,10,'#f5e7b2');rect(x+40,y+8,9,8,'#666f8d');}else{rect(x+9,y+8,13,9,'#f6e8b8');rect(x+5,y+34,62,19,'#91ad82');rect(x+15,y+28,20,25,'#a7be91');}rect(x+34,y,4,57,'#f1e5ca');rect(x,y+27,72,4,'#f1e5ca');rect(x-9,y-5,10,70,'#e5d6b7');rect(x+71,y-5,10,70,'#e5d6b7');rect(x-5,y+58,84,4,'#b49a78');}
function floor(){rect(0,0,480,300,'#e4d9b9');rect(14,16,452,120,'#ede4cb');for(let x=20;x<466;x+=15)rect(x,17,1,114,'#e4dcc0');rect(10,132,460,9,'#a58b69');rect(10,141,460,150,'#c5ab82');for(let y=143,n=0;y<293;y+=19,n++){rect(12,y,456,1,'#b59a73');for(let x=12+(n%2)*38;x<470;x+=76){rect(x,y,1,18,'#b59a73');rect(x+12,y+7,24,1,'#cbb28e');}}rect(0,0,480,12,'#8c795e');rect(0,0,10,300,'#8c795e');rect(470,0,10,300,'#8c795e');rect(0,291,480,9,'#8c795e');}
function rug(x,y,w,h){rect(x-3,y+3,w+6,h,'#aa967b');rect(x,y,w,h,'#e9dac0');rect(x+5,y+5,w-10,h-10,'#b1b896');rect(x+9,y+9,w-18,h-18,'#cbd0ae');for(let i=x+12;i<x+w-8;i+=12){rect(i,y+12,3,h-24,'#bbc4a0');}for(let i=x;i<x+w;i+=7){rect(i,y-3,3,3,'#e9dac0');rect(i,y+h,3,4,'#e9dac0');}}
function living(){floor();windowArt(39,35);rect(142,33,37,34,'#aa8f6c');rect(145,36,31,28,'#f5e9cc');rect(151,48,18,12,'#acbd90');rect(159,42,9,9,'#d4ae79');text('HOME',160,76,'#9a9a7d',6);rect(239,39,46,3,'#a78a67');rect(242,23,4,16,'#a8b298');rect(248,20,5,19,'#c09c7e');rect(255,25,5,14,'#e3ca9b');plant(275,39,.48);windowArt(333,31);rug(105,178,202,82);
 rect(88,113,205,57,'#90765b');rect(92,96,197,60,'#879978');rect(98,101,185,30,'#a5b392');rect(98,130,185,26,'#b1bd9b');rect(99,154,184,7,'#6f8466');rect(87,121,18,40,'#97aa84');rect(278,121,18,40,'#97aa84');rect(111,108,29,22,'#e1d8b9');rect(248,109,23,21,'#d8b69a');rect(191,101,3,50,'#91a681');rect(102,162,7,9,'#755f4e');rect(273,162,7,9,'#755f4e');text('沙发',192,91,'#7a8568');
 ellipse(341,213,29,17,'#b39372');ellipse(341,209,27,17,'#b6a082');ellipse(341,208,21,11,'#e2d6bd');ellipse(341,211,16,7,'#c5b89d');text('小白的窝',343,240,'#827657');
 rect(375,119,21,32,'#e0e0cc');rect(378,110,16,22,'#a4c4bf');rect(381,113,5,15,'#cfe1d4');rect(372,151,28,13,'#f1eee0');rect(375,152,21,5,'#94bdb9');rect(384,142,4,10,'#6a9998');rect(386,153,2,5,'#d7eeea');text('饮水机',386,106,'#7d876f');
 ellipse(426,174,17,8,'#a1775e');ellipse(426,170,16,7,'#d2a27c');ellipse(426,168,12,4,'#7f6e56');if(s.food){for(let i=0;i<foodStage(s.food.elapsed)*4;i++)rect(417+(i*7)%19,165+Math.floor(i/4)*2,3,2,'#c39a5d');}text('饭盆',427,195,'#827657');plant(39,174,1.3);plant(448,130,.8);
 rect(37,243,37,31,'#a38662');rect(39,238,33,30,'#d9bc8f');rect(43,242,25,19,'#f3e5c8');rect(48,247,15,2,'#c5b392');rect(47,252,15,2,'#c5b392');
}
function yard(){rect(0,0,480,300,'#9cba80');rect(0,0,480,84,'#c8dcc0');rect(0,73,480,12,'#afc899');for(let x=8;x<480;x+=19){rect(x,78,10,53,'#e5d5ac');rect(x+2,73,6,5,'#e5d5ac');rect(x,81,2,49,'#c3b68f');}rect(0,94,480,7,'#efe0b9');rect(0,117,480,7,'#cdbb91');for(let i=0;i<150;i++){const x=(i*79+23)%470,y=139+(i*43)%153;rect(x,y,3,2,i%2?'#88a76d':'#acc990');if(i%6===0){rect(x,y-3,1,3,'#789861');rect(x-2,y-4,4,2,i%3?'#efe4ae':'#e4b4a1');}}for(let i=0;i<6;i++){rect(51+i*8,150+i*24,41,17,'#c6bea0');rect(54+i*8,151+i*24,34,12,'#d9d1b1');}rect(337,203,103,60,'#80684d');rect(343,209,91,48,'#9e825e');for(let i=0;i<5;i++)plant(355+i*17,240,.55);text('小菜园',389,277,'#546e43');tree(47,100);tree(431,84);rect(171,111,119,25,'#c4a57c');rect(170,115,119,3,'#aa8762');rect(176,137,7,22,'#92734f');rect(274,137,7,22,'#92734f');rect(165,135,128,9,'#d3b589');rect(313,156,14,15,'#cd9c75');plant(318,151,.8);for(const p of s.poops){ellipse(p.x,p.y+2,8,3,'#7d7856');rect(p.x-6,p.y-5,12,6,'#866047');rect(p.x-4,p.y-9,8,5,'#987252');rect(p.x-1,p.y-12,4,4,'#ae8560');}text('点小白或「遛狗」一起撒欢',237,38,'#6e8960',9);}
function tree(x,y){rect(x-5,y-32,11,49,'#a58a63');rect(x-23,y-73,48,49,'#799967');rect(x-32,y-62,65,27,'#799967');rect(x-24,y-72,43,27,'#92ad75');rect(x-13,y-82,24,17,'#92ad75');rect(x-18,y-67,13,4,'#a7bc86');}
function bedroom(){floor();windowArt(50,34,true);rect(343,35,53,37,'#ab947a');rect(347,39,45,29,'#ddc7ad');text('GOOD NIGHT',369,57,'#8d826e',5);rug(151,202,178,63);rect(157,95,153,111,'#8f735e');rect(163,88,141,38,'#ac8f72');rect(166,111,135,87,'#f0e4cb');rect(170,115,58,27,'#fbf1d9');rect(238,115,58,27,'#fbf1d9');rect(166,145,135,49,'#9da68d');rect(170,151,127,4,'#b6bea2');for(let x=177;x<295;x+=17)rect(x,155,1,37,'#aeb69a');rect(163,195,141,8,'#7d6655');rect(165,203,8,9,'#715c4d');rect(293,203,8,9,'#715c4d');rect(115,119,31,42,'#b3946d');rect(118,124,25,14,'#c9ae84');rect(129,130,4,2,'#806d52');rect(129,101,3,18,'#9c8766');rect(119,92,23,12,'#f0dca4');ellipse(131,96,23,17,'#f4deaa35');plant(334,160,.8);rect(388,102,50,87,'#baa17f');rect(391,105,44,80,'#cbb493');rect(412,106,2,78,'#ad9576');rect(407,145,3,7,'#867359');rect(417,145,3,7,'#867359');text('一起休息',236,84,'#8e856b',8);}
function glow(x,y,r,color){const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#ffe2a000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function frame(x,y,w,h){rect(x-1,y-1,w+2,h+3,'#9c7a5d');rect(x,y,w,h,'#d4b48b');rect(x+2,y+2,w-4,h-4,'#fbebce');rect(x+4,y+4,w-8,h-8,'#b8c2a0');rect(x+6,y+7,5,6,'#f0c39c');rect(x+w-12,y+8,5,6,'#edc5a1');rect(x+6,y+5,5,3,'#685043');rect(x+w-12,y+6,5,3,'#59453a');rect(x+5,y+13,8,7,'#82967e');rect(x+w-13,y+14,8,6,'#c99482');rect(x+w/2-2,y+h-7,4,3,'#fff6e1');}
function book(x,y,w,color){rect(x,y,w,4,color);rect(x+1,y+1,w-3,1,'#f3e3c6');rect(x+2,y+3,w-4,1,'#77665155');}
function cup(x,y){rect(x-4,y-6,8,7,'#fff2d8');rect(x-3,y-5,6,2,'#9b7560');rect(x+4,y-4,3,4,'#e5c9a3');rect(x+5,y-3,1,1,'#c7aa82');rect(x-3,y+1,9,1,'#b59a72');for(let i=0;i<2;i++)rect(x-1+Math.sin(s.time*1.4+i)*2,y-11-i*4,1,3,'#fff7e478');}
function flowers(x,y){rect(x-5,y-11,10,11,'#e6c3a7');rect(x-4,y-13,8,3,'#f4d7b6');for(let i=0;i<5;i++){const xx=x-8+i*4,yy=y-20-(i%2)*5;rect(xx,yy,1,y-yy-10,'#7c9469');rect(xx-3,yy-2,6,5,i%2?'#e7b6a0':'#eee1b4');rect(xx-1,yy-1,2,2,'#c2a270');}rect(x-3,y-9,1,6,'#f2d9bc');}
function decor(room){
 if(room==='living'){
 // Afternoon light, soft curtains and stitched furniture.
 c.fillStyle='#fff4c727';c.beginPath();c.moveTo(39,94);c.lineTo(111,94);c.lineTo(215,284);c.lineTo(84,284);c.fill();
 for(const x of [31,112,325,406]){rect(x,30,10,64,'#c6b38c');rect(x+1,32,8,59,'#eddbb8');rect(x+3,33,2,55,'#fbebcd');rect(x+7,34,1,57,'#d9c49d');rect(x,75,10,3,'#b09c77');}
 rect(98,98,185,2,'#bac6a4');rect(94,103,2,17,'#bbc7a6');rect(106,133,169,2,'#ccd0ae');rect(108,151,168,2,'#8b9e7b');rect(89,124,3,29,'#b6c39e');rect(281,123,10,3,'#bec9a9');for(let x=113;x<279;x+=16){rect(x,141,1,1,'#d4d7b9');rect(x+5,111,1,1,'#c1caae');}
 rect(112,108,26,2,'#fff0cf');rect(112,109,2,17,'#ebdfba');rect(115,111,19,15,'#d2be91');rect(118,113,13,11,'#e5d5aa');rect(120,115,9,7,'#c7b888');rect(123,117,3,3,'#f1dfb5');
 rect(248,109,22,2,'#f0ceb0');rect(250,112,18,16,'#d4a08c');for(let y=114;y<128;y+=4)rect(251,y,16,1,'#e5b49e');for(let x=253;x<269;x+=5)rect(x,112,1,16,'#e7b9a2');
 rect(222,127,20,29,'#d3bb94');rect(225,128,2,29,'#ede0b9');rect(233,128,2,29,'#a5ad89');for(let y=130;y<155;y+=5)rect(222,y,20,1,'#f0dfb2');for(let x=222;x<242;x+=3)rect(x,157,1,4,'#d3bb94');
 // Little shelf with a framed portrait, records and keepsakes.
 rect(188,56,43,4,'#ac8b65');rect(188,56,43,1,'#ddc198');frame(191,31,25,24);rect(220,46,7,9,'#b5bb93');rect(222,39,2,8,'#7f9665');rect(218,39,6,3,'#9fb27f');text('our little home',213,74,'#999077',5);
 rect(24,263,53,19,'#a48867');rect(26,257,49,18,'#c5a581');rect(27,258,47,2,'#ebcca0');rect(30,276,4,8,'#876d53');rect(67,276,4,8,'#876d53');book(31,253,19,'#8d9c80');book(33,249,17,'#c69079');cup(61,256);
 // A floor lamp and warm pool of light.
 ellipse(309,170,11,4,'#9c8563');rect(308,106,3,63,'#a48b64');rect(303,100,14,7,'#e2c596');rect(298,88,24,15,'#ecdbb0');rect(301,84,18,5,'#f2e3c1');rect(300,90,2,10,'#fff0cf');rect(316,90,2,10,'#d5bd8e');rect(297,103,26,2,'#b6a175');glow(310,106,41,'#ffdc813b');
 // Basket with tiny dog toys.
 rect(392,238,36,26,'#bc986e');rect(394,236,32,5,'#e6c697');rect(395,240,30,2,'#d2b487');for(let x=397;x<426;x+=6)rect(x,241,2,22,'#d9b98d');for(let y=246;y<263;y+=6)rect(394,y,32,1,'#a78c64');rect(399,230,7,8,'#98a884');rect(398,229,3,3,'#98a884');rect(405,229,3,3,'#98a884');ellipse(417,235,5,5,'#c9927e');rect(416,231,1,8,'#e6b7a0');text('TOYS',410,255,'#927557',5);
 // Dog bed piping, water ripples, bowls and a chew toy.
 for(let i=0;i<13;i++){const a=i*Math.PI*2/13;rect(341+Math.cos(a)*25,208+Math.sin(a)*14,2,1,'#dac29b');}rect(331,202,16,2,'#eee3cc');rect(336,213,10,1,'#ded1b7');rect(377,154,6,1,'#d6ebe0');rect(391,155,5,1,'#c8e5d8');rect(415,175,23,1,'#ecc49a');rect(451,208,13,4,'#ece3c7');rect(450,206,4,8,'#ece3c7');rect(462,206,4,8,'#ece3c7');
 // String lights: low-key sparkle, never a flashing effect.
 for(let i=0;i<17;i++){let x=24+i*26,y=20+Math.sin(i/16*Math.PI)*7;rect(x,y,25,1,'#bbac8a');rect(x+12,y+1,1,3,'#bcab87');rect(x+11,y+4,3,3,'#fff0bf');glow(x+12,y+5,8,'#ffe7a32e');}
 }else if(room==='bedroom'){
 for(const x of [42,123]){rect(x,29,9,66,'#b7a291');rect(x+2,31,2,62,'#d7c2ac');rect(x+5,31,1,62,'#efdbc1');rect(x,74,9,3,'#9a8878');}
 rect(166,91,135,2,'#d7b68e');for(let x=173;x<299;x+=17){rect(x,94,1,15,'#bc9b76');rect(x+1,94,1,15,'#8c715833');}rect(173,118,51,2,'#fff9e4');rect(174,122,1,14,'#d5c5a9');rect(242,118,49,2,'#fff9e4');rect(289,122,1,14,'#d5c5a9');
 for(let y=159;y<193;y+=8)for(let x=176;x<294;x+=12){rect(x,y,2,2,'#c6caab');rect(x+2,y+2,2,2,'#b7bfa0');}rect(168,146,131,3,'#d3d5b5');rect(168,188,130,3,'#84967c');
 rect(282,154,18,39,'#d0a48f');for(let x=284;x<299;x+=5)rect(x,155,1,37,'#e2bfaa');for(let y=157;y<192;y+=5)rect(283,y,17,1,'#b58d7c');
 glow(131,110,62,'#ffcf7940');rect(122,94,2,8,'#fff0c8');rect(125,94,1,8,'#f5e2b8');rect(135,94,1,8,'#d5bb87');book(117,117,13,'#8b9a82');cup(140,119);frame(350,42,32,25);
 rect(320,161,43,4,'#be9d74');rect(324,165,4,25,'#9b805c');rect(355,165,4,25,'#9b805c');flowers(343,160);rect(393,107,40,2,'#e4cbaa');rect(394,111,1,72,'#dbc2a0');rect(416,111,1,72,'#dbc2a0');
 rect(49,201,60,41,'#b49b78');rect(52,204,54,5,'#d3bd98');rect(52,213,54,2,'#977d5e');rect(52,218,54,21,'#c4ab86');rect(74,226,9,2,'#907356');rect(53,242,5,6,'#967657');rect(101,242,5,6,'#967657');frame(54,178,23,22);flowers(96,202);
 for(let i=0;i<8;i++){rect(180+i*14,32+Math.sin(i*.5)*5,12,1,'#bba588');rect(183+i*14,35+Math.sin(i*.5)*5,3,3,'#ffe1a1');glow(185+i*14,37,10,'#fcd39115');}text('you are my home',237,56,'#a78f77',7);
 ellipse(363,255,9,4,'#c4ad8a');rect(355,249,13,6,'#d3b29d');rect(356,247,9,3,'#ebc9b0');ellipse(383,260,9,4,'#c4ad8a');rect(375,254,13,6,'#95a58c');rect(376,252,9,3,'#c0cbb0');
 }else{
 for(let x=14;x<471;x+=19){rect(x,82,1,10,'#f5e6c3');rect(x,104,1,11,'#f3e1b7');rect(x+2,98,2,2,'#b09c73');rect(x+2,121,2,2,'#ad9a72');}
 for(let i=0;i<45;i++){const x=10+(i*83)%465,y=133+(i*37)%154;if(x>337&&y>201)continue;rect(x,y,1,3,'#7b9c68');rect(x+2,y-1,1,3,'#a6c58b');if(i%4===0){rect(x-1,y-2,4,2,'#f6e9bb');rect(x,y-3,2,4,'#f6e9bb');rect(x,y-2,1,1,'#d7b770');}}
 rect(173,113,114,1,'#e7cda1');rect(169,137,122,1,'#f0d4a8');rect(190,119,23,15,'#e7d4aa');rect(192,120,19,11,'#b8bc98');rect(244,124,20,11,'#d6a28b');book(222,130,15,'#969e7d');
 for(let i=0;i<4;i++){const x=351+i*25;rect(x,252,7,3,'#ad684f');rect(x+3,246,1,7,'#739559');rect(x,245,7,2,'#93ae70');}
 // A small picnic blanket and a ball in the grass.
 rect(152,260,100,31,'#cfb998');rect(154,261,96,28,'#ead7b2');for(let x=160;x<249;x+=12)rect(x,261,4,28,'#c3947a');for(let y=265;y<287;y+=10)rect(154,y,96,3,'#cda084');book(173,271,18,'#889881');cup(221,270);ellipse(307,250,8,7,'#d69f7b');rect(302,246,3,3,'#f3caa2');rect(307,244,2,13,'#eee3ba');
 for(let n=0;n<3;n++){const x=105+n*111+Math.sin(s.time*.8+n)*13,y=63+n*12+Math.sin(s.time+n)*4;rect(x,y,2,2,'#856e54');rect(x-3,y-2,3,3,'#f0d8a1');rect(x+2,y-2,3,3,'#f0d8a1');}
 }
}

function drawHead(p,i){const ink='#634443',skin='#f5cfb2',skinShade='#dba78c',hair=i?'#51322f':'#3b302e',hairLight=i?'#815348':'#79604c';
 // Small pixel clusters form a rounded head, side fringe and highlights.
 rect(-13,-75,25,3,ink);rect(-17,-72,33,6,hair);rect(-19,-66,37,16,hair);rect(-17,-51,33,8,hair);rect(-14,-70,26,22,skinShade);rect(-12,-69,24,22,skin);rect(-9,-48,18,5,skinShade);rect(-8,-48,16,4,skin);
 rect(-15,-71,29,7,hair);rect(-16,-64,6,6,hair);rect(-10,-65,7,3,hair);rect(-2,-65,7,5,hair);rect(7,-65,7,3,hair);rect(-14,-73,18,2,hairLight);rect(-17,-68,2,10,hairLight);rect(-10,-71,7,1,i?'#ac7561':'#c29164');
 if(i){rect(-19,-61,5,18,hair);rect(13,-62,6,20,hair);rect(-17,-58,1,11,hairLight);rect(16,-56,1,11,hairLight);rect(12,-68,8,4,'#bd6e88');rect(14,-70,3,7,'#f4c4c9');rect(17,-67,2,2,'#fff3cf');}else{rect(-14,-75,23,4,hair);rect(-10,-77,19,3,hair);rect(-16,-70,29,6,hair);rect(-12,-69,23,3,hairLight);rect(-9,-68,17,3,hair);rect(-5,-66,14,3,hair);rect(3,-64,8,3,hair);rect(-17,-63,4,9,'#635047');rect(13,-64,4,10,hair);rect(-9,-74,12,1,'#a28b6a');rect(-12,-71,15,1,'#79604c');}
 rect(-10,-57,6,i?1:2,i?'#ad7762':'#604638');rect(5,-57,6,i?1:2,i?'#ad7762':'#604638');
 if(['sleep','bed','hug'].includes(p.pose)){rect(-9,-53,5,1,ink);rect(-8,-52,3,1,ink);rect(5,-53,5,1,ink);rect(6,-52,3,1,ink);}else if(!i){rect(-9,-53,5,3,'#e8d7c4');rect(5,-53,5,3,'#e8d7c4');rect(-8,-53,3,3,'#443e37');rect(5,-53,3,3,'#443e37');rect(-8,-53,1,1,'#f9f0df');rect(5,-53,1,1,'#f9f0df');}else{rect(-9,-54,4,5,'#fff4df');rect(5,-54,4,5,'#fff4df');rect(-8,-54,3,4,ink);rect(5,-54,3,4,ink);rect(-8,-54,1,1,'#fff');rect(5,-54,1,1,'#fff');}
 rect(-13,-49,6,2,'#e9a89f');rect(9,-49,5,2,'#e9a89f');rect(0,-50,2,2,'#e4b296');rect(-1,-45,i?3:4,1,'#ac706b');if(!i)rect(3,-46,1,1,'#ac706b');
 if(p.reacting){rect(-11,-56,23,12,skin);for(const side of [-1,1]){rect(side*7-2,-54,2,2,ink);rect(side*7,-52,2,2,ink);rect(side*7-2,-50,2,2,ink);}rect(-3,-46,6,2,'#ac706b');rect(-2,-47,2,1,'#ac706b');rect(2,-45,2,1,'#ac706b');rect(12,-50,2,4,'#b5dfed');}
}

const SOFA_POSES=['sit','sitPhone','pet','lie','liePhone','sleep'];
const sofaLying=p=>['lie','liePhone','sleep'].includes(p.pose);
const onSofa=p=>s.room==='living'&&SOFA_POSES.includes(p.pose);
// Sofa coordinates are measured on the seat surface, independently of floor feet.
// One layout drives the body, props, labels and pointer bounds for every pose.
function sofaLayout(p,i){const lying=sofaLying(p),dir=i?-1:1;
 const x=lying?p.x+dir*(i?26:13):p.x,y=lying?129:137;
 const faceX=lying?x-dir*27:x;
 return {x,y,dir,lying,faceX,faceY:lying?129:119,
  bounds:lying?{left:Math.min(x,x-dir*39)-4,right:Math.max(x,x-dir*39)+4,top:102,bottom:142}:{left:x-17,right:x+17,top:105,bottom:155},
  labelX:lying?x-dir*19:x,labelY:168};
}
function personContains(p,i,x,y){const special=interactions.contains(p,i,x,y);if(special!==null)return special;if(!onSofa(p))return Math.abs(x-p.x)<19&&y>p.y-44&&y<p.y+12;
 const b=sofaLayout(p,i).bounds;return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;
}
function releaseLap(p){const d=s.dog;if(d.pose!=='lap'||(p&&s.people[d.owner]!==p))return;
 const owner=s.people[d.owner];Object.assign(d,{x:owner.x+18,y:180,pose:'sit',target:null,timer:3});if(owner.pose==='pet')owner.pose='sit';
}
function setSofaPose(p,pose){releaseLap(p);p.pose=pose;p.phoneTimer=0;p.hit=0;p.drop=false;}
function seatedBody(p,i){
 const skin='#f5cfb2',shade='#dba78c',edge=i?'#ad617d':'#ae9782',cloth=i?'#dfa2b7':'#e9d6b6',light=i?'#f1c2d0':'#fff0d2';
 // Hips rest on the cushion; bent thighs project forward and shins hang down.
 ellipse(0,4,18,5,'#65384838');
 for(const x of [-12,4]){rect(x,7,9,20,i?'#edc7ad':'#49535e');rect(x+2,9,5,15,i?'#f6d6be':'#6c7580');rect(x,22,9,5,i?'#fff0df':'#394350');rect(x-1,26,12,5,i?'#87515e':'#856453');rect(x,26,9,2,i?'#d6a0ae':'#f7e7d0');}
 rect(-15,-3,31,13,i?'#ad617d':'#49535e');rect(-14,-2,29,10,i?'#dfa2b7':'#6c7580');
 rect(-13,-21,27,22,edge);rect(-11,-21,23,19,cloth);rect(-7,-20,3,16,light);rect(7,-20,3,16,light);
 if(i){rect(-17,0,35,9,'#d48ba5');for(let x=-13;x<17;x+=6){rect(x,1,2,7,'#efbbcd');}rect(-16,8,33,2,'#ad617d');rect(-6,-22,6,5,'#fff1dc');rect(1,-22,6,5,'#fff1dc');rect(-3,-17,7,3,'#b16c87');}
 else{rect(-4,-21,9,19,'#91b1aa');rect(-8,-20,4,7,light);rect(5,-20,4,7,light);rect(7,-12,2,2,'#9b7865');rect(7,-5,2,2,'#9b7865');rect(-12,-1,25,3,edge);}
 // Forearms bend onto the lap, rather than hanging in a standing pose.
 for(const side of [-1,1]){c.save();c.scale(side,1);rect(13,-19,7,13,edge);rect(14,-19,5,11,cloth);rect(10,-8,9,5,light);rect(4,-5,11,5,shade);rect(4,-5,10,3,skin);c.restore();}
}
function sofaPhone(p,l){const lying=l.lying;
 const progress=p.hit>0?1:(p.drop&&p.phoneTimer>0&&p.phoneTimer<.5?1-p.phoneTimer/.5:0);
 const x=lying?l.faceX-3:l.x+4,y=lying?l.y-26+progress*22:124;
 if(lying){c.strokeStyle='#ae9782';c.lineWidth=3;c.beginPath();c.moveTo(l.x-l.dir*15,l.y);c.lineTo(l.faceX+l.dir*5,l.y-14);c.stroke();c.strokeStyle='#f5cfb2';c.lineWidth=2;c.beginPath();c.moveTo(l.faceX+l.dir*5,l.y-14);c.lineTo(l.faceX+3,l.y-18);c.stroke();}
 rect(x,y,6,9,'#59454c');rect(x+1,y+1,4,6,'#ccd7d6');rect(x+1,y+2,3,2,'#e7a6b8');rect(x+2,y+7,2,1,'#d6bfbe');if(!lying)rect(x-2,y+6,3,3,'#f5cfb2');
 if(p.hit>0)text('!',l.faceX,l.y-16,'#e28292',12);
}
function sofaPetHand(p){if(p.pose!=='pet'||s.dog.pose!=='lap'||s.people[s.dog.owner]!==p)return;
 const x=p.x+5,y=132+Math.sin(s.time*6)*1.2;
 rect(x-8,y-3,5,4,s.people.indexOf(p)?'#dfa2b7':'#e9d6b6');rect(x-4,y-2,8,3,'#dba78c');rect(x-4,y-2,7,2,'#f5cfb2');
}
function sofaLabels(p,i,l){c.save();c.shadowColor='#fff4e9';c.shadowBlur=4;text(p.name,l.labelX,l.labelY,i===s.selected?'#724053':'#805e5c',7);c.restore();
 if(i===s.selected){rect(l.labelX-3,l.bounds.top-5,6,2,'#ffe6ee');rect(l.labelX-1,l.bounds.top-3,2,2,'#ffe6ee');}
 if(p.pose==='sleep')text('z z',l.faceX-l.dir*7,l.y-16-Math.sin(s.time)*2,'#b87595',8);
}
function person(p,i,plain=false){
 if(!plain&&interactions.drawPerson(p,i))return;
 const sofa=onSofa(p)?sofaLayout(p,i):null;
 if(sofa&&!sofa.lying){c.save();c.translate(sofa.x,sofa.y);c.scale(.5,.5);seatedBody(p,i);c.translate(0,19);drawHead(p,i);c.restore();if(p.pose==='sitPhone')sofaPhone(p,sofa);sofaLabels(p,i,sofa);return;}

 const inBed=['bed','hug'].includes(p.pose),lying=['lie','liePhone','sleep'].includes(p.pose),seated=['sit','sitPhone','pet','pour','dig','pat','kick'].includes(p.pose);
 c.save();c.translate(sofa?sofa.x:Math.round(p.x),sofa?sofa.y:Math.round(p.y+(p.pose==='walk'?Math.sin(s.time*12):0)));
 if(p.pose==='fall'){const t=Math.min(1,p.anim/.65);c.translate(t*102,t*96);c.rotate(t*Math.PI*.58);}else if(inBed){c.translate(0,6);if(p.pose==='hug')c.rotate(i?-.04:.06);c.scale(1,1.4);}else if(lying){if(sofa){ellipse(-sofa.dir*18,5,24,4,'#65384838');c.rotate(-sofa.dir*Math.PI/2);}else{c.translate(-8,-10);c.rotate(-Math.PI/2);}}else if(['prone','dizzy'].includes(p.pose)){c.translate(0,-3);c.rotate(-Math.PI/2.5);}
 if(!inBed&&!lying)ellipse(0,1,10,3,'#39231d30');c.scale(.5,.5);
 const ink='#634443',skin='#f5cfb2',skinShade='#dba78c',hair=i?'#51322f':'#3b302e',hairLight=i?'#815348':'#79604c',shirt=i?'#dc98ad':'#94ac99',dark=i?'#b86d88':'#688879';
 // Soft tailored layers: ivory cardigan for Qite, rose dress for Baixuezi.
 const stride=p.pose==='walk'?Math.sin(s.time*12)*4:0;
 if(i&&!inBed){
  rect(-11,-14,8,15,'#edc7ad');rect(4,-14,8,15,'#edc7ad');rect(-11,-7,8,7,'#fcf1dd');rect(4,-7,8,7,'#fcf1dd');
  rect(-13,-1+stride,11,4,'#87515e');rect(3,-1-stride,12,4,'#87515e');rect(-11,-3+stride,8,3,'#d6a0ae');rect(5,-3-stride,8,3,'#d6a0ae');rect(-10,-2+stride,5,1,'#f2d1d7');rect(6,-2-stride,5,1,'#f2d1d7');
  rect(-11,-40,23,21,'#ad617d');rect(-9,-40,19,20,'#dfa2b7');rect(-7,-38,4,18,'#f1c2d0');rect(7,-37,3,17,'#c5819b');
  rect(-12,-24,25,7,'#d48ba5');rect(-14,-18,29,7,'#d48ba5');rect(-16,-11,33,5,'#ad617d');rect(-14,-11,29,3,'#efbbcd');
  for(let k=-10;k<14;k+=6){rect(k,-21,2,13,'#edb6c8');rect(k+2,-17,1,9,'#c77996');}rect(-12,-25,25,3,'#b4708d');
  rect(-6,-41,6,5,'#fff1dc');rect(1,-41,6,5,'#fff1dc');rect(-3,-36,3,3,'#b16c87');rect(1,-36,3,3,'#b16c87');rect(0,-34,1,5,'#eac0cc');
  if(!p.hideArms){rect(-17,-38,7,10,'#ad617d');rect(12,-38,7,10,'#ad617d');rect(-16,-38,5,8,'#e9aec1');rect(12,-38,5,8,'#e9aec1');rect(-16,-30,5,3,'#fff0dc');rect(12,-30,5,3,'#fff0dc');rect(-16,-27,5,12,skinShade);rect(-15,-27,3,11,skin);rect(12,-27,5,12,skinShade);rect(12,-27,3,11,skin);}
 }else{
  rect(-12,-17,10,seated?13:19,'#49535e');rect(3,-17,10,seated?13:19,'#49535e');rect(-10,-16,5,16,'#6c7580');rect(5,-16,5,16,'#6c7580');rect(-12,-5,10,2,'#394350');rect(3,-5,10,2,'#394350');
  rect(-14,-1+stride,12,4,'#856453');rect(3,-1-stride,12,4,'#856453');rect(-13,-3+stride,10,3,'#f7e7d0');rect(4,-3-stride,10,3,'#f7e7d0');
  const edge=i?'#b3748e':'#ae9782',cloth=i?'#e5a9bd':'#e9d6b6',shine=i?'#f6cbd5':'#fff0d2';
  rect(-14,-40,28,23,edge);rect(-12,-40,24,21,cloth);rect(-5,-39,10,21,i?'#f4c5d2':'#718f91');rect(-3,-37,6,17,i?'#f6d5dc':'#91b1aa');
  rect(-9,-39,4,7,shine);rect(6,-39,4,7,shine);rect(-8,-33,3,12,shine);rect(6,-33,3,12,shine);rect(-13,-21,26,3,edge);
  rect(6,-32,2,2,'#9b7865');rect(6,-26,2,2,'#9b7865');rect(-11,-27,5,1,edge);for(let k=-12;k<14;k+=3)rect(k,-19,1,2,shine);
  if(!p.hideArms){rect(-19,-37,6,19,edge);rect(14,-37,6,19,edge);rect(-18,-37,4,16,cloth);rect(14,-37,4,16,cloth);rect(-18,-34,1,11,shine);rect(14,-34,1,11,shine);rect(-19,-21,6,3,shine);rect(14,-21,6,3,shine);rect(-18,-18,5,5,skinShade);rect(-17,-18,3,5,skin);rect(14,-18,5,5,skinShade);rect(14,-18,3,5,skin);}
 }
 drawHead(p,i);
 if(p.pose==='pet')rect(11,-25+Math.sin(s.time*6)*3,15,5,skin);
 if(p.pose==='pat')rect(-28,-31+Math.sin(s.time*10)*7,15,5,skin);
 if(p.pose==='kick'){rect(-36,-14,24,8,'#87818b');rect(-41,-14,8,9,'#f1d9c3');}
 if(p.pose==='pour'){rect(23,-39,18,25,'#d9b684');rect(25,-36,14,17,'#f0d2a4');text('♡',32,-23,'#b68170',10);for(let n=0;n<4;n++)rect(36+n*3,-16+(s.time*25+n*4)%23,3,3,'#9d683c');}
 if(p.pose==='dig'){rect(25,-32,3,37,'#bc8c61');rect(19,4,15,10,'#81868b');rect(21,4,10,3,'#b3b6b3');}
 if(/Phone/.test(p.pose)&&!sofa){let py=-38;if(p.drop&&p.phoneTimer>0&&p.phoneTimer<.5)py-=Math.round((.5-p.phoneTimer)*35);if(p.hit>0)py=-62;rect(17,py,12,19,'#59454c');rect(19,py+2,8,13,'#ccd7d6');rect(20,py+4,6,3,'#e7a6b8');rect(20,py+9,5,2,'#f7efe0');rect(21,py+16,3,1,'#d6bfbe');rect(13,py+12,6,5,skin);}
 c.restore();
 if(sofa){if(p.pose==='liePhone')sofaPhone(p,sofa);sofaLabels(p,i,sofa);return;}
 if(p.pose==='dizzy')for(let n=0;n<3;n++)text('✦',p.x+Math.cos(s.time*5+n*2)*18,p.y-35+Math.sin(s.time*5+n*2)*5,'#ffeab9',10);
 if(p.hit>0)text('!',p.x+15,p.y-37,'#e28292',15);
 if(['sleep','bed'].includes(p.pose))text('z z',p.x+15,p.y-34-Math.sin(s.time)*2,'#d1a2b6',8);
 if(!s.cinematic&&!p.noLabel){c.save();c.shadowColor='#fff4e9';c.shadowBlur=4;text(p.name,p.x,p.y+16,i===s.selected?'#724053':'#805e5c',7);c.restore();if(i===s.selected){rect(p.x-3,p.y-44,6,2,'#ffe6ee');rect(p.x-1,p.y-42,2,2,'#ffe6ee');}}
}
function dog(){const d=s.dog;let x=d.x,y=d.y;if(d.pose==='lap'){const p=s.people[d.owner];x=p.x+2;y=145;}
 const walking=!!d.target||d.pose==='run',lying=d.pose==='lie',sitting=['sit','lap'].includes(d.pose),drinking=['drink','eat'].includes(d.pose);
 c.save();c.translate(Math.round(x),Math.round(y+(walking?Math.sin(s.time*(d.pose==='run'?23:12)):0)));if(d.pose==='lap')c.scale(.7,.7);if(d.target&&d.target.x<d.x)c.scale(-1,1);ellipse(0,1,12,3,'#48372d30');c.scale(.5,.5);
 const shade='#c4bcae',fur='#f6f0df',light='#fff9eb',mid='#e2daca';const by=lying?-13:-27;
 // Rounded white body with irregular tufts and shaded underside.
 rect(-19,by+4,36,19,shade);rect(-22,by+8,39,11,mid);rect(-18,by+1,30,19,fur);rect(-13,by-1,18,3,light);rect(-19,by+4,7,8,light);rect(-22,by+9,4,7,fur);rect(-17,by+18,23,4,mid);
 for(let n=0;n<7;n++){const xx=-18+n*4;rect(xx,by+1+(n%3),2,3,light);rect(xx+1,by+15+(n%2),2,2,'#ede5d4');}
 if(sitting){rect(-12,-31,15,22,fur);rect(-17,-10,19,10,mid);rect(-15,-8,16,6,fur);}
 const stride=walking?Math.sin(s.time*16)*4:0;rect(-14,-6,6,7+stride,mid);rect(7,-6,6,7-stride,mid);rect(-16,-1+stride,9,4,light);rect(6,-1-stride,9,4,light);rect(-15,2+stride,3,1,shade);rect(11,2-stride,3,1,shade);
 c.save();c.translate(-22,by+10);c.rotate(Math.sin(s.time*8)*.3);rect(-5,-12,5,14,mid);rect(-7,-15,5,11,fur);rect(-7,-16,3,6,light);c.restore();
 const hy=lying?13:drinking?8:0;c.save();c.translate(0,hy);
 // Upright pointed Westie ears, fluffy cheeks, bright eyes and beard.
 rect(1,-47,7,16,shade);rect(3,-51,3,7,fur);rect(2,-47,6,13,fur);rect(4,-46,2,7,'#d8aea3');rect(23,-49,6,16,shade);rect(24,-52,3,6,fur);rect(24,-48,5,12,fur);rect(25,-46,2,7,'#d8aea3');
 rect(3,-38,24,20,shade);rect(0,-34,30,12,mid);rect(3,-40,21,21,fur);rect(1,-36,27,10,light);rect(-2,-32,5,6,fur);rect(26,-31,6,8,fur);rect(7,-41,4,3,light);rect(17,-41,4,3,light);rect(2,-25,23,8,fur);rect(7,-19,15,3,light);
 rect(9,-31,4,4,'#5c4940');rect(11,-32,2,2,'#fffdf5');rect(23,-30,3,3,'#5c4940');rect(24,-31,1,1,'#fffdf5');rect(16,-26,15,7,mid);rect(15,-27,15,5,light);rect(26,-27,6,4,'#5a4a43');rect(27,-28,3,1,'#8e7c6c');rect(25,-21,3,1,'#8e7b6a');rect(17,-20,9,3,light);
 for(const [xx,yy]of [[3,-29],[6,-24],[11,-20],[20,-22],[6,-35],[18,-36]])rect(xx,yy,2,1,'#e4dacc');
 rect(5,-17,20,3,'#be8092');rect(12,-14,4,4,'#d4aa72');rect(13,-14,2,2,'#ffdf98');if(drinking)rect(27,-20,3,3+Math.sin(s.time*15)*2,'#dfaaad');c.restore();
 if(lying)text('z',0,-48,'#b88f9e',12);c.restore();if(d.pose==='lap')sofaPetHand(s.people[d.owner]);}

function update(dt){game.tick(dt);for(const p of s.people){if(p.target){const dx=p.target.x-p.x,dy=p.target.y-p.y,len=Math.hypot(dx,dy);if(len<1.5){p.x=p.target.x;p.y=p.target.y;p.target=null;p.pose='stand';const cb=p.action;p.action=null;cb?.();}else{p.x+=dx/len*65*dt;p.y+=dy/len*65*dt;}}if(p.busy>0){p.busy-=dt;if(p.busy<=0){const cb=p.after;p.after=null;cb?.();}}if(p.pose==='fall'){p.anim+=dt;if(p.anim>.7){p.x+=102;p.y+=96;p.pose='dizzy';s.people[1].pose='bed';tone(660,.5,'sine',1000);}}}
 const d=s.dog;if(d.target){const dx=d.target.x-d.x,dy=d.target.y-d.y,len=Math.hypot(dx,dy);if(len<2){d.x=d.target.x;d.y=d.target.y;d.target=null;if(d.pose==='walkWater'){d.pose='drink';d.timer=4;}else if(d.pose==='walkFood'){d.pose='eat';if(s.food)s.food.eating=true;}else{d.pose=d.pose==='walkBed'?'lie':s.walk?'run':'sit';d.timer=d.pose==='lie'?6:3;}}else{const speed=s.walk?115:47;d.x+=dx/len*speed*dt;d.y+=dy/len*speed*dt;}}else if(s.walk){d.pose='run';d.target={x:105+Math.random()*235,y:153+Math.random()*108};}else if(!['lap','eat'].includes(d.pose)){d.timer-=dt;if(d.timer<=0){const r=Math.random();if(s.room==='living'&&r<.3){d.target={x:363,y:191};d.pose='walkBed';}else if(s.room==='living'&&r<.55){d.target={x:s.people[1].x+24,y:Math.max(185,s.people[1].y)};d.pose='walk';}else if(r<.8){d.target={x:60+Math.random()*370,y:190+Math.random()*82};d.pose='walk';}else{d.pose='sit';d.timer=4;}}}
 interactions.update(dt);
 if(effect){effect.left-=dt;if(effect.left<=0)effect=null;}while(s.events.length){const m=s.events.shift();say(m);if(m.startsWith('啪嗒'))tone(140,.16,'triangle',50);}
 $('dog-status').textContent=s.food?.eating?`正在吃饭 · 还剩 ${Math.ceil(30-s.food.elapsed)} 秒`:s.walk?'正在撒欢 · 快乐得飞起来':({sit:'正在发呆 · 尾巴轻轻摇',lie:'窝在狗窝 · 呼噜呼噜',lap:'被摸摸中 · 世界第一幸福',drink:'吨吨吨 · 喝点水吧',eat:'咔嚓咔嚓 · 真香'}[d.pose]||'小爪子哒哒 · 到处逛逛');}
function render(){c.setTransform(3,0,0,3,0,0);c.save();if(s.cinematic){const z=1+Math.min(s.cinematic/4,1)*1.7;c.translate(240,150);c.scale(z,z);c.translate(-240,-145);}paintRoom();interactions.drawSwingBack();if(s.cinematic){s.people[0].x=230;s.people[1].x=247;s.people.forEach(p=>p.y=132);}const entities=s.people.map((p,i)=>({y:p.y,draw:()=>person(p,i)}));if(s.room==='yard')entities.push({y:210,draw:()=>interactions.drawSwing()});entities.push({y:s.dog.pose==='lap'?999:s.dog.y,draw:dog});entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());bedCovers();interactions.renderEffects();if(effect){for(let n=0;n<8;n++)rect(effect.x+(n-4)*3,effect.y-Math.sin(n+effect.left)*7,3,2,'#9a825d');}c.restore();if(s.cinematic>4){rect(0,0,480,300,`rgba(24,29,28,${Math.min(.93,(s.cinematic-4)/4)})`);if(s.cinematic>6){text('晚安，我最喜欢的人。',240,128,'#e9dfc5',13);text('明天，也要在一起。',240,153,'#c3c9b1',8);}}}
const interactions=createInteractions({c,s,game,rect,ellipse,text,drawHead,seatedBody,drawBase:(p,i)=>person(p,i,true),move,say,options,close,audioContext:()=>{if(!sound)return null;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();return audio;}catch{return null;}}});
roomActions();GameLoop({update,render}).start();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
// State is intentionally exposed for deterministic development verification.
window.homeGame={game,sofa,water,feed,rest,bedMenu,travel,update,render,select,lie,interactions};




