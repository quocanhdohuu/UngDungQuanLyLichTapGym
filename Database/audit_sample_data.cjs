// Read-only inventory. Does not export account passwords or login tokens.
const path = require('node:path');
const fs = require('node:fs');
const backend = path.resolve(__dirname, '../App/BE_GymPlan');
const mysql = require(path.join(backend, 'node_modules/mysql2/promise'));
require(path.join(backend, 'node_modules/dotenv')).config({path:path.join(backend,'.env'),quiet:true});
(async () => {
  let db;
  try {
    db = await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_DATABASE||'quanlylichtapgym',dateStrings:true,connectTimeout:5000});
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
    const query = async sql => (await db.query(sql))[0];
    const result = {server:await query('SELECT DATABASE() db, VERSION() version, NOW() serverNow, UTC_TIMESTAMP() utcNow, @@session.time_zone sessionTimeZone'), schema:{}, data:{}, routines:{}};
    const tables = await query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    for (const row of tables) {
      const name = Object.values(row)[0];
      result.schema[name] = (await query('SHOW CREATE TABLE '+db.escapeId(name)))[0]['Create Table'];
      if (name.toLowerCase()==='loginsessions') result.data[name]=await query('SELECT COUNT(*) rowCount FROM '+db.escapeId(name));
      else if(name.toLowerCase()==='accounts') result.data[name]=await query('SELECT accountId, username, email, role, status, createdAt FROM '+db.escapeId(name));
      else result.data[name]=await query('SELECT * FROM '+db.escapeId(name));
    }
    const routines=await query("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=DATABASE() AND ROUTINE_TYPE='PROCEDURE'");
    for(const row of routines) result.routines[row.ROUTINE_NAME]=(await query('SHOW CREATE PROCEDURE '+db.escapeId(row.ROUTINE_NAME)))[0]['Create Procedure'];
    // Each getter was inspected above. Restrict calls to the reviewed read-only set.
    const allowedGetters = new Set(['sp_GetMyProfile','sp_GetUserActivePlan','sp_GetTodayWorkout','sp_GetUserProgressSummary','sp_GetUserPersonalRecords','sp_GetUserWorkoutHistory']);
    const verification = [];
    const statements = fs.readFileSync(path.join(__dirname,'verify_sample_data.sql'),'utf8')
      .replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
    for (const sql of statements) {
      const call = /^CALL\s+(\w+)\(/i.exec(sql);
      if (call ? !allowedGetters.has(call[1]) : !/^(SELECT\s|WITH\s|SET\s+@)/i.test(sql)) {
        throw new Error('Read-only verification statement rejected');
      }
      verification.push({sql,result:await query(sql)});
    }
    await db.rollback();
    fs.writeFileSync(path.join(__dirname,'sample_data_audit.json'),JSON.stringify(result,null,2)+'\n','utf8');
    fs.writeFileSync(path.join(__dirname,'sample_data_verification.json'),JSON.stringify(verification,null,2)+'\n','utf8');
    console.log(JSON.stringify({server:result.server,counts:Object.fromEntries(Object.entries(result.data).map(([k,v])=>[k,k.toLowerCase()==='loginsessions'?v[0].rowCount:v.length])),target:result.data.accounts?.filter(a=>a.accountId===28),profile:result.data.gymusers?.filter(a=>a.accountId===28),procedures:Object.keys(result.routines)},null,2));
  } catch(e) { console.error(e.code||e.message); process.exitCode=1; }
  finally { if(db) await db.end(); }
})();
