export const chance = (p, random = Math.random) => random() < p;
export const foodStage = elapsed => Math.max(0, 3 - Math.floor(elapsed / 10));
export function createGame(random = Math.random) {
  const state = {room:'living', selected:0, time:0, dog:{x:325,y:215,pose:'sit',target:null,timer:4}, people:[{name:'齐特',x:204,y:205,pose:'stand'},{name:'白雪梓',x:271,y:219,pose:'stand'}], food:null, poops:[], walk:null, bed:null, pats:0, cinematic:0, events:[], hearts:0, play:{combo:0,left:0,line:'',speechLeft:0}, playScene:null, swing:null};
  function emit(text){state.events.push(text);}
  function travel(room){if(state.food)state.food.eating=false;state.room=room;state.people.forEach((p,i)=>{Object.assign(p,{x:205+i*67,y:210,pose:'stand',target:null,action:null,busy:0,after:null,phoneTimer:0,hit:0,drop:false});});Object.assign(state.dog,{x:326,y:223,target:null,pose:'sit',timer:3});if(state.food&&!state.food.eating&&room==='living'){state.dog.pose='walkFood';state.dog.target={x:408,y:148};}state.bed=null;state.cinematic=0;state.walk=null;state.playScene=null;state.swing=null;Object.assign(state.play,{combo:0,left:0,line:'',speechLeft:0});emit({living:'回家啦，今天也要好好在一起。',yard:'风吹草地，小狗已经等不及啦。',bedroom:'把疲惫留在门外。'}[room]);}
  function walk(){if(state.walk)return false;state.walk={left:12,poop:chance(.3,random)};state.dog.pose='run';emit('撒开小爪子，出发！');return true;}
  function feed(){if(state.food)return false;state.food={elapsed:0,eating:false};emit('狗粮添好啦，来吃饭！');return true;}
  function phone(person){person.pose='liePhone';person.phoneTimer=2;person.drop=chance(.1,random);}
  const playLines=['别打了老婆我错了呜呜','老婆别奖励我了,有点爽','老婆别打了好痛饶命啊TuT'];
  function playHit(){if(state.room!=='living')return false;if(state.play.left<=0)state.play.combo=0;state.play.combo++;state.play.left=3.5;state.play.speechLeft=3;state.play.line=playLines[Math.floor(random()*playLines.length)];emit(state.play.line);return true;}
  function pat(){state.pats++;state.play.speechLeft=3;state.play.line=state.pats>10?'老婆别打了，再打屁股开花啦':['老婆我错了，别拍啦，我认输！','老婆别拍了，呜呜呜 TuT'][Math.floor(random()*2)];emit(state.play.line);}
  function tick(dt){state.time+=dt;state.play.left=Math.max(0,state.play.left-dt);state.play.speechLeft=Math.max(0,state.play.speechLeft-dt);if(!state.play.left)state.play.combo=0;if(state.food?.eating){state.food.elapsed+=dt;if(state.food.elapsed>=30){state.food=null;state.dog.pose='sit';state.dog.timer=3;emit('一粒也不剩！小肚子饱饱的。');}}
    if(state.walk){state.walk.left-=dt;if(state.walk.left<=0){if(state.walk.poop){state.poops.push({x:state.dog.x,y:state.dog.y});emit('小狗便便了，点一下让主人埋好。');}else emit('今日巡逻完成，没有便便！');state.walk=null;state.dog.pose='sit';state.dog.target=null;state.dog.timer=4;}}
    for(const p of state.people){if(p.phoneTimer>0){p.phoneTimer-=dt;if(p.phoneTimer<=0&&p.drop){p.hit=1.2;emit('啪嗒！手机砸到脸啦……');}}if(p.hit>0)p.hit-=dt;}
    if(state.cinematic>0)state.cinematic+=dt;
  }
  return {state,travel,walk,feed,phone,pat,playHit,tick,emit};
}

