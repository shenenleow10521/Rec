import fs from 'node:fs';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createRobot } from '../src/showroom/model.js';
globalThis.FileReader=class {readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}};
const model=createRobot({textures:false}),instances=[];model.root.traverse(o=>{if(o.isInstancedMesh)instances.push(o);});
for(const inst of instances){const group=new T.Group();group.matrixAutoUpdate=false;group.matrix.copy(inst.matrix);for(let i=0;i<inst.count;i++){const mat=new T.Matrix4();inst.getMatrixAt(i,mat);const m=new T.Mesh(inst.geometry,inst.material);m.matrixAutoUpdate=false;m.matrix.copy(mat);group.add(m);}inst.parent.add(group);inst.parent.remove(inst);}
model.root.updateMatrixWorld(true);const exporter=new GLTFExporter();const data=await exporter.parseAsync(model.root,{binary:true,onlyVisible:true});fs.writeFileSync('/tmp/rec-display-model.glb',Buffer.from(data));console.log('Exported photo-derived model to /tmp/rec-display-model.glb');
