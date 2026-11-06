import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Photo-derived display reconstruction. Units are illustrative, not fabrication dimensions.
export function createRobot({ textures = true } = {}) {
  const robot = new T.Group(); robot.name = 'REC / Group 4 / photo-derived robot';
  const parts = [], gears = [], racks = [];
  const material = (color, opts={}) => new T.MeshPhysicalMaterial({color, roughness:.42, metalness:.05, clearcoat:.22, clearcoatRoughness:.32, ...opts});
  const blue=material('#2684d5',{roughness:.38,clearcoat:.38}), edgeBlue=material('#1767b3'), rubber=material('#12191e',{roughness:.88,clearcoat:0}), foam=material('#111720',{roughness:1,clearcoat:0});
  const yellow=material('#dce629',{roughness:.4}), neon=material('#d8ef32'), metal=material('#bcc8cb',{metalness:.88,roughness:.24}), brass=material('#c3a968',{metalness:.77,roughness:.32});
  const pcb=material('#1f6b91',{roughness:.5}), green=material('#245c49'), black=material('#111a21',{roughness:.5}), brown=material('#955b47',{roughness:.86,clearcoat:0}), red=material('#9c2d31');
  const wireM=['#d94649','#e7b74b','#23649b','#46906d','#61513d','#171e24'].map(c=>material(c,{roughness:.54,clearcoat:0}));
  const boxGeo = new Map(), cylGeo = new Map();
  function box(p,w,h,d,m,x=0,y=0,z=0,r=.018){
    const key=[w,h,d,r].join('/');if(!boxGeo.has(key))boxGeo.set(key,r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d));
    const o=new T.Mesh(boxGeo.get(key),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
  }
  function cyl(p,rt,rb,h,m,x=0,y=0,z=0,segments=32){
    const key=[rt,rb,h,segments].join('/');if(!cylGeo.has(key))cylGeo.set(key,new T.CylinderGeometry(rt,rb,h,segments));
    const o=new T.Mesh(cylGeo.get(key),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
  }
  function cable(p,points,m,r=.012){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));const o=new T.Mesh(new T.TubeGeometry(curve,30,r,6,false),m);o.castShadow=true;p.add(o);return o;}
  function part(name,offset){const g=new T.Group();g.name=name;g.userData.home=new T.Vector3();g.userData.explode=new T.Vector3(...offset);robot.add(g);parts.push(g);return g;}
  function screw(p,x,y,z){cyl(p,.032,.032,.019,metal,x,y,z,16);const slot=box(p,.036,.003,.006,black,x,y+.011,z,0);slot.rotation.y=.5;}
  const base=part('Blue printed chassis',[0,-.12,0]);
  box(base,2.12,.095,2.22,blue,0,.43,.05,.05);
  box(base,1.38,.10,.17,blue,0,.47,-1.01,.025);
  for(const x of [-.98,.98])for(const z of [-.94,.35]){box(base,.13,.17,.17,edgeBlue,x,.53,z);screw(base,x,.624,z);}
  for(const x of [-.60,.60])for(const z of [.65,.93])screw(base,x,.491,z);
  // Low rear battery pack visible underneath the raised electronics deck.
  for(const z of [-.77,-.48]){const c=cyl(base,.145,.145,1.30,material('#2b78bf',{roughness:.35}),0,.67,z);c.rotation.z=Math.PI/2;}
  cable(base,[[.65,.7,-.6],[.9,.78,-.65],[.75,.73,-.18],[.30,.68,-.10]],wireM[0],.019);
  cable(base,[[-.65,.7,-.65],[-.7,.75,-.2],[-.2,.63,.1]],wireM[5],.019);
  // Front ball caster.
  box(base,.28,.08,.30,metal,0,.34,.85);const ball=new T.Mesh(new T.SphereGeometry(.16,24,16),metal);ball.position.set(0,.17,.85);base.add(ball);
  const wheels=[];
  for(const side of [-1,1]){
    const drive=part(side<0?'Left TT drive':'Right TT drive',[side*.48,.12,-.12]);
    box(drive,.42,.37,.64,neon,side*.89,.53,-.65,.055);
    const can=cyl(drive,.14,.14,.35,metal,side*.57,.52,-.65);can.rotation.z=Math.PI/2;
    box(drive,.11,.24,.29,black,side*.39,.52,-.65,.03);
    const axle=cyl(drive,.055,.055,.36,metal,side*1.16,.51,-.65);axle.rotation.z=Math.PI/2;
    const wheel=new T.Group();wheel.name='Black tread / yellow spoke wheel';wheel.position.set(side*1.29,.51,-.65);wheel.rotation.z=Math.PI/2;drive.add(wheel);wheels.push(wheel);
    cyl(wheel,.49,.49,.28,rubber,0,0,0,64);
    // Instanced tire blocks keep draw-call cost low while preserving visible tread.
    const treadGeo=new RoundedBoxGeometry(.105,.045,.11,1,.014);
    const tread=new T.InstancedMesh(treadGeo,rubber,96);const dummy=new T.Object3D();let index=0;
    for(let row=0;row<3;row++)for(let i=0;i<32;i++){
      const a=(i+(row%2)*.48)*Math.PI*2/32;dummy.position.set(Math.cos(a)*.488,(row-1)*.085,Math.sin(a)*.488);dummy.rotation.set(0,-a,Math.PI/2);dummy.scale.set(1,1,1);dummy.updateMatrix();tread.setMatrixAt(index++,dummy.matrix);
    }tread.castShadow=true;wheel.add(tread);
    for(const face of [-1,1]){
      cyl(wheel,.35,.35,.035,yellow,0,face*.154,0,48);
      // Dark recessed openings and raised spokes on each yellow wheel face.
      for(let i=0;i<6;i++){const a=i*Math.PI/3;const inset=box(wheel,.12,.006,.20,rubber,Math.cos(a)*.23,face*.176,Math.sin(a)*.23,.035);inset.rotation.y=-a+.3;const spoke=box(wheel,.08,.025,.25,yellow,Math.cos(a+.52)*.15,face*.184,Math.sin(a+.52)*.15,.015);spoke.rotation.y=-(a+.52)+Math.PI/2;}
      cyl(wheel,.095,.11,.06,yellow,0,face*.19,0,24);cyl(wheel,.026,.026,.012,metal,0,face*.225,0,16);
    }
    for(const z of [-.9,-.38])box(drive,.1,.16,.12,blue,side*1.01,.62,z);
  }
  const electronics=part('Lower power electronics',[0,.4,0]);
  box(electronics,.87,.027,.69,red,0,.72,-.05);
  box(electronics,.39,.30,.25,black,0,.885,-.15);
  for(let i=0;i<7;i++)box(electronics,.026,.11,.25,metal,-.18+i*.06,1.04,-.15,.003);
  for(const x of [-.27,.27])cyl(electronics,.073,.073,.17,metal,x,.82,.17,20);
  box(electronics,.65,.025,.43,pcb,0,.54,.57);
  box(electronics,.16,.12,.16,material('#2e7eb3'),-.15,.61,.61);
  cyl(electronics,.11,.11,.11,material('#586564',{metalness:.45}),.13,.61,.56,24);
  box(electronics,.14,.21,.28,black,-1.03,.61,.33);
  const toggle=box(electronics,.045,.16,.19,red,-1.11,.63,.34);toggle.rotation.z=-.18;
  const upper=part('Raised perfboard and controller',[0,1.12,0]);
  // Four brass standoffs support a separate raised perfboard deck.
  for(const x of [-.83,.83])for(const z of [-.91,.26]){cyl(upper,.036,.036,.70,brass,x,.84,z,12);screw(upper,x,1.225,z);}
  let perfMaterial=brown;
  if(textures&&typeof document!=='undefined'){
    const cv=document.createElement('canvas');cv.width=512;cv.height=384;const ctx=cv.getContext('2d');
    if(ctx){ctx.fillStyle='#985d48';ctx.fillRect(0,0,512,384);ctx.font='10px monospace';ctx.fillStyle='#d5c6ae';
      for(let row=0;row<24;row++)for(let col=0;col<32;col++){const x=9+col*16,y=9+row*16;ctx.fillStyle='#c7a68a';ctx.beginPath();ctx.arc(x,y,3.1,0,Math.PI*2);ctx.fill();ctx.fillStyle='#402b24';ctx.beginPath();ctx.arc(x,y,1.55,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#e0d7bd';for(let i=0;i<24;i++)ctx.fillText(String(i+1),1,11+i*16);
      const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;perfMaterial=brown.clone();perfMaterial.map=tx;
    }
  }
  box(upper,1.85,.032,1.39,perfMaterial,0,1.20,-.35,.025);
  if(!textures){const holes=new T.InstancedMesh(new T.CylinderGeometry(.012,.012,.003,6),material('#3d2d2a'),336);const d=new T.Object3D();let n=0;for(let row=0;row<14;row++)for(let col=0;col<24;col++){d.position.set(-.86+col*.074,1.218,-.99+row*.099);d.updateMatrix();holes.setMatrixAt(n++,d.matrix);}upper.add(holes);}
  for(const x of [-.83,.83])for(const z of [-.91,.26])screw(upper,x,1.226,z);
  const nano=new T.Group();nano.name='Arduino Nano';nano.position.set(-.35,1.25,-.43);upper.add(nano);
  for(const x of [-.19,.19]){box(nano,.075,.12,.93,black,x,.045,0,.004);for(let i=0;i<15;i++)cyl(nano,.009,.009,.15,brass,x,.08,-.42+i*.06,6);}
  box(nano,.47,.025,1.00,pcb,0,.12,0,.012);
  const chip=box(nano,.20,.035,.20,black,0,.15,.04,.004);chip.rotation.y=Math.PI/4;
  box(nano,.23,.11,.21,metal,0,.18,-.42,.014);box(nano,.15,.056,.012,black,0,.18,-.532,.002);
  box(nano,.11,.021,.045,metal,.10,.145,.29,.007);
  for(let i=0;i<7;i++)box(nano,.028,.017,.04,metal,-.16,.148,-.23+i*.07,.002);
  const led=material('#64eeaf',{emissive:'#27e59b',emissiveIntensity:.8});box(nano,.025,.014,.025,led,.15,.151,.33,.002);
  const hc=new T.Group();hc.name='Upright HC-05';hc.position.set(.59,1.26,-.80);hc.rotation.x=-.08;upper.add(hc);
  box(hc,.33,.12,.16,black,0,.015,0,.003);box(hc,.31,.83,.025,green,0,.47,0,.009);
  box(hc,.22,.27,.018,black,0,.40,.025,.004);box(hc,.095,.065,.025,metal,-.08,.19,.025,.003);
  for(let j=0;j<4;j++){const x=-.11+j*.065;box(hc,.018,.18,.008,brass,x,.78,.023,.001);if(j<3)box(hc,.075,.018,.008,brass,x+.029,j%2?.69:.87,.023,.001);}
  const fuse=cyl(upper,.032,.032,.30,material('#e4e5d7',{roughness:.45}),.23,1.257,.04,20);fuse.rotation.z=Math.PI/2;
  for(const x of [.06,.4]){const cap=cyl(upper,.034,.034,.045,metal,x,1.257,.04,20);cap.rotation.z=Math.PI/2;}
  for(let i=0;i<3;i++){const r=cyl(upper,.018,.018,.10,material('#c6a26a'),.13+i*.13,1.245,.20,12);r.rotation.z=Math.PI/2;}
  // Colored jumpers are actual curved tubes, not billboard textures.
  const loom=part('Rainbow jumper loom',[0,1.12,0]);
  for(let i=0;i<6;i++)cable(loom,[[-.20+i*.07,1.41,-.65],[-.45+i*.09,1.87,-1.00],[.32+i*.055,2.12-i*.027,-.96],[.49+i*.04,1.38,-.81]],wireM[i],.012);
  for(let side of [-1,1])for(let i=0;i<3;i++)cable(loom,[[side*.73,1.25,.17],[side*.97,1.15,.45],[side*.70,1.08,.84],[side*.65,1.01,.73]],wireM[i],.011);
  for(let i=0;i<4;i++)cable(electronics,[[.05+i*.08,.76,-.15],[.25+i*.07,.97,-.36],[.34+i*.09,1.19,-.18]],wireM[i],.014);
  // Mirror-image front rack-and-pinion grippers, with padded inner faces.
  for(const side of [-1,1]){
    const g=part(side<0?'Left rack-and-pinion claw':'Right rack-and-pinion claw',[side*.37,.27,.56]);g.position.x=side*.64;g.userData.home.copy(g.position);g.scale.x=side;
    box(g,.34,.41,.37,material('#244d8a',{roughness:.4,transparent:true,opacity:.91}),0,.78,.58,.025);
    for(const x of [-.23,.23])box(g,.105,.65,.42,blue,x,.71,.58,.02);
    box(g,.46,.09,.12,edgeBlue,0,1.05,.54);
    const shape=new T.Shape();const teeth=16;
    for(let j=0;j<teeth;j++)for(const [f,r] of [[-.5,.246],[-.32,.246],[-.20,.302],[.20,.302],[.32,.246],[.5,.246]]){const a=(j+f)*Math.PI*2/teeth;const x=Math.cos(a)*r,y=Math.sin(a)*r;j===0&&f===-.5?shape.moveTo(x,y):shape.lineTo(x,y);}shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:1,steps:1});
    const gear=new T.Mesh(geo,blue);gear.name='16-tooth blue pinion';gear.position.set(0,.94,.89);gear.castShadow=true;g.add(gear);gears.push(gear);
    const screwFront=cyl(g,.035,.035,.028,metal,0,.94,1.005,20);screwFront.rotation.x=Math.PI/2;
    const rack=new T.Group();rack.name='Sliding padded jaw';g.add(rack);racks.push(rack);
    box(rack,1.00,.13,.17,blue,0,.55,1.00,.015);
    for(let j=0;j<16;j++)box(rack,.036,.07,.13,blue,-.47+j*.062,.65,1.00,.004);
    box(rack,.14,.22,.93,blue,.39,.47,1.39,.018);box(rack,.055,.26,.56,foam,.292,.49,1.53,.012);
    box(g,.14,.22,.93,blue,-.28,.47,1.39,.018);box(g,.055,.26,.56,foam,-.182,.49,1.53,.012);
  }
  robot.userData={photoReconstruction:true,units:'illustrative',parts:parts.length};
  robot.updateMatrixWorld(true);
  const focusPositions={all:new T.Vector3(0,1,0),gripper:new T.Vector3(0,.78,1.02),electronics:new T.Vector3(0,1.44,-.38),drive:new T.Vector3(0,.56,-.55)};
  function update(explode=0,grip=0){
    for(const p of parts)p.position.copy(p.userData.home).addScaledVector(p.userData.explode,explode);
    for(let i=0;i<gears.length;i++){racks[i].position.x=-.15*grip;gears[i].rotation.z=.15*grip/.274;}
  }
  update();
  return {root:robot,parts,gears,racks,wheels,focusPositions,update};
}
