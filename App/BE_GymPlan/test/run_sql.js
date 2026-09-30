require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

async function run() {
  const files = process.argv.includes("--alternatives") ? ["sp_exercise_alternatives.sql"]
    : ["sp_user_workout_flow.sql", "sp_exercise_alternatives.sql"];
  const definitions = new Map();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, "../sql", file), "utf8");
    for (const match of sql.matchAll(/CREATE\s+PROCEDURE\s+(\w+)[\s\S]*?END\s*\$\$/gi)) {
      definitions.set(match[1], { name: match[1], sql: match[0].replace(/\$\$$/, "").trim() });
    }
  }
  const procedures = [...definitions.values()];
  if (procedures.length !== (process.argv.includes("--alternatives") ? 2 : 13)) throw new Error("Unexpected procedure count");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "quanlylichtapgym",
  });
  const originals = new Map();
  const changed = [];
  try {
    // Capture every existing definition before changing any procedure.
    for (const procedure of procedures) {
      try {
        const [rows] = await connection.query("SHOW CREATE PROCEDURE " + procedure.name);
        originals.set(procedure.name, rows[0]["Create Procedure"]);
      } catch (error) {
        if (error.code !== "ER_SP_DOES_NOT_EXIST") throw error;
        originals.set(procedure.name, null);
      }
    }
    const migration = fs.readFileSync(path.join(__dirname, "../sql/migrate_exercise_selection.sql"), "utf8");
    for (const statement of migration.replace(/^\s*--.*$/gm, "").split(";").filter(s => s.trim())) {
      await connection.query(statement);
    }
    for (const procedure of procedures) {
      changed.push(procedure.name);
      await connection.query("DROP PROCEDURE IF EXISTS " + procedure.name);
      await connection.query(procedure.sql);
      console.log("Installed " + procedure.name);
    }
    const seed = fs.readFileSync(path.join(__dirname, "../../../Database/seed_exercise_alternatives.sql"), "utf8");
    await connection.beginTransaction();
    for (const statement of seed.replace(/^\s*--.*$/gm, "").split(";").filter(s => s.trim())) {
      await connection.query(statement);
    }
    await connection.commit();
    console.log(`Installed ${procedures.length} procedures and seeded exercise alternatives.`);
  } catch (error) {
    await connection.rollback();
    for (const name of changed.reverse()) {
      await connection.query("DROP PROCEDURE IF EXISTS " + name);
      if (originals.get(name)) await connection.query(originals.get(name));
    }
    throw error;
  } finally { await connection.end(); }
}
run().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
