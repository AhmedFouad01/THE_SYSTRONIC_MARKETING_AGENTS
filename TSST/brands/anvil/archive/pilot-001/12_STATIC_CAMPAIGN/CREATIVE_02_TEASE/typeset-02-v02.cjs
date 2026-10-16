const sharp=require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs');
const path=require('path');
(async()=>{
 const lines=[['القوة ليها','Bold',80,1000],['ملامح.','Bold',80,1090],['مرحلة جديدة. بمعايير أقوى.','Regular',37,1220]], layers=[],spec=[];
 for(const [s,w,size,y] of lines){
  const b=await sharp({text:{text:`<span foreground="#FFFFFF">${s}</span>`,font:`Cairo ${w} ${size}`,fontfile:`C:/Users/10/AppData/Local/Microsoft/Windows/Fonts/Cairo-${w}.ttf`,rgba:true,dpi:72}}).png().toBuffer();
  const m=await sharp(b).metadata();layers.push({input:b,left:990-m.width,top:y});spec.push({text:s,font:'Cairo '+w,fontSize:size,x:990-m.width,y,width:m.width,height:m.height});
 }
 const b=await sharp('C:/Users/10/.codex/generated_images/01a0c9fb-b0d6-7680-9855-080fefb14900/exec-3397e475-4e01-476c-a8aa-880aa09d6abe.png').resize(1080,1350,{fit:'fill'}).composite(layers).png().toBuffer();
 fs.writeFileSync(path.join(__dirname,'creative-02-tease-v02.png'),b);
 await sharp(b).resize(360,450).png().toFile(path.join(__dirname,'creative-02-feed-qa-v02.png'));
 fs.writeFileSync(path.join(__dirname,'creative-02-type-spec-v02.json'),JSON.stringify(spec,null,2));
 console.log(JSON.stringify(spec));
})();


