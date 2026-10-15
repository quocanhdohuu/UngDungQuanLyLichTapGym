const fs = require('fs');
const path = require('path');
const bePath = path.resolve(__dirname, '../App/BE_GymPlan');
const mysql = require(path.join(bePath, 'node_modules/mysql2/promise'));
require(path.join(bePath, 'node_modules/dotenv')).config({ path: path.join(bePath, '.env'), quiet: true });

async function run() {
  const sqlContent = fs.readFileSync(path.join(__dirname, 'migration_add_workoutplan_goal.sql'), 'utf8');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'quanlylichtapgym',
    multipleStatements: true
  });

  console.log('Connected to MySQL successfully.');

  // Parse SQL statements accounting for DELIMITER $$
  const lines = sqlContent.split(/\r?\n/);
  const statements = [];
  let currentDelimiter = ';';
  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue;
    }
    if (trimmed.toUpperCase().startsWith('DELIMITER ')) {
      const newDelim = trimmed.slice(10).trim();
      currentDelimiter = newDelim;
      continue;
    }

    buffer.push(line);
    const joined = buffer.join('\n');
    if (joined.trim().endsWith(currentDelimiter)) {
      const stmt = joined.trim().slice(0, -currentDelimiter.length).trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      buffer = [];
    }
  }

  if (buffer.join('\n').trim().length > 0) {
    statements.push(buffer.join('\n').trim());
  }

  console.log(`Found ${statements.length} statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await connection.query(stmt);
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 60);
      console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (err) {
      console.error(`[${i + 1}/${statements.length}] ERROR on: ${stmt.slice(0, 100)}`);
      console.error(err.message);
      await connection.end();
      process.exit(1);
    }
  }

  console.log('Migration completed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
