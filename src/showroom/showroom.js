import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createRobot } from './model.js';

const stage=document.getElementById('showroom');
if(stage){
 const viewport=stage.querySelector('.rs-viewport'),status=stage.querySelector('.rs-status');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const orbitButton=document.getElementById('rsOrbit'),explodeButton=document.getElementById('rsExplode'),gripButton=document.getElementById('rsGrip');
 const inputs=[...stage.querySelectorAll('button')];
 let renderer,composer,scene,camera,controls,robot,visible=false,initialized=false,failed=false;
 let automatic=!reduced.matches,gripping=false,explodeTarget=0,explode=0,last=0,gripTime=0,poseGoal=null;
 const poses={hero:{eye:[4.4,3.3,5.7],target:[0,.98,.25]},front:{eye:[0,2.15,6.4],target:[0,.88,.3]},top:{eye:[.01,7,.28],target:[0,.7,.05]},gripper:{eye:[2.4,2.05,4.25],target:[0,.8,1.0]},drive:{eye:[4.5,1.9,1.5],target:[.15,.65,-.5]},electronics:{eye:[2.7,3.7,3.4],target:[0,1.45,-.37]}};
 function syncButtons(){orbitButton.disabled=!initialized||failed||reduced.matches;explodeButton.textContent=explodeTarget===1?'Assemble':'Explode';gripButton.textContent=gripping?'Stop grip':'Grip demo';orbitButton.setAttribute('aria-pressed',String(automatic));explodeButton.setAttribute('aria-pressed',String(explodeTarget===1));gripButton.setAttribute('aria-pressed',String(gripping));}
 function syncLoop(){if(renderer&&!failed)renderer.setAnimationLoop(visible&&!document.hidden?frame:null);last=0;}
 function setPose(name){if(!initialized||failed)return;automatic=false;controls.autoRotate=false;poseGoal=poses[name];stage.querySelectorAll('[data-rs-focus]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rsFocus===name)));if(reduced.matches){camera.position.fromArray(poseGoal.eye);controls.target.fromArray(poseGoal.target);poseGoal=null;controls.update();}syncButtons();stage.querySelectorAll('[data-rs-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rsView===name)));}
 function unavailable(){failed=true;renderer?.setAnimationLoop(null);stage.classList.remove('rs-ready');stage.classList.add('rs-static');status.textContent='Static model view · 3D is unavailable on this device';inputs.forEach(b=>b.disabled=true);}
 function initialize(){
  if(initialized||failed)return;initialized=true;
  try{
   renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setClearColor('#06111d',0);
   renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive 3D reconstruction of the blue Group 4 robot. Drag to orbit; use arrow keys to rotate and plus or minus to zoom.');
   viewport.prepend(renderer.domElement);
   scene=new T.Scene();scene.fog=new T.FogExp2('#06111d',.028);
   camera=new T.PerspectiveCamera(34,1,.05,35);camera.position.fromArray(poses.hero.eye);
   controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(poses.hero.target);controls.enableDamping=!reduced.matches;controls.dampingFactor=.065;controls.enablePan=false;controls.rotateSpeed=.6;controls.zoomSpeed=.7;controls.minDistance=3.2;controls.maxDistance=9;controls.minPolarAngle=.12;controls.maxPolarAngle=1.49;controls.autoRotate=automatic;controls.autoRotateSpeed=.65;
   controls.addEventListener('start',()=>{automatic=false;poseGoal=null;controls.autoRotate=false;syncButtons();});
   const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.70;room.dispose?.();pmrem.dispose();
   scene.add(new T.HemisphereLight('#d6eeff','#0b1d33',1.05));
   const key=new T.SpotLight('#ecf6ff',115,18,Math.PI/4,.65,1.4);key.position.set(3.8,6,4.2);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.bias=-.0002;key.shadow.normalBias=.025;key.shadow.camera.near=.5;key.shadow.camera.far=18;key.target.position.set(0,.8,0);scene.add(key,key.target);
   const rim=new T.SpotLight('#35cbdc',85,16,Math.PI/3,.8,1.5);rim.position.set(-4,3,-2.5);rim.target.position.set(0,1,0);scene.add(rim,rim.target);
   const warm=new T.PointLight('#ffe4ad',24,8,1.5);warm.position.set(3,2,-3);scene.add(warm);
   const pad=new T.Mesh(new T.CylinderGeometry(2.27,2.34,.10,96),new T.MeshPhysicalMaterial({color:'#111e2b',roughness:.28,metalness:.75,clearcoat:.8}));pad.position.y=-.065;pad.receiveShadow=true;scene.add(pad);
   const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#06111c',roughness:.58,metalness:.3}));floor.rotation.x=-Math.PI/2;floor.position.y=-.12;floor.receiveShadow=true;scene.add(floor);
   const glow=new T.MeshBasicMaterial({color:'#43d7df',toneMapped:false});
   for(const radius of [2.29,2.37]){const ring=new T.Mesh(new T.TorusGeometry(radius,.007,5,160),glow);ring.rotation.x=Math.PI/2;ring.position.y=-.008;scene.add(ring);}
   const ticks=new T.InstancedMesh(new T.BoxGeometry(.009,.003,.052),new T.MeshBasicMaterial({color:'#669ba9'}),60);const d=new T.Object3D();for(let i=0;i<60;i++){const a=i*Math.PI/30;d.position.set(Math.sin(a)*2.16,-.009,Math.cos(a)*2.16);d.rotation.y=a;d.scale.z=i%5===0?1.8:1;d.updateMatrix();ticks.setMatrixAt(i,d.matrix);}scene.add(ticks);
   robot=createRobot();scene.add(robot.root);
   const hdr=renderer.extensions.has('EXT_color_buffer_float');const target=new T.WebGLRenderTarget(1,1,{type:hdr?T.HalfFloatType:T.UnsignedByteType});composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));if(hdr)composer.addPass(new UnrealBloomPass(new T.Vector2(1,1),.25,.35,1.5));composer.addPass(new OutputPass());
   const resize=()=>{const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(viewport);resize();
   renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);stage.classList.remove('rs-ready');status.textContent='Recovering the 3D view…';});
   renderer.domElement.addEventListener('webglcontextrestored',()=>{stage.classList.add('rs-ready');status.textContent='Drag to orbit · scroll to zoom';syncLoop();});
   renderer.domElement.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();automatic=false;controls.autoRotate=false;poseGoal=null;
    const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(event.key==='ArrowLeft')spherical.theta-=.16;if(event.key==='ArrowRight')spherical.theta+=.16;if(event.key==='ArrowUp')spherical.phi=Math.max(.12,spherical.phi-.12);if(event.key==='ArrowDown')spherical.phi=Math.min(1.49,spherical.phi+.12);
    if(['+','='].includes(event.key))spherical.radius=Math.max(3.2,spherical.radius*.92);if(['-','_'].includes(event.key))spherical.radius=Math.min(9,spherical.radius*1.08);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(spherical));controls.update();syncButtons();
   });
   controls.update();composer.render();stage.classList.add('rs-ready');status.textContent='Drag to orbit · scroll to zoom';inputs.forEach(b=>b.disabled=false);syncButtons();syncLoop();
  }catch(error){console.warn('REC showroom could not start:',error);unavailable();}
 }
 function frame(time){
  if(!renderer||failed)return;
  const dt=last?Math.min((time-last)/1000,.05):0;last=time;
  try{
   if(poseGoal){const a=reduced.matches?1:1-Math.exp(-dt*5);const eye=new T.Vector3().fromArray(poseGoal.eye),target=new T.Vector3().fromArray(poseGoal.target);camera.position.lerp(eye,a);controls.target.lerp(target,a);if(camera.position.distanceTo(eye)<.008){poseGoal=null;}}
   explode=reduced.matches?explodeTarget:T.MathUtils.damp(explode,explodeTarget,5,dt);
   if(gripping&&!reduced.matches)gripTime+=dt;
   robot.update(explode,gripping?(reduced.matches?1:(1-Math.cos(gripTime*1.6))*.5):0);
   controls.autoRotate=automatic&&!poseGoal&&!reduced.matches;controls.update(dt);composer.render();
  }catch(error){console.warn('REC showroom render stopped:',error);unavailable();}
 }
 stage.querySelectorAll('[data-rs-view]').forEach(b=>b.addEventListener('click',()=>setPose(b.dataset.rsView)));
 stage.querySelectorAll('[data-rs-focus]').forEach(b=>b.addEventListener('click',()=>{setPose(b.dataset.rsFocus);stage.querySelectorAll('[data-rs-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
 orbitButton.addEventListener('click',()=>{automatic=!automatic;poseGoal=null;if(controls)controls.autoRotate=automatic;syncButtons();});
 explodeButton.addEventListener('click',()=>{explodeTarget=explodeTarget?0:1;automatic=false;poseGoal=explodeTarget?{eye:[5.1,4.2,6.8],target:[0,1.4,.2]}:poses.hero;syncButtons();});
 gripButton.addEventListener('click',()=>{gripping=!gripping;gripTime=0;syncButtons();});
 reduced.addEventListener('change',()=>{if(reduced.matches){automatic=false;gripping=false;}if(controls)controls.enableDamping=!reduced.matches;syncButtons();});
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)initialize();syncLoop();},{threshold:.02});observer.observe(stage);
 document.addEventListener('visibilitychange',syncLoop);syncButtons();
}
