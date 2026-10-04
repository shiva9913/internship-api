require("dotenv").config();
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database(path.join(__dirname, process.env.DB_FILE || "internship.db"));
db.pragma("foreign_keys = ON");


const exists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='internships'")
  .get();

if (!exists) {
  const sql = fs.readFileSync(path.join(__dirname, "internship-board-sample.sql"), "utf8");
  db.exec(sql);
  console.log("Database created from internship-board-sample.sql");
}

module.exports = db;