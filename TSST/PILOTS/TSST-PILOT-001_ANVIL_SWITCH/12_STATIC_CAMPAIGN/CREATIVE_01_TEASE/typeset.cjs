const sharp = require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const out = __dirname;
const fonts = 'C:/Users/10/AppData/Local/Microsoft/Windows/Fonts/';
async function text(s, weight, size) {
  return sharp({text:{text:`<span foreground="#FFFFFF">${s}</span>`,font:`Cairo ${weight} ${size}`,fontfile:fonts+`Cairo-${weight}.ttf`,rgba:true,dpi:72}}).png().toBuffer();
}
(async()=>{
  const source='C:/Users/10/.codex/generated_images/01a0c9fb-b0d6-7680-9855-080fefb14900/exec-e86af56b-9cab-4f82-9c21-4e584f9136f4.png';
  let size=104, line2=await text('لسه جاي.','Bold',size), m=await sharp(line2).metadata();
  size=Math.round(size*350/m.width);
  const lines=[['الأقوى','Bold',size,120],['لسه جاي.','Bold',size,230],['فصل جديد بيتشكّل.','Regular',37,356]];
  const layers=[], report=[];
  for(const [s,w,z,y] of lines){const b=await text(s,w,z), meta=await sharp(b).metadata();layers.push({input:b,left:495-meta.width,top:y});report.push({text:s,font:'Cairo '+w,fontSize:z,width:meta.width,height:meta.height,x:495-meta.width,y});}
  const final=await sharp(source).resize(1080,1350,{fit:'fill'}).composite(layers).png().toBuffer();
  fs.writeFileSync(path.join(out,'creative-01-final-v02.png'),final);
  await sharp(final).resize(360,450).png().toFile(path.join(out,'creative-01-feed-qa-v02.png'));
  fs.writeFileSync(path.join(out,'creative-01-type-spec.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
})();
