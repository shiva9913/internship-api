const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/internships.db');
db.all('SELECT * FROM applications', [], (err, rows) => {
    if (err) {
        console.error("Error executing query:", err.message);
    } else {
        console.log("--- Total Submitted Applications ---");
        console.table(rows);
    }
    db.close();
});
