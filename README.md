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

The Electron window opens the Customers screen with searchable fictional customer
records, support email addresses, and office/site details. The client runs
locally without the server, AWS credentials, or an `.env` file. The first install
and first launch need internet access to download npm packages and the Electron
binary.

Run the client in a graphical desktop session on macOS, Windows, or Linux.
See [client/README.md](client/README.md) for development commands, linting,
the client structure, and troubleshooting.

## Start the backend with Docker

Install Docker Desktop (Windows/macOS) or Docker Engine (Linux), and make sure
Docker is running. No local Python installation, credentials, or external
services are needed to start the backend.

Run all commands below from the `company-brain` repository root:

```sh
docker build -t company-brain-backend:local ./server
docker run -d --name company-brain-backend -p 127.0.0.1:8000:8000 company-brain-backend:local
```

This builds the backend image and starts it as an individual container.
The first build needs internet access to download the Python image and packages.
The API is available at http://localhost:8000.

Verify the running service:

```sh
docker ps --filter name=company-brain-backend
curl --fail http://localhost:8000/health
```

The container should report `healthy` after a few seconds, and the health
endpoint returns HTTP 200 with `{"status":"ok"}`. This checks that the API process
is responding.

| Endpoint | Purpose |
| --- | --- |
| [Health check](http://localhost:8000/health) | API process health |
| [Swagger UI](http://localhost:8000/docs) | Interactive API documentation |
| [OpenAPI schema](http://localhost:8000/openapi.json) | Machine-readable API definition |

Swagger UI uses CDN-hosted JavaScript and CSS, so the browser needs
internet access to render it. The health endpoint and OpenAPI schema work
without browser internet access.

View logs or stop the backend:

```sh
docker logs -f company-brain-backend
docker stop company-brain-backend
```

To restart the stopped container, run `docker start company-brain-backend`.

After changing backend code or dependencies, rebuild the image and replace the
container:

```sh
docker build -t company-brain-backend:local ./server
docker stop company-brain-backend
docker rm company-brain-backend
docker run -d --name company-brain-backend -p 127.0.0.1:8000:8000 company-brain-backend:local
```

If port 8000 is already in use, change the host port in `docker run`, for example
to `-p 127.0.0.1:8001:8000`, and use port 8001 in the URLs above. The container
still listens on port 8000. The port is published on the local machine's loopback
interface.

The Dockerfile uses the official Python image and starts Uvicorn directly,
following the [FastAPI container deployment guide](https://fastapi.tiangolo.com/deployment/docker/).
The application runs as a non-root user and has a Docker health check.

## Run backend smoke tests

With the backend running, use Python 3.11 or newer on your machine. These tests
make real HTTP requests and need no third-party Python packages:

```sh
python3 -m unittest discover -s server/tests -v
```

If you changed the host port, set `BACKEND_URL` to the matching URL when running
the tests (for example, `http://localhost:8001`). The tests cover the health
response, Swagger UI, and generated OpenAPI schema.

## Develop without Docker (optional)

Use Python 3.13 to match the container:

```sh
cd server
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

On Windows PowerShell, activate the environment with `.venv\Scripts\Activate.ps1`.
The API and documentation use the same URLs as the Docker setup. Stop the Docker
backend first if it is already using port 8000.
