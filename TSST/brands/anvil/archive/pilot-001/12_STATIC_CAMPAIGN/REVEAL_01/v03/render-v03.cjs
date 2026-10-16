const sharp = require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path = require('path');
const fs = require('fs');
const dir = __dirname;
const fontRoot = 'C:/Users/10/AppData/Local/Microsoft/Windows/Fonts';
// Editable deterministic source. Symbolic bag background, separate official master and real font layers.
// Each direction is rendered separately through Pango; no synthetic Arabic or generative lettering.
async function textLayer(text, font, fontfile, size, centerX, top, color='#ffffff') {
 const input = await sharp({text:{text:`<span foreground="${color}">${text}</span>`,font:`${font} ${size}`,fontfile:path.join(fontRoot,fontfile),rgba:true,dpi:72}}).png().toBuffer();
 const m=await sharp(input).metadata();
 return {input,left:Math.round(centerX-m.width/2),top};
}
(async()=>{
 const base = await sharp(path.join(dir,'background-clean.png')).resize(1080,1350,{fit:'fill'}).png().toBuffer();
 const logo = await sharp(path.join(dir,'references/anvil-official-reverse.png')).resize({width:255}).png().toBuffer();
 const layers = [
 await textLayer('Shark X Store','Inter SemiBold','Inter_18pt-SemiBold.ttf',52,540,86),
 await textLayer('بقى اسمه','Cairo Bold','Cairo-Bold.ttf',38,540,155),
 await textLayer('ANVIL SUPPS','Inter SemiBold','Inter_18pt-SemiBold.ttf',72,540,223),
 await textLayer('Shark X Store','Inter SemiBold','Inter_18pt-SemiBold.ttf',34,355,797),
 {input:logo,left:609,top:762},
 await textLayer('اسم جديد. نفس الحكاية.','Cairo Bold','Cairo-Bold.ttf',42,540,1226)
 ];
 const output=path.join(dir,'reveal-01-v03.png');
 await sharp(base).composite(layers).png().toFile(output);
 await sharp(output).resize(360,450).png().toFile(path.join(dir,'reveal-01-v03-phone-qa.png'));
 const meta=await sharp(output).metadata();
 fs.writeFileSync(path.join(dir,'render-metadata.json'),JSON.stringify({status:'REVIEW',width:meta.width,height:meta.height,format:meta.format,logo:{source:'references/anvil-official-reverse.png',width:255,left:609,top:762,transform:'uniform scale only'},fonts:['Cairo Bold','Inter SemiBold'],phonePreview:'360x450'},null,2));
 console.log(JSON.stringify({width:meta.width,height:meta.height,format:meta.format}));
})().catch(err=>{console.error(err);process.exit(1)});
