"""Build an editable Blender entrance scene from the authored character gallery."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(BASE/'blender'/'cabinet-characters.blend'))
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.name='Cabinet entrance'
for name in ['Studio floor']:
    obj=bpy.data.objects.get(name)
    if obj:bpy.data.objects.remove(obj,do_unlink=True)
scene.timeline_markers.clear()

def mat(color):
    rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)]
    rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    m=bpy.data.materials.get('Room '+color)
    if m:return m
    m=bpy.data.materials.new('Room '+color);m.diffuse_color=(*rgb,1);m.use_nodes=True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*rgb,1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
    return m

def cube(name,pos,size,color,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat(color))
    if bevel:
        mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=2
    return o

def disk(name,pos,scale,color):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=1,depth=1,location=pos);o=bpy.context.object
    o.name=name;o.scale=scale;o.data.materials.append(mat(color));return o

# Appearance follows the photographed Sejong Room; measurements and admission lane are schematic.
layout=json.loads((BASE/'cabinet-layout.json').read_text())
room_x,room_z=layout['roomHalf'];back=room_z-.1;left=-room_x+.1
cube('Cream carpet',(0,0,-.22),(room_x*2,room_z*2,.44),'#ded8c8')
cube('Learning admission lane',(room_x+2.5,0,-.22),(5,room_z*2,.44),'#e4ded0')
cube('Back wall',(0,back,2.3),(room_x*2,.16,4.6),'#ece4d5')
cube('Left wall',(left,0,2.3),(.16,room_z*2,4.6),'#e9e1d1')
for height in [.17,3.68,4.25,4.51]:
    cube('Wood cornice',(0,back-.14,height),(room_x*2-.1,.15,.11),'#a47846')
    cube('Wood cornice',(left+.14,0,height),(.15,room_z*2-.3,.11),'#a47846')
for x in [-9,-6.2,-3.2,3.2,6.2,9]:cube('Timber post',(x,back-.17,2.25),(.16,.16,4.5),'#a47846')
for z in [-8,-5,-2.2,2.2,5,8]:cube('Timber post',(left+.16,-z,2.25),(.18,.16,4.5),'#a47846')
for x in [-7.5,-4.7,4.7,7.5]:
    cube('Window',(x,back-.26,2.15),(2.12,.08,2.68),'#c9d2d3')
    for i in range(7):cube('Window grid',(x-.9+i*.3,back-.33,2.15),(.018,.02,2.54),'#9b8a6e',0)
    for i in range(8):cube('Window grid',(x,back-.34,1+i*.32),(2.04,.02,.018),'#9b8a6e',0)
    for sign in [-1,1]:cube('Curtain',(x+sign*.96,back-.44,2.15),(.25,.1,2.75),'#e5decd')
for i in range(55):
    x=-9+i*.33
    for sign in [-1,1]:
        strip=cube('Upper lattice',(x,back-.27,3.96),(.018,.018,.54),'#ad885b',0);strip.rotation_euler.y=sign*.55
cube('Blue chair backdrop',(0,back-.3,2.15),(5.66,.12,3.95),'#214a92')
seal=disk('Schematic presidential seal',(0,back-.39,3.04),(.46,.46,.035),'#e3ce92');seal.rotation_euler.x=math.pi/2
seal=disk('Seal blue center',(0,back-.42,3.04),(.36,.36,.03),'#244777');seal.rotation_euler.x=math.pi/2
for i in range(5):
    a=i*math.tau/5
    petal=disk('Seal flower',(math.sin(a)*.09,back-.45,3.04+math.cos(a)*.09),(.075,.075,.025),'#ddbd69');petal.rotation_euler.x=math.pi/2
cube('Schematic landscape background',(left+.25,0,2.18),(.04,6.2,2.7),'#98c1ce')
for layer,color in enumerate(['#8aab76','#547d61','#315b52']):
    vertices=[(left+.3+layer*.01,-3.1,.83)]
    for i in range(11):vertices.append((left+.3+layer*.01,-3.1+i*.62,1.8-layer*.2 if i%2==0 else 3.28-layer*.35))
    vertices.append((left+.3+layer*.01,3.1,.83))
    mesh=bpy.data.meshes.new('Mountain silhouette');mesh.from_pydata(vertices,[],[tuple(range(len(vertices)))]);mesh.materials.append(mat(color))
    obj=bpy.data.objects.new('Schematic landscape layer',mesh);scene.collection.objects.link(obj)
for z in [-4.3,4.3]:
    cube('Side opening frame',(left+.25,-z,1.67),(.13,1.65,3.2),'#795033')
    cube('Side opening',(left+.35,-z,1.65),(.08,1.42,3.02),'#e8dfce')
def screen(x,z,height,w,h):
    cube('Conference screen',(x,-z,height),(w,.08,h),'#252b32')
    cube('Blue screen',(x,-z-.05,height),(w-.08,.02,h-.08),'#12356a')
for x in [-4.7,4.7]:screen(x,-back+.56,2.4,1.65,.99)
for x in [-3.2,0,3.2]:screen(x,-layout['tableInner'][1]+.22,.52,1.35,.76)
for x,presidential in [(-2.67,False),(2.27,True)]:
    disk('Flag foot',(x,back-.58,.13),(.23,.23,.16),'#9c8557');disk('Flag pole',(x,back-.58,1.64),(.018,.018,3.05),'#c3a366')
    cube('Presidential flag' if presidential else 'Korean flag',(x+.43,back-.6,2.6),(1,.025,.68),'#244d8b' if presidential else '#fffdf5',0)
    if presidential:
        mark=disk('Flag schematic flower',(x+.43,back-.63,2.6),(.12,.12,.015),'#e5c578');mark.rotation_euler.x=math.pi/2
    else:
        # Two opposing semicircles and the four trigrams keep this recognizably the Korean flag.
        for upper,color in [(True,'#bd4c51'),(False,'#34558a')]:
            angles=[i*math.pi/32+(0 if upper else math.pi) for i in range(33)]
            vertices=[(x+.43,back-.63,2.6)]+[(x+.43+math.cos(a)*.13,back-.63,2.6+math.sin(a)*.13) for a in angles]
            mesh=bpy.data.meshes.new('Taegeuk half');mesh.from_pydata(vertices,[],[tuple(range(len(vertices)))]);mesh.materials.append(mat(color))
            obj=bpy.data.objects.new('Taegeuk half',mesh);scene.collection.objects.link(obj)
        for dx,dz,bars,angle in [(-.28,.19,[1,1,1],-.55),(.28,.19,[0,1,0],.55),(-.28,-.19,[1,0,1],.55),(.28,-.19,[0,0,0],-.55)]:
            bpy.ops.object.empty_add(location=(x+.43+dx,back-.645,2.6+dz));trigram=bpy.context.object;trigram.rotation_euler.y=angle
            for j,solid in enumerate(bars):
                for offset in ([0] if solid else [-.048,.048]):
                    bar=cube('Trigram',(offset,0,(j-1)*.035),(.16 if solid else .065,.012,.018),'#29333c',0);bar.parent=trigram

def desk(x,z,w,d):
    cube('Wood table top',(x,-z,1.17),(w,d,.13),'#895035')
    cube('Wood table front',(x,-z,.66),(w-.08,d-.13,.91),'#85492e')
    if w>2:
        for i in range(int(w/1.15)):
            xx=x-w/2+.6+i*1.15
            for side in [-1,1]:cube('Raised wood panel',(xx,-z+side*(d/2-.05),.7),(1.02,.045,.62),'#9e6040')
outer_x,outer_z=layout['tableOuter'];inner_x,inner_z=layout['tableInner'];rail_z=(outer_z+inner_z)/2
desk(0,-rail_z,outer_x*2,outer_z-inner_z);desk(0,rail_z,outer_x*2,outer_z-inner_z)
for sign in [-1,1]:desk(sign*(outer_x+inner_x)/2,0,outer_x-inner_x,inner_z*2)
seats=[(x,z,0 if z<0 else math.pi,False) for z in [-layout['mainRowZ'],layout['mainRowZ']] for x in layout['mainRowX']]
seats += [(-outer_x-.7,z,math.pi/2,True) for z in [-1.2,1.2]]
seats += [(x,row['z'],0 if row['z']<0 else math.pi,True) for row in layout['observerRows'] for x in row['x']]
for i,(x,z,yaw,secondary) in enumerate(seats):
    bpy.ops.object.empty_add(location=(x,-z,0));chair=bpy.context.object;chair.name=f'Chair {i+1}';chair.rotation_euler.z=yaw
    for name,pos,size in [('Seat',(0,0,.59),(.69,.64,.17)),('Back',(0,.26,1.05),(.69,.14,.92))]:
        part=cube(name,pos,size,'#493936');part.parent=chair
    for xx in [-.34,.34]:
        part=cube('Chair arm',(xx,0,.83),(.07,.52,.09),'#332f2d');part.parent=chair
    part=disk('Chair stem',(0,0,.3),(.05,.05,.5),'#7c7d7c');part.parent=chair
    for j in range(5):
        a=j*math.tau/5;part=cube('Chair caster',(math.sin(a)*.18,math.cos(a)*.18,.09),(.06,.42,.05),'#686c6b');part.rotation_euler.z=-a;part.parent=chair
    if not secondary:
        dz=(rail_z+.18)*(1 if z>0 else -1)
        cube('Laptop base',(x,-dz,1.27),(.54,.37,.03),'#303b47')
        cube('Laptop screen',(x,-dz-.16*(1 if z<0 else -1),1.48),(.54,.035,.4),'#354050')
        cube('Documents',(x+.36,-dz,1.27),(.18,.25,.02),'#ebe9df')
        disk('Microphone',(x-.35,-dz,1.41),(.015,.015,.3),'#242b30')
for row in layout['observerRows']:
    for x in row['x']:
        cube('Attendee desk',(x,-row['deskZ'],1.13),(1.45,.64,.1),'#90583b')
        cube('Attendee documents',(x-.1,-row['deskZ'],1.2),(.45,.3,.02),'#e9e7da')
door_x,door_z=layout['door']
for z in [door_z-.93,door_z+.93]:cube('Learning doorway jamb',(door_x,-z,1.43),(.26,.17,2.86),'#a47846')
cube('Door lintel',(door_x,-door_z,2.84),(.26,2.04,.18),'#a47846')
bpy.ops.object.empty_add(location=(door_x,-door_z+.82,0));door=bpy.context.object;door.name='Animated learning doorway'
for name,pos,size,color in [('Door',(0,-.81,1.28),(.1,1.62,2.56),'#9a754b'),('Door panel',(.065,-.81,1.4),(.04,1.32,1.72),'#e5d7bd')]:
    part=cube(name,pos,size,color);part.parent=door
motion=json.loads((BASE/'blender'/'entrance-motion.json').read_text())
events=[]
for job in motion['characters']:
    pid=job['id'];rig=bpy.data.objects[pid+'_rig'];source=rig.animation_data.action
    channels=[(fc.data_path,fc.array_index,fc) for fc in source.fcurves]
    rig.animation_data.action=bpy.data.actions.new(pid+'_Entrance')
    def key_pose(frame,source_frame,previous=None,weight=1):
        for path,axis,fc in channels:
            value=rig.path_resolve(path)
            target=fc.evaluate(source_frame)
            value[axis]=target if previous is None else fc.evaluate(previous)*(1-weight)+target*weight
        for bone in rig.pose.bones:
            bone.keyframe_insert('rotation_euler',frame=frame,group=bone.name)
            bone.keyframe_insert('location',frame=frame,group=bone.name)
    first=job['frames'][0]
    rig.location=(first[1],-first[2],.08);rig.rotation_euler=(0,0,0)
    for frame in [1,job['start']-1]:
        rig.keyframe_insert('location',frame=frame);rig.keyframe_insert('rotation_euler',frame=frame);key_pose(frame,1)
    for frame,x,z,yaw,source_frame,previous,weight in job['frames']:
        rig.location=(x,-z,.08);rig.rotation_euler.z=yaw
        rig.keyframe_insert('location',frame=frame);rig.keyframe_insert('rotation_euler',frame=frame)
        key_pose(frame,source_frame,previous,weight)
    for fc in rig.animation_data.action.fcurves:
        for key in fc.keyframe_points:key.interpolation='LINEAR'
    events.append({key:value for key,value in job.items() if key!='frames'})
    scene.timeline_markers.new(pid,frame=job['start'])
    end=job.get('seated',job.get('exit'))
    for frame,angle in [(job['start']-1,0),(job['start']+10,-math.pi/2 if 'seated' in job else 0),(end,-math.pi/2 if 'seated' in job else 0),(end+10,0)]:
        door.rotation_euler.z=angle;door.keyframe_insert('rotation_euler',frame=frame)
next_frame=motion['end']
# President is present from the start; the official is only used in the public-records stage.
president=bpy.data.objects['president_rig'];scene.frame_set(94);president.animation_data_clear()
president.location=(layout['president'][0],-layout['president'][1],.08);president.rotation_euler.z=0
legal=bpy.data.objects['legislation_rig'];legal.hide_render=True;legal.hide_set(True)
for child in legal.children:child.hide_render=True;child.hide_set(True)
scene.frame_start=1;scene.frame_end=next_frame
scene.timeline_markers.new('Meeting ready',frame=next_frame)
for light in [o for o in scene.objects if o.type=='LIGHT']:
    light.data.energy*=4;light.location*=1.7
camera=scene.camera;camera.location=(23,-30,23)
camera.rotation_euler=(Vector((2.6,0,1.5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=34
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene['description']='Sejong Room based on official 2026-09-29 photographs. Schematic dimensions and learning admission route. Space: play.'
scene['reference']=layout['photo']
scene['entrance_events']=json.dumps(events)
scene.frame_set(1)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'blender'/'cabinet-entrance.blend'))
scene.frame_set(events[0]['start']+95)
print('ENTRANCE_SCENE_DONE',events)
