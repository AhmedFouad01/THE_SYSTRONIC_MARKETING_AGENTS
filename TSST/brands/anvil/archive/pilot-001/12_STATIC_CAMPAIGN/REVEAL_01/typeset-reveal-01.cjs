const sharp=require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs'); const path=require('path');
(async()=>{
const layers=[];
const mark=await sharp(path.join(__dirname,'anvil-production/source/anvil-official-reverse.png')).resize({width:600}).png().toBuffer();
layers.push({input:mark,left:240,top:404});
for(const [txt,family,weight,size,y,file] of [
 ['المرحلة الأقوى بدأت.','Cairo','Bold',64,120,'Cairo-Bold.ttf'],
 ['هوية جديدة. وطموح أقوى.','Cairo','Regular',37,230,'Cairo-Regular.ttf'],
 ['ANVIL SUPPS','Inter','SemiBold',32,691,'Inter_18pt-SemiBold.ttf']
]) {const b=await sharp({text:{text:`<span foreground="#FFFFFF">${txt}</span>`,font:`${family} ${weight} ${size}`,fontfile:'C:/Users/10/AppData/Local/Microsoft/Windows/Fonts/'+file,rgba:true,dpi:72}}).png().toBuffer();const m=await sharp(b).metadata();layers.push({input:b,left:Math.round((1080-m.width)/2),top:y});console.log(txt,m.width,m.height);}
const final=await sharp('C:/Users/10/.codex/generated_images/01a0c9fb-b0d6-7680-9855-080fefb14900/exec-336103f9-2951-4a9e-9d8c-25ab6aa9783a.png').resize(1080,1350,{fit:'fill'}).composite(layers).png().toBuffer();
fs.writeFileSync(path.join(__dirname,'reveal-01-v01.png'),final);
await sharp(final).resize(360,450).png().toFile(path.join(__dirname,'reveal-01-feed-qa-v01.png'));
})();
