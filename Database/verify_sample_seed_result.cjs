// Post-application read-only reconciliation. Preserves the original inventory.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const original=require('./sample_data_audit.json'),seed=require('./sample_seed_manifest.json');
const expected=require('./sample_seed_preview.json'),first=require('./sample_seed_first_apply.json'),rerun=require('./sample_seed_applied.json');
const be=path.resolve(__dirname,'../App/BE_GymPlan'),mysql=require(path.join(be,'node_modules/mysql2/promise'));
require(path.join(be,'node_modules/dotenv')).config({path:path.join(be,'.env'),quiet:true});
const keys={accounts:['accountId'],bodymetrics:['metricId'],equipment:['equipmentId'],exercisealternatives:['alternativeId'],exerciseconfigs:['configId'],exerciseequipment:['exerciseId','equipmentId'],exercisemedia:['mediaId'],exercisemusclegroups:['exerciseMuscleGroupId'],exercises:['exerciseId'],exercisesets:['setId'],gymusers:['profileId'],gymuserworkoutplans:['profileId','planId'],musclegroups:['groupId'],performedexercises:['performedExerciseId'],workoutdays:['dayId'],workoutplans:['planId'],workoutsessions:['workoutSessionId']};
const normalizeDDL=s=>s.replace(/AUTO_INCREMENT=\d+\s*/g,'');
(async()=>{
 let db;
 try{
  db=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_DATABASE||'quanlylichtapgym',dateStrings:true});
  await db.query("SET SESSION time_zone='+07:00'");
  await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const read=async sql=>(await db.query(sql))[0],now={},oldRows={};let unchangedProcedures=0,matchedValues=0;
  for(const [table,pk] of Object.entries(keys)){
   now[table]=await read(table==='accounts'?'SELECT accountId,username,email,role,status,createdAt FROM Accounts':'SELECT * FROM '+db.escapeId(table));
   const key=r=>JSON.stringify(pk.map(k=>r[k])),map=new Map(now[table].map(r=>[key(r),r]));
   for(const old of original.data[table])assert.deepEqual(map.get(key(old)),old,'Old row changed in '+table+': '+key(old));
   oldRows[table]=original.data[table].length;
   const ddl=(await read('SHOW CREATE TABLE '+db.escapeId(table)))[0]['Create Table'];
   assert.equal(normalizeDDL(ddl),normalizeDDL(original.schema[table]),'Schema changed: '+table);
  }
  for(const [name,ddl] of Object.entries(original.routines)){
   assert.equal((await read('SHOW CREATE PROCEDURE '+db.escapeId(name)))[0]['Create Procedure'],ddl,'Procedure changed: '+name);unchangedProcedures++;
  }
  const fks=await read('SELECT TABLE_NAME,COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION');
  const grouped=new Map();for(const fk of fks){const key=fk.TABLE_NAME+'.'+fk.CONSTRAINT_NAME;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(fk);}
  for(const [name,cols] of grouped){
   const q=db.escapeId.bind(db),fk=cols[0];
   const join=cols.map(c=>'c.'+q(c.COLUMN_NAME)+'=p.'+q(c.REFERENCED_COLUMN_NAME)).join(' AND ');
   const present=cols.map(c=>'c.'+q(c.COLUMN_NAME)+' IS NOT NULL').join(' AND ');
   const [row]=await read('SELECT COUNT(*) n FROM '+q(fk.TABLE_NAME)+' c LEFT JOIN '+q(fk.REFERENCED_TABLE_NAME)+' p ON '+join+' WHERE '+present+' AND p.'+q(fk.REFERENCED_COLUMN_NAME)+' IS NULL');
   assert.equal(row.n,0,'Orphan FK: '+name);
  }
  const one=(rows,predicate,label)=>{const found=rows.filter(predicate);assert.equal(found.length,1,label);return found[0];};
  const compare=(actual,wanted,fields)=>{for(const k of fields){assert.equal(actual[k]==null?null:String(actual[k]),wanted[k]==null?null:String(wanted[k]),'Value mismatch: '+k);matchedValues++;}};
  const userIds=new Map(),planIds=new Map(),dayIds=new Map(),sessionIds=new Map(),performedIds=new Map();
  for(const u of seed.users){
   const a=one(now.accounts,a=>a.username===u.username&&a.email===u.email,'seed account');compare(a,u,['status','createdAt']);assert.equal(a.role,'GYM_USER');
   const g=one(now.gymusers,g=>g.accountId===a.accountId,'seed profile');compare(g,u,['fullName','gender','level','goal','sessionsPerWeek']);assert.equal(g.status,u.profileStatus);userIds.set(u.username,{accountId:a.accountId,profileId:g.profileId});
  }
  const target=one(now.gymusers,g=>g.accountId===28,'Minh profile');userIds.set('gym_minh',{accountId:28,profileId:target.profileId});
  for(const p of seed.plans){const actual=one(now.workoutplans,x=>x.creatorId===userIds.get(p.userKey).accountId&&x.title===p.title,'personal plan');compare(actual,p,['description','level','durationWeeks','createdAt']);assert.equal(actual.isTemplate,0);planIds.set(p.planKey,actual.planId);}
  const active=one(now.gymuserworkoutplans,p=>p.profileId===target.profileId&&p.status==='ACTIVE','one active Minh plan');planIds.set(seed.target.planKey,active.planId);
  for(const day of seed.days){const actual=one(now.workoutdays,x=>x.planId===planIds.get(day.planKey)&&x.order===day.dayOrder,'day mapping');compare(actual,day,['dayName','weekDay']);dayIds.set(day.planKey+'|'+day.dayOrder,actual.dayId);}
  for(const c of seed.configs){const e=one(now.exercises,e=>e.name===c.exerciseName,'exercise');const actual=one(now.exerciseconfigs,x=>x.dayId===dayIds.get(c.planKey+'|'+c.dayOrder)&&x.order===c.exerciseOrder,'config');assert.equal(actual.exerciseId,e.exerciseId);compare(actual,c,['sets','reps','restTime']);}
  for(const m of seed.memberships){const actual=one(now.gymuserworkoutplans,x=>x.profileId===userIds.get(m.userKey).profileId&&x.planId===planIds.get(m.planKey),'membership');compare(actual,m,['joinedAt','startedAt','status']);}
  for(const s of seed.sessions){const actual=one(now.workoutsessions,x=>x.profileId===userIds.get(s.userKey).profileId&&x.startTime===s.startTime,'session');assert.equal(actual.dayId,dayIds.get(s.planKey+'|'+s.dayOrder));compare(actual,s,['endTime','totalDuration','status']);sessionIds.set(s.sessionKey,actual.workoutSessionId);}
  for(const p of seed.performed){const e=one(now.exercises,x=>x.name===p.exerciseName,'performed exercise library'),o=one(now.exercises,x=>x.name===p.originalExerciseName,'original exercise');const actual=one(now.performedexercises,x=>x.workoutSessionId===sessionIds.get(p.sessionKey)&&x.exerciseId===e.exerciseId,'performed');assert.equal(actual.originalExerciseId,o.exerciseId);compare(actual,p,['isSubstituted','isActive','isCompleted']);performedIds.set(p.sessionKey+'|'+p.exerciseName,actual.performedExerciseId);}
  for(const s of seed.sets){const actual=one(now.exercisesets,x=>x.performedExerciseId===performedIds.get(s.sessionKey+'|'+s.exerciseName)&&x.setNumber===s.setNumber,'set');for(const field of ['weight','reps','preValue']){assert.equal(actual[field]==null?null:Number(actual[field]),s[field],field);matchedValues++;}}
  for(const m of seed.metrics){const actual=one(now.bodymetrics,x=>x.profileId===userIds.get(m.userKey).profileId&&x.recordedAt===m.recordedAt,'metric');assert.equal(Number(actual.height),m.height);assert.equal(Number(actual.weight),m.weight);}
  for(const [k,n] of Object.entries(expected.expectedAdded)){assert.equal(first.counts[0]['added_'+k],n,'first insert count');assert.equal(rerun.counts[0]['added_'+k],0,'rerun must insert zero');}
  const before=require('./sample_data_verification.json').find(x=>x.sql.includes('duplicateUsername')).result;
  const after=first.verification.find(x=>x.sql.includes('duplicateUsername')).result;
  assert.deepEqual(after,before,'New integrity issues');
  const ws=now.workoutsessions.filter(x=>x.profileId===target.profileId),pe=now.performedexercises.filter(x=>ws.some(w=>w.workoutSessionId===x.workoutSessionId)),sets=now.exercisesets.filter(x=>pe.some(p=>p.performedExerciseId===x.performedExerciseId));
  const metrics=now.bodymetrics.filter(x=>x.profileId===target.profileId).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
  const volume=sets.filter(s=>{const p=pe.find(p=>p.performedExerciseId===s.performedExerciseId);return ws.find(w=>w.workoutSessionId===p.workoutSessionId).status==='COMPLETED';}).reduce((sum,s)=>sum+Number(s.weight)*s.reps,0);
  assert.equal(ws.length,51);assert.equal(pe.length,214);assert.equal(sets.length,592);assert.equal(metrics.length,13);assert.equal(Number(metrics.at(-1).weight),60);assert.equal(volume,140455);
  const report={verifiedAt:(await read('SELECT NOW() t'))[0].t,readOnly:true,firstApplication:first.counts[0],rerun:rerun.counts[0],matchedValues,originalRowsUnchanged:oldRows,schemasUnchanged:Object.keys(keys).length,proceduresUnchanged:unchangedProcedures,foreignKeysChecked:grouped.size,orphanRows:0,newIntegrityIssues:0,existingIssuesUnchanged:after.filter(x=>x.violations>0),target:{accountId:28,profileId:target.profileId,sessions:ws.length,completed:ws.filter(x=>x.status==='COMPLETED').length,cancelled:ws.filter(x=>x.status==='CANCELLED').length,performed:pe.length,sets:sets.length,metrics:metrics.length,height:Number(metrics.at(-1).height),weight:Number(metrics.at(-1).weight),volumeKg:volume},counts:Object.fromEntries(Object.entries(now).map(([k,v])=>[k,v.length]))};
  await db.rollback();fs.writeFileSync(path.join(__dirname,'sample_seed_reconciled.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }catch(e){if(db)await db.rollback();console.error(e.message);process.exitCode=1;}finally{if(db)await db.end();}
})();
