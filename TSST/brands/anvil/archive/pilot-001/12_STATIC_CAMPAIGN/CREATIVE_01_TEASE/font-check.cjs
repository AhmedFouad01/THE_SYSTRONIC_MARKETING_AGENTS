const fs=require('fs');
for(const file of ['Cairo-Bold.ttf','Cairo-Regular.ttf']){
 const b=fs.readFileSync('C:/Users/10/AppData/Local/Microsoft/Windows/Fonts/'+file),tables={};
 for(let i=0;i<b.readUInt16BE(4);i++){const p=12+i*16;tables[b.toString('ascii',p,p+4)]=b.readUInt32BE(p+8);}
 const n=tables.name, count=b.readUInt16BE(n+2), start=n+b.readUInt16BE(n+4), names={};
 for(let i=0;i<count;i++){let p=n+6+i*12;const platform=b.readUInt16BE(p),id=b.readUInt16BE(p+6),len=b.readUInt16BE(p+8),offset=b.readUInt16BE(p+10);if(platform===3&&[1,2,6,16,17].includes(id)){const a=Buffer.from(b.subarray(start+offset,start+offset+len));a.swap16();names[id]=a.toString('utf16le');}}
 console.log(JSON.stringify({file,names,weight:b.readUInt16BE(tables['OS/2']+4)}));
}
