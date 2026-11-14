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

- An internet connection is required to access Supabase and Firebase. Please **check if your connection allows access to these services**. E.g. PoliTo does not allow access and an mobile hotspot is required.
- [Docker](https://www.docker.com/) - only needed to run the containerized application

---

## How to Run the Application

1. Create a repository on your pc
2. You need to define 3 files:
   - compose.yaml - contains the configuration for the Docker containers and pull the images from Docker Hub
   - .env - contains the environment variables for the application
   - mountain-hut-group-10-firebase.json - contains the Firebase service account credentials

### Compose.yaml

```yaml
name: mountain-hut-group-10

services:
  mountain-hut:
    image: cristianoberardo/mountain-hut:${TAG:-latest}
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      PORT: 3000
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_APPLICATION_CREDENTIALS: /app/secrets/firebase.json
    volumes:
      - ./mountain-hut-group-10-firebase.json:/app/secrets/firebase.json:ro
    restart: unless-stopped
```

### .env

We need to provide the database credentials and the JWT secret key in the `.env` file. You can copy the example file and fill in the values:

```bash
DB_USER=supabase_user
DB_PASSWORD=supabase_password
DB_HOST=supabase_host
DB_PORT=5432
DB_NAME=postgres

# Security
JWT_SECRET=jwt-secret-key
```

### mountain-hut-group-10-firebase.json

We need to provide the Firebase service account credentials in the `mountain-hut-group-10-firebase.json` file.
You can also create your own firebase auth service account and download it from the Firebase console and save it in the root directory of the project.

```json
{
  "type": "your-service-account-type",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-client-email",
  "client_id": "your-client-id",
  "auth_uri": "your-auth-uri",
  "token_uri": "your-token-uri",
  "auth_provider_x509_cert_url": "your-auth-provider-x509-cert-url",
  "client_x509_cert_url": "your-client-x509-cert-url",
  "universe_domain": "your-universe-domain"
}
```

Once you have these files ready, you can run the application using Docker Compose:

```bash
docker compose up -d
```

Enjoy! The application should now be running and accessible at [http://localhost:3000](http://localhost:3000).

---

## Local Development

For development, follow the instructions in [DEV.md](./DEV.md).
