import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EXAMPLE_TIMEOUT_MS,NANO_COMMANDS,newFirmwareState,stepFirmware,firmwareTiming,initNanoExplorer} from '../assets/nano-firmware-explainer.js';

test('decoding matches all five cases from the supplied excerpt',()=>{
 assert.equal(EXAMPLE_TIMEOUT_MS,5000);
 assert.deepEqual(Object.fromEntries(Object.entries(NANO_COMMANDS).map(([k,v])=>[k,[v.left,v.right]])),{F:[1,1],B:[-1,-1],L:[-1,1],R:[1,-1],S:[0,0]});
 assert.throws(()=>stepFirmware(newFirmwareState(),{type:'command',command:'X'},0),/Unknown/);
});
test('silence stops at the configured boundary; valid commands reset the guard',()=>{
 let s=stepFirmware(newFirmwareState(0),{type:'command',command:'F'},0);
 s=stepFirmware(s,{type:'tick'},120);assert.equal(s.lastCmd,120);
 s=stepFirmware(s,{type:'loss'},120);
 s=stepFirmware(s,{type:'tick'},5119);assert(!s.motorsStopped);assert(!s.failsafe);
 assert.equal(firmwareTiming(s,5119).remaining,1);
 s=stepFirmware(s,{type:'tick'},5120);assert(s.motorsStopped);assert(s.failsafe);assert.equal(firmwareTiming(s,5120).remaining,0);
 s=stepFirmware(s,{type:'command',command:'R'},5200);assert(!s.failsafe);assert(!s.motorsStopped);assert.equal(s.lastCmd,5200);
 s=stepFirmware(s,{type:'command',command:'S'},5250);assert(s.motorsStopped);assert(!s.failsafe);
 const fast=stepFirmware(stepFirmware(newFirmwareState(0),{type:'command',command:'F'},0),{type:'loss'},0);
 assert(stepFirmware(fast,{type:'tick'},600,600).failsafe);
});
test('continuous command input prevents expiry without claiming hardware feedback',()=>{
 let s=stepFirmware(newFirmwareState(0),{type:'command',command:'F'},0);
 for(let now=40;now<=10000;now+=40)s=stepFirmware(s,{type:'tick'},now);
 assert(!s.failsafe);assert(!s.motorsStopped);assert(firmwareTiming(s,10000).elapsed<120);
});

function fixture(){
 const root={hidden:false,activeElement:null,listeners:{}};
 class Element{
  constructor(id,data={}){this.id=id;this.dataset=data;this.textContent='';this.attributes={};this.listeners={};this.open=false;this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c),contains:c=>this.classes.has(c)};this.style={setProperty:(k,v)=>{this[k]=v;}};}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  emit(type,props={}){const e={target:this,stopPropagation(){this.stopped=true;},...props};for(const f of this.listeners[type]??[])f(e);return e;}
  focus(){root.activeElement=this;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return {left:10,right:500,top:10,bottom:500};}
 }
 const ids=['nfDialog','nfClose','nfRemaining','nfMotorOutput','nfCurrentCommand','nfDemoStatus','nfSignalLoss'];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 const buttons=Object.keys(NANO_COMMANDS).map(c=>new Element('button-'+c,{nfCommand:c}));
 const lines=[...Object.keys(NANO_COMMANDS),'timeout','timeout'].map((c,i)=>new Element('line-'+i,{nfLine:c}));
 const opener=new Element('opener');elements.nfDialog.querySelectorAll=selector=>selector==='[data-nf-command]'?buttons:lines;
 root.getElementById=id=>elements[id];root.querySelectorAll=()=>[opener];root.addEventListener=(t,f)=>(root.listeners[t]??=[]).push(f);
 let time=0;const active=new Set();let handle=0;
 const originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval;
 globalThis.setInterval=()=>{active.add(++handle);return handle;};globalThis.clearInterval=id=>active.delete(id);
 const api=initNanoExplorer(root,()=>time);
 return {root,elements,buttons,lines,opener,api,active,setTime:t=>{time=t;},cleanup:()=>{api.stop();globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;}};
}
test('modal connects code highlighting, watchdog demo, restoration and timer cleanup',()=>{
 const f=fixture(),e=f.elements;
 try{
  f.opener.emit('click');assert(e.nfDialog.open);assert.equal(f.active.size,1);assert.equal(f.root.activeElement,e.nfClose);
  f.buttons.find(b=>b.dataset.nfCommand==='L').emit('click');assert.equal(e.nfMotorOutput.textContent,'L -1 / R 1');
  assert(f.lines.find(l=>l.dataset.nfLine==='L').classList.contains('nf-line-active'));
  e.nfSignalLoss.emit('click');f.setTime(4999);f.api.tick();assert.equal(e.nfDialog.dataset.nfState,'loss');assert.equal(e.nfDialog.dataset.nfMoving,'true');
  f.setTime(5000);f.api.tick();assert.equal(e.nfDialog.dataset.nfState,'timeout');assert.equal(e.nfMotorOutput.textContent,'L 0 / R 0');
  assert(f.lines.filter(l=>l.dataset.nfLine==='timeout').every(l=>l.classList.contains('nf-line-active')));
  e.nfSignalLoss.emit('click');assert.equal(e.nfDialog.dataset.nfMoving,'true');assert.equal(e.nfDialog.dataset.nfState,'stream');
  assert(e.nfDialog.emit('keydown',{key:'ArrowRight'}).stopped);
  f.root.hidden=true;f.root.listeners.visibilitychange[0]();assert.equal(f.active.size,0);
  f.setTime(100000);f.root.hidden=false;f.root.listeners.visibilitychange[0]();assert.equal(f.active.size,1);assert(!f.api.getState().failsafe);
  e.nfClose.emit('click');assert.equal(f.active.size,0);assert.equal(f.root.activeElement,f.opener);
 }finally{f.cleanup();}
});
test('both entry points and supplied timeout context exist in the built page',()=>{
 const s=fs.readFileSync('index.html','utf8');assert.equal((s.match(/\bdata-nf-open\b/g)??[]).length,2);
 assert(s.includes('5 s is the example in your screenshot.'));assert(s.includes('value of FAILSAFE_MS in the installed sketch'));
 assert(s.includes('src="assets/nano-firmware-explainer.js"'));assert(s.includes('lastCmd &gt;= FAILSAFE_MS'));
 assert(!fs.readFileSync('assets/nano-firmware-explainer.js','utf8').includes('navigator.bluetooth'));
});
