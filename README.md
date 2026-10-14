# Notes App: Backend

REST API for a secure note-taking application with JWT authentication and role-based access control (`user` / `admin`).
Built with Node.js, Express, MongoDB and Mongoose, in plain JavaScript (ES modules).

## Features

- Register, login, logout and current-user endpoints
- Real logout: each user has a `tokenVersion`, and logging out increments it so every previously issued JWT stops working
- Role-based access control, enforced on the server
- Notes CRUD where every query is scoped to the authenticated owner
- Admin user management: list, view, create, update, delete
- Admin view of all notes, with an owner filter
- Admin interest grouping, implemented as one MongoDB aggregation
- Public posts, including posts by a specific user, implemented as one `$lookup` aggregation
- Pagination on every list endpoint
- Input validation (Zod), Helmet, CORS from environment, rate limiting on register/login, centralized error handling
- Mongo operator stripping on all user input (`$` and `.` keys)

## Tech Stack

Node.js, Express 4, MongoDB, Mongoose 8, jsonwebtoken, bcryptjs, Zod, Helmet, cors, express-rate-limit, dotenv.

## Architecture

The code follows a routes → controllers → services pattern.

```
src/
  config/        environment loading and validation
  models/        Mongoose schemas and explicit schema.index() definitions
  validators/    Zod request schemas
  routes/        URL map and middleware chain only
  controllers/   HTTP in/out only; call one service function each
  services/      business rules and all database access
  middleware/    authenticate, authorizeRoles, notFound, errorHandler
  utils/         AppError, async wrapper, pagination helpers, validate, sanitize
  app.js         Express app setup
  server.js      DB connection and server start
scripts/
  seed-admin.js  creates the first administrator
```

## Prerequisites

- Node.js 18 or newer
- MongoDB **5.0 or newer** (the `$lookup` with a sub-pipeline requires 5.0+). Use a local install or MongoDB Atlas.

## Setup

```bash
cd backend
npm install
cp .env.example .env     # then edit the values
```

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development`, `production` or `test` |
| `MONGO_URI` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/notes_app` or an Atlas URI |
| `JWT_SECRET` | Long random secret used to sign tokens (use 64+ random characters) |
| `JWT_EXPIRES_IN` | Access token lifetime (default `15m`) |
| `CORS_ORIGINS` | Comma-separated allowed origins, e.g. `http://localhost:5173` |
| `ADMIN_NAME` | Used only by the admin seed script |
| `ADMIN_EMAIL` | Used only by the admin seed script |
| `ADMIN_PASSWORD` | Used only by the admin seed script (minimum 8 characters) |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### MongoDB options

- **Local:** install MongoDB Community, start `mongod`, and use `mongodb://127.0.0.1:27017/notes_app`.
- **Atlas:** create a cluster, add your IP to the access list, create a database user, and paste the `mongodb+srv://...` connection string into `MONGO_URI`.

## Running

```bash
npm run dev      # watch mode
npm start        # normal start
```

On start the server connects to MongoDB and runs `mongoose.syncIndexes()` so the declared indexes exist.
The API is served under `http://localhost:4000/api`.

### Create the first administrator

There is no public way to become an admin. Registration always creates a `user`.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (and optionally `ADMIN_NAME`), then run:

```bash
npm run seed:admin
```

The password is hashed with the same bcrypt routine as normal users. The script is safe to re-run: if the email already exists, nothing is changed.

## API Overview

All responses use this shape:

```json
{ "success": true, "data": {}, "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }
```

Errors:

```json
{ "success": false, "error": { "message": "Validation failed", "details": [{ "path": "email", "message": "Invalid email" }] } }
```

Protected endpoints need `Authorization: Bearer <token>`.

### Auth

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public, rate-limited | body: `name`, `email`, `password`, optional `interests` |
| POST | `/api/auth/login` | public, rate-limited | body: `email`, `password` |
| POST | `/api/auth/logout` | authenticated | revokes all tokens issued so far |
| GET | `/api/auth/me` | authenticated | current user |

### Profile

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/users/me` | authenticated | |
| PUT | `/api/users/me` | authenticated | only `name` and `interests` are writable |

### Notes (own notes only)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/notes` | body: `title`, optional `content` |
| GET | `/api/notes?page=&limit=` | paginated |
| GET | `/api/notes/:id` | 404 if missing or not yours |
| PUT | `/api/notes/:id` | `title` and/or `content` |
| DELETE | `/api/notes/:id` | |

### Posts

| Method | Path | Access |
|---|---|---|
| GET | `/api/posts?page=&limit=` | public |
| GET | `/api/posts/:id` | public |
| GET | `/api/users/:userId/posts?page=&limit=` | public; single `Post.aggregate()` with `$lookup` |
| POST | `/api/posts` | authenticated |
| PUT | `/api/posts/:id` | author or admin |
| DELETE | `/api/posts/:id` | author or admin |

### Admin (admin role only)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/users?page=&limit=` | |
| GET | `/api/admin/users/interests?page=&limit=` | single `User.aggregate()`; registered before `/users/:id` |
| GET | `/api/admin/users/:id` | |
| POST | `/api/admin/users` | body: `name`, `email`, `password`, `role`, optional `interests` |
| PUT | `/api/admin/users/:id` | any of `name`, `email`, `password`, `role`, `interests` |
| DELETE | `/api/admin/users/:id` | also deletes that user's notes and posts |
| GET | `/api/admin/notes?page=&limit=&owner=` | `owner` is an optional user id filter |
| GET | `/api/admin/notes/:id` | |

Status codes used: 400, 401, 403, 404, 409, 422, 429, 500.

### Example requests

```bash
# register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sam","email":"sam@example.com","password":"password123","interests":["chess","reading"]}'

# login (copy data.token from the response)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sam@example.com","password":"password123"}'

# create a note
curl -X POST http://localhost:4000/api/notes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"First note","content":"Hello"}'

# list notes, page 2, 5 per page
curl "http://localhost:4000/api/notes?page=2&limit=5" -H "Authorization: Bearer $TOKEN"

# admin: users grouped by interest
curl "http://localhost:4000/api/admin/users/interests?page=1&limit=10" -H "Authorization: Bearer $ADMIN_TOKEN"

# posts by a user
curl "http://localhost:4000/api/users/<userId>/posts?page=1&limit=10"
```

Example interests response:

```json
{
  "success": true,
  "data": [
    { "interest": "chess", "userCount": 2, "users": [{ "_id": "...", "name": "Sam", "email": "sam@example.com" }] }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

## Pagination

Every list endpoint accepts `page` (default 1) and `limit` (default 10, maximum 100). Values outside the range return 422.
Lists use offset pagination (`skip`/`limit`) with a deterministic `createdAt desc, _id desc` sort. Offset pagination is simple and supports jumping to a page, but gets slower on very deep pages; cursor pagination would scale better for huge collections.

## Indexes

All indexes are declared explicitly with `schema.index()` in the model files.

| Model | Index | Supports |
|---|---|---|
| User | `{ email: 1 }` unique | login lookup, duplicate prevention |
| User | `{ createdAt: -1, _id: -1 }` | admin user list and sort |
| User | `{ role: 1 }` | last-admin guard |
| User | `{ interests: 1 }` | interest aggregation `$match` |
| Note | `{ owner: 1, createdAt: -1, _id: -1 }` | a user's notes list, admin owner filter |
| Note | `{ createdAt: -1, _id: -1 }` | admin all-notes list |
| Post | `{ author: 1, createdAt: -1, _id: -1 }` | posts-by-user `$match` + `$sort` |
| Post | `{ createdAt: -1, _id: -1 }` | public posts feed |

Note ownership lookups use `{ _id, owner }`, which is served by the `_id` index. To check a query plan, use `.explain('executionStats')` in the Mongo shell or Compass. An index helps filtering and sorting but does not guarantee the absence of every collection scan.

## Aggregations

**Interest grouping** (`services/user.service.js`, `groupByInterest`): exactly one `User.aggregate()` call.
Stages: `$match` (users with at least one interest) → `$unwind` → `$group` (count and user list per interest) → `$sort` → `$facet` (the page of results and the total count in the same call). No other query is used. Interests are de-duplicated per user on write, so counts are accurate.
Limitation: each group's `users` array lives in one document, so an extremely popular interest could approach MongoDB's 16 MB document limit.

**Posts by user** (`services/post.service.js`, `listByAuthor`): exactly one `Post.aggregate()` call.
Stages: `$match` (author) → `$facet` with `$sort` → `$skip` → `$limit` → `$lookup` (from `User.collection.name`, projecting only `name`) → `$set` → `$project`, plus a `$count` branch for the total. The lookup runs after the limit so only one page of authors is joined.
Contract: an unknown user id, or a user with no posts, returns 200 with an empty list. Distinguishing the two would need a second query, which the single-pipeline rule forbids.

## Security Notes

- Passwords hashed with bcryptjs (cost 12); hashes are never returned.
- JWTs are HS256, short-lived (15 minutes by default) and include the user's `tokenVersion`; the `authenticate` middleware re-checks the user and version on every request.
- Logout, password changes, and role downgrades increment `tokenVersion`, which revokes existing tokens.
- Zod schemas use `.strict()`: unknown fields (for example `role` in a register or profile request) are rejected with 422, which prevents mass assignment and privilege escalation.
- Ownership is part of the database query, and another user's note returns 404, so its existence is not revealed.
- An admin cannot delete or demote the last remaining administrator (409).
- Helmet headers, CORS limited to `CORS_ORIGINS`, 100 kb JSON body limit, and rate limiting (20 attempts per 15 minutes) on register and login.
- Unexpected errors return a generic 500 message; details are not leaked.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | start with file watching |
| `npm start` | start the server |
| `npm run seed:admin` | create the first admin |
| `npm run format` | format with Prettier |
| `npm test` | run Jest (see below) |

## Testing

Jest, Supertest and MongoDB Memory Server are listed as dev dependencies, but **no automated test files are included in this version**. The `npm test` script runs Jest and will report that it found no tests. The `test` script sets `NODE_OPTIONS` inline, which works in macOS/Linux shells; on Windows use WSL or set the variable manually.

To verify manually, follow the curl examples above: register two users, confirm one cannot read or change the other's notes (404), confirm a normal user gets 403 on `/api/admin/*`, and confirm `role` in a register body returns 422.

## Troubleshooting

- **`Missing env var ...` on start:** `.env` is missing or incomplete; copy `.env.example` and fill it in.
- **Cannot connect to MongoDB:** check that `mongod` is running or that your Atlas IP allowlist and credentials are correct.
- **`$lookup` / aggregation error:** your MongoDB server is older than 5.0.
- **401 after a while:** the access token expired (15 minutes) or you logged out; log in again.
- **429:** too many register or login attempts; wait 15 minutes.
- **CORS error in the browser:** add the frontend origin to `CORS_ORIGINS`.
- **409 on create or update:** the email is already used, or the change would remove the last admin.
