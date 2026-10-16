const sharp=require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs'),path=require('path');
(async()=>{
const layers=[];
for(const [txt,font,file,size,y] of [['المرحلة الأقوى بدأت.','Cairo Bold','Cairo-Bold.ttf',64,180],['ANVIL SUPPS','Inter SemiBold','Inter_18pt-SemiBold.ttf',26,93]]) {
const b=await sharp({text:{text:`<span foreground="#FFFFFF">${txt}</span>`,font:`${font} ${size}`,fontfile:'C:/Users/10/AppData/Local/Microsoft/Windows/Fonts/'+file,rgba:true,dpi:72}}).png().toBuffer(); const m=await sharp(b).metadata();layers.push({input:b,left:Math.round((1080-m.width)/2),top:y});}
const b=await sharp('C:/Users/10/.codex/generated_images/01a0c9fb-b0d6-7680-9855-080fefb14900/exec-d5492f80-8f66-4cae-a4b2-6615abd15753.png').resize(1080,1350,{fit:'fill'}).composite(layers).png().toBuffer();
fs.writeFileSync(path.join(__dirname,'reveal-01-v02.png'),b);
await sharp(b).resize(360,450).png().toFile(path.join(__dirname,'reveal-01-feed-qa-v02.png'));
})();
