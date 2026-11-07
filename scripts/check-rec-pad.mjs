import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONTROLS,DEFAULT_MAPPING,STOP_FRAME,mapCommand,describeControl,initRecPadExplorer} from '../assets/rec-pad-explainer.js';

test('calibration matches REC PAD source, including fixed turn swap',()=>{
 assert.deepEqual(Object.fromEntries('FBLRWXEC'.split('').map(c=>[c,mapCommand(c)])),{F:'B',B:'F',L:'R',R:'L',W:'X',X:'W',E:'E',C:'C'});
 const direct={drive:false,left:false,right:false};
 assert.equal(mapCommand('F',direct),'F');assert.equal(mapCommand('W',direct),'W');assert.equal(mapCommand('L',direct),'R');
 assert.equal(mapCommand('E',{...direct,right:true}),'C');
 assert.deepEqual(DEFAULT_MAPPING,{drive:true,left:true,right:false});
});
test('every control exposes the correct packet, release and repeat semantics',()=>{
 assert.equal(Object.keys(CONTROLS).length,11);
 assert.equal(describeControl('forward').hex,'42');
 assert.equal(describeControl('leftOpen').release,'J');assert.equal(describeControl('rightClose').release,'K');
 assert.equal(describeControl('faster').frame,'+P');assert.equal(describeControl('slower').hex,'2D 50');
 assert.equal(describeControl('pause').frame,STOP_FRAME);
 assert.equal(describeControl('pause').hex,'0D 0A 53 0D 0A 21 0D 0A 50 0D 0A');
 assert.match(describeControl('pause').timing,/240 ms/);assert.match(describeControl('leftClose').timing,/120 ms/);
 assert.throws(()=>describeControl('bad'),/Unknown/);
});

// Small event fixture exercises the actual modal controller without a browser.
function fixture(){
 const root={hidden:false,activeElement:null};
 class Element{
  constructor(id,data={}){this.id=id;this.dataset=data;this.attributes={};this.listeners={};this.textContent='';this.hidden=false;this.checked=false;this.open=false;this.offsetWidth=100;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  emit(type,props={}){const event={target:this,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...props};for(const fn of this.listeners[type]??[])fn(event);return event;}
  setAttribute(k,v){this.attributes[k]=v;}
  focus(){root.activeElement=this;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return {left:10,right:500,top:10,bottom:500};}
 }
 const ids=['rpDialog','rpClose','rpReverseDrive','rpReverseLeft','rpReverseRight','rpResetMapping','rpControlTitle','rpControlGroup','rpDescription','rpSemantic','rpWire','rpFrame','rpHex','rpTiming','rpRelease','rpMapNote','rpPathCommand'];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 elements.rpReverseDrive.checked=elements.rpReverseLeft.checked=true;
 const actions=Object.keys(CONTROLS).map(key=>new Element(key,{rpAction:key}));
 const tabs=['map','path','protocol'].map(name=>new Element('tab-'+name,{rpTab:name}));
 const panels=['map','path','protocol'].map(name=>new Element('panel-'+name,{rpPanel:name}));
 const opener=new Element('open'),replay=new Element('replay');
 elements.rpDialog.querySelectorAll=selector=>({'[data-rp-action]':actions,'[data-rp-tab]':tabs,'[data-rp-panel]':panels,'[data-rp-replay]':[replay]}[selector]??[]);
 root.getElementById=id=>elements[id];root.querySelectorAll=()=>[opener];root.listeners={};
 root.addEventListener=(type,fn)=>(root.listeners[type]??=[]).push(fn);
 let reduced=false;const motionListeners=[];
 globalThis.matchMedia=()=>({get matches(){return reduced;},addEventListener:(type,fn)=>motionListeners.push(fn)});
 const api=initRecPadExplorer(root);
 return {root,elements,actions,tabs,panels,opener,replay,api,setReduced:()=>{reduced=true;motionListeners.forEach(fn=>fn());}};
}
test('opening, controls, calibration, tabs and dismissal remain coordinated',()=>{
 const f=fixture(),{elements:e}=f;
 f.opener.emit('click');assert(e.rpDialog.open);assert.equal(f.root.activeElement,e.rpClose);
 assert.equal(e.rpWire.textContent,'B');
 f.actions.find(b=>b.dataset.rpAction==='leftOpen').emit('click');assert.equal(e.rpWire.textContent,'X');
 e.rpReverseLeft.checked=false;e.rpReverseLeft.emit('change');assert.equal(e.rpWire.textContent,'W');
 e.rpResetMapping.emit('click');assert.equal(e.rpWire.textContent,'X');
 const event=f.tabs[0].emit('keydown',{key:'ArrowRight'});assert(event.prevented);
 assert.equal(f.tabs[1].attributes['aria-selected'],'true');assert(!f.panels[1].hidden);assert(f.panels[0].hidden);assert.equal(f.root.activeElement,f.tabs[1]);
 assert(e.rpDialog.emit('keydown',{key:'ArrowDown'}).stopped);
 f.replay.emit('click');assert(e.rpDialog.classList.contains('rp-playing'));
 f.setReduced();assert(!e.rpDialog.classList.contains('rp-playing'));
 f.replay.emit('click');assert(!e.rpDialog.classList.contains('rp-playing'));
 e.rpClose.emit('click');assert(!e.rpDialog.open);assert.equal(f.root.activeElement,f.opener);
 f.opener.emit('click');assert.equal(f.tabs[0].attributes['aria-selected'],'true');
 e.rpDialog.emit('click',{clientX:0,clientY:0});assert(!e.rpDialog.open);
 f.api.stopAnimation();delete globalThis.matchMedia;
});
test('HTML includes linked accessible views, both entry points and unique IDs',()=>{
 const s=fs.readFileSync('index.html','utf8');const ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal((s.match(/\bdata-rp-open\b/g)??[]).length,2);
 assert.equal((s.match(/\bdata-rp-action="/g)??[]).length,Object.keys(CONTROLS).length);
 assert(s.includes('src="assets/rec-pad-explainer.js"'));assert(s.includes('aria-describedby="rpSubtitle"'));
 for(const name of ['Map','Path','Protocol']){assert(s.includes(`id="rpTab${name}"`));assert(s.includes(`aria-labelledby="rpTab${name}"`));}
 assert(!fs.readFileSync('assets/rec-pad-explainer.js','utf8').includes('navigator.bluetooth'));
});
