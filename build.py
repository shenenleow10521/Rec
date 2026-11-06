import base64,sys
src=open('src/index.src.html').read()
for n in ['mech','elec','prog','nano','battery','robot','chassis','assembled','rack-cad','pinion-cad','gripper','power-art','nano-board']:
    b=base64.b64encode(open(f'src/assets/{n}.webp','rb').read()).decode()
    src=src.replace(f'%%{n}%%','data:image/webp;base64,'+b)
b=base64.b64encode(open('src/assets/wiring-reference.jpg','rb').read()).decode()
src=src.replace('%%wiring-reference%%','data:image/jpeg;base64,'+b)
assert '%%' not in src
open('index.html','w').write(src)
print(len(src)//1024,'KB')
