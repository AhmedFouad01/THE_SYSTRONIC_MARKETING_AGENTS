import os
from PIL import Image, ImageDraw, ImageFont
R=r"G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/"
OUT=R+"CREATIVE/fonts/lockup-tests/"
FD=os.path.expandvars(r"$LOCALAPPDATA/Microsoft/Windows/Fonts/")
BOLD=FD+"Inter_28pt-Bold.ttf"; SEMI=FD+"Inter_28pt-SemiBold.ttf"
SCR={"Allura":R+"CREATIVE/fonts/allura/Allura-Regular.ttf","AlexBrush":R+"CREATIVE/fonts/alexbrush/AlexBrush-Regular.ttf"}
PHOTO=R+"PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/showcase-01/build-v2/slide-04/01_photo.png"
DARK="#011C2C";WHITE="#F4F4F4";ORANGE="#F58021";PET="#01304A"
def F(p,s): return ImageFont.truetype(p,max(8,int(round(s))))
def bb(f,t): return f.getbbox(t,anchor="ls")
def width(p,t,s): b=bb(F(p,s),t); return b[2]-b[0]
def fit(p,t,W): return 100*W/width(p,t,100)
def xh(p,s): b=bb(F(p,s),"x"); return b[3]-b[1]
def build(treat,script,kind,W,x0,y0,bold_c,scr_c,d):
    sp=SCR[script]
    if treat=="A":  # script over bold caps
        t="LIVE IN."; sb=fit(BOLD,t,W); cap=0.728*sb
        ss=sb*1.0
        while xh(sp,ss)<0.45*cap: ss*=1.04
        fs=F(sp,ss); sb_=bb(fs,"made to"); asc=-sb_[1]
        sbase=y0+asc; btop=sbase-0.12*cap; bbase=btop+cap
        d.text((x0,bbase),t,font=F(BOLD,sb),fill=bold_c,anchor="ls")
        d.text((x0+0.04*W,sbase),"made to",font=fs,fill=scr_c,anchor="ls")
        return bbase-y0
    if treat=="B":  # script behind bold
        t="ONE TEAM."; ts="Finished"
        ss=fit(sp,ts,0.9*W); fs=F(sp,ss); b=bb(fs,ts); sbase=y0-b[1]
        sb=fit(BOLD,t,0.5*W); cap=0.728*sb
        d.text((x0-b[0],sbase),ts,font=fs,fill=scr_c,anchor="ls")
        bbase=sbase-0.25*xh(sp,ss)+cap
        d.text((x0+0.4*W,bbase),t,font=F(BOLD,sb),fill=bold_c,anchor="ls")
        return max(sbase+b[3],bbase)-y0
    if treat=="C":  # script accent inside an Inter line
        l1="Made to "; l2a="live"; l2b=" in."
        # size so that line 2 (script live scaled 1.6 + inter in.) fits W
        s=100*W/(width(sp,l2a,160)+width(SEMI,l2b,100))
        s=min(s,fit(SEMI,"Made to",W))
        i=F(SEMI,s); cap=0.728*s
        y1=y0+cap
        d.text((x0,y1),l1.strip(),font=i,fill=bold_c,anchor="ls")
        y2=y1+s*1.25
        fs=F(sp,s*1.6); d.text((x0,y2),l2a,font=fs,fill=scr_c,anchor="ls")
        d.text((x0+width(sp,l2a,s*1.6),y2),l2b,font=i,fill=bold_c,anchor="ls")
        return y2-y0+0.4*s
NAMES={"A":"A script over Inter Bold caps","B":"B script behind Inter Bold","C":"C script accent word in Inter line"}
def panel(treat,script,kind):
    if kind=="dark":
        im=Image.new("RGB",(1080,1350),DARK); d=ImageDraw.Draw(im)
        # measure height first on scratch
        h=build(treat,script,kind,840,0,0,WHITE,ORANGE,ImageDraw.Draw(Image.new("RGB",(1,1))))
        build(treat,script,kind,840,120,(1350-h)/2,WHITE,ORANGE,d)
    else:
        im=Image.open(PHOTO).convert("RGB"); d=ImageDraw.Draw(im)
        build(treat,script,kind,360,44,60,WHITE,ORANGE,d)
    return im
cells={}
for sc in SCR:
  for t in "ABC":
    a=panel(t,sc,"dark"); b=panel(t,sc,"photo")
    v=Image.new("RGB",(2160,1350)); v.paste(a,(0,0)); v.paste(b,(1080,0))
    v.save(OUT+f"variant_{t}_{sc}.png"); cells[(sc,t,"dark")]=a; cells[(sc,t,"photo")]=b
# sheet
cw,ch=480,600; lab=60; hd=70; sheet=Image.new("RGB",(lab+3*cw,hd+4*ch),"#202020"); d=ImageDraw.Draw(sheet)
lf=F(FD+"Inter_18pt-SemiBold.ttf",20)
for j,t in enumerate("ABC"): d.text((lab+j*cw+10,24),NAMES[t],font=lf,fill=WHITE)
r=0
for sc in SCR:
  for kind in("dark","photo"):
    y=hd+r*ch
    tl=Image.new("RGB",(ch,lab),"#202020"); td=ImageDraw.Draw(tl); td.text((8,18),f"{sc} / {kind}",font=lf,fill=ORANGE)
    sheet.paste(tl.rotate(90,expand=True),(0,y))
    for j,t in enumerate("ABC"):
        sheet.paste(cells[(sc,t,kind)].resize((cw-8,ch-8),Image.LANCZOS),(lab+j*cw+4,y+4))
    r+=1
sheet.save(OUT+"sheet.png"); print("ok",sheet.size)
