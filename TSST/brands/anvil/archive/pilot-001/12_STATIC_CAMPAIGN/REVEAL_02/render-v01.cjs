const sharp = require('C:/Users/10/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dir = __dirname;
const fontRoot = 'C:/Users/10/AppData/Local/Microsoft/Windows/Fonts';
// Editable composition: generated unbranded scene, untouched exact logo, separately shaped type.
async function textLayer(text, font, fontfile, size, centerX, top, color='#ffffff') {
 const input = await sharp({text:{text:`<span foreground="${color}">${text}</span>`,font:`${font} ${size}`,fontfile:path.join(fontRoot,fontfile),rgba:true,dpi:72}}).png().toBuffer();
 const m=await sharp(input).metadata();
 return {input,left:Math.round(centerX-m.width/2),top};
}
(async()=>{
 const base=await sharp(path.join(dir,'background-clean.png')).resize(1080,1350,{fit:'fill'}).png().toBuffer();
 const logo=await sharp(path.join(dir,'references/anvil-official-reverse.png')).resize({width:260}).png().toBuffer();
 const layers=[
 await textLayer('نفس الحكاية.','Cairo Bold','Cairo-Bold.ttf',76,540,116),
 await textLayer('فصل جديد.','Cairo Bold','Cairo-Bold.ttf',76,540,230),
 await textLayer('Shark X Store','Inter SemiBold','Inter_18pt-SemiBold.ttf',34,300,663),
 {input:logo,left:650,top:604},
 await textLayer('ANVIL SUPPS','Inter SemiBold','Inter_18pt-SemiBold.ttf',30,780,780),
 await textLayer('Shark X Store','Inter SemiBold','Inter_18pt-SemiBold.ttf',38,540,1090),
 await textLayer('بقى اسمه','Cairo Bold','Cairo-Bold.ttf',30,540,1150),
 await textLayer('ANVIL SUPPS','Inter SemiBold','Inter_18pt-SemiBold.ttf',46,540,1214)
 ];
 const output=path.join(dir,'reveal-02-v01.png');
 await sharp(base).composite(layers).png().toFile(output);
 await sharp(output).resize(360,450).png().toFile(path.join(dir,'reveal-02-v01-phone-qa.png'));
 const m=await sharp(output).metadata();
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,p))).digest('hex');
 fs.writeFileSync(path.join(dir,'render-metadata.json'),JSON.stringify({status:'REVIEW',width:m.width,height:m.height,format:m.format,phonePreview:'360x450',logo:{source:'references/anvil-official-reverse.png',width:260,left:650,top:604,transform:'uniform scale only',sha256:hash('references/anvil-official-reverse.png')},fonts:['Cairo Bold','Inter SemiBold'],backgroundSha256:hash('background-clean.png'),outputSha256:hash('reveal-02-v01.png')},null,2)+'\n');
 console.log(JSON.stringify({width:m.width,height:m.height,format:m.format}));
})().catch(e=>{console.error(e);process.exit(1)});
