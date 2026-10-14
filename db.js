const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, "internships.db"));

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS internships (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        mode TEXT NOT NULL,
        location TEXT NOT NULL,
        skills TEXT NOT NULL,
        openings INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        internship_id TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

const count = db
    .prepare("SELECT COUNT(*) AS count FROM internships")
    .get();

if (count.count === 0) {
    const filePath = path.join(dataDir, "internships.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const insert = db.prepare(`
        INSERT INTO internships
        (id, title, domain, mode, location, skills, openings)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((internships) => {
        for (const internship of internships) {
            insert.run(
                internship.id,
                internship.title,
                internship.domain,
                internship.mode,
                internship.location,
                JSON.stringify(internship.skills),
                internship.openings
            );
        }
    });

    insertMany(data.internships);
}

module.exports = db;