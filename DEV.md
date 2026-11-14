## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v22.x or v24.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) - only needed to run the containerized application

> IMPORTANT: An internet connection is required to access Supabase and Firebase. Please check if your connection allows access to these services. E.g. PoliTo does not allow access and an mobile hotspot is required.

Run the following commands from the repository root.

---

## Local Development

### 1. Environment Configuration

In the root directory, copy the example environment file to initialize your configuration

```bash
cp .env.example .env
```

#### Supabase Database

The backend connects directly to PostgreSQL hosted on Supabase.

Request the development database credentials from the team and update these variables in the root `.env` file:

```dotenv
DB_USER=supabase_user
DB_PASSWORD=supabase_password
DB_HOST=supabase_host
DB_PORT=5432
DB_NAME=postgres
```

Use the exact host, port, database name, and username provided for the selected Supabase connection method. (downloaded from our telegram group)

#### Firebase backend configuration

Save the JSON file `mountain-hut-group-10-firebase.json` into the directory: `./backend/secrets` (downloaded from our telegram group)

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
