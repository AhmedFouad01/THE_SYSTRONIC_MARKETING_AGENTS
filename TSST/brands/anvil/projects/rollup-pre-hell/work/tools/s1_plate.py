# Stage 1: place plate B on the 150-dpi canvas, extend sides + bottom locally (mirror + fade), no AI.
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
W,H=4724,11811
SC=0.93*W/5792          # plate px -> canvas px
TOP=549                 # plate crop at top (canvas px)
p=Image.open('../plates/plate-b-4x.jpg').convert('RGB')
pw,ph=round(5792*SC),round(14480*SC)
p=p.resize((pw,ph),Image.LANCZOS)
ox=(W-pw)//2
a=np.zeros((H,W,3),np.uint8)
vis=ph-TOP
a[:vis,ox:ox+pw]=np.asarray(p)[TOP:]
del p
# sides: mirror strips
sw=ox
a[:vis,:ox]=a[:vis,ox:2*ox][:,::-1]
r0=ox+pw
a[:vis,r0:]=a[:vis,r0-(W-r0):r0][:,::-1]
# bottom: mirror last rows, fade to dark
ext=H-vis
src=a[vis-ext:vis][::-1].astype(np.float32)
t=np.linspace(0,1,ext,dtype=np.float32)[:,None,None]
fade=1-0.78*np.clip((t-0.05)/0.95,0,1)**0.8
a[vis:]=np.clip(src*fade,0,255).astype(np.uint8)
# soften seam
seam=60
blend=a[vis-seam:vis+seam].astype(np.float32)
from PIL import ImageFilter
bl=Image.fromarray(a[vis-seam:vis+seam]).filter(ImageFilter.GaussianBlur(6))
w=np.exp(-((np.arange(2*seam)-seam)/(seam/2.2))**2)[:,None,None].astype(np.float32)
a[vis-seam:vis+seam]=(blend*(1-w*0.8)+np.asarray(bl).astype(np.float32)*w*0.8).astype(np.uint8)
print('vis rows',vis,'ext',ext,'ox',ox,'SC',SC)
Image.fromarray(a).save('01_plate_extended.png',compress_level=2)
Image.fromarray(a).resize((472,1181),Image.LANCZOS).save('01_plate_extended_thumb.jpg')
