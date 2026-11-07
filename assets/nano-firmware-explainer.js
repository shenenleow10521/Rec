// Interactive explanation of the user's supplied sketch excerpt, not firmware execution.
export const EXAMPLE_TIMEOUT_MS=5000;
export const NANO_COMMANDS=Object.freeze({F:{title:'Forward',left:1,right:1},B:{title:'Reverse',left:-1,right:-1},L:{title:'Left',left:-1,right:1},R:{title:'Right',left:1,right:-1},S:{title:'Stop',left:0,right:0}});
export function newFirmwareState(now=0){return {command:'S',lastCmd:now,stream:false,started:false,motorsStopped:true,failsafe:false};}
export function stepFirmware(state,event,now,timeout=EXAMPLE_TIMEOUT_MS){
 const next={...state};
 if(event.type==='command'){
  if(!NANO_COMMANDS[event.command])throw new Error('Unknown Nano demo command');
  return {...next,command:event.command,lastCmd:now,stream:true,started:true,motorsStopped:event.command==='S',failsafe:false};
 }
 if(event.type==='loss')return {...next,stream:false};
 if(event.type==='tick'&&next.started){
  if(next.stream&&now-next.lastCmd>=120)next.lastCmd=now;
  if(!next.stream&&now-next.lastCmd>=timeout){next.motorsStopped=true;next.failsafe=true;}
 }
 return next;
}
export function firmwareTiming(state,now,timeout=EXAMPLE_TIMEOUT_MS){
 const elapsed=Math.max(0,now-state.lastCmd);return {elapsed,remaining:Math.max(0,timeout-elapsed),progress:Math.min(1,elapsed/timeout)};
}
export function initNanoExplorer(root=document,clock=()=>performance.now()){
 const dialog=root.getElementById('nfDialog');if(!dialog)return null;
 const get=id=>root.getElementById(id),buttons=[...dialog.querySelectorAll('[data-nf-command]')],lines=[...dialog.querySelectorAll('[data-nf-line]')];
 let state=newFirmwareState(clock()),timer=null,opener=null,hiddenAt=null;
 function render(){
  const t=firmwareTiming(state,clock()),command=NANO_COMMANDS[state.command];
  dialog.dataset.nfState=state.failsafe?'timeout':state.stream?'stream':'loss';dialog.dataset.nfCommand=state.command;
  dialog.dataset.nfMoving=String(!state.motorsStopped);
  dialog.style.setProperty('--nf-progress',t.progress.toFixed(4));
  get('nfRemaining').textContent=(t.remaining/1000).toFixed(1);
  get('nfMotorOutput').textContent=state.motorsStopped?'L 0 / R 0':'L '+command.left+' / R '+command.right;
  get('nfCurrentCommand').textContent=state.command+' · '+command.title;
  const status=state.failsafe?'TIMEOUT → stopMotors()':state.stream?'COMMAND STREAM ACTIVE':'NO NEW COMMANDS';
  if(get('nfDemoStatus').textContent!==status)get('nfDemoStatus').textContent=status;
  get('nfSignalLoss').textContent=state.stream?'Simulate signal loss ↗':'Restore command stream ↺';
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.nfCommand===state.command&&!state.failsafe)));
  lines.forEach(line=>line.classList.toggle('nf-line-active',line.dataset.nfLine===state.command&&!state.failsafe||line.dataset.nfLine==='timeout'&&state.failsafe));
 }
 function tick(){state=stepFirmware(state,{type:'tick'},clock());render();}
 function stop(){if(timer!==null)clearInterval(timer);timer=null;}
 function start(){stop();timer=setInterval(tick,40);}
 function command(c){state=stepFirmware(state,{type:'command',command:c},clock());render();}
 function toggleSignal(){if(state.stream)state=stepFirmware(state,{type:'loss'},clock());else state=stepFirmware(state,{type:'command',command:state.command==='S'?'F':state.command},clock());render();}
 function open(button){opener=button;state=newFirmwareState(clock());command('F');dialog.showModal();get('nfClose').focus();start();}
 root.querySelectorAll('[data-nf-open]').forEach(b=>b.addEventListener('click',()=>open(b)));
 get('nfClose').addEventListener('click',()=>dialog.close());
 get('nfSignalLoss').addEventListener('click',toggleSignal);
 buttons.forEach(b=>b.addEventListener('click',()=>command(b.dataset.nfCommand)));
 dialog.addEventListener('close',()=>{stop();if(opener)opener.focus();});
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 root.addEventListener('visibilitychange',()=>{if(!dialog.open)return;if(root.hidden){hiddenAt=clock();stop();}else{if(hiddenAt!==null)state.lastCmd+=clock()-hiddenAt;hiddenAt=null;tick();start();}});
 render();return {open,command,toggleSignal,tick,stop,getState:()=>({...state})};
}
if(typeof document!=='undefined')initNanoExplorer(document);
