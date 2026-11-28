# Company Brain

## Project structure

```text
company-brain/
├── client/       # Electron application
├── server/       # FastAPI server
├── docs/         # Project documentation
└── sample-data/  # Fictional demo files
```

## Get a local copy

Accept your GitHub collaborator invitation, then run:

```sh
git clone https://github.com/dazakharova/company-brain.git
cd company-brain
```

## Run the desktop client

Install **Node.js 22 (22.13+) or Node.js 24+**, with npm. If you use nvm, run
`nvm install` and `nvm use` from `client/` to select Node.js 22.

```sh
cd client
npm ci
npm start
```

The Electron window displays the Company Brain placeholder page. The client runs
locally without the server, AWS credentials, or an `.env` file. The first install
and first launch need internet access to download npm packages and the Electron
binary.

Run the client in a graphical desktop session on macOS, Windows, or Linux.
See [client/README.md](client/README.md) for development commands, linting,
the client structure, and troubleshooting.

## Start the local API and database

Install Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin
(Linux), and start Docker. Use Linux containers on Windows. No local Python
installation or AWS account is needed to run the services; the host smoke tests
below require Python 3.11 or newer.

| Component | Version / requirement |
| --- | --- |
| Docker Engine | 24+ (included with current Docker Desktop) |
| Docker Compose | v2.20+; use `docker compose`, not `docker-compose` |
| API runtime | Official `python:3.13-slim` image |
| Database | Official `mariadb:11.4` image (11.4 LTS series) |
| Python packages | Exact direct dependency versions in `server/requirements.txt` |

Image tags track patch updates within their specified series. The first build
needs internet access to download images and Python packages.

Run all commands below from the `company-brain` repository root:

```sh
cp .env.example .env
docker compose config --quiet
docker compose up --build --wait --wait-timeout 180
docker compose ps
```

In Windows PowerShell, use `Copy-Item .env.example .env` for the first command.
Copy the file only on first setup so existing settings are preserved. The template
contains working local development values; choose your local passwords before
the first start. `.env` is ignored by Git.

Compose runs FastAPI (`api`) and MariaDB (`db`) as separate services. It initializes
the database and application account, waits for MariaDB to be ready, then starts
the API. Both services should report `healthy`. The API runs as a non-root OS
user and connects to `db:3306` using the application account. The API receives
no database root password. MariaDB grants that account access to `DB_NAME` only.
The database port is available inside the Compose network and is not published
to the host. The API is published on the host's loopback interface.

| Setting in `.env` | Purpose |
| --- | --- |
| `API_PORT` | Host API port; defaults to `8000` |
| `DB_NAME` | Database created on first initialization |
| `DB_USER` | Application account; must not be `root` |
| `DB_PASSWORD` | Application account password |
| `DB_ROOT_PASSWORD` | Separate MariaDB administration password |

Compose requires all database settings to be nonempty. It sets the API's
`DB_HOST=db` and `DB_PORT=3306` internally. Database names, users, and passwords
initialize an **empty volume only**. Editing `.env` later does not change accounts
in an existing database. Keep the original settings, or update the database
accounts separately before changing them in `.env`.

| Endpoint | Expected response / purpose |
| --- | --- |
| [Process health](http://localhost:8000/health) | HTTP 200, `{"status":"ok"}` |
| [Database readiness](http://localhost:8000/health/db) | HTTP 200, `{"status":"ok","database":"ok"}` after a real `SELECT 1` through the application account |
| [Swagger UI](http://localhost:8000/docs) | Interactive API documentation |
| [OpenAPI schema](http://localhost:8000/openapi.json) | Machine-readable API definition |

Database readiness returns HTTP 503 with `{"detail":"Database unavailable"}`
if connecting, authenticating, or querying fails. Connections and reads have
short timeouts; each request opens and closes a fresh connection. The synchronous
database check runs in FastAPI's thread pool. Compose uses this endpoint for API
health, while `/health` continues to report whether the API process is responding.
Swagger UI uses CDN-hosted JavaScript and CSS and needs browser internet access.

## Verify the environment

With the services running, use Python 3.11+ on the **host computer**. These smoke
tests make real HTTP requests and need no third-party Python packages:

```sh
python3 -m unittest discover -s server/tests -v
```

On Windows, use `py -3` instead of `python3`. All four tests should pass, checking
host access to the API, a successful MariaDB query, Swagger UI, and OpenAPI.
Any failed request or incorrect response makes the command exit nonzero.

To verify failure reporting, stop only MariaDB and rerun the same smoke check:

```sh
docker compose stop db
python3 -m unittest discover -s server/tests -v
```

The database connectivity test must **fail with HTTP 503**, giving the command
a nonzero exit status; the other three tests should still pass. For a direct
inspection, open http://localhost:8000/health/db or run
`curl -i http://localhost:8000/health/db`. Restore MariaDB and verify recovery:

```sh
docker compose up --wait --wait-timeout 180 db
python3 -m unittest discover -s server/tests -v
```

All four tests should pass again without restarting the API manually. The API's
Docker health status returns to `healthy` on its next scheduled check. Targeting
`db` here avoids Compose rejecting the API's previous `unhealthy` status before
that next check runs.

## Daily development and persistent data

```sh
docker compose logs -f api db
```

Stop following logs with Ctrl+C. Use `docker compose stop` to stop the services,
then `docker compose up --wait --wait-timeout 180` to resume them. After changing
backend code or dependencies, rebuild with:

```sh
docker compose up --build --wait --wait-timeout 180
```

MariaDB stores its data in the named volume `mariadb-data` (normally named
`company-brain_mariadb-data` in Docker). Data survives service restarts, image
rebuilds, and `docker compose down` followed by `docker compose up`.
`docker compose down` removes the containers and network while keeping the data.
**`docker compose down --volumes` permanently deletes the local database.**
Use that command only when deliberately resetting disposable local data, then
start the environment again to initialize it with the current `.env` settings.

## Troubleshooting

- **Docker connection error:** start Docker Desktop or the Docker Engine service.
- **Missing settings:** copy `.env.example` to `.env` and fill in all database
  settings. Run `docker compose config --quiet` to validate without printing passwords.
- **Port 8000 in use:** stop an old standalone backend container if present, or
  set `API_PORT=8001` in `.env` and rerun `docker compose up --wait`. Use port 8001
  in URLs and set `BACKEND_URL=http://localhost:8001` for tests. On macOS/Linux:
  `BACKEND_URL=http://localhost:8001 python3 -m unittest discover -s server/tests -v`.
  In PowerShell, first run `$env:BACKEND_URL = "http://localhost:8001"`.
- **Database readiness fails or startup times out:** inspect
  `docker compose logs --tail=100 api db`. Check that the application credentials
  match the ones used when the volume was first initialized. Fix the settings
  and run `docker compose up --build --wait --wait-timeout 180` again.
