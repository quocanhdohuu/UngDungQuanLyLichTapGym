// Default: temporary SELECT staging + EXPLAIN INSERT, never executes INSERT.
// --apply-approved is for explicit user approval only.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const be=path.resolve(__dirname,'../App/BE_GymPlan');
const mysql=require(path.join(be,'node_modules/mysql2/promise'));
require(path.join(be,'node_modules/dotenv')).config({path:path.join(be,'.env'),quiet:true});
const args=process.argv.slice(2);
if(args.some(a=>!['--check','--apply-approved'].includes(a))||args.length>1)throw Error('Use --check OR --apply-approved');
const apply=args[0]==='--apply-approved';
for(const [file,hash] of Object.entries(require('./sample_seed_preview.json').artifacts)) {
 if(createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex')!==hash)throw Error('Review artifact changed: '+file);
}
const validated=spawnSync(process.execPath,[path.join(__dirname,'validate_sample_seed.cjs')],{encoding:'utf8'});
if(validated.status!==0){console.error(validated.stdout,validated.stderr);process.exit(1);}
// SQL splitter respects quoted JSON and string literals. Comments are full-line only.
function splitSQL(input) {
 const sql=input.replace(/^--.*$/gm,''),out=[];let begin=0,quote=null;
 for(let i=0;i<sql.length;i++){
  const c=sql[i];
  if(quote){if(c===quote){if(sql[i+1]===quote)i++;else quote=null;}}
  else if(c==="'"||c==='"'||c==='`')quote=c;
  else if(c===';'){const part=sql.slice(begin,i).trim();if(part)out.push(part);begin=i+1;}
 }
 if(quote)throw Error('Unclosed SQL literal');if(sql.slice(begin).trim())out.push(sql.slice(begin).trim());return out;
}
(async()=>{
 let db,committed=false,currentStatement='';const results=[];let explained=0,temporary=0;
 try {
  db=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_DATABASE||'quanlylichtapgym',dateStrings:true,multipleStatements:false,connectTimeout:5000});
  const statements=splitSQL(fs.readFileSync(path.join(__dirname,'seed_sample_data_v2.sql'),'utf8'));
  if(!apply)await db.query('START TRANSACTION READ ONLY');
  await db.query('SET @seed_authorized=?',[apply?1:0]);
  for(const sql of statements) {
   currentStatement=sql.slice(0,100);
   if(!/^(USE |SET |SELECT |START TRANSACTION|COMMIT|CREATE TEMPORARY TABLE sd_|INSERT INTO (sd_guard|Accounts|GymUsers|WorkoutPlans|WorkoutDays|ExerciseConfigs|GymUserWorkoutPlans|WorkoutSessions|PerformedExercises|ExerciseSets|BodyMetrics)\s)/i.test(sql))throw Error('Statement outside seed allowlist');
   if(!apply&&(/^(START TRANSACTION|COMMIT|SET TRANSACTION)/i.test(sql)||sql.includes('GET_LOCK(')||sql.includes('RELEASE_LOCK(')))continue;
   if(!apply&&/^INSERT INTO /i.test(sql)){
    // MySQL also rejects EXPLAIN INSERT on persistent tables in READ ONLY.
    // The issued statement is always EXPLAIN, never the INSERT itself.
    await db.rollback();await db.query('EXPLAIN '+sql);await db.query('START TRANSACTION READ ONLY');explained++;continue;
   }
   if(!apply&&/FOR UPDATE\s*$/i.test(sql)){await db.query('EXPLAIN '+sql);continue;}
   if(/^CREATE TEMPORARY/i.test(sql)){
    temporary++;
    if(!apply){
     // MySQL rejects temporary-table DDL inside READ ONLY. Create connection-local
     // SELECT staging outside that transaction, then restore READ ONLY for EXPLAIN.
     await db.rollback();await db.query(sql);await db.query('START TRANSACTION READ ONLY');continue;
    }
   }
   const [rows]=await db.query(sql);
   if(/^COMMIT$/i.test(sql))committed=true;
   if(/^SELECT @seed_apply/i.test(sql))results.push(...rows);
   // Validate source snapshot before the first application write in check mode.
   if(!apply&&sql.startsWith('SET @seed_apply')) {
    const baseline=require('./sample_seed_baseline.json');
    for(const b of baseline){const [r]=await db.query(b.sql);if(Number(r[0].n)!==b.n||r[0].signature!==b.signature)throw Error('Baseline changed: '+b.table);}
   }
  }
  if(!apply)await db.rollback();
  const report={mode:apply?'APPLIED':'CHECK: connection-local temporary SELECT staging and EXPLAIN INSERT; no INSERT executed',committed,explainedInserts:explained,temporaryTables:temporary,counts:apply?results:undefined};
  if(apply){
   fs.writeFileSync(path.join(__dirname,'sample_seed_applied.json'),JSON.stringify({...report,verification:'pending'},null,2)+'\n');
   await db.query('START TRANSACTION READ ONLY');
   const checks=splitSQL(fs.readFileSync(path.join(__dirname,'verify_sample_data.sql'),'utf8'));
   const allowed=new Set(['sp_GetMyProfile','sp_GetUserActivePlan','sp_GetTodayWorkout','sp_GetUserProgressSummary','sp_GetUserPersonalRecords','sp_GetUserWorkoutHistory']);
   report.verification=[];
   for(const sql of checks){const call=/^CALL\s+(\w+)\(/.exec(sql);if(call?!allowed.has(call[1]):!/^(SELECT\s|WITH\s|SET\s+@)/i.test(sql))throw Error('Unexpected verification statement');const [r]=await db.query(sql);report.verification.push({sql,result:r});}
   await db.rollback();
  }
  fs.writeFileSync(path.join(__dirname,apply?'sample_seed_applied.json':'sample_seed_sql_check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,verification:report.verification?`${report.verification.length} queries saved`:undefined},null,2));
 } catch(e) {
  if(db){try{await db.rollback();}catch{}}
  console.error(JSON.stringify({code:e.code,message:e.sqlMessage||e.message,statement:currentStatement,committed,note:committed?'Seed committed; post-commit verification needs attention.':'No commit; transaction rolled back.'}));process.exitCode=1;
 } finally {
  if(db){if(apply){try{await db.query("SELECT RELEASE_LOCK('QuanLyLichTapGym.sample_seed_v2')");}catch{}}await db.end();}
 }
})();
