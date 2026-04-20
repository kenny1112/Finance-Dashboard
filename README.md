# Finance Dashboard

A full-stack personal finance dashboard for tracking expenses, filtering by category/date range, visualizing spending trends, and exporting data as CSV.

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL
- Charts: Chart.js (`react-chartjs-2`)
- Deploy: Vercel (frontend) + Railway (backend)

## Features

- Add expense entries (`amount`, `category`, `date`, `note`)
- List expenses by `userId`
- Filter expenses by category
- Filter expenses by date range (`startDate`, `endDate`)
- Delete individual expense records
- Visualize data with bar and pie charts
- Export filtered results as CSV

## Project Structure

- `client`: React + TypeScript frontend app
- `server`: Express API and PostgreSQL integration
- `server/db/migrations`: SQL schema migration scripts
- `server/db/seeds`: SQL seed scripts
- `docs/screenshots`: README screenshot assets

## Local Setup

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
```

Set `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_dashboard
NODE_ENV=development
```

Run migrations and seed data:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init_schema.sql
psql "$DATABASE_URL" -f db/seeds/001_default_categories.sql
```

Start backend:

```bash
npm run dev
```

Health check:

- `GET http://localhost:5000/api/health`

### 2) Frontend

```bash
cd client
npm install
```

Optional `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:

```bash
npm start
```

Build frontend:

```bash
npm run build
```

## API Endpoints

- `GET /api/health`
- `POST /api/expenses`
- `GET /api/expenses?userId=<id>&startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>`
- `DELETE /api/expenses/:id?userId=<id>`
- `GET /api/expenses/export/csv?userId=<id>&startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>`

## Deployment

### Frontend on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `build`
- Config file: `client/vercel.json`
- Env var: `REACT_APP_API_URL=<your railway backend url>`

### Backend on Railway

- Root directory: `server`
- Start command: `npm start`
- Config file: `server/railway.json`
- Required env vars:
  - `DATABASE_URL=<railway postgres url>`
  - `NODE_ENV=production`
  - `PORT` is handled by Railway

## Screenshots

Add screenshots under `docs/screenshots/`, then keep these links in README:

![Expense Form](docs/screenshots/expense-form.png)
![Expense List and Filters](docs/screenshots/expense-list.png)
![Charts View](docs/screenshots/charts.png)

## Development Roadmap (Completed)

- [x] React + TypeScript app setup
- [x] PostgreSQL schema (`users`, `categories`, `expenses`)
- [x] Express + PostgreSQL connection layer
- [x] Expense CRUD APIs (create/list/delete)
- [x] Entry form and validations
- [x] Expense list and category filtering
- [x] Chart.js integration (bar + pie)
- [x] Date range filtering (frontend + backend)
- [x] CSV export
- [x] Vercel/Railway deployment configs
