# Mountain Hut - Group 10

#### License
The GNU GPL v3.0 was selected for its commitment to software freedom, transparency, and collaboration. Its copyleft provisions ensure that distributed derivative works remain subject to the same licensing terms, preserving users’ rights to use, modify, and redistribute the software.

#### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v20.x or v22.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- [Git](https://git-scm.com/)

---

#### Environment Configuration

In the root directory, copy the example environment file to initialize your configuration (the root `.env` serves as the **Single Source of Truth** for the entire project, including backend and Docker Compose):

```bash
cp .env.example .env
```

---

## Local Development

### 1. Install All Dependencies
Install root, backend, and frontend dependencies with a single command:
```bash
npm run install:all
```

### 2. Start the Development Server
Run frontend and backend concurrently with hot-reloading:
```bash
npm run dev
```
> **Note**: `npm run dev` automatically triggers `npm run docker:db:up`, ensuring PostgreSQL and Adminer are running before the backend server starts.

- **Frontend (Vite dev server)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express / nodemon)**: [http://localhost:3000](http://localhost:3000)
- **Database Adminer Web UI**: [http://localhost:8080](http://localhost:8080)

### 3. Individual Component Scripts
If you only want to work on a specific part of the system:
```bash
## Start backend only (automatically boots PostgreSQL first)
npm run dev:backend

## Start frontend only
npm run dev:frontend

## Format all code with Prettier
npm run format
```

---

## Database Management & Adminer

The PostgreSQL development database lifecycle can be controlled with dedicated npm scripts:

| Command | Action |
| :--- | :--- |
| `npm run docker:db:up` | Starts the PostgreSQL database and Adminer containers in background |
| `npm run docker:db:down` | Stops and removes the local database containers |
| `npm run docker:db:logs` | Streams real-time database logs to your terminal |

### Resetting the Database
To clear all data and re-run the seed scripts (`seed/init.sql` and `seed/seed.sql`):
```bash
docker compose -f backend/connections/PostgreSQL/compose.yaml down -v
npm run docker:db:up
```

### Accessing the Adminer Web UI
Navigate to [http://localhost:8080](http://localhost:8080) in your browser:
- **System**: `PostgreSQL`
- **Server**: `db`
- **Username**: `admin`
- **Password**: `admin`
- **Database**: `admin`

### Meal Reservations

The local database includes `dining_table`, `meal_reservation`, and `reservation_table` tables. A reservation belongs to a PostgreSQL user and can use one or more dining tables through `reservation_table`, allowing tables to be joined for larger parties. Reservation start and end times are stored as `TIMESTAMPTZ`; the application can use a default duration of 120 minutes when calculating the end time. The sample data creates five tables with capacities from two to six people.

When creating a reservation, the backend must choose active tables whose combined capacity is at least the party size and ensure none is already reserved during the requested interval. It should perform the availability check and insert the reservation and all table assignments in one transaction, locking the selected table rows in a consistent order to prevent simultaneous bookings from claiming the same tables.

---

# Building & Publishing to Docker Hub (Optional but if you want to try the experience with your own Docker Hub account)

The project includes an automated, cross-platform deploy script (`scripts/docker-publish.js`) that handles image naming conventions, multi-container builds, and version tagging.

## Step 1: Log in to Docker Hub (One-time)
Authenticate in your terminal:
```bash
docker login
```

## Step 2: Set Your Docker Hub Username
Ensure `DOCKER_USER` is configured in your `.env` file:
```ini
DOCKER_USER=myusername
```
*(Alternatively, you can export it in your terminal session: `export DOCKER_USER=myusername` or `$env:DOCKER_USER="myusername"` in PowerShell).*

## Step 3: Build & Publish Commands

#### 1. Local Build Only (No Push)
Builds both `backend` and `frontend` images using the version from `package.json` without publishing:
```bash
npm run docker:build
```

#### 2. Build and Push to Docker Hub
Builds, dual-tags (`:version` and `:latest`), and pushes both images to Docker Hub:
```bash
npm run docker:push
```
*Example outcome on Docker Hub:*
- `myusername/mountain-hut-backend:1.0.0`
- `myusername/mountain-hut-backend:latest`
- `myusername/mountain-hut-frontend:1.0.0`
- `myusername/mountain-hut-frontend:latest`

#### 3. Manual Version Tag Override
Publish with an explicit custom tag without having to edit `package.json`:
```bash
npm run docker:push -- 1.2.0
```

#### 4. Dry Run (Test Simulation)
Preview every command that would be executed without making any network calls or disk writes:
```bash
npm run docker:push -- --dry-run
```

---

# Building & Publishing to Docker Hub (The real one)

I'll implement the CI/CD pipeline in GitHub Actions to automate the build and push process whenever changes are merged into the `staging` branch. This will ensure that the latest version of the application is always available on Docker Hub for deployment.

> Note: why into the `staging` branch? Because we need some time to see if all works correctly. Most of the time it will work, but if we have some problems we can fix them before merging into the `main` branch and end the sprint.

#### Running the Full Stack with Docker - like if you were in production

To run the entire production-grade stack (Frontend on Nginx + Backend API + PostgreSQL) locally via Docker:

```bash
## Build and start all services in the background
docker compose up -d --build

## Stop all services
docker compose down
```

Access points:
- **Frontend App**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

### 1. `backend/Dockerfile` (Production Image)
Uses a **Multi-Stage Build** to keep the final image minimal and secure:
- **Build Stage (`node:22-alpine AS build`)**: Installs all dependencies (including TypeScript and build tools), caches npm layer dependencies via `npm ci`, and compiles TypeScript into `/app/dist`.
- **Runtime Stage (`node:22-alpine`)**: Discards all source `.ts` files, compilers, and devDependencies. Installs only production dependencies (`npm ci --omit=dev`), copies the precompiled `/app/dist`, sets up an unprivileged non-root user (`USER node`), and runs the compiled `node dist/app.js`.

### 2. `backend/connections/PostgreSQL/compose.yaml` (Local Development Database)
Dedicated to day-to-day coding on your local host:
- Spins up only **PostgreSQL** (mapped to host port `5433` to prevent conflicts with local Postgres installations) and **Adminer** (lightweight web interface on port `8080`).
- Automatically mounts `./seed/init.sql` and `./seed/seed.sql` into `/docker-entrypoint-initdb.d/` on first startup, creating tables and inserting sample seed data automatically.

### 3. `compose.yaml` (Full-Stack Production/Staging Stack)
Orchestrates the complete distributed application:
- **`db`**: PostgreSQL 17 on internal port 5432 with health checks (`pg_isready`).
- **`backend`**: Node.js container with internal network discovery (`DB_HOST: db`) and safe startup conditions (`depends_on: db: condition: service_healthy`).
- **`frontend`**: React client built with Vite and served through an optimized Nginx alpine web server.

---
