## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v20.x or v22.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Git](https://git-scm.com/)

An internet connection is required to access Supabase and Firebase.
Docker is only needed to run the containerized application.

Run the following commands from the repository root.

---

## Local Development

### 1. Environment Configuration

In the root directory, copy the example environment file to initialize your configuration

```bash
cp .env.example .env
```

> **FOR MAC USER**: Open the `.env` file and replace "\" with "/"

#### Supabase Database

The backend connects directly to PostgreSQL hosted on Supabase.

Request the development database credentials from the team and update these variables in the root `.env` file:

```dotenv
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-supabase-user
DB_PASSWORD="your-database-password"
JWT_SECRET="your-development-secret"
```

Use the exact host, port, database name, and username provided for the selected Supabase connection method.

The shared development database must already contain the application tables and the data needed for testing. Starting the application does not create tables or load seed data.

#### Firebase backend configuration

Save the JSON file `mountain-hut-group-10-firebase.json` into the directory: `./backend/secrets` (downloaded from our telegram group)

Configure its path in the root `.env`:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=./backend/secrets/mountain-hut-group-10-firebase.json
```

### 2. Install All Dependencies

Install root, backend, and frontend dependencies with a single command:

```bash
npm run install:all
```

### 3. Start the Application

Run frontend and backend concurrently with hot-reloading:

```bash
npm run dev
```

Access the application at:

- **Frontend (Vite dev server)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express / nodemon)**: [http://localhost:3000](http://localhost:3000)
- **API documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 4. Verify the Setup

1. Check the backend terminal for `Connected to PostgreSQL database`
2. Open http://localhost:3000/api/health and verify that it returns
   `{"status":"ok"}`
3. Open the frontend and sign in with a test account provided by the team

The health endpoint confirms that the backend responds; it does not check database connectivity.

## Database Management

Use the Supabase dashboard:

- **Table Editor** to inspect application data.
- **SQL Editor** to execute SQL queries and schema changes.

The shared development database is used by everyone configured with the same connection details.

## Individual Component Scripts

If you only want to work on a specific part of the system:

### Start backend only

```bash
npm run dev:backend
```

### Start frontend only

```bash
npm run dev:frontend
```

### Format all code with Prettier

```bash
npm run format
```
