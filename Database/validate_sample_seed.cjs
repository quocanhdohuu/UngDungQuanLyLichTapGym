// Independent manifest checks against the read-only inventory. No database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const audit = require('./sample_data_audit.json');
const seed = require('./sample_seed_manifest.json');
const parse = x=>new Date(x.replace(' ','T')+(x.length===10?'T00:00:00Z':'Z')).getTime();
const wd = x=>(new Date(parse(x)).getUTCDay()+6)%7+1;
function validate(s, database=audit.data) {
 let checks=0;
 const ok=(test,msg)=>{assert(test,msg);checks++;};
 const distinct=(rows,key,label)=>ok(new Set(rows.map(key)).size===rows.length,label);
 const index=(rows,key)=>new Map(rows.map(x=>[key(x),x]));
 ok(s.users.length===30,'30 users');
 for(const [group,n] of [['NEW',6],['REGULAR',15],['LONG',9]])ok(s.users.filter(u=>u.group===group).length===n,'cohort '+group);
 distinct(s.users,u=>u.username.toLowerCase(),'username uniqueness');distinct(s.users,u=>u.email.toLowerCase(),'email uniqueness');
 distinct(s.plans,p=>p.planKey,'plan keys');distinct(s.plans,p=>p.title,'plan titles');
 distinct(s.days,x=>x.planKey+'|'+x.dayOrder,'day order');distinct(s.days,x=>x.planKey+'|'+x.weekDay,'weekday uniqueness');
 distinct(s.configs,x=>x.planKey+'|'+x.dayOrder+'|'+x.exerciseOrder,'config order');
 distinct(s.configs,x=>x.planKey+'|'+x.dayOrder+'|'+x.exerciseName,'no duplicate configured exercise');
 distinct(s.sessions,x=>x.sessionKey,'session keys');distinct(s.sessions,x=>x.userKey+'|'+x.startTime.slice(0,10),'one generated session per day');
 distinct(s.performed,x=>x.sessionKey+'|'+x.exerciseName,'performed uniqueness');
 distinct(s.sets,x=>x.sessionKey+'|'+x.exerciseName+'|'+x.setNumber,'set uniqueness');
 distinct(s.metrics,x=>x.userKey+'|'+x.recordedAt,'metric uniqueness');
 const users=index(s.users,x=>x.username),plans=index(s.plans,x=>x.planKey),days=index(s.days,x=>x.planKey+'|'+x.dayOrder),sessions=index(s.sessions,x=>x.sessionKey);
 const target=database.gymusers.find(g=>g.accountId===28),account=database.accounts.find(a=>a.accountId===28);
 const membership=database.gymuserworkoutplans.find(m=>m.profileId===target.profileId&&m.status==='ACTIVE');
 const targetPlan=database.workoutplans.find(p=>p.planId===membership.planId);
 users.set('gym_minh',{...target,username:'gym_minh',createdAt:account.createdAt,group:'TARGET'});
 plans.set(s.target.planKey,{...targetPlan,planKey:s.target.planKey,userKey:'gym_minh'});
 const memberships=index([...s.memberships,{userKey:'gym_minh',planKey:s.target.planKey,...membership}],x=>x.userKey+'|'+x.planKey);
 const newStartDates=[];
 for(const u of s.users) {
  ok(!database.accounts.some(a=>a.username.toLowerCase()===u.username.toLowerCase()||a.email.toLowerCase()===u.email.toLowerCase()),'seed identity must be new');
  ok(u.email.endsWith('@example.test')&&u.createdAt<=s.cutoff,'account domain/time');
  ok(['BEGINNER','INTERMEDIATE','ADVANCED'].includes(u.level)&&u.sessionsPerWeek>=2&&u.sessionsPerWeek<=6,'profile');
  ok(s.memberships.filter(m=>m.userKey===u.username&&m.status==='ACTIVE').length<2,'at most one ACTIVE');
  ok(s.metrics.filter(m=>m.userKey===u.username).length>=1,'metrics present');
  const history=s.sessions.filter(x=>x.userKey===u.username);
  ok(history.length<51,'Minh has richest session history');
  if(u.group!=='NEW')ok(history.length>=6,'existing user has useful history');
  newStartDates.push(history.map(h=>h.startTime).join(','));
 }
 // Two genuinely new users have empty history, the others must not share a copied timestamp sequence.
 distinct(newStartDates.filter(Boolean),x=>x,'different histories');
 for(const p of s.plans) {
  const u=users.get(p.userKey);ok(u&&p.createdAt>=u.createdAt,'plan creator and time');ok(p.level===u.level,'plan matches level');
  const ds=s.days.filter(x=>x.planKey===p.planKey);ok(ds.length===u.sessionsPerWeek,'plan frequency');
  const m=memberships.get(p.userKey+'|'+p.planKey);ok(m&&m.joinedAt>=p.createdAt,'membership');
  if(m.status==='COMPLETED')ok(parse(m.startedAt)+p.durationWeeks*7*86400000<=parse(s.cutoff),'completed program finished');
 }
 for(const day of s.days) {
  const cs=s.configs.filter(c=>c.planKey===day.planKey&&c.dayOrder===day.dayOrder);
  ok(day.weekDay>=1&&day.weekDay<=7&&cs.length>=4&&cs.length<=7,'complete workout day');
 }
 for(const c of s.configs) {
  ok(database.exercises.filter(e=>e.name===c.exerciseName).length===1,'existing unambiguous exercise');
  ok(c.sets>=2&&c.sets<=5&&c.reps>0&&c.restTime>=0,'config values');
 }
 const history=[];
 const exerciseNames=index(database.exercises,x=>x.exerciseId);
 for(const ws of database.workoutsessions.filter(x=>x.profileId===target.profileId&&x.status==='COMPLETED')) {
  for(const pe of database.performedexercises.filter(x=>x.workoutSessionId===ws.workoutSessionId)) {
   history.push({userKey:'gym_minh',exerciseName:exerciseNames.get(pe.exerciseId).name,endTime:ws.endTime,sets:database.exercisesets.filter(x=>x.performedExerciseId===pe.performedExerciseId)});
  }
 }
 for(const session of [...s.sessions].sort((a,b)=>a.startTime.localeCompare(b.startTime))) {
  const u=users.get(session.userKey),day=days.get(session.planKey+'|'+session.dayOrder),p=plans.get(session.planKey);
  const m=memberships.get(session.userKey+'|'+session.planKey);
  ok(u&&day&&p&&m,'session references');
  ok(session.startTime>=u.createdAt&&session.startTime>=m.joinedAt&&session.startTime.slice(0,10)>=m.startedAt,'session time after registration and membership');
  ok(parse(session.startTime)<parse(m.startedAt)+p.durationWeeks*7*86400000,'session inside program duration');
  ok(session.endTime<=s.cutoff&&wd(session.startTime)===day.weekDay,'weekday/past');
  ok(session.totalDuration>=45&&session.totalDuration<=100&&(parse(session.endTime)-parse(session.startTime))/60000===session.totalDuration,'session duration');
  const peers=s.sessions.filter(x=>x.userKey===session.userKey&&x.sessionKey!==session.sessionKey);
  ok(!peers.some(x=>x.startTime<session.endTime&&session.startTime<x.endTime),'new session overlap');
  if(session.userKey==='gym_minh')ok(!database.workoutsessions.some(x=>x.profileId===target.profileId&&x.startTime<session.endTime&&session.startTime<(x.endTime||s.cutoff)),'existing session overlap');
  const pes=s.performed.filter(x=>x.sessionKey===session.sessionKey),cs=s.configs.filter(x=>x.planKey===session.planKey&&x.dayOrder===session.dayOrder);
  ok(pes.length===cs.length&&pes.length>=4&&pes.length<=7,'all configured exercises performed');
  for(const pe of pes) {
   const c=cs.find(x=>x.exerciseName===pe.originalExerciseName);
   ok(c&&pe.isActive===1&&pe.isCompleted===1&&pe.isSubstituted===0&&pe.exerciseName===pe.originalExerciseName,'performed consistency');
   const sets=s.sets.filter(x=>x.sessionKey===pe.sessionKey&&x.exerciseName===pe.exerciseName).sort((a,b)=>a.setNumber-b.setNumber);
   ok(sets.length===c.sets&&sets.every((x,i)=>x.setNumber===i+1),'set count and contiguous numbering');
   const prior=history.filter(h=>h.userKey===session.userKey&&h.exerciseName===pe.exerciseName&&h.endTime<session.startTime).sort((a,b)=>b.endTime.localeCompare(a.endTime))[0];
   for(const set of sets) {
    const expected=prior?.sets.find(x=>x.setNumber===set.setNumber)?.weight;
    ok(set.preValue===(expected==null?null:Number(expected)),'preValue matches previous completed performance');
    ok(set.weight>=0&&set.weight<=200&&set.reps>0&&set.reps<=60,'reasonable synthetic load/reps');
    if(['Plank','Pull Up','Chin Up','Push Up','Glute Bridge','Bench Dips','Hanging Leg Raise','Ab Wheel Rollout','Russian Twist'].includes(pe.exerciseName))ok(set.weight===0,'bodyweight load');
   }
   history.push({userKey:session.userKey,exerciseName:pe.exerciseName,endTime:session.endTime,sets});
  }
 }
 for(const u of users.values()) {
  const ms=s.metrics.filter(x=>x.userKey===u.username).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
  for(const [i,m] of ms.entries()) {
   ok(m.recordedAt>=u.createdAt&&m.recordedAt<=s.cutoff&&m.height>=140&&m.height<=200&&m.weight>=40&&m.weight<=120,'metric values/time');
   if(i)ok(m.height===ms[i-1].height&&Math.abs(m.weight-ms[i-1].weight)<=Math.max(.3,(parse(m.recordedAt)-parse(ms[i-1].recordedAt))/86400000*.1),'stable height and gradual weight');
   if(u.username==='gym_minh')ok(!database.bodymetrics.some(x=>x.profileId===target.profileId&&x.recordedAt===m.recordedAt),'no existing metric collision');
  }
 }
 ok(s.target.existingSessions+s.sessions.filter(x=>x.userKey==='gym_minh').length===51,'target total');
 ok(s.metrics.filter(x=>x.userKey==='gym_minh').at(-1).weight===60,'confirmed 60kg reference');
 // Long histories need improvements, plateaus and deloads across actual sessions.
 for(const u of s.users.filter(x=>x.group==='LONG')) {
  const sequences=new Map();
  for(const set of s.sets.filter(x=>x.setNumber===1&&x.weight>0&&sessions.get(x.sessionKey).userKey===u.username)){
   if(!sequences.has(set.exerciseName))sequences.set(set.exerciseName,[]);
   sequences.get(set.exerciseName).push(set.weight);
  }
  let up=false,hold=false,down=false;
  for(const values of sequences.values())for(let i=1;i<values.length;i++){up ||= values[i]>values[i-1];hold ||= values[i]===values[i-1];down ||= values[i]<values[i-1];}
  ok(up&&hold&&down,'long-term progression, plateau and deload: '+u.username);
 }
 return checks;
}
const checks=validate(seed);
// Fault injection demonstrates checks reject common data mistakes rather than echoing generation.
const mutations=[
 s=>{s.sessions[0].endTime=s.sessions[0].startTime;},
 s=>{s.days[0].weekDay=9;},
 s=>{s.sets[0].weight=-1;},
 s=>{s.sets[0].preValue=999;},
 s=>{s.users[1].email=s.users[0].email;},
 s=>{s.metrics[0].recordedAt='2027-01-01 00:00:00';}
];
for(const mutate of mutations){const broken=structuredClone(seed);mutate(broken);assert.throws(()=>validate(broken));}
// Batch replay state machine used by the SQL: all absent -> insert, all exact -> skip,
// partial or colliding -> abort. An edited password/profile is intentionally irrelevant.
function batchMode(accounts) {
 const matches=accounts.filter(a=>seed.users.some(u=>u.username===a.username||u.email===a.email));
 if(!matches.length)return 'insert';
 if(matches.length===30&&seed.users.every(u=>matches.some(a=>a.username===u.username&&a.email===u.email&&a.createdAt===u.createdAt&&a.role==='GYM_USER')))return 'skip';
 throw Error('partial/colliding batch');
}
assert.equal(batchMode(audit.data.accounts),'insert');
const after=[...audit.data.accounts,...seed.users.map(u=>({...u,role:'GYM_USER'}))];
assert.equal(batchMode(after),'skip');assert.throws(()=>batchMode(after.slice(0,-1)));
const collision=structuredClone(after);collision.at(-1).email='collision@example.test';assert.throws(()=>batchMode(collision));
const result={mode:'offline validation; no INSERT executed',checks,faultInjectionCases:mutations.length,batchReplay:'first=insert, second=skip, partial/collision=reject',limitations:'MySQL write constraints and rollback-on-write-error are not executed until approval.'};
fs.writeFileSync(path.join(__dirname,'sample_seed_validation.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
