require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, "../sql/sp_user_workout_flow.sql"), "utf8");
  const procedures = [...sql.matchAll(/CREATE\s+PROCEDURE\s+(\w+)[\s\S]*?END\s*\$\$/gi)]
    .map(match => ({ name: match[1], sql: match[0].replace(/\$\$$/, "").trim() }));
  if (procedures.length !== 13) throw new Error("Expected exactly 13 workout procedures");
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
    for (const procedure of procedures) {
      changed.push(procedure.name);
      await connection.query("DROP PROCEDURE IF EXISTS " + procedure.name);
      await connection.query(procedure.sql);
      console.log("Installed " + procedure.name);
    }
    console.log("Installed all 13 procedures; tables and existing records unchanged.");
  } catch (error) {
    for (const name of changed.reverse()) {
      await connection.query("DROP PROCEDURE IF EXISTS " + name);
      if (originals.get(name)) await connection.query(originals.get(name));
    }
    throw error;
  } finally { await connection.end(); }
}
run().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
