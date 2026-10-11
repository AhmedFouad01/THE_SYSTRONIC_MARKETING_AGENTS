# Stage 2: cut real packshots. JPGs: all share identical tub geometry + a closed white sticker outline -> one flood-fill master mask.
import numpy as np, os
from PIL import Image, ImageDraw, ImageFilter
RAW='../../../INBOX/01_RAW_PRODUCTS/premium-pre-hell/'
os.makedirs('cutouts',exist_ok=True)
def master_mask(ref='red-chili.jpg'):
    a=np.asarray(Image.open(RAW+ref).convert('RGB'))
    white=(a.min(2)>235).astype(np.uint8)*255
    w=Image.fromarray(white).filter(ImageFilter.MaxFilter(5))
    w=w.point(lambda v:255 if v else 0)
    ImageDraw.floodfill(w,(2,2),128)          # outside -> 128
    m=np.asarray(w)
    filled=(m!=128).astype(np.uint8)*255       # tub + ring
    f=Image.fromarray(filled)
    # undo the 5px dilation then remove the 7px sticker ring
    for _ in range(2+8+1): f=f.filter(ImageFilter.MinFilter(3))
    return f
def feather(f,r=0.9): return f.filter(ImageFilter.GaussianBlur(r))
if __name__=='__main__':
    mm=master_mask(); mm.save('cutouts/_master_mask.png')
    mmf=feather(mm)
    bb=mm.getbbox(); print('bbox',bb)
    for n in ['red-chili','trooma','tequille','bad-girl','red-poll','moonster-energy']:
        im=Image.open(RAW+n+'.jpg').convert('RGB')
        rgba=im.convert('RGBA'); rgba.putalpha(mmf)
        rgba=rgba.crop(bb)
        rgba.save(f'cutouts/{n}.png'); print(n,rgba.size)
    for n in ['mango','blue-resberry','green-apple','red-cherry']:
        im=Image.open(RAW+n+'.png').convert('RGBA')
        al=np.asarray(im)[...,3]; ys,xs=np.where(al>8)
        print(n,'png bbox',xs.min(),ys.min(),xs.max(),ys.max(), 'alpha unique',len(np.unique(al)))
