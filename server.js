const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const db = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;

// -------------------------
// Security middleware
// -------------------------

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

// -------------------------
// Rate limiting
// -------------------------

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);

// -------------------------
// Static frontend
// -------------------------

app.use(express.static(path.join(__dirname, "public")));

// -------------------------
// GET internships
// -------------------------

app.get("/api/internships", (req, res) => {
    try {
        const search = String(req.query.search || "").trim();

        let internships;

        if (search) {
            const value = `%${search}%`;

            const rows = db.prepare(`
                SELECT *
                FROM internships
                WHERE title LIKE ?
                   OR domain LIKE ?
                   OR location LIKE ?
                ORDER BY title
            `).all(value, value, value);

            internships = rows;
        } else {
            internships = db.prepare(`
                SELECT *
                FROM internships
                ORDER BY title
            `).all();
        }

        internships = internships.map((item) => ({
            ...item,
            skills: JSON.parse(item.skills)
        }));

        res.json({
            success: true,
            count: internships.length,
            internships
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Unable to load internships."
        });
    }
});

// -------------------------
// GET single internship
// -------------------------

app.get("/api/internships/:id", (req, res) => {
    try {
        const internship = db
            .prepare(`
                SELECT *
                FROM internships
                WHERE id = ?
            `)
            .get(req.params.id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                error: "Internship not found."
            });
        }

        internship.skills = JSON.parse(internship.skills);

        res.json({
            success: true,
            internship
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Unable to load internship."
        });
    }
});

// -------------------------
// Application rate limiter
// -------------------------

const applicationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many applications. Please try again later."
    }
});

// -------------------------
// POST application
// -------------------------

app.post(
    "/api/applications",
    applicationLimiter,
    (req, res) => {

        try {
            const {
                name,
                email,
                internshipId,
                message
            } = req.body;

            // -------------------------
            // Server-side validation
            // -------------------------

            if (
                typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Name must be between 2 and 100 characters."
                });
            }

            if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
) {
    return res.status(400).json({
        success: false,
        error: "Please enter a valid email address."
    });
}

            if (
                typeof internshipId !== "string" ||
                internshipId.trim().length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Internship is required."
                });
            }

            if (
                typeof message !== "string" ||
                message.trim().length < 10 ||
                message.trim().length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Message must be between 10 and 1000 characters."
                });
            }

            // -------------------------
            // Check internship
            // -------------------------

            const internship = db
                .prepare(`
                    SELECT id, title, openings
                    FROM internships
                    WHERE id = ?
                `)
                .get(internshipId.trim());

            if (!internship) {
                return res.status(400).json({
                    success: false,
                    error: "Selected internship does not exist."
                });
            }

            // -------------------------
            // Parameterized INSERT
            // -------------------------

            const result = db
                .prepare(`
                    INSERT INTO applications
                    (name, email, internship_id, message)
                    VALUES (?, ?, ?, ?)
                `)
                .run(
                    name.trim(),
                    email.trim().toLowerCase(),
                    internshipId.trim(),
                    message.trim()
                );

            res.status(201).json({
                success: true,
                message: "Application submitted successfully.",
                applicationId: result.lastInsertRowid
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                error: "Unable to submit application."
            });
        }
    }
);

// -------------------------
// Health check
// -------------------------

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API is running"
    });
});

// -------------------------
// Start server
// -------------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});