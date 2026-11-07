// REC PAD 1.0.10: interactive documentation, never a Bluetooth controller.
export const SOURCE_COMMIT = '06202cec659052fd6503e1d8ed9ded5f3e0d031e';
export const DEFAULT_MAPPING = Object.freeze({drive:true,left:true,right:false});
export const STOP_FRAME = '\r\nS\r\n!\r\nP\r\n';
export const CONTROLS = Object.freeze({
 forward:{title:'Forward',group:'DRIVE',command:'F',release:'S',description:'Hold to request forward motion. The calibrated mapping determines the byte sent to the robot.'},
 back:{title:'Reverse',group:'DRIVE',command:'B',release:'S',description:'Hold to request reverse motion. Releasing the button sends a wheel-stop command.'},
 left:{title:'Turn left',group:'DRIVE',command:'L',release:'S',description:'The app swaps left and right commands to match the robot’s wiring: Left becomes R.'},
 right:{title:'Turn right',group:'DRIVE',command:'R',release:'S',description:'The app swaps left and right commands to match the robot’s wiring: Right becomes L.'},
 pause:{title:'Pause / Resume',group:'STOP',command:'S + ! + P',description:'Pause clears held actions, prioritises the stop frame and locks motion controls. Resume unlocks the interface; it does not restart the previous motion.'},
 leftOpen:{title:'Left claw · Open',group:'LEFT CLAW',command:'W',release:'J',description:'The left claw is the ARM command group in the code. Open/close mapping can be reversed in the app settings.'},
 leftClose:{title:'Left claw · Close',group:'LEFT CLAW',command:'X',release:'J',description:'Left-claw control is independent of wheel movement and the right claw. Release freezes this servo target with J.'},
 rightOpen:{title:'Right claw · Open',group:'RIGHT CLAW',command:'E',release:'K',description:'The right claw is the GRIP command group in the code. Its calibration setting is independent of the left claw.'},
 rightClose:{title:'Right claw · Close',group:'RIGHT CLAW',command:'C',release:'K',description:'Right-claw control has its own held action. Release freezes this servo target with K.'},
 faster:{title:'Speed up',group:'PWM',command:'+',description:'Each tap sends + and requests status with P. The companion sketch increases motor PWM by 20, clamped at 255.'},
 slower:{title:'Speed down',group:'PWM',command:'-',description:'Each tap sends - and requests status with P. The companion sketch decreases motor PWM by 20, clamped at 80.'}
});
export function mapCommand(command, mapping=DEFAULT_MAPPING){
 if(command==='L')return 'R';if(command==='R')return 'L';
 if(mapping.drive&&command==='F')return 'B';if(mapping.drive&&command==='B')return 'F';
 if(mapping.left&&command==='W')return 'X';if(mapping.left&&command==='X')return 'W';
 if(mapping.right&&command==='E')return 'C';if(mapping.right&&command==='C')return 'E';
 return command;
}
export function describeControl(key,mapping=DEFAULT_MAPPING){
 const c=CONTROLS[key];if(!c)throw new Error('Unknown REC PAD control');
 const wire=key==='pause'?STOP_FRAME:mapCommand(c.command,mapping);
 const frame=c.group==='PWM'?wire+'P':wire;
 return {...c,wire,frame,hex:[...frame].map(x=>x.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')).join(' '),
  displayFrame:frame.replace(/\r/g,'<CR>').replace(/\n/g,'<LF>'),
  timing:c.release?'Repeat while held · 120 ms':c.group==='STOP'?'Stop frame repeats while paused · ~240 ms':'One command per tap + status request',
  releaseText:c.release?'Release → '+c.release:c.group==='STOP'?'Resume → unlock; no automatic movement':'Companion PWM: 80–255 · step 20'};
}
export function initRecPadExplorer(root=document){
 const dialog=root.getElementById('rpDialog');if(!dialog)return null;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const get=id=>root.getElementById(id),all=selector=>[...dialog.querySelectorAll(selector)];
 const actions=all('[data-rp-action]'),tabs=all('[data-rp-tab]'),panels=all('[data-rp-panel]');
 let selected='forward',opener=null,playTimer=null;
 const mapping=()=>({drive:get('rpReverseDrive').checked,left:get('rpReverseLeft').checked,right:get('rpReverseRight').checked});
 function stopAnimation(){clearTimeout(playTimer);playTimer=null;dialog.classList.remove('rp-playing');}
 function render(){
  const c=describeControl(selected,mapping());
  actions.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rpAction===selected)));
  get('rpControlTitle').textContent=c.title;get('rpControlGroup').textContent=c.group;
  dialog.dataset.rpGroup=c.group;
  get('rpDescription').textContent=c.description;get('rpSemantic').textContent=c.group==='STOP'?'PAUSE':c.command;
  get('rpWire').textContent=c.group==='STOP'?'S / ! / P':c.wire;
  get('rpFrame').textContent=c.displayFrame;get('rpHex').textContent=c.hex;
  get('rpTiming').textContent=c.timing;get('rpRelease').textContent=c.releaseText;
  get('rpMapNote').textContent=c.release&&c.command!==c.wire?'Mapped '+c.command+' → '+c.wire+' for calibrated direction.':c.release?'Semantic command is unchanged by these settings.':c.group==='STOP'?'One priority frame; controls remain locked until Resume.':'PWM target is confirmed only by robot status feedback.';
  get('rpPathCommand').textContent=c.group==='STOP'?'S / ! / P':c.wire;
  stopAnimation();
 }
 function selectTab(name,focus=false){
  tabs.forEach(t=>{const active=t.dataset.rpTab===name;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;if(active&&focus)t.focus();});
  panels.forEach(p=>p.hidden=p.dataset.rpPanel!==name);stopAnimation();
 }
 function play(){
  stopAnimation();if(motion.matches)return;
  void dialog.offsetWidth;dialog.classList.add('rp-playing');playTimer=setTimeout(stopAnimation,2100);
 }
 function open(button){opener=button;selectTab('map');render();dialog.showModal();get('rpClose').focus();}
 root.querySelectorAll('[data-rp-open]').forEach(button=>button.addEventListener('click',()=>open(button)));
 get('rpClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{stopAnimation();if(opener)opener.focus();});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 // Keep presentation navigation and the fullscreen shortcut out of this modal.
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 actions.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.rpAction;render();play();}));
 ['rpReverseDrive','rpReverseLeft','rpReverseRight'].forEach(id=>get(id).addEventListener('change',render));
 get('rpResetMapping').addEventListener('click',()=>{get('rpReverseDrive').checked=true;get('rpReverseLeft').checked=true;get('rpReverseRight').checked=false;render();});
 tabs.forEach((t,index)=>{t.addEventListener('click',()=>selectTab(t.dataset.rpTab));t.addEventListener('keydown',e=>{
  const key=e.key;let next=index;if(key==='ArrowRight')next=(index+1)%tabs.length;else if(key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(key==='Home')next=0;else if(key==='End')next=tabs.length-1;else return;
  e.preventDefault();selectTab(tabs[next].dataset.rpTab,true);
 });});
 all('[data-rp-replay]').forEach(b=>b.addEventListener('click',play));
 motion.addEventListener('change',()=>{if(motion.matches)stopAnimation();});
 root.addEventListener('visibilitychange',()=>{if(root.hidden)stopAnimation();});
 render();return {open,selectTab,render,stopAnimation};
}
if(typeof document!=='undefined')initRecPadExplorer(document);
