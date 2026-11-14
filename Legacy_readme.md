# Mountain Hut - Group 10

## License

The GNU GPL v3.0 was selected for its commitment to software freedom, transparency, and collaboration. Its copyleft provisions ensure that distributed derivative works remain subject to the same licensing terms, preserving users’ rights to use, modify, and redistribute the software.

## Users

| email                 | password              | role     |
| --------------------- | --------------------- | -------- |
| hiker@hiker.com       | hiker@hiker.com       | HIKER    |
| employee@employee.com | employee@employee.com | EMPLOYEE |
| warden@warden.com     | warden@warden.com     | WARDEN   |

---

## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v22.x or v24.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) - only needed to run the containerized application

> IMPORTANT: An internet connection is required to access Supabase and Firebase. Please check if your connection allows access to these services. E.g. PoliTo does not allow access and an mobile hotspot is required.

---

## Local Development

### 0. Environment Configuration

In the root directory, copy the example environment file to initialize your configuration

```bash
cp .env.example .env
```

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

- **Frontend (Vite dev server)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express / nodemon)**: [http://localhost:3000](http://localhost:3000)
- **API documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 3. Individual Component Scripts

If you only want to work on a specific part of the system:

#### Start backend only

```bash
npm run dev:backend
```

#### Start frontend only

```bash
npm run dev:frontend
```

#### Format all code with Prettier

```bash
npm run format
```

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

_(Alternatively, you can export it in your terminal session: `export DOCKER_USER=myusername` or `$env:DOCKER_USER="myusername"` in PowerShell)._

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

_Example outcome on Docker Hub:_

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

To run the entire production-grade stack (Frontend on Nginx + Backend API) locally via Docker:

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

### 2. `compose.yaml` (Full-Stack Production/Staging Stack)

Orchestrates the complete distributed application:

- **`backend`**: Node.js container with internal network discovery.
- **`frontend`**: React client built with Vite and served through an optimized Nginx alpine web server.

---

# Firebase Authentication

This project uses **Firebase Authentication** to authenticate users and the **Firebase Admin SDK** in the backend to verify their identity.

PostgreSQL remains responsible for storing application-specific user information and roles.

## 1. Firebase Project Setup

1. Open the project in the Firebase Console
2. Select the appropriate Firebase Project
3. Register a Web App if one has not already been registered
4. Navigate to **Authentication** &rarr; **Sign-in method**
5. Enable the authentication provider required by the application, such as email/password

## 2. Architecture

The authentication flow is designed as follows:

1. The user signs in through Firebase Authentication in the React frontend
2. Firebase returns an ID token to the frontend
3. The frontend sends the token to the Express backend using the `Authorization` header
4. The backend verifies the token using Firebase Admin SDK
5. The backend uses the verified Firebase UID to identify the corresponding user in PostgreSQL
6. The user's application role is retrieved from PostgreSQL and used to authorize access to protected endpoints

Firebase handles authentication, while PostgreSQL remains the source of truth for application-specific user data and roles.

## 3. Firebase Admin SDK Configuration

The backend uses the `firebase-admin` package to interact with Firebase Authentication.

The Firebase Admin SDK is initialized in:

```
backend/config/firebaseAdmin.ts
```

The `GOOGLE_APPLICATION_CREDENTIALS` environment variable specifies the location of the Firebase service account credential file.

## 4. Service Account Setup

To configure Firebase Admin:

1. Open the project in the Firebase Console
2. Navigate to **Project Settings** &rarr; **Service accounts**
3. Generate a private key for the Firebase Admin SDK if one is not already available
4. Save the downloaded JSON file to: `backend/secrets/mountain-hut-group-10-firebase.json`
5. Configure `GOOGLE_APPLICATION_CREDENTIALS` to point at the file

### Security considerations

- **Never** commit service account JSON file to Git
- Ensure that `backend/secrets` is always included in `.gitignore`
- If a service account key has been committed to Git, revoke it and generate a replacement

## 5. Token Verification

After a successful Firebase login, the frontend must send the ID token to the backend:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The backend can verify the token using:

```typescript
const decodedToken = await adminAuth.verifyIdToken(idToken);
```

A successfully verified token provides a trusted Firebase UID that can be used to identify the authenticated user.

The backend must reject invalid, expired or missing tokens on protected endpoints.

## 6. User Roles and PostgreSQL

Application-specific user information remains stored in PostgreSQL.

After verifying the Firebase ID token, the backend uses the Firebase UID to find the corresponding application user and retrieve their role.

Supported application roles include:

- `WARDEN`
- `EMPLOYEE`
- `HIKER`

**SECURITY RULE**: Roles and permissions must be determined and enforced by the backend. The backend must not trust a role supplied directly by the frontend.

## 7. Testing

To verify the Firebase Admin configuration:

1. Confirm that the service account JSON file exists at the configured path
2. Confirm that `GOOGLE_APPLICATION_CREDENTIALS` is loaded correctly

The Firebase Admin SDK test runs automatically when `npm run dev` is launched, after the PostgreSQL initialization completes. It verifies that Firebase Admin can successfully generate a custom authentication token.

### Google Cloud IAM Configuration

The Firebase Admin SDK may require the **IAM Service Account Credentials API** for operations such as generating custom tokens with `createCustomToken()`, depending on the configured credentials and authentication method.

If an error occurs, enable the IAM Service Account Credentials API in the Google Cloud project associated with the Firebase service account.

Steps:

1. Open the Google Cloud Console
2. Select the Google Cloud project associated with the Firebase application
3. Navigate to **APIs & Services** &rarr; **Library**
4. Search for **IAM Service Account Credentials API**
5. Open the API page and click **Enable**
6. Wait a few minutes for the change to take effect, then rerun the Firebase Admin test.

**NOTE**: This API requirement is relevant to the custom-token generation test described above. It should not be interpreted as a requirement for every Firebase Admin operation.
