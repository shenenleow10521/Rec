import bpy,math
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/tmp/rec-display-model.glb')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=False
scene.render.resolution_x=1200;scene.render.resolution_y=920;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.018,.035,.06,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25
scene.view_settings.view_transform='AgX'
def mat(name,color,metal=0,rough=.4,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
 if emission:n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=emission
 return m
bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=2.30,depth=.10,location=(0,0,-.065));bpy.context.object.data.materials.append(mat('Display plinth',(.018,.032,.05),.65,.25));bevel=bpy.context.object.modifiers.new('Soft machined rim','BEVEL');bevel.width=.025;bevel.segments=3
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.12));bpy.context.object.data.materials.append(mat('Studio floor',(.006,.013,.024),.3,.45))
for r in [2.29,2.36]:
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.008,major_segments=128,minor_segments=8,location=(0,0,-.008));bpy.context.object.data.materials.append(mat('Cyan inlay',(.05,.70,.78),.25,.3,1.8))
def area(name,loc,energy,color,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.color=color;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large soft key',(3,-4,6),650,(.82,.92,1),5)
area('Cyan rim',(-4,1.5,4),700,(.22,.7,1),4)
area('Warm edge',(3,3,3),500,(1,.84,.58),3)
area('Front fill',(-1,-5,2.8),180,(.63,.81,1),3)
data=bpy.data.cameras.new('Showroom camera');cam=bpy.data.objects.new('Showroom camera',data);scene.collection.objects.link(cam);cam.location=(4.2,-5.8,3.45);cam.rotation_euler=(Vector((0,-.25,1.0))-cam.location).to_track_quat('-Z','Y').to_euler();data.lens=44;scene.camera=cam
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=91;scene.render.filepath='assets/robot-preview.webp';bpy.ops.wm.save_as_mainfile(filepath='/tmp/rec-studio.blend');bpy.ops.render.render(write_still=True)
