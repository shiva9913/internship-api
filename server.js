const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MODES = ["Remote", "Hybrid", "Onsite"];

const ok = (res, data, status = 200, meta) =>
    res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });

const fail = (res, status, code, message, details) =>
    res.status(status).json({
        success: false,
        error: { code, message, ...(details && { details }) },
    });

const toApi = (row) => ({ ...row, applications_open: Boolean(row.applications_open) });

function validate(body, partial = false) {
    const errors = [];
    const value = {};
    const has = (k) => body[k] !== undefined;

    for (const k of ["title", "domain"]) {
        if (!partial || has(k)) {
            if (typeof body[k] !== "string" || body[k].trim() === "")
                errors.push(`${k} is required and must be a non-empty string`);
            else value[k] = body[k].trim();
        }
    }
    if (!partial || has("mode")) {
        if (!MODES.includes(body.mode)) errors.push(`mode must be one of: ${MODES.join(", ")}`);
        else value.mode = body.mode;
    }
    if (!partial || has("duration_weeks")) {
        if (!Number.isInteger(body.duration_weeks) || body.duration_weeks < 1 || body.duration_weeks > 52)
            errors.push("duration_weeks must be an integer between 1 and 52");
        else value.duration_weeks = body.duration_weeks;
    }
    if (has("applications_open")) {
        if (typeof body.applications_open !== "boolean")
            errors.push("applications_open must be true or false");
        else value.applications_open = body.applications_open ? 1 : 0;
    }
    return { errors, value };
}

function nextId() {
    const row = db
        .prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS n FROM internships")
        .get();
    return `INT-${String((row.n || 0) + 1).padStart(3, "0")}`;
}

app.get("/", (req, res) => {
    res.json({ message: "EdVyro Internship REST API is running" });
});

app.get("/api/internships", (req, res) => {
    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "10", 10);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100)
        return fail(res, 400, "VALIDATION_ERROR", "page must be >= 1 and limit must be between 1 and 100");

    const where = [];
    const params = [];
    if (req.query.domain) { where.push("domain = ?"); params.push(req.query.domain); }
    if (req.query.mode) { where.push("mode = ?"); params.push(req.query.mode); }
    if (req.query.open !== undefined) {
        where.push("applications_open = ?");
        params.push(req.query.open === "true" ? 1 : 0);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const total = db.prepare(`SELECT COUNT(*) AS c FROM internships ${clause}`).get(...params).c;
    const rows = db
        .prepare(`SELECT * FROM internships ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
        .all(...params, limit, (page - 1) * limit);

    ok(res, rows.map(toApi), 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

app.get("/api/internships/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Internship not found");
    ok(res, toApi(row));
});


app.post("/api/internships", (req, res) => {
    const { errors, value } = validate(req.body || {});
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Invalid input", errors);

    const id = nextId();
    db.prepare(
        "INSERT INTO internships (id, title, domain, mode, duration_weeks, applications_open) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, value.title, value.domain, value.mode, value.duration_weeks, value.applications_open ?? 1);

    ok(res, toApi(db.prepare("SELECT * FROM internships WHERE id = ?").get(id)), 201);
});

const update = (partial) => (req, res) => {
    const existing = db.prepare("SELECT * FROM internships WHERE id = ?").get(req.params.id);
    if (!existing) return fail(res, 404, "NOT_FOUND", "Internship not found");

    const { errors, value } = validate(req.body || {}, partial);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Invalid input", errors);

    const m = { ...existing, ...value };
    db.prepare(
        "UPDATE internships SET title=?, domain=?, mode=?, duration_weeks=?, applications_open=? WHERE id=?"
    ).run(m.title, m.domain, m.mode, m.duration_weeks, m.applications_open, req.params.id);

    ok(res, toApi(db.prepare("SELECT * FROM internships WHERE id = ?").get(req.params.id)));
};
app.put("/api/internships/:id", update(false));
app.patch("/api/internships/:id", update(true));


app.delete("/api/internships/:id", (req, res) => {
    try {
        const r = db.prepare("DELETE FROM internships WHERE id = ?").run(req.params.id);
        if (r.changes === 0) return fail(res, 404, "NOT_FOUND", "Internship not found");
        ok(res, { id: req.params.id, deleted: true });
    } catch (e) {
        if (String(e.message).includes("FOREIGN KEY"))
            return fail(res, 409, "CONFLICT", "Internship has applications and cannot be deleted");
        throw e;
    }
});


app.use((req, res) => fail(res, 404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));

app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed")
        return fail(res, 400, "INVALID_JSON", "Request body is not valid JSON");
    console.error(err);
    fail(res, 500, "SERVER_ERROR", "Something went wrong");
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
