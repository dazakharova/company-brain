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
