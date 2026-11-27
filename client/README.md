# Company Brain desktop client

An Electron foundation using plain HTML, CSS, and JavaScript. No frontend
framework, bundler, or server is required to run the placeholder page.

## Prerequisites and setup

- Git and Node.js **22 (22.13+) or 24+**, with npm. `.nvmrc` selects Node.js 22
  for teammates using nvm (`nvm install`, then `nvm use` in this directory).
- A graphical desktop session on macOS, Windows, or Linux. Linux also needs
  Electron's system libraries; see the [Electron prerequisites](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites).
- Internet access during installation and first launch to download dependencies
  and the Electron binary.

From the repository root:

```sh
cd client
npm ci
npm start
```

A window titled **Company Brain** opens with a plain heading and a
“Client foundation is running.” message. No backend, AWS credentials, or `.env`
file is needed for this task.

## Development commands

Run these commands from `client/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Launch the desktop application. |
| `npm run dev` | Launch with Chromium Developer Tools open. |
| `npm run lint` | Check JavaScript with ESLint; warnings fail the command. |
| `npm run lint:fix` | Apply available automatic lint fixes. |

After changing renderer HTML, CSS, or JavaScript, reload the window using
**Cmd+R** on macOS or **Ctrl+R** on Windows/Linux. Restart the application after
changing main or preload code. There is no automatic reload or build step.
Quit using **Cmd+Q** on macOS, or close all windows on Windows/Linux.
You can also stop the process with **Ctrl+C** in the terminal. On macOS, closing
the last window keeps the app running; clicking its Dock icon reopens a window.

Dependencies are pinned in `package.json` and `package-lock.json`. Use `npm ci`
for a repeatable install. When intentionally changing dependencies, use
`npm install` and include both files in the change. Coordinate additional
dependencies with affected teammates before introducing them.

## Client structure

```text
client/
├── .nvmrc
├── eslint.config.cjs
├── package.json
├── package-lock.json
└── src/
    ├── main/
    │   └── main.cjs          # Electron lifecycle and native window
    ├── preload/
    │   └── preload.cjs       # Small, explicit bridge to the renderer
    └── renderer/
        ├── index.html       # Shared page shell and content security policy
        ├── app.js           # Renderer entry point; mounts the initial screen
        ├── styles.css       # Shared styling
        └── screens/
            └── home.js      # Placeholder screen
```

To add a screen, create a module in `src/renderer/screens/` that exports a render
function accepting a container, then import it in `app.js`. The shared shell
stays in `index.html`; `#screen` is the mount point for screen content. Navigation
can later select which render function to call. Keep modules and styles local;
inline scripts and styles are blocked by the content security policy.

The renderer uses browser ES modules and has no Node.js access. The main process
uses CommonJS (`.cjs`). Context isolation and renderer sandboxing are enabled;
the preload currently exposes only `window.desktop.electronVersion`, available
in Developer Tools without displaying it in the UI. Future
native capabilities should use narrowly scoped preload methods and validated
IPC handlers, with shared interfaces agreed with affected teammates. Do not
expose raw Electron or Node.js APIs to renderer code. See
[Electron's security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

The window blocks page navigation and popup windows. Network requests are
currently disabled by `connect-src 'none'` in `index.html`; agree on the backend
interface and explicitly allow its origin when adding server integration.

ESLint checks the main process, preload, renderer, and its own configuration,
using Node.js and browser globals in their respective files. It does not lint
HTML or CSS. Packaging, installers, backend integration, and navigation are
future tasks.

## Verify a change

1. Run `npm ci` and `npm run lint` from this directory.
2. Run `npm start` and confirm the heading and placeholder message appear.
3. Run `npm run dev` and check the Developer Tools console for errors.
4. Reload the page and resize the window; check that the content remains readable.
5. On macOS, close the window and click the Dock icon to check that it reopens.

## Troubleshooting

- **Missing Electron binary / failed download:** Electron downloads its
  platform-specific binary on first launch. Check network or proxy settings,
  then rerun `npm start`. If the installation is incomplete, run `npm ci` first.
- **Unsupported Node.js version:** check `node --version` and switch to Node.js
  22 (22.13+) or 24+, then rerun `npm ci`.
- **Linux display or missing shared library error:** run in a desktop session
  and install the system libraries required by Electron for your distribution.
  Keep Electron's sandbox enabled.
- **Blank page:** use `npm run dev` and inspect the console for missing files or
  content security policy errors. Keep renderer script/style files external.
