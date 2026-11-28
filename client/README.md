# Company Brain desktop client

Electron client built with HTML, CSS, and JavaScript. The Customers screen lists
organisation names, customer IDs, support emails, and sites using fictional mock
data. Search by full or partial organisation name or customer ID, ignoring case.
Loading, no-results, and error/retry states are included.

## Setup

Requires Node.js **22.13+ (22.x) or 24+**, npm, and a graphical desktop session.
Internet access is needed to install dependencies and download Electron.
No backend, AWS credentials, or `.env` file is required.

From the repository root:

```sh
cd client
npm ci
npm start
```

If using nvm, run `nvm install` and `nvm use` in `client/` first.

## Commands

Run from `client/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Launch the app. |
| `npm run dev` | Launch with Developer Tools. |
| `npm run lint` | Check JavaScript with ESLint. |
| `npm run lint:fix` | Apply automatic lint fixes. |
| `npm test` | Test mock data, search, errors, and cancellation. |
| `npm run test:ui` | Test interactions in a hidden Electron window; requires a desktop session. |

Add `-- --screenshots` to `npm run test:ui` to save desktop and compact previews
in `test-results/customers/` (ignored by Git).

## Development

- `src/main/` handles Electron windows; `src/preload/` provides the isolated bridge.
- `src/renderer/` contains the page shell, styles, screens, and data services.
- Reload renderer changes with **Cmd+R** / **Ctrl+R**. Restart after main/preload changes.
- For a blank page, run `npm run dev` and check the console. For a missing Electron
  binary, check the network connection and rerun `npm ci`.

The customer service exposes `list({ query, signal })`, returning a promise of
records with `customer_id`, `organisation_name`, `support_email`, and `site`.
Replace the mock service passed from `src/renderer/app.js` when the API is ready.
For HTTP integration, allow the agreed API origin in `index.html`'s content
security policy; network requests are currently disabled. Keep renderer Node.js
access disabled and native capabilities behind the isolated preload bridge.
