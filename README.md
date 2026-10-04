# Internship REST API

A Node.js + Express REST API for internship records with validation, pagination and SQLite persistence (better-sqlite3).

## Setup

```
npm install
copy .env.example .env     (Mac/Linux: cp .env.example .env)
npm start
```

The server runs on http://localhost:3000.
On first start, `internship.db` is created automatically from `internship-board-sample.sql` (4 seed records). Data is saved in the file, so it stays after a restart.

## Endpoints

| Method | URL | Description |
|---|---|---|
| GET | /api/internships?page=1&limit=10 | List with pagination. Optional filters: domain, mode, open |
| GET | /api/internships/:id | Get one internship |
| POST | /api/internships | Create (201) |
| PUT | /api/internships/:id | Full update |
| PATCH | /api/internships/:id | Partial update |
| DELETE | /api/internships/:id | Delete |

## Data model

| Field | Type | Rule |
|---|---|---|
| id | string | Auto-generated (INT-001, INT-002, ...) |
| title | string | Required, non-empty |
| domain | string | Required, non-empty |
| mode | string | Remote, Hybrid or Onsite |
| duration_weeks | integer | 1 to 52 |
| applications_open | boolean | Optional, default true |

## Response format

Success:
```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 } }
```
(`meta` only appears on the list endpoint.)

Error:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": ["..."] } }
```

## Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | VALIDATION_ERROR or INVALID_JSON |
| 404 | NOT_FOUND |
| 409 | CONFLICT (internship has applications) |
| 500 | SERVER_ERROR |

## Example requests (curl)

```
curl "http://localhost:3000/api/internships?page=1&limit=2"
curl http://localhost:3000/api/internships/INT-001
curl -X POST http://localhost:3000/api/internships -H "Content-Type: application/json" -d "{\"title\":\"Node Internship\",\"domain\":\"Backend\",\"mode\":\"Remote\",\"duration_weeks\":4}"
curl -X PATCH http://localhost:3000/api/internships/INT-005 -H "Content-Type: application/json" -d "{\"duration_weeks\":8}"
curl -X DELETE http://localhost:3000/api/internships/INT-005
```

## Tested

All endpoints were tested with Thunder Client: list with pagination, detail, 404 for missing id, create (201), validation error (400), invalid JSON (400), PATCH, PUT, DELETE, and persistence after a server restart.