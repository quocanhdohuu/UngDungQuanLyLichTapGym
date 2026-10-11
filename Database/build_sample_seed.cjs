// Builds reviewable SQL and data on disk only. Never connects to MySQL.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const audit = require('./sample_data_audit.json');
const baseline = require('./sample_seed_baseline.json');
const d = audit.data;
const OUT = __dirname;
const DAY = 86400000;
const cutoff = '2026-10-10 23:59:59';
const dt = s => new Date(s.replace(' ', 'T') + (s.length === 10 ? 'T00:00:00Z' : 'Z'));
const stamp = x => x.toISOString().slice(0,19).replace('T',' ');
const add = (s,n) => stamp(new Date(dt(s).getTime()+n*DAY));
const weekday = s => (dt(s).getUTCDay()+6)%7+1;
const date = s => s.slice(0,10);
const round = (n,step=.1) => Number((Math.round(n/step)*step).toFixed(2));
const names = ['Nguyễn Đức Anh','Trần Thùy Dương','Lê Minh Khang','Phạm Ngọc Hân','Hoàng Quốc Bảo','Đặng Yến Nhi',
 'Vũ Thành Đạt','Bùi Khánh Linh','Đỗ Quang Huy','Hồ Diệu Trang','Ngô Tiến Dũng','Dương Bảo Ngọc',
 'Lý Gia Hưng','Trịnh Thu Hà','Đinh Anh Tuấn','Mai Phương Thảo','Phan Văn Nam','Cao Thanh Trúc',
 'Tạ Hoàng Long','Lâm Mỹ Duyên','Trương Hải Đăng','Nguyễn Hoài An','Trần Quốc Việt','Lê Quỳnh Chi',
 'Phạm Trung Kiên','Hoàng Minh Châu','Võ Nhật Tân','Bùi Ngọc Mai','Đỗ Tuấn Phong','Đặng Hà My'];
const templates = ['Beginner Full Body 3 Days','Upper Lower 4 Days','Push Pull Legs 6 Days','Push Pull Legs 3 Days',
 'Upper Lower Strength 4 Days','Hypertrophy 5 Days','Strength Foundation 3 Days','Advanced Push Pull Legs'];
const goals = ['Tăng cơ','Giảm mỡ','Tăng sức mạnh','Cải thiện sức khỏe'];
const weights = {'Barbell Bench Press':25,'Barbell Squat':30,'Deadlift':35,'Lat Pulldown':25,
 'Dumbbell Shoulder Press':7.5,'Latteral Raise':4,'Incline Barbell Bench Press':20,'Incline Dumbbell Press':10,
 'Dumbbell Bench Press':10,'Chest Press Machine':20,'Cable Fly':5,'Pec Deck Fly':15,'Push Up':0,'Pull Up':0,
 'Chin Up':0,'Barbell Bent Over Row':25,'Dumbbell Row':10,'Seated Cable Row':25,'T-Bar Row':20,
 'Straight Arm Pulldown':10,'Face Pull':10,'Barbell Overhead Press':20,'Arnold Press':7.5,
 'Machine Shoulder Press':15,'Cable Lateral Raise':4,'Reverse Pec Deck':12.5,'Rear Delt Fly':4,
 'Barbell Curl':12.5,'Dumbbell Curl':5,'Hammer Curl':5,'Incline Dumbbell Curl':5,'Preacher Curl':10,
 'Cable Curl':10,'Triceps Pushdown':10,'Overhead Triceps Extension':7.5,'Skull Crusher':10,
 'Close Grip Bench Press':20,'Bench Dips':0,'Front Squat':25,'Leg Press':40,'Hack Squat':25,
 'Bulgarian Split Squat':5,'Walking Lunge':5,'Leg Extension':15,'Romanian Deadlift':25,
 'Lying Leg Curl':15,'Seated Leg Curl':15,'Hip Thrust':30,'Glute Bridge':0,'Good Morning':15,
 'Standing Calf Raise':20,'Seated Calf Raise':15,'Plank':0,'Hanging Leg Raise':0,'Cable Crunch':10,
 'Ab Wheel Rollout':0,'Russian Twist':0};
const seed = {version:'gym_demo_v2_20261011',cutoff,users:[],plans:[],days:[],configs:[],memberships:[],sessions:[],performed:[],sets:[],metrics:[]};
const byId = (table,key,id) => {const x=d[table].find(x=>x[key]===id);assert(x,`${table}:${id}`);return x;};
function sourcePlan(title) {const xs=d.workoutplans.filter(x=>x.title===title&&x.isTemplate===1);assert.equal(xs.length,1);return xs[0];}
function makePlan(u,kind,start,weeks,status) {
 const source=sourcePlan(u.template),planKey=`${u.username}_${kind}`;
 const title=`${u.fullName} | ${planKey}`;
 const weekdays={2:[1,4],3:u.no%2?[1,3,5]:[2,4,6],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6]}[u.sessionsPerWeek];
 seed.plans.push({planKey,userKey:u.username,title,description:`[${seed.version}] Tham khảo ${u.template}. Lịch cá nhân ${u.sessionsPerWeek} buổi/tuần.`,level:u.level,durationWeeks:weeks,createdAt:start,sourceTitle:u.template});
 seed.memberships.push({userKey:u.username,planKey,joinedAt:start,startedAt:date(start),status});
 const days=d.workoutdays.filter(x=>x.planId===source.planId).sort((a,b)=>a.order-b.order).slice(0,u.sessionsPerWeek);
 assert.equal(days.length,u.sessionsPerWeek);
 days.forEach((day,i)=>{
  seed.days.push({planKey,dayOrder:i+1,dayName:day.dayName,weekDay:weekdays[i]});
  d.exerciseconfigs.filter(c=>c.dayId===day.dayId).sort((a,b)=>a.order-b.order).forEach((c,j)=>{
   // A live template has a 10-set test prescription. Adapt only the new personal copy.
   seed.configs.push({planKey,dayOrder:i+1,exerciseName:byId('exercises','exerciseId',c.exerciseId).name,sets:Math.max(2,Math.min(5,c.sets)),reps:c.reps,restTime:c.restTime,exerciseOrder:j+1});
  });
 });
 return {planKey,start,weeks,status};
}
function schedule(u,p,end,maxSessions) {
 const candidates=[];
 for(let at=date(p.start)+' 18:00:00';at<=end&&at<add(p.start,p.weeks*7);at=add(at,1)) {
  const day=seed.days.find(x=>x.planKey===p.planKey&&x.weekDay===weekday(at));
  if(day)candidates.push({at,day});
 }
 // Rank deterministically across the whole period, including planned low-adherence weeks.
 const selected=candidates.map((x,i)=>({...x,i,rank:(i*37+u.no*17)%101})).sort((a,b)=>a.rank-b.rank).slice(0,maxSessions).sort((a,b)=>a.at.localeCompare(b.at));
 selected.forEach((x,i)=>{
  const minute=(u.no*7+i*3)%40;
  const hour=u.no%3===0&&date(x.at)!==date(p.start)?'06':u.no%3===2?'19':'18';
  const startTime=date(x.at)+` ${hour}:${String(minute).padStart(2,'0')}:00`;
  const prescription=seed.configs.filter(c=>c.planKey===p.planKey&&c.dayOrder===x.day.dayOrder);
  const workSeconds=prescription.reduce((sum,c)=>sum+(c.sets-1)*c.restTime+c.sets*c.reps*(c.exerciseName==='Plank'?1:3),0);
  const duration=Math.min(100,Math.max(45,Math.ceil(workSeconds/60)+10+prescription.length*2+(u.no*3+i*7)%13));
  seed.sessions.push({sessionKey:`${u.username}_${date(startTime)}`,userKey:u.username,planKey:p.planKey,dayOrder:x.day.dayOrder,startTime,endTime:stamp(new Date(dt(startTime).getTime()+duration*60000)),totalDuration:duration,status:'COMPLETED'});
 });
}
for(let no=1;no<=30;no++) {
 const group=no<=6?'NEW':no<=21?'REGULAR':'LONG';
 const level=no<=15?'BEGINNER':no<=26?'INTERMEDIATE':'ADVANCED';
 const frequency=level==='BEGINNER'?(no%4===0?2:3):level==='INTERMEDIATE'?[3,4,5,6][no%4]:(no%2?4:6);
 const goal=goals[(no-1)%4];
 const template=level==='BEGINNER'?templates[0]:level==='ADVANCED'?(frequency===4?templates[4]:templates[7]):({3:templates[6],4:templates[1],5:templates[5],6:templates[2]})[frequency];
 const age=group==='NEW'?8-no:group==='REGULAR'?22+((no-7)*2):115+(no-22)*6;
 const status=[12,18,24,30].includes(no)?'INACTIVE':[15,29].includes(no)?'LOCKED':'ACTIVE';
 const createdAt=date(add('2026-10-11 08:00:00',-age))+' 08:00:00';
 const u={no,username:`gym_demo_v2_${String(no).padStart(2,'0')}`,fullName:names[no-1],gender:no%2?'MALE':'FEMALE',level,goal,sessionsPerWeek:frequency,status,profileStatus:status==='INACTIVE'?'INACTIVE':'ACTIVE',createdAt,group,template};
 u.email=u.username+'@example.test';seed.users.push(u);
 if(group==='LONG') {
  const past=makePlan(u,'past',add(createdAt,7),frequency<=3?8:4,no%3===0?'CANCELLED':'COMPLETED');
  schedule(u,past,add(past.start,past.weeks*7-1),18+(no%5));
 }
 const start=group==='LONG'?add('2026-09-12 08:00:00',no%5):add(createdAt,1);
 const current=makePlan(u,'current',start,8,status==='ACTIVE'?'ACTIVE':'CANCELLED');
 const end=status==='ACTIVE'?cutoff:add(cutoff,-(3+no%5));
 const wanted=group==='NEW'?Math.max(0,5-no):group==='REGULAR'?10+(no%13):17+(no%7);
 schedule(u,current,end,wanted);
 const metricCount=group==='NEW'?1:group==='REGULAR'?4:6;
 const height=u.gender==='MALE'?169+no%12:156+no%13;
 const initial=u.gender==='MALE'?65+no%17:51+no%15;
 const weekly=goal==='Giảm mỡ'?-.22:goal==='Tăng cơ'?.13:goal==='Tăng sức mạnh'?.08:0;
 for(let n=0;n<metricCount;n++) {
  const at=add(createdAt,Math.floor((age-1)*n/Math.max(1,metricCount-1)));
  const w=round(initial+weekly*(dt(at)-dt(createdAt))/DAY/7+(n===0?0:[0,.1,-.1,0][n%4]));
  seed.metrics.push({userKey:u.username,height,weight:w,recordedAt:at});
 }
}
const targetAccount=byId('accounts','accountId',28),target= d.gymusers.find(x=>x.accountId===28);
assert.equal(targetAccount.username,'gym_minh');assert.equal(target.level,'BEGINNER');assert.equal(target.goal,'Sức bền');
const active=d.gymuserworkoutplans.filter(x=>x.profileId===target.profileId&&x.status==='ACTIVE');assert.equal(active.length,1);
const targetPlan=byId('workoutplans','planId',active[0].planId);
const targetPlanKey='existing_minh_active';
seed.target={accountId:28,userKey:targetAccount.username,planKey:targetPlanKey,planTitle:targetPlan.title,joinedAt:active[0].joinedAt,startedAt:active[0].startedAt,existingSessions:d.workoutsessions.filter(x=>x.profileId===target.profileId).length,weight:60};
d.workoutdays.filter(x=>x.planId===targetPlan.planId).forEach(day=>{
 seed.days.push({planKey:targetPlanKey,dayOrder:day.order,dayName:day.dayName,weekDay:day.weekDay});
 d.exerciseconfigs.filter(c=>c.dayId===day.dayId).forEach(c=>seed.configs.push({planKey:targetPlanKey,dayOrder:day.order,exerciseName:byId('exercises','exerciseId',c.exerciseId).name,sets:c.sets,reps:c.reps,restTime:c.restTime,exerciseOrder:c.order}));
});
for(const [i,at] of ['2026-10-02','2026-10-07','2026-10-09'].entries()) {
 const startTime=at+' 12:15:00',duration=[65,58,68][i],day=seed.days.find(x=>x.planKey===targetPlanKey&&x.weekDay===weekday(startTime));
 assert(day);
 assert(!d.workoutsessions.some(s=>s.profileId===target.profileId&&date(s.startTime)===at),'Minh already has a session on '+at);
 seed.sessions.push({sessionKey:'gym_minh_'+at,userKey:'gym_minh',planKey:targetPlanKey,dayOrder:day.dayOrder,startTime,endTime:stamp(new Date(dt(startTime).getTime()+duration*60000)),totalDuration:duration,status:'COMPLETED'});
}
seed.metrics.push({userKey:'gym_minh',height:175,weight:60.1,recordedAt:'2026-10-07 07:15:00'},{userKey:'gym_minh',height:175,weight:60,recordedAt:'2026-10-10 07:15:00'});
// Historical completed performances, including test sessions, for exact preValue semantics.
const histories=new Map();
for(const ws of d.workoutsessions.filter(s=>s.profileId===target.profileId&&s.status==='COMPLETED')) {
 for(const pe of d.performedexercises.filter(p=>p.workoutSessionId===ws.workoutSessionId)) {
  const name=byId('exercises','exerciseId',pe.exerciseId).name,key='gym_minh|'+name;
  if(!histories.has(key))histories.set(key,[]);
  histories.get(key).push({endTime:ws.endTime,startTime:ws.startTime,duration:ws.totalDuration,sets:d.exercisesets.filter(s=>s.performedExerciseId===pe.performedExerciseId).map(s=>({setNumber:s.setNumber,weight:Number(s.weight),reps:s.reps}))});
 }
}
seed.sessions.sort((a,b)=>a.startTime.localeCompare(b.startTime)||a.userKey.localeCompare(b.userKey));
for(const session of seed.sessions) {
 const u=seed.users.find(u=>u.username===session.userKey),configs=seed.configs.filter(c=>c.planKey===session.planKey&&c.dayOrder===session.dayOrder);
 for(const config of configs) {
  const exerciseName=config.exerciseName,key=session.userKey+'|'+exerciseName;
  assert(Object.hasOwn(weights,exerciseName),'Missing exercise load rule: '+exerciseName);
  const history=(histories.get(key)||[]).filter(h=>h.endTime<session.startTime).sort((a,b)=>b.endTime.localeCompare(a.endTime));
  const previous=history[0];
  const performance={sessionKey:session.sessionKey,exerciseName,originalExerciseName:exerciseName,isSubstituted:0,isActive:1,isCompleted:1};
  seed.performed.push(performance);
  const week=u?Math.floor(seed.sessions.filter(x=>x.userKey===u.username&&x.startTime<session.startTime).length/u.sessionsPerWeek):0;
  const block=u?seed.memberships.find(x=>x.userKey===u.username&&x.planKey===session.planKey):null;
  const blockWeek=block?Math.floor((dt(session.startTime)-dt(block.joinedAt))/DAY/7):0;
  const sets=[];
  for(let setNumber=1;setNumber<=config.sets;setNumber++) {
   const prior=previous?.sets.find(s=>s.setNumber===setNumber);
   let weight,reps;
   if(u) {
    const base=weights[exerciseName],factor={BEGINNER:1,INTERMEDIATE:1.5,ADVANCED:2}[u.level]*(.85+(u.no%5)*.06);
    // Increase by training exposure (not time off), hold each step, deload week 4 of a block.
    const progress=Math.min(4,Math.floor(week/3)),deload=blockWeek%6===3?.85:1;
    weight=base===0?0:round((base*factor+progress*(base>=20?2.5:1.25))*deload,1.25);
    reps=exerciseName==='Plank'?config.reps:Math.max(3,config.reps+(week%3===2?1:0)-(setNumber===config.sets&&week%2===1?1:0));
   } else {
    const valid=history.find(h=>h.duration>=45&&h.sets.some(s=>s.setNumber===setNumber));
    const reference=valid?.sets.find(s=>s.setNumber===setNumber)?.weight??weights[exerciseName];
    // Preserve earlier progression, add a small step on Oct 2, a light day on Oct 7, recover Oct 9.
    weight=weights[exerciseName]===0?0:round(reference*(date(session.startTime)==='2026-10-07'?.9:1)+(date(session.startTime)==='2026-10-02'?1.25:0),1.25);
    reps=config.reps;
   }
   const set={sessionKey:session.sessionKey,exerciseName,setNumber,weight,reps,preValue:prior?.weight??null};
   seed.sets.push(set);sets.push(set);
  }
  if(!histories.has(key))histories.set(key,[]);
  histories.get(key).push({startTime:session.startTime,endTime:session.endTime,duration:session.totalDuration,sets});
 }
}
fs.writeFileSync(path.join(OUT,'sample_seed_manifest.json'),JSON.stringify(seed,null,2)+'\n');
// Build self-contained SQL. All application IDs are resolved from natural keys.
const quote = s => "'"+String(s).replace(/'/g,"''")+"'";
const lines=[];
const emit = s=>lines.push(s);
const guard=(message,condition)=>emit(`INSERT INTO sd_guard (message, ok) SELECT ${quote(message)}, IF((${condition}),1,0);`);
const stage=(name,rows,types)=>{
 const json='[\n'+rows.map(row=>JSON.stringify(row)).join(',\n')+'\n]';assert(!json.includes('\\'),'Keep JSON literals independent of NO_BACKSLASH_ESCAPES');
 const columns=Object.entries(types).map(([k,t])=>`\`${k}\` ${t} PATH '$.${k}' ERROR ON ERROR`).join(',\n  ');
 emit(`-- Dữ liệu dự kiến: ${name} (${rows.length} dòng). Chỉ tồn tại trên kết nối seed.\nCREATE TEMPORARY TABLE sd_${name} ENGINE=InnoDB AS\nSELECT * FROM JSON_TABLE(${quote(json)}, '$[*]' COLUMNS (\n  ${columns}\n)) AS j;`);
};
emit(`-- Generated by build_sample_seed.cjs from inspected MySQL data. MySQL 8.0.16+.
-- CHƯA ĐƯỢC PHÊ DUYỆT THỰC THI. Chỉ chạy sau khi người dùng đồng ý INSERT.
-- Runner an toàn: node Database/run_sample_seed.cjs --apply-approved
-- Chạy trên kết nối riêng, dừng ngay khi lỗi và ROLLBACK. Không dùng mysql --force.
-- Không sửa bảng/procedure/dữ liệu cũ. Không tạo Exercises mới.
-- Mật khẩu thử nghiệm: GymDemoV2@2026! (đúng cơ chế sp_Login hiện tại).
-- Manifest cố định đến ${cutoff}, múi giờ +07:00. Chạy lại: thêm 0 dòng.
USE QuanLyLichTapGym;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET SESSION time_zone = '+07:00';
SET SESSION group_concat_max_len = 67108864;
SET @seed_authorized = COALESCE(@seed_authorized, 0);
SET @seed_lock = GET_LOCK('QuanLyLichTapGym.sample_seed_v2', 10);
CREATE TEMPORARY TABLE sd_guard (message VARCHAR(255) NOT NULL, ok INT NOT NULL CHECK (ok = 1)) ENGINE=InnoDB;`);
guard('Require explicit INSERT approval, lock, strict mode, FK and UNIQUE checks',"@seed_authorized=1 AND @seed_lock=1 AND @@foreign_key_checks=1 AND @@unique_checks=1 AND (FIND_IN_SET('STRICT_TRANS_TABLES',@@sql_mode)>0 OR FIND_IN_SET('STRICT_ALL_TABLES',@@sql_mode)>0)");
emit('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSTART TRANSACTION;');
stage('users',seed.users,{no:'INT',username:'VARCHAR(50)',email:'VARCHAR(100)',fullName:'VARCHAR(100)',gender:'VARCHAR(10)',level:'VARCHAR(20)',goal:'VARCHAR(255)',sessionsPerWeek:'INT',status:'VARCHAR(10)',profileStatus:'VARCHAR(10)',createdAt:'DATETIME'});
stage('plans',seed.plans,{planKey:'VARCHAR(80)',userKey:'VARCHAR(50)',title:'VARCHAR(150)',description:'VARCHAR(255)',level:'VARCHAR(20)',durationWeeks:'INT',createdAt:'DATETIME'});
stage('days',seed.days,{planKey:'VARCHAR(80)',dayOrder:'INT',dayName:'VARCHAR(100)',weekDay:'INT'});
stage('configs',seed.configs,{planKey:'VARCHAR(80)',dayOrder:'INT',exerciseName:'VARCHAR(150)',sets:'INT',reps:'INT',restTime:'INT',exerciseOrder:'INT'});
stage('memberships',seed.memberships,{userKey:'VARCHAR(50)',planKey:'VARCHAR(80)',joinedAt:'DATETIME',startedAt:'DATE',status:'VARCHAR(10)'});
stage('sessions',seed.sessions,{sessionKey:'VARCHAR(100)',userKey:'VARCHAR(50)',planKey:'VARCHAR(80)',dayOrder:'INT',startTime:'DATETIME',endTime:'DATETIME',totalDuration:'INT',status:'VARCHAR(20)'});
stage('performed',seed.performed,{sessionKey:'VARCHAR(100)',exerciseName:'VARCHAR(150)',originalExerciseName:'VARCHAR(150)',isSubstituted:'INT',isActive:'INT',isCompleted:'INT'});
stage('sets',seed.sets,{sessionKey:'VARCHAR(100)',exerciseName:'VARCHAR(150)',setNumber:'INT',weight:'DECIMAL(6,2)',reps:'INT',preValue:'DECIMAL(6,2)'});
stage('metrics',seed.metrics,{userKey:'VARCHAR(50)',height:'DECIMAL(5,2)',weight:'DECIMAL(5,2)',recordedAt:'DATETIME'});
emit(`SET @existing_batch = (SELECT COUNT(*) FROM Accounts a JOIN sd_users s ON a.username=s.username OR a.email=s.email);
SET @seed_apply = IF(@seed_authorized=1 AND @seed_lock=1 AND @existing_batch=0,1,0);
SELECT g.profileId FROM GymUsers g JOIN Accounts a ON a.accountId=g.accountId WHERE a.accountId=28 OR LEFT(a.username,12)='gym_demo_v2_' FOR UPDATE;`);
guard('Batch must be entirely absent or all 30 exact seed account identities present',`@existing_batch=0 OR (@existing_batch=30 AND (SELECT COUNT(*) FROM sd_users s JOIN Accounts a ON a.username=s.username AND a.email=s.email AND a.createdAt=s.createdAt AND a.role='GYM_USER')=30)`);
guard('Target identity and ACTIVE membership must still match reviewed data',`@seed_apply=0 OR (SELECT COUNT(*) FROM Accounts a JOIN GymUsers g ON g.accountId=a.accountId JOIN GymUserWorkoutPlans uw ON uw.profileId=g.profileId JOIN WorkoutPlans p ON p.planId=uw.planId WHERE a.accountId=28 AND a.username='gym_minh' AND a.email='minh@example.test' AND a.status='ACTIVE' AND g.level='BEGINNER' AND g.goal='Sức bền' AND g.sessionsPerWeek=3 AND uw.status='ACTIVE' AND p.title=${quote(targetPlan.title)} AND uw.joinedAt=${quote(active[0].joinedAt)})=1`);
guard('Manifest is entirely in the past',`(SELECT MAX(endTime) FROM sd_sessions)<=NOW() AND (SELECT MAX(recordedAt) FROM sd_metrics)<=NOW() AND (SELECT MAX(createdAt) FROM sd_users)<=NOW()`);
for(const b of baseline)guard(`Baseline changed: ${b.table}. Refresh audit before applying`, `@seed_apply=0 OR (SELECT n=${b.n} AND signature=${quote(b.signature)} FROM (${b.sql}) fingerprint)`);
emit(`SET @before_accounts=(SELECT COUNT(*) FROM Accounts);
SET @before_users=(SELECT COUNT(*) FROM GymUsers);
-- 1. Accounts and profiles. No old rows are updated.
INSERT INTO Accounts (username,email,password,role,status,createdAt)
SELECT username,email,'GymDemoV2@2026!','GYM_USER',status,createdAt FROM sd_users WHERE @seed_apply=1 ORDER BY no;
SET @added_accounts=ROW_COUNT();
INSERT INTO GymUsers (accountId,fullName,gender,level,goal,sessionsPerWeek,status)
SELECT a.accountId,s.fullName,s.gender,s.level,s.goal,s.sessionsPerWeek,s.profileStatus FROM sd_users s JOIN Accounts a ON a.username=s.username AND a.email=s.email WHERE @seed_apply=1 ORDER BY s.no;
SET @added_profiles=ROW_COUNT();
CREATE TEMPORARY TABLE sd_user_ids ENGINE=InnoDB AS
SELECT a.username AS userKey,a.accountId,g.profileId FROM Accounts a JOIN GymUsers g ON g.accountId=a.accountId WHERE a.accountId=28 OR a.username IN (SELECT username FROM sd_users);
-- 2. Necessary personal schedules: templates lack weekDay. All exercises already exist.
INSERT INTO WorkoutPlans (title,description,creatorId,isTemplate,level,durationWeeks,createdAt)
SELECT s.title,s.description,u.accountId,0,s.level,s.durationWeeks,s.createdAt FROM sd_plans s JOIN sd_user_ids u ON u.userKey=s.userKey WHERE @seed_apply=1 ORDER BY s.planKey;
SET @added_plans=ROW_COUNT();
CREATE TEMPORARY TABLE sd_plan_ids ENGINE=InnoDB AS
SELECT s.planKey,p.planId FROM sd_plans s JOIN sd_user_ids u ON u.userKey=s.userKey JOIN WorkoutPlans p ON p.title=s.title AND p.creatorId=u.accountId AND p.description=s.description
UNION ALL SELECT ${quote(targetPlanKey)},p.planId FROM WorkoutPlans p JOIN GymUserWorkoutPlans uw ON uw.planId=p.planId JOIN GymUsers g ON g.profileId=uw.profileId WHERE g.accountId=28 AND p.title=${quote(targetPlan.title)} AND uw.status='ACTIVE';
INSERT INTO WorkoutDays (planId,dayName,\`order\`,weekDay)
SELECT p.planId,s.dayName,s.dayOrder,s.weekDay FROM sd_days s JOIN sd_plan_ids p ON p.planKey=s.planKey WHERE @seed_apply=1 AND s.planKey<>${quote(targetPlanKey)} ORDER BY s.planKey,s.dayOrder;
SET @added_days=ROW_COUNT();
CREATE TEMPORARY TABLE sd_day_ids ENGINE=InnoDB AS
SELECT p.planKey,d.\`order\` AS dayOrder,d.dayId FROM sd_plan_ids p JOIN WorkoutDays d ON d.planId=p.planId;
INSERT INTO ExerciseConfigs (exerciseId,dayId,sets,reps,restTime,\`order\`)
SELECT e.exerciseId,d.dayId,s.sets,s.reps,s.restTime,s.exerciseOrder FROM sd_configs s JOIN sd_day_ids d ON d.planKey=s.planKey AND d.dayOrder=s.dayOrder JOIN Exercises e ON e.name=s.exerciseName WHERE @seed_apply=1 AND s.planKey<>${quote(targetPlanKey)} ORDER BY s.planKey,s.dayOrder,s.exerciseOrder;
SET @added_configs=ROW_COUNT();
INSERT INTO GymUserWorkoutPlans (profileId,planId,joinedAt,startedAt,status)
SELECT u.profileId,p.planId,s.joinedAt,s.startedAt,s.status FROM sd_memberships s JOIN sd_user_ids u ON u.userKey=s.userKey JOIN sd_plan_ids p ON p.planKey=s.planKey WHERE @seed_apply=1;
SET @added_memberships=ROW_COUNT();
-- 3. Sessions, performed exercises and sets. Fixed calendar is stable on rerun.
INSERT INTO WorkoutSessions (profileId,dayId,startTime,endTime,totalDuration,status)
SELECT u.profileId,d.dayId,s.startTime,s.endTime,s.totalDuration,s.status FROM sd_sessions s JOIN sd_user_ids u ON u.userKey=s.userKey JOIN sd_day_ids d ON d.planKey=s.planKey AND d.dayOrder=s.dayOrder WHERE @seed_apply=1 ORDER BY s.startTime,s.userKey;
SET @added_sessions=ROW_COUNT();
CREATE TEMPORARY TABLE sd_session_ids ENGINE=InnoDB AS
SELECT s.sessionKey,ws.workoutSessionId FROM sd_sessions s JOIN sd_user_ids u ON u.userKey=s.userKey JOIN sd_day_ids d ON d.planKey=s.planKey AND d.dayOrder=s.dayOrder JOIN WorkoutSessions ws ON ws.profileId=u.profileId AND ws.dayId=d.dayId AND ws.startTime=s.startTime;
INSERT INTO PerformedExercises (workoutSessionId,exerciseId,originalExerciseId,isSubstituted,isActive,isCompleted)
SELECT ws.workoutSessionId,e.exerciseId,o.exerciseId,s.isSubstituted,s.isActive,s.isCompleted FROM sd_performed s JOIN sd_session_ids ws ON ws.sessionKey=s.sessionKey JOIN Exercises e ON e.name=s.exerciseName JOIN Exercises o ON o.name=s.originalExerciseName WHERE @seed_apply=1;
SET @added_performed=ROW_COUNT();
CREATE TEMPORARY TABLE sd_performed_ids ENGINE=InnoDB AS
SELECT s.sessionKey,s.exerciseName,pe.performedExerciseId FROM sd_performed s JOIN sd_session_ids ws ON ws.sessionKey=s.sessionKey JOIN Exercises e ON e.name=s.exerciseName JOIN PerformedExercises pe ON pe.workoutSessionId=ws.workoutSessionId AND pe.exerciseId=e.exerciseId;
INSERT INTO ExerciseSets (performedExerciseId,setNumber,weight,reps,preValue)
SELECT p.performedExerciseId,s.setNumber,s.weight,s.reps,s.preValue FROM sd_sets s JOIN sd_performed_ids p ON p.sessionKey=s.sessionKey AND p.exerciseName=s.exerciseName WHERE @seed_apply=1;
SET @added_sets=ROW_COUNT();
-- 4. Body metrics. Minh's confirmed reference is 60 kg, old measurements stay intact.
INSERT INTO BodyMetrics (profileId,height,weight,recordedAt)
SELECT u.profileId,s.height,s.weight,s.recordedAt FROM sd_metrics s JOIN sd_user_ids u ON u.userKey=s.userKey WHERE @seed_apply=1;
SET @added_metrics=ROW_COUNT();`);
const counts={accounts:30,profiles:30,plans:seed.plans.length,days:seed.days.filter(x=>x.planKey!==targetPlanKey).length,configs:seed.configs.filter(x=>x.planKey!==targetPlanKey).length,memberships:seed.memberships.length,sessions:seed.sessions.length,performed:seed.performed.length,sets:seed.sets.length,metrics:seed.metrics.length};
for(const [key,n] of Object.entries(counts))guard(`Exact inserted row count: ${key}`,`@added_${key}=@seed_apply*${n}`);
// These also detect incomplete batches on rerun rather than silently creating more records.
guard('All user and plan mappings must be unambiguous',`(SELECT COUNT(*) FROM sd_user_ids)=31 AND (SELECT COUNT(*) FROM sd_plan_ids)=${seed.plans.length+1} AND (SELECT COUNT(*) FROM sd_day_ids)=${seed.days.length}`);
guard('All seeded sessions and performed exercises still exist exactly once',`(SELECT COUNT(*) FROM sd_session_ids)=${seed.sessions.length} AND (SELECT COUNT(*) FROM sd_performed_ids)=${seed.performed.length}`);
guard('All seeded set numbers still exist exactly once',`(SELECT COUNT(*) FROM sd_sets s JOIN sd_performed_ids p ON p.sessionKey=s.sessionKey AND p.exerciseName=s.exerciseName JOIN ExerciseSets es ON es.performedExerciseId=p.performedExerciseId AND es.setNumber=s.setNumber)=${seed.sets.length}`);
guard('All seeded metric timestamps still exist exactly once',`(SELECT COUNT(*) FROM sd_metrics s JOIN sd_user_ids u ON u.userKey=s.userKey JOIN BodyMetrics bm ON bm.profileId=u.profileId AND bm.recordedAt=s.recordedAt)=${seed.metrics.length}`);
guard('At most one active plan for each affected user',`NOT EXISTS (SELECT uw.profileId FROM GymUserWorkoutPlans uw JOIN sd_user_ids u ON u.profileId=uw.profileId WHERE uw.status='ACTIVE' GROUP BY uw.profileId HAVING COUNT(*)>1)`);
guard('Minh total is 51 on first application',`@seed_apply=0 OR (SELECT COUNT(*) FROM WorkoutSessions ws JOIN GymUsers g ON g.profileId=ws.profileId WHERE g.accountId=28)=51`);
guard('Seed session calendar and membership valid',`@seed_apply=0 OR NOT EXISTS (SELECT 1 FROM sd_session_ids m JOIN WorkoutSessions ws ON ws.workoutSessionId=m.workoutSessionId JOIN WorkoutDays wd ON wd.dayId=ws.dayId JOIN GymUsers g ON g.profileId=ws.profileId JOIN Accounts a ON a.accountId=g.accountId LEFT JOIN GymUserWorkoutPlans uw ON uw.profileId=g.profileId AND uw.planId=wd.planId WHERE uw.profileId IS NULL OR ws.startTime<a.createdAt OR ws.startTime<uw.joinedAt OR DATE(ws.startTime)<uw.startedAt OR WEEKDAY(ws.startTime)+1<>wd.weekDay OR ws.endTime>NOW() OR ws.totalDuration<>TIMESTAMPDIFF(MINUTE,ws.startTime,ws.endTime))`);
guard('New sessions do not overlap any session',`@seed_apply=0 OR NOT EXISTS (SELECT 1 FROM sd_session_ids m JOIN WorkoutSessions a ON a.workoutSessionId=m.workoutSessionId JOIN WorkoutSessions b ON a.profileId=b.profileId AND a.workoutSessionId<>b.workoutSessionId AND a.startTime<COALESCE(b.endTime,NOW()) AND b.startTime<a.endTime)`);
guard('Seed performed exercises match the actual day configuration',`@seed_apply=0 OR NOT EXISTS (SELECT 1 FROM sd_performed_ids m JOIN PerformedExercises pe ON pe.performedExerciseId=m.performedExerciseId JOIN WorkoutSessions ws ON ws.workoutSessionId=pe.workoutSessionId WHERE pe.isActive<>1 OR pe.isCompleted<>1 OR pe.isSubstituted<>0 OR pe.originalExerciseId<>pe.exerciseId OR NOT EXISTS (SELECT 1 FROM ExerciseConfigs c WHERE c.dayId=ws.dayId AND c.exerciseId=pe.exerciseId))`);
guard('New metric values and timestamps valid',`@seed_apply=0 OR NOT EXISTS (SELECT 1 FROM sd_metrics m JOIN sd_user_ids u ON u.userKey=m.userKey JOIN Accounts a ON a.accountId=u.accountId WHERE m.recordedAt<a.createdAt OR m.recordedAt>NOW() OR m.height<=0 OR m.weight<=0)`);
emit(`-- Counts are selected before COMMIT so the runner can report exact mutations.
SELECT @seed_apply AS applied, @before_accounts AS accountsBefore, (SELECT COUNT(*) FROM Accounts) AS accountsAfter, @before_users AS profilesBefore, (SELECT COUNT(*) FROM GymUsers) AS profilesAfter, ${Object.keys(counts).map(k=>`@added_${k} AS added_${k}`).join(', ')};
COMMIT;
SELECT RELEASE_LOCK('QuanLyLichTapGym.sample_seed_v2') AS released;
-- Temporary tables are released when this dedicated connection closes.`);
fs.writeFileSync(path.join(OUT,'seed_sample_data_v2.sql'),lines.join('\n\n')+'\n');
const summary={cutoff,expectedAdded:counts,target:{before:seed.target.existingSessions,after:seed.target.existingSessions+3,newSessions:3,newPerformed:15,newSets:43,bodyMetricsBefore:11,bodyMetricsAfter:13,latestWeight:60},users:seed.users.map(u=>({...u,sessions:seed.sessions.filter(s=>s.userKey===u.username).length,metrics:seed.metrics.filter(s=>s.userKey===u.username).length})),expectedTotal:Object.fromEntries(Object.entries(counts).map(([k,n])=>[k,n+({accounts:23,profiles:22,plans:18,days:73,configs:364,memberships:11,sessions:224,performed:959,sets:3108,metrics:81}[k])]))};
summary.artifacts=Object.fromEntries(['seed_sample_data_v2.sql','sample_seed_manifest.json','sample_seed_baseline.json'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(OUT,file))).digest('hex')]));
fs.writeFileSync(path.join(OUT,'sample_seed_preview.json'),JSON.stringify(summary,null,2)+'\n');
const vi=n=>n.toLocaleString('vi-VN');
const tableNames={accounts:'Accounts',profiles:'GymUsers',plans:'WorkoutPlans',days:'WorkoutDays',configs:'ExerciseConfigs',memberships:'GymUserWorkoutPlans',sessions:'WorkoutSessions',performed:'PerformedExercises',sets:'ExerciseSets',metrics:'BodyMetrics'};
const volumeAdded=seed.sets.filter(x=>x.sessionKey.startsWith('gym_minh_')).reduce((sum,x)=>sum+x.weight*x.reps,0);
const ready=`# Bộ dữ liệu mẫu v2 — chờ phê duyệt INSERT

Đã áp dụng câu trả lời: **50–80 là tổng số buổi**, cân nặng đúng của Minh là **60 kg**. Script hoàn chỉnh: [seed_sample_data_v2.sql](seed_sample_data_v2.sql). Chưa thực thi INSERT vào MySQL.

## Phạm vi và số lượng cụ thể

| Bảng | Dự kiến thêm | Tổng sau khi thêm |
|---|---:|---:|
${Object.entries(counts).map(([k,n])=>`| ${tableNames[k]} | ${vi(n)} | ${vi(summary.expectedTotal[k])} |`).join('\n')}

Số lượng dựa trên baseline 11/10/2026. Có **30 GYM_USER mới**, nâng tổng GYM_USER từ 22 lên 52; giữ 1 ADMIN. Không thêm Exercises, Alternatives, Media, thiết bị hoặc nhóm cơ.

39 chương trình là các bản sao cá nhân cần thiết: 30 lịch hiện tại và 9 lịch trước đây. Các template tiêu chuẩn hiện thiếu weekDay, trong khi schema không có lịch tuần riêng theo từng người; vì vậy cần sao chép cấu hình để gán thứ mà vẫn giữ nguyên mẫu dùng chung. Riêng template Upper Lower 4 Days có cấu hình Bench Press 10 hiệp do dữ liệu hiện có; chỉ bản sao mới được giới hạn còn 5 hiệp. Không sửa template gốc.

24 tài khoản ACTIVE, 4 INACTIVE, 2 LOCKED; 15 BEGINNER, 11 INTERMEDIATE, 4 ADVANCED. Quan hệ chương trình mới gồm 24 ACTIVE, 6 COMPLETED, 9 CANCELLED. Toàn bộ buổi mới là COMPLETED; 8 buổi CANCELLED của Minh được giữ nguyên. Mỗi người mới có lịch sử riêng, ngày nghỉ, tuần ít buổi; người dùng lâu có tăng tải, giữ tải và giảm tải. Thời lượng tính từ số hiệp, thời gian nghỉ, vận động và khởi động, trong khoảng 45–100 phút.

## Riêng Minh

- Truy vấn profile qua accountId 28, không hardcode profileId/dayId/planId.
- Giữ nguyên 1 plan ACTIVE và 1 plan COMPLETED đang có.
- Thêm 3 buổi: 02/10 (65 phút), 07/10 (58 phút), 09/10 (68 phút), đều bắt đầu 12:15, khớp lịch Thứ Tư/Sáu. Tổng **51 buổi: 43 COMPLETED, 8 CANCELLED**.
- Thêm 15 bài đã thực hiện, 43 hiệp; tổng tương ứng 214 bài và 592 hiệp. Mức tạ dựa trên các buổi đầy đủ trước đó, có buổi giảm tải ngày 07/10.
- preValue lấy mức tạ của cùng số hiệp ở buổi COMPLETED gần nhất trước thời điểm buổi mới, gồm cả các buổi test đã có. Không viết lại preValue của bản ghi cũ khi bổ sung lịch sử lùi ngày.
- Volume dự kiến tăng ${vi(volumeAdded)} kg, từ 127.195 lên ${vi(127195+volumeAdded)} kg; phải đối chiếu getter thật sau thực thi.
- Thêm đo thể trạng ngày 07/10 lúc 07:15: 175 cm / 60,1 kg; ngày 10/10 lúc 07:15: 175 cm / **60 kg**. Tổng **13 bản ghi**. Mục tiêu vẫn là Sức bền.
- Giữ nguyên các bản ghi 64–66 kg cũ theo yêu cầu không sửa dữ liệu. Biểu đồ vẫn có bước nhảy 66 → 60 kg đã tồn tại; seed chỉ nối tiếp mốc 60 kg đã được xác nhận.

## Danh sách 30 người mới

Email = username + @example.test. Mật khẩu thử nghiệm chung: **GymDemoV2@2026!**, phù hợp sp_Login hiện tại. Mật khẩu của Minh không thay đổi.

| Username | Họ tên | Level | Mục tiêu | Buổi/tuần | Trạng thái | Ngày tạo | Buổi đã tập | Số đo |
|---|---|---|---|---:|---|---|---:|---:|
${summary.users.map(u=>`| ${u.username} | ${u.fullName} | ${u.level} | ${u.goal} | ${u.sessionsPerWeek} | ${u.status} | ${u.createdAt.slice(0,10)} | ${u.sessions} | ${u.metrics} |`).join('\n')}

Nhóm 01–06: mới đăng ký (0–3 buổi), 07–21: thường xuyên (6–18 buổi), 22–30: lịch sử dài (26–40 buổi). Có nam/nữ xen kẽ, đăng ký từ tháng 5 đến tháng 10/2026. Mọi dữ liệu được cố định đến ${cutoff} theo UTC+7 để chạy lại không phát sinh ngày mới.

## Kiểm tra và giới hạn

- [validate_sample_seed.cjs](validate_sample_seed.cjs): kiểm tra độc lập khóa tự nhiên, quan hệ, lịch tuần, khoảng tham gia, thời gian, số bài/hiệp, số đo, preValue theo lịch sử và progression. Có ca cố tình làm sai để xác nhận bộ kiểm tra phát hiện lỗi.
- [run_sample_seed.cjs](run_sample_seed.cjs) mặc định hoặc --check: tạo bảng tạm bằng SELECT và chạy **EXPLAIN INSERT**, không thực thi INSERT. MySQL không cho CREATE TEMPORARY TABLE hoặc EXPLAIN INSERT lên bảng thường trong READ ONLY, nên các câu đó chạy ngoài transaction READ ONLY; chỉ tạo bảng tạm của kết nối, không thay đổi schema hay dữ liệu ứng dụng.
- Kết quả: [sample_seed_validation.json](sample_seed_validation.json), [sample_seed_sql_check.json](sample_seed_sql_check.json). EXPLAIN xác minh MySQL phân tích được câu lệnh, không thay thế thử INSERT thật.
- Mô phỏng chạy lại: lần đầu chọn thêm, lần hai chọn bỏ qua toàn bộ; tình trạng dở dang/trùng danh tính bị từ chối. Chưa chạy INSERT lần nào trên MySQL nên chưa tuyên bố đã thử rollback/lặp lại bằng ghi thật.
- Kiểm kê và 6 getter đã được chạy trước seed. [verify_sample_data.sql](verify_sample_data.sql) dùng để đối chiếu sau seed; runner tự thực hiện ngay sau COMMIT, lưu kết quả và số dòng thêm vào sample_seed_applied.json.
- Các lỗi dữ liệu/procedure cũ trong [SAMPLE_DATA_REVIEW.md](SAMPLE_DATA_REVIEW.md) không bị sửa. Getter không lọc isActive, ngày PR có giới hạn như báo cáo; Backend hiện có bổ sung achievedAt khi trả PR.

## Transaction, chống trùng và thực thi sau phê duyệt

- Script dùng transaction SERIALIZABLE, khóa tên cho cả batch, khóa profile và các kiểm tra CHECK trên bảng tạm. Lỗi bất kỳ trước COMMIT khiến runner ROLLBACK và đóng kết nối.
- Kiểm tra SHA-256 nội dung 12 bảng nguồn khi chạy lần đầu. Nếu baseline đổi, dừng để kiểm kê lại; không tiếp tục dùng dữ liệu nguồn cũ. Không xuất mật khẩu thật để tính baseline Accounts.
- Dùng namespace và ngày tạo cố định, kiểm tra tất cả 30 danh tính cùng tồn tại hoặc cùng chưa có; chạy lại đủ batch sẽ thêm 0 dòng. Nếu người dùng xoá/sửa khóa nhận diện, lịch hoặc bản ghi seed, script có thể dừng để kiểm tra thay vì tự dựng lại lịch sử. Thay đổi số đo/mức tạ không bị ghi đè.
- ID tự tăng đều được lấy qua SELECT/JOIN sau INSERT, không gán cứng. Các quan hệ thiếu hoặc mapping nhiều dòng làm CHECK thất bại; không INSERT IGNORE.
- Không DROP, TRUNCATE, DELETE, ALTER hoặc sửa Stored Procedure. SQL và manifest được đối chiếu SHA-256 trước khi runner chạy.
- Kiểm tra không ghi: \`node Database/run_sample_seed.cjs --check\`.
- **Chỉ sau khi người dùng xác nhận INSERT:** \`node Database/run_sample_seed.cjs --apply-approved\`. Runner bật cờ phê duyệt trên một kết nối mới, dừng/rollback khi lỗi, báo số dòng chính xác, rồi gọi các SELECT/getter đối chiếu.
- Nếu chạy SQL trực tiếp: dùng kết nối riêng, đặt @seed_authorized=1 chỉ sau phê duyệt và dừng/ROLLBACK ngay khi có lỗi. Không dùng chế độ tiếp tục sau lỗi. Khuyến nghị dùng runner.

SHA-256 script được duyệt: \`${summary.artifacts['seed_sample_data_v2.sql']}\`.
`;
fs.writeFileSync(path.join(OUT,'SAMPLE_DATA_V2_READY.md'),ready,'utf8');
console.log(JSON.stringify({expectedAdded:counts,target:summary.target,userSessions:summary.users.map(u=>[u.username,u.sessions])},null,2));
