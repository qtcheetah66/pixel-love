import {easeOut,easeInOut} from './vendor/easing.js';
import {playZzfx} from './vendor/zzfx.js';

// Each segment stays six world pixels long. Only joint angles are animated.
export function jointArm(x,y,upper,lower){
 const elbow={x:x+6*Math.cos(upper),y:y+6*Math.sin(upper)};
 return {shoulder:{x,y},elbow,hand:{x:elbow.x+6*Math.cos(lower),y:elbow.y+6*Math.sin(lower)}};
}
export function playArmPose(kind,age){
 const bed=kind==='bed',keys=bed?[[1.8,1.4],[3.35,4.45],[2.7,1.9],[1.8,1.4]]:[[1.25,1.8],[-.7,-1.95],[-.85,.75],[1.25,1.8]];
 const t=age==null?0:Math.max(0,Math.min(.68,age)),times=[0,.09,.22,.68];
 let segment=t<.09?0:t<.22?1:2;
 const blend=easeInOut((t-times[segment])/(times[segment+1]-times[segment]));
 const angles=keys[segment].map((a,i)=>{const d=keys[segment+1][i]-a;return a+Math.atan2(Math.sin(d),Math.cos(d))*blend;});
 return jointArm(bed?-7:7,bed?-19:-18,...angles);
}

// Shared timelines keep contact, recoil, sound and particles on the same frame.
export function createInteractions({c,s,game,rect,ellipse,text,drawHead,seatedBody,drawBase,move,say,options,close,audioContext}){
 const particles=[],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const swing={x:271,y:123,length:68};
 const talk=document.getElementById('play-talk'),end=document.getElementById('end-interaction');
 function sound(kind,count=1){const context=audioContext();if(!context)return;try{
  if(kind==='pat')playZzfx(context,.34,.02,240,.01,.02,.1,0,1.6,-7,0,70,.035);
  else if(kind==='hit')playZzfx(context,.4,.03,370+count%4*45,.008,.025,.13,0,1.3,-14,0,100,.025);
  else playZzfx(context,.18,.01,620,.01,.015,.24,0,1,2,0,155,.06);
 }catch{}}
 function burst(x,y){for(let i=0;i<9;i++){const a=i*Math.PI*2/9;particles.push({x,y,vx:Math.cos(a)*(13+i%3*9),vy:Math.sin(a)*24-13,t:0,life:.6+i%3*.1,color:['#fff0a9','#f8b8ca','#fff7eb'][i%3]});}}
 function stopPlay(){const scene=s.playScene;if(!scene)return;s.playScene=null;
  s.people.forEach((p,i)=>{p.target=null;p.action=null;p.hit=0;p.pose='stand';if(scene.kind==='bed'&&s.room==='bedroom'&&s.bed){p.x=218+i*44;p.y=132;p.pose='bed';}});
  if(scene.kind==='bed'&&s.bed)s.bed='rest';s.play.combo=0;s.play.left=0;s.play.speechLeft=0;
 }
 function stopSwing(){const sw=s.swing;if(!sw)return;s.swing=null;for(const i of sw.participants){const p=s.people[i];if(p.pose==='swing'||p.pose==='pushSwing'){p.x=243+i*34;p.y=234;}p.pose='stand';p.target=null;p.action=null;}}
 function stop(){stopPlay();stopSwing();particles.length=0;talk.hidden=true;end.hidden=true;}
 function cancelForMove(p){if(s.playScene)stopPlay();if(s.swing?.participants.includes(s.people.indexOf(p)))stopSwing();}
 end.onclick=()=>{stop();close();say('玩闹暂停，歇一会儿，再一起玩。');};
 function queueHit(){const scene=s.playScene;if(scene)scene.queue=Math.min(scene.queue+1,5);}
 function startLiving(){if(s.room!=='living')return;close();if(s.playScene?.kind==='living'){queueHit();return;}
  stop();const q=s.people[0],bx=clamp(q.x,150,375),by=clamp(q.y,211,253);
  const scene=s.playScene={kind:'living',stage:'approach',queue:1,age:null,contact:false,arrived:0};
  s.people.forEach((p,i)=>move(p,bx-i*24,by,()=>{if(s.playScene!==scene)return;p.pose=i?'playBai':'playQite';if(++scene.arrived===2)scene.stage='ready';},true));
  say('白雪梓走过来轻轻闹一下。继续点齐特可以连击，点地面就停。');
 }
 function startBed(){close();stop();s.bed='pat-enter';s.pats=0;
  const scene=s.playScene={kind:'bed',stage:'approach',queue:0,age:null,contact:false,arrived:0};
  s.people.forEach((p,i)=>move(p,i?246:225,i?187:160,()=>{if(s.playScene!==scene)return;p.pose=i?'bedKneel':'bedTummy';if(++scene.arrived===2){scene.stage='ready';s.bed='pat';say('齐特趴好抱住枕头。点一下，白雪梓隔着睡裤轻拍一下。');}},true));
  say('换好软软的睡衣，挪好枕头，准备轻轻玩闹。');
 }
 function posePoint(i){const sw=s.swing;if(!sw)return null;const a=sw.angle||0,lx=sw.riders.length===2?(i===0?-14:14):0,ly=swing.length;
  return {x:swing.x+lx*Math.cos(a)-ly*Math.sin(a),y:swing.y+lx*Math.sin(a)+ly*Math.cos(a)};
 }
 function startSwing(mode='solo',rider=s.selected){close();stop();const riders=mode==='together'?[0,1]:[rider],participants=mode==='solo'?[rider]:[0,1];
  const sw=s.swing={mode,riders,participants,stage:'boarding',arrived:0,time:0,angle:0};
  for(const i of participants){const p=s.people[i],push=mode==='push'&&i===0;
   move(p,push?218:swing.x+(riders.length===2?(i===0?-14:14):0),push?207:206,()=>{if(s.swing!==sw)return;p.pose=push?'pushSwing':'swing';if(++sw.arrived===participants.length){sw.stage='active';sound('swing');say(mode==='push'?'齐特轻轻推一下，风也变甜了。':mode==='together'?'挨着坐好，一起慢慢荡秋千。':'坐稳啦，小秋千轻轻荡起来。');}},true);
  }
  say(mode==='push'?'齐特走到秋千旁，准备轻轻推。':mode==='together'?'两个人走向秋千，挨着坐好。':'走向花藤秋千，坐下吹吹风。');
 }
 function swingMenu(){if(s.room!=='yard')return;close();const items=s.selected===1?[
  ['让老公推秋千',()=>startSwing('push',1)],['和老公荡秋千',()=>startSwing('together',1)],['自己荡一会儿',()=>startSwing('solo',1)]
 ]:[['坐上秋千',()=>startSwing('solo',0)],['一起荡秋千',()=>startSwing('together',0)]];
  if(s.swing)items.push(['下秋千',()=>{stopSwing();say('慢慢停下来，牵手走走吧。');}]);options('花藤秋千 · 一起吹吹风',items);
 }
 function contains(p,i,x,y){if(p.pose==='bedTummy')return x>p.x-17&&x<p.x+17&&y>p.y-23&&y<p.y+33;
  if(p.pose==='bedKneel')return x>p.x-17&&x<p.x+17&&y>p.y-39&&y<p.y+7;
  if(p.pose==='swing'){const at=posePoint(i);return !!at&&Math.abs(x-at.x)<18&&y>at.y-35&&y<at.y+20;}return null;
 }
 function tap(x,y){if(s.room==='yard'&&x>198&&x<342&&y>113&&y<224){
   // People remain selectable even while they stand beside or sit on the swing.
   if(s.people.some((p,i)=>contains(p,i,x,y)??(Math.abs(x-p.x)<19&&y>p.y-44&&y<p.y+12)))return false;
   swingMenu();return true;}
  if(s.room==='bedroom'&&s.playScene?.kind==='bed'&&contains(s.people[0],0,x,y)){queueHit();return true;}return false;
 }
 function arm(x,y,ex,ey,hx,hy,color='#e7adbf'){c.strokeStyle='#ad738d';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();c.strokeStyle=color;c.lineWidth=3;c.stroke();c.strokeStyle='#f5cfb2';c.lineWidth=2.7;c.beginPath();c.moveTo(ex,ey);c.lineTo(hx,hy);c.stroke();ellipse(hx,hy,2.5,1.8,'#f5cfb2');}
 function drawJointArm(pose,color='#e7adbf',longSleeve=false){const {shoulder:a,elbow:b,hand:h}=pose;
  c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=3;
  c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);if(longSleeve)c.lineTo(h.x,h.y);c.stroke();
  if(!longSleeve){c.strokeStyle='#f5cfb2';c.lineWidth=2.5;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(h.x,h.y);c.stroke();}
  ellipse(h.x,h.y,1.65,1.4,'#f5cfb2');c.restore();
 }
 function strokeProgress(){const age=s.playScene?.age;if(age===null||age===undefined)return 0;return age<.22?easeInOut(age/.22):1-easeOut(clamp((age-.22)/.42,0,1));}
 function reaction(){const age=s.playScene?.age;return age!=null&&age>=.22?Math.sin(clamp((age-.22)/.42,0,1)*Math.PI):0;}
 function drawBedPerson(p,i){const react=reaction();c.save();c.translate(p.x,p.y);
  if(!i){c.translate(0,-react*1.5);ellipse(0,7,15,26,'#80516124');
   // A complete, clothed body lies along the mattress, with arms over a pillow.
   rect(-14,-21,28,16,'#d6b5c4');rect(-13,-22,26,14,'#fff0e6');rect(-11,-20,23,1,'#fffaf0');
   rect(-10,-5,21,18,'#667f99');rect(-8,-5,17,18,'#9db7ce');rect(-6,-3,3,13,'#bfcede');rect(7,0,2,10,'#7892ad');rect(-8,11,17,3,'#e9d9d0');
   ellipse(0,16,10,6,'#667f99');ellipse(-1,15,8,5,'#9db7ce');rect(-7,14,13,1,'#b5cadb');
   for(const x of [-9,2]){const dy=x<0?0:-2;rect(x,18+dy,8,14,'#657d98');rect(x+1,18+dy,6,12,'#9db7ce');rect(x+2,19+dy,1,10,'#c9d7df');rect(x,29+dy,8,3,'#e8e5dc');}
   // Folded elbows hug the pillow; a turned cheek makes the tummy-down pose clear.
   rect(-14,-7,6,9,'#7892ad');rect(9,-7,6,9,'#7892ad');rect(-14,-9,12,5,'#b4c8d9');rect(4,-9,11,5,'#b4c8d9');rect(-8,-10,7,4,'#f5cfb2');rect(2,-10,6,4,'#f5cfb2');
   rect(-9,-22,17,3,'#3b302e');rect(-11,-19,21,10,'#3b302e');rect(-9,-10,15,3,'#514035');rect(-7,-23,12,2,'#3b302e');rect(-6,-21,12,1,'#8b7259');rect(-9,-18,3,4,'#79604c');
   rect(-11,-14,6,8,'#f5cfb2');rect(-13,-10,3,3,'#f5cfb2');rect(-10,-11,3,1,'#634443');rect(-11,-7,2,1,'#ac706b');rect(-7,-9,2,2,'#e9a89f');if(react>.15)rect(-13,-8,2,3,'#b5dfed');
  }else{ellipse(0,0,11,3,'#80516124');rect(-10,-4,20,7,'#b77d96');rect(-9,-6,8,8,'#e5b0c5');rect(1,-6,9,8,'#e5b0c5');
   rect(-8,-22,17,18,'#b77d96');rect(-7,-22,15,16,'#e8b8c9');rect(-1,-21,2,16,'#f9e4df');rect(-6,-23,5,3,'#fff1e3');rect(2,-23,5,3,'#fff1e3');
   c.save();c.translate(0,1);c.scale(.5,.5);drawHead(p,1);c.restore();
   drawJointArm(playArmPose('bed',s.playScene?.age),'#edc1ce',true);
   drawJointArm(jointArm(7,-19,1.3,1.65),'#edc1ce',true);
  }c.restore();text(p.name,p.x,p.y+(i?15:43),'#805e5c',7);
 }
 function drawPerson(p,i){if(p.pose==='swing')return true;
  if(['bedTummy','bedKneel'].includes(p.pose)){drawBedPerson(p,i);return true;}
  if(['playQite','playBai'].includes(p.pose)){const react=reaction(),motion=strokeProgress();c.save();c.translate(p.x+(i?motion:react*3),p.y-(i?0:react*2));c.rotate(i?motion*.03:react*.08);
   drawBase({...p,x:0,y:0,pose:'stand',noLabel:true,hideArms:true,reacting:!i&&react>.12},i);
   if(i){drawJointArm(jointArm(-7,-18,1.85,1.6));drawJointArm(playArmPose('living',s.playScene?.age));}
   else{const upper=1.6+react*2.1,lower=1.6-react*2.4;drawJointArm(jointArm(-7,-18,upper,lower),'#e9d6b6',true);drawJointArm(jointArm(7,-18,Math.PI-upper,Math.PI-lower),'#e9d6b6',true);}
   c.restore();text(p.name,p.x,p.y+16,'#805e5c',7);return true;
  }
  if(p.pose==='pushSwing'){drawBase({...p,pose:'stand'},i);const sw=s.swing,t=Math.max(0,Math.cos(sw.time*1.7));arm(p.x+7,p.y-21,p.x+14,p.y-23,p.x+22+t*7,p.y-25,'#e9d6b6');return true;}return false;
 }
 function drawSwingBack(){if(s.room!=='yard')return;ellipse(271,219,72,10,'#42612d25');
  // A-frame posts, warm timber grain and a small rose garland.
  for(const side of [-1,1]){const top=271+side*49,bottom=271+side*65;c.strokeStyle='#735239';c.lineWidth=7;c.beginPath();c.moveTo(top,124);c.lineTo(bottom,219);c.stroke();c.strokeStyle='#bd8b5a';c.lineWidth=4;c.stroke();c.strokeStyle='#e5bd87';c.lineWidth=1;c.stroke();rect(bottom-5,217,11,4,'#826545');}
  rect(210,119,123,9,'#705038');rect(210,119,123,5,'#b98859');rect(213,120,115,1,'#e5bc87');
  for(let n=0;n<12;n++){rect(216+n*9,124,4,1,'#97663e');rect(219+n*9,122,5,1,'#d5a673');}
  for(const x of [221,319]){ellipse(x,123,2,2,'#8d7250');rect(x,122,1,1,'#efd2a1');}
  for(let n=0;n<23;n++){const x=216+n*5,y=117+Math.sin(n*.65)*3;rect(x,y,5,3,n%2?'#7f9b5a':'#587c47');if(n%3===0){ellipse(x+1,y-1,3,2,'#e9a6b5');rect(x,y-2,2,2,'#ffe6d7');}}
  text('花藤秋千',271,111,'#655942',7);
 }
 function drawSwing(){if(s.room!=='yard')return;const sw=s.swing,angle=sw?.angle||0;
  c.save();c.translate(swing.x,swing.y);c.rotate(angle);
  for(const x of [-34,34]){rect(x-1,2,2,69,'#795f42');rect(x,3,1,64,'#e1c99a');for(let y=6;y<67;y+=5)rect(x-1,y,2,1,'#b59a6d');}
  rect(-37,54,74,16,'#805436');rect(-35,55,70,13,'#c79361');for(let y=58;y<69;y+=4)rect(-34,y,68,1,'#e3b984');
  rect(-38,68,76,7,'#805436');rect(-36,68,72,4,'#e3b984');rect(-34,66,68,4,'#e8b4c2');rect(-32,66,64,1,'#ffdece');
  for(const x of [-31,22]){rect(x,59,10,8,'#c885a0');rect(x+1,59,8,6,'#efbdcb');rect(x+3,60,3,2,'#ffe0d5');}
  if(sw)for(const i of sw.riders){if(s.people[i].pose!=='swing')continue;const x=sw.riders.length===2?(i===0?-14:14):0;
   c.save();c.translate(x,68);c.scale(.5,.5);seatedBody(s.people[i],i);c.translate(0,19);drawHead(s.people[i],i);c.restore();
  }
  c.restore();if(sw?.stage==='active'){text(sw.mode==='push'?'齐特轻轻推 ♡':sw.mode==='together'?'一起慢慢荡 ♡':'风软软的 ♡',271,234,'#6b7449',7);}
 }
 function renderEffects(){for(const p of particles){c.save();c.globalAlpha=Math.max(0,1-p.t/p.life);const x=p.x+p.vx*p.t,y=p.y+p.vy*p.t+p.t*p.t*18;rect(x-3,y-1,6,2,p.color);rect(x-1,y-3,2,6,p.color);c.restore();}}
 function update(dt){const scene=s.playScene;
  if(scene?.stage==='ready'){
   if(scene.age===null&&scene.queue>0){scene.queue--;scene.age=0;scene.contact=false;}
   if(scene.age!==null){scene.age+=dt;if(scene.age>=.22&&!scene.contact){scene.contact=true;
    if(scene.kind==='living')game.playHit();else game.pat();sound(scene.kind==='living'?'hit':'pat',s.play.combo);
    const p=s.people[1],hand=playArmPose(scene.kind,.22).hand,a=scene.kind==='living'?.03:0;
    burst(p.x+(scene.kind==='living'?1:0)+hand.x*Math.cos(a)-hand.y*Math.sin(a),p.y+hand.x*Math.sin(a)+hand.y*Math.cos(a));
   }if(scene.age>=.68)scene.age=null;}
  }
  const sw=s.swing;if(sw?.stage==='active'){sw.time+=dt;sw.angle=Math.sin(sw.time*1.7)*.19*easeOut(Math.min(1,sw.time/2));}
  for(let i=particles.length-1;i>=0;i--){particles[i].t+=dt;if(particles[i].t>particles[i].life)particles.splice(i,1);}
  end.hidden=!scene&&!sw;end.textContent=sw?'下秋千':'结束玩闹';
  talk.hidden=!scene||s.play.speechLeft<=0;if(!talk.hidden){const q=s.people[0];talk.style.left=clamp(q.x/480*100,27,73)+'%';talk.style.top=(scene.kind==='bed'?q.y-27:q.y-45)/300*100+'%';
   talk.querySelector('b').textContent=scene.kind==='bed'?'轻拍 × '+s.pats:'连击 × '+s.play.combo;talk.querySelector('span').textContent=s.play.line;
  }
 }
 return {startLiving,startBed,startSwing,swingMenu,cancelForMove,stop,tap,contains,drawPerson,drawSwingBack,drawSwing,renderEffects,update,queueHit,posePoint};
}
