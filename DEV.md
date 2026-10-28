## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v20.x or v22.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (**must be running**)
- [Git](https://git-scm.com/)

---

## Local Development

### 1. Environment Configuration

In the root directory, copy the example environment file to initialize your configuration

```bash
cp .env.example .env
```

#### Firebase backend configuration

Save the JSON file `mountain-hut-group-10-firebase.json` into the directory: `./backend/secrets` (downloaded from out telegram group)

#### Firebase frontend configuration

In the root directory:

```bash
cd ./frontend
cp .env.example .env.local
cd ..
```

The React frontend uses the Firebase JavaScript SDK to authenticate users.

1. Open the Firebase Console (https://console.firebase.google.com/u/0/)
2. Select your Firebase project (`mountain-hut-group-10`) from the list of projects
3. Click on the **Settings** icon &rarr; **General**
4. Scroll down to your registered **Web App** (the `</>` icon)

Into the file you created `.env.local` replace the hardcoded configuration values with the onces from your Firebase Web App configuration:

```text
VITE_FIREBASE_API_KEY=firebaseConfig.apiKey
VITE_FIREBASE_AUTH_DOMAIN=firebaseConfig.authDomain
VITE_FIREBASE_PROJECT_ID=firebaseConfig.projectId
VITE_FIREBASE_APP_ID=firebaseConfig.appId
```

### 2. Install All Dependencies

Install root, backend, and frontend dependencies with a single command:

```bash
npm run install:all
```

### 3. Start the Development Server

Run frontend and backend concurrently with hot-reloading:

```bash
npm run dev
```

Done!

> **Note**: `npm run dev` automatically triggers `npm run docker:db:up`, ensuring PostgreSQL and Adminer are running before the backend server starts.

- **Frontend (Vite dev server)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express / nodemon)**: [http://localhost:3000](http://localhost:3000)
- **Database Adminer Web UI**: [http://localhost:8080](http://localhost:8080)

## Individual Component Scripts

If you only want to work on a specific part of the system:

### Start backend only (automatically boots PostgreSQL first)

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

### Starts the PostgreSQL database and Adminer containers in background

```bash
npm run docker:db:up
```

### Stops and removes the local database containers

```bash
npm run docker:db:down
```

### Streams real-time database logs to your terminal

```bash
npm run docker:db:logs
```

### Reset the database

```bash
docker compose -f backend/connections/PostgreSQL/compose.yaml down -v
npm run docker:db:up
```

---

## Accessing the Adminer Web UI

Navigate to [http://localhost:8080](http://localhost:8080) in your browser:

- **System**: `PostgreSQL`
- **Server**: `db`
- **Username**: `admin`
- **Password**: `admin`
- **Database**: `admin`
