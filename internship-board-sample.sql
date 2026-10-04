-- EdVyro fictional internship board starter database (SQLite compatible)
-- Safe for local learning use. Contains no real student or employer data.
CREATE TABLE internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    mode TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    applications_open INTEGER NOT NULL DEFAULT 1
);

INSERT INTO internships (id, title, domain, mode, duration_weeks, applications_open) VALUES
('INT-001', 'Frontend Practice Internship', 'Web Development', 'Remote', 4, 1),
('INT-002', 'Data Dashboard Internship', 'Data Analytics', 'Remote', 6, 1),
('INT-003', 'Product Design Internship', 'UI/UX', 'Hybrid', 4, 1),
('INT-004', 'C++ Utility Internship', 'C++ Programming', 'Remote', 5, 0);

CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (internship_id, applicant_email),
    FOREIGN KEY (internship_id) REFERENCES internships(id)
);
