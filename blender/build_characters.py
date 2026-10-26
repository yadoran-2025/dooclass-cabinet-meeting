"""Blender 4.2: model eight civic characters, skin them, and export animated GLBs."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parent.parent
OUT = BASE / 'assets' / 'cabinet'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.context.scene.render.fps = 30
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 95

PEOPLE = [
    ('premier', '국무총리', '#7da7d0', '#3b3538', '#f0c4a0', 'short'),
    ('speaker', '국회의장', '#e7a6a1', '#704631', '#deb08b', 'bow'),
    ('secretary', '대통령비서실장', '#e3b647', '#343e47', '#f2c89f', 'glasses'),
    ('justice', '법무부장관', '#c4ad7a', '#8c5c3d', '#f2c89f', 'side-glasses'),
    ('chief', '대법원장', '#94bec4', '#363c49', '#deb08b', 'beret'),
    ('education', '교육부장관', '#b6a3d4', '#573b32', '#f0c4a0', 'bun'),
    ('president', '대통령', '#6688a8', '#4d3e36', '#f0c4a0', 'scarf'),
    ('legislation', '법제처장', '#e5d3ae', '#775543', '#f2c89f', 'beret'),
]
MATERIALS = {}
def material(hexcolor, roughness=.75):
    key = (hexcolor, roughness)
    if key not in MATERIALS:
        rgb = [int(hexcolor[i:i+2], 16) / 255 for i in (1, 3, 5)]
        rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        m = bpy.data.materials.new(hexcolor)
        m.diffuse_color = (*rgb, 1)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
        bsdf.inputs['Roughness'].default_value = roughness
        MATERIALS[key] = m
    return MATERIALS[key]

parts = []
def finish(obj, name, color, bone='chest'):
    obj.name = name
    obj.data.materials.append(material(color))
    if obj.type == 'MESH':
        for p in obj.data.polygons: p.use_smooth = False
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
        parts.append(obj)
    return obj

def voxel(name, pos, size, color, bone):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, color, bone)

PIXEL = .075
REFERENCE = json.loads((BASE/'blender'/'pixel-reference.json').read_text())['characters']

def pixel_body(pid, coat, hair, skin, style):
    for x, top, width, height, color in REFERENCE[pid]['rects']:
        row = top + height/2
        center_x = x + width/2
        if row < 14:
            bone = 'head'
            depth = .48
            base = skin if color in ['#3f3937', '#dc9290', '#b4776b', '#514c46'] else color
        elif top >= 19:
            bone = ('thigh_' if top < 20 else 'shin_') + ('L' if center_x < 8 else 'R')
            depth = .30
            base = color
        elif center_x < 4 or center_x >= 12:
            bone = ('arm_' if row < 17 else 'forearm_') + ('L' if center_x < 8 else 'R')
            depth = .22
            base = color
        else:
            bone = 'hips' if top >= 18 else 'chest'
            depth = .28
            base = coat
        px = (center_x - 8) * PIXEL
        pz = (21 - top - height/2) * PIXEL
        voxel('Voxel volume', (px, 0, pz), (width*PIXEL, depth, height*PIXEL), base, bone)
        voxel('Pixel face', (px, -depth/2-.004, pz), (width*PIXEL, .008, height*PIXEL), color, bone)
        if row <= (12 if style in ['bow', 'beret'] else 10):
            voxel('Hair back', (px, depth/2+.004, pz), (width*PIXEL, .008, height*PIXEL), hair, bone)

def build_rig(pid):
    data=bpy.data.armatures.new(pid+'_skeleton')
    rig=bpy.data.objects.new(pid+'_rig',data);bpy.context.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    bones=[('root',(0,0,0),(0,0,.10),None),('hips',(0,0,.15),(0,0,.30),'root'),('chest',(0,0,.30),(0,0,.525),'hips'),('head',(0,0,.525),(0,0,1.35),'chest')]
    for side,x in [('L',-.1875),('R',.1875)]:
        bones += [(f'thigh_{side}',(x,0,.15),(x,0,.075),'hips'),(f'shin_{side}',(x,0,.075),(x,0,.015),f'thigh_{side}')]
    for side,x in [('L',-.375),('R',.375)]:
        bones += [(f'arm_{side}',(x,0,.4875),(x,0,.3375),'chest'),(f'forearm_{side}',(x,0,.3375),(x,0,.15),f'arm_{side}')]
    for name,head,tail,parent in bones:
        bone=data.edit_bones.new(name);bone.head=head;bone.tail=tail
        if parent:bone.parent=data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.show_in_front=True
    return rig

def pose_at(rig, kind, t):
    for bone in rig.pose.bones:
        bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
    p=rig.pose.bones
    if kind=='idle':
        p['chest'].rotation_euler.x=.014*math.sin(t*math.tau)
    if kind=='walk':
        phase=t*math.tau
        p['root'].location.x=.018*math.sin(phase)
        p['root'].location.y=.012*(1-math.cos(2*phase))
        p['chest'].rotation_euler.x=.035
        p['chest'].rotation_euler.z=.025*math.sin(phase)
        p['head'].rotation_euler.z=-.015*math.sin(phase)
        for side,sign in [('L',1),('R',-1)]:
            swing=math.sin(phase)*sign
            p['thigh_'+side].rotation_euler.x=-.65*swing
            p['shin_'+side].rotation_euler.x=.80*max(0,swing)
            p['arm_'+side].rotation_euler.x=.28*swing
            p['forearm_'+side].rotation_euler.x=-.10-.12*max(0,-swing)
    if kind=='sit':
        ease=lambda v: (max(0,min(1,v)))**2*(3-2*max(0,min(1,v)))
        if t<.18:
            u=ease(t/.18)
            lift=-.045*u;fold=.30*u;lean=.10*u;arm=-.30*u;forearm=-.15*u
        elif t<.70:
            u=ease((t-.18)/.52)
            lift=-.045+.765*u;fold=.30+(math.pi/2-.30)*u
            lean=.10*(1-u);arm=-.30-.18*math.sin(math.pi*u);forearm=-.15-.55*u
        else:
            u=ease((t-.70)/.30)
            lift=.72-.17*u;fold=math.pi/2;lean=.035*math.sin(math.pi*u)
            arm=-.30+.02*u;forearm=-.70
        p['root'].location.y=lift
        p['chest'].rotation_euler.x=lean
        p['head'].rotation_euler.x=-lean*.3
        for side in ['L','R']:
            p['thigh_'+side].rotation_euler.x=-fold
            p['shin_'+side].rotation_euler.x=fold
            p['arm_'+side].rotation_euler.x=arm
            p['forearm_'+side].rotation_euler.x=forearm

def animate(rig):
    for start,end,kind in [(1,31,'idle'),(32,62,'walk'),(63,93,'sit'),(94,95,'seated')]:
        for frame in range(start,end+1):
            pose_at(rig,'sit' if kind=='seated' else kind,1 if kind=='seated' else (frame-start)/(end-start))
            for bone in rig.pose.bones:
                bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=bone.name)
                bone.keyframe_insert(data_path='location',frame=frame,group=bone.name)
    rig.animation_data.action.name=rig.name+'_Motion'
    for fcurve in rig.animation_data.action.fcurves:
        for key in fcurve.keyframe_points:key.interpolation='LINEAR'

gallery=[]
for index,(pid,label,coat,hair,skin,style) in enumerate(PEOPLE):
    parts=[]
    rig=build_rig(pid)
    pixel_body(pid, coat, hair, skin, style)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    mesh=bpy.context.object;mesh.name=pid+'_body'
    modifier=mesh.modifiers.new('Character skeleton','ARMATURE');modifier.object=rig
    mesh.parent=rig
    animate(rig)
    bpy.context.scene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(OUT/(pid+'.glb')),export_format='GLB',use_selection=True,
        export_animations=True,export_frame_range=True,export_animation_mode='ACTIVE_ACTIONS',
        export_force_sampling=True,export_skins=True,export_yup=True)
    rig.location=(index*1.12-3.92,0,0)
    rig['role']=label;rig['authoring']='Blender 4.2.3; voxel extrusion of characters.mjs pixel art'
    gallery.append((rig,mesh))

for name,frame in [('Idle',1),('Walk',32),('Sit down',63),('Seated',94)]:
    bpy.context.scene.timeline_markers.new(name,frame=frame)
bpy.context.scene.frame_set(1)
bpy.context.scene.world.color=(.16,.19,.20)
bpy.context.scene.render.engine='BLENDER_EEVEE_NEXT'
bpy.context.scene.render.resolution_x=1600;bpy.context.scene.render.resolution_y=650;bpy.context.scene.render.resolution_percentage=100
bpy.context.scene.render.image_settings.file_format='PNG'
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005))
floor=bpy.context.object;floor.name='Studio floor';floor.data.materials.append(material('#eaf0f1'))
for loc,power,size in [((1,-4,7),1100,7),((-5,-2,4),650,5),((2,3,6),900,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4,-13,6))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=10.7;bpy.context.scene.camera=camera
bpy.context.scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'blender'/'cabinet-characters.blend'))
(OUT/'manifest.json').write_text(json.dumps({'generator':'Blender 4.2.3','style':'pixel-voxel','pixelReference':'characters.mjs','fps':30,'characters':[{'id':p[0],'role':p[1],'file':p[0]+'.glb'} for p in PEOPLE],
    'clips':{'Idle':[1,32],'Walk':[32,63],'SitDown':[63,94],'Seated':[94,96]}},ensure_ascii=False,indent=2))
print('CABINET_ASSETS_DONE',OUT)
