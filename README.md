# Finance Dashboard

A full-stack expense tracking dashboard built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Project Structure

- `client/`: React + TypeScript frontend
- `server/`: Express backend API

## Quick Start

### 1) Frontend

```bash
cd client
npm install
npm start
```

### 2) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Backend health check endpoint:

- `GET http://localhost:5000/api/health`

## Roadmap

1. Database schema and migrations
2. Expense CRUD APIs
3. Entry form and expenses list
4. Charts and date filtering
5. CSV export and deployment

## Database (Part 2)

Schema and seed SQL files are ready in:

- `server/db/migrations/001_init_schema.sql`
- `server/db/seeds/001_default_categories.sql`

Example run order:

```bash
psql "$DATABASE_URL" -f server/db/migrations/001_init_schema.sql
psql "$DATABASE_URL" -f server/db/seeds/001_default_categories.sql
```

## Backend Setup (Part 3)

The backend now includes:

- PostgreSQL connection pool: `server/db/pool.js`
- Express app and middleware: `server/app.js`
- Server entry point: `server/index.js`
- Health endpoint with DB ping: `GET /api/health`

## Expenses API (Part 4)

Core expenses CRUD endpoints:

- `POST /api/expenses`
- `GET /api/expenses?userId=<id>`
- `DELETE /api/expenses/:id?userId=<id>`
