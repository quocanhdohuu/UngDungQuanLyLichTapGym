const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "quanlylichtapgym",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDB = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    console.log("Connected to MySQL database: quanlylichtapgym");
  } finally {
    connection?.release();
  }
};

module.exports = { pool, connectDB };