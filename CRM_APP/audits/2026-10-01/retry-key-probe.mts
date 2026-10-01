import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
import {seed} from '../../scripts/seed.ts';
import {transition} from '../../src/transition.ts';
import {pool} from '../../src/db.ts';
const admin=new pg.Client({connectionString:process.env.ADMIN_DATABASE_URL});
await admin.connect();
try {
 const f=await seed(admin),ctx={tenant:f.ids.a,token:f.tokens.manager};
 const first={to_stage_id:f.ids.qualified,expected_version:0,command_id:randomUUID(),reason:'Independent audit'};
 const a=await transition(ctx,f.ids.dealA,first,'K1');
 const replay=await transition(ctx,f.ids.dealA,first,'K2');
 let observed;
 try {observed={accepted:true,result:await transition(ctx,f.ids.dealA,{...first,to_stage_id:f.ids.won,expected_version:1,command_id:randomUUID()},'K2')};}
 catch(e){observed={accepted:false,status:e.status,code:e.code};}
 const {rows:[counts]}=await admin.query('SELECT count(*)::int transitions FROM crm.stage_transition WHERE tenant_id=$1',[f.ids.a]);
 assert.equal(replay.id,a.id);
 assert.deepEqual(observed,{accepted:false,status:409,code:'IDEMPOTENCY_CONFLICT'});
 assert.equal(counts.transitions,1);
 console.log(JSON.stringify({verdict:'PASS',probe:'New retry key on durable replay binds request hash',firstVersion:a.version,replaySameOutcome:replay.id===a.id,expected:'409 IDEMPOTENCY_CONFLICT for different body under K2',observed,counts},null,2));
}finally{await admin.end();await pool.end();}
