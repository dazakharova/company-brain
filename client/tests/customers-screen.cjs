// Run UI checks in the real Electron renderer without adding a test dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'company-brain-customers-')));
const timeout = setTimeout(() => {
  console.error('Customers UI checks timed out.');
  app.exit(1);
}, 20000);

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  await window.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  if (process.argv.includes('--screenshots')) {
    const screenshotDir = path.join(__dirname, '../test-results/customers');
    fs.mkdirSync(screenshotDir, { recursive: true });
    await window.webContents.executeJavaScript(`new Promise((resolve) => {
      const timer = setInterval(() => {
        if (document.querySelectorAll('tbody tr').length === 3) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    })`);
    for (const [name, width, height] of [['desktop', 1120, 760], ['compact', 640, 480]]) {
      window.setSize(width, height);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const image = await window.webContents.capturePage();
      fs.writeFileSync(path.join(screenshotDir, `${name}.png`), image.toPNG());
    }
    window.setSize(1120, 760);
  }
  const passed = await window.webContents.executeJavaScript(`(async () => {
    const { renderCustomersScreen } = await import('./screens/customers.js');
    const { createMockCustomersService } = await import('./services/customers.js');
    const host = document.querySelector('#screen');
    const checks = [];
    const check = (value, message) => {
      if (!value) { throw new Error(message); }
      checks.push(message);
    };
    const waitFor = async (predicate) => {
      const end = Date.now() + 3000;
      while (!predicate()) {
        if (Date.now() > end) { throw new Error('Timed out waiting for UI state'); }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };
    const rows = () => host.querySelectorAll('tbody tr');
    const settled = () => host.querySelector('#customer-results').getAttribute('aria-busy') === 'false';
    const input = () => host.querySelector('input');
    const submit = (query) => {
      input().value = query;
      host.querySelector('form').requestSubmit();
    };

    // Verify the actual app entry point before testing injected services.
    await waitFor(() => rows().length === 3 && settled());
    check(host.querySelector('h1').textContent === 'Customers', 'app opens the Customers screen');
    check(rows()[1].textContent.includes('it@westquay.example') &&
      rows()[1].textContent.includes('Central Office'), 'customer rows include support email and site');
    check(typeof window.require === 'undefined', 'renderer has no Node access');

    let fail = false;
    let dispose = renderCustomersScreen(host, {
      customerService: createMockCustomersService({ delayMs: 80, shouldFail: () => fail }),
    });
    check(!host.querySelector('#customer-state').hidden && !settled(), 'loading state appears during requests');
    await waitFor(settled);
    submit('  wEsT qUaY  ');
    await waitFor(settled);
    check(rows().length === 1 && rows()[0].textContent.includes('CUST-002'), 'form searches organisation names');
    input().value = 'cust-003';
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(settled);
    check(rows().length === 1 && rows()[0].textContent.includes('Harbour Room Events'), 'typing searches customer IDs');

    submit('<img src=x onerror=alert(1)>');
    await waitFor(settled);
    check(host.querySelector('#state-title').textContent === 'No matching customers' &&
      rows().length === 0 && !host.querySelector('img'), 'no-results state safely displays an unmatched query');
    host.querySelector('#state-action').click();
    await waitFor(settled);
    check(rows().length === 3 && input().value === '' && document.activeElement === input(),
      'clearing an empty search restores the directory and focuses search');

    fail = true;
    submit('Birchline');
    await waitFor(settled);
    check(host.querySelector('[role=alert]').textContent === 'Unable to load customers' &&
      !host.querySelector('[role=alert]').hidden && rows().length === 0, 'error replaces stale customer results');
    check(input().value === 'Birchline', 'failed search text is preserved');
    fail = false;
    host.querySelector('#state-action').click();
    await waitFor(settled);
    check(rows().length === 1 && rows()[0].textContent.includes('CUST-001'), 'retry recovers using the same search');
    host.querySelector('#clear-search').click();
    await waitFor(settled);
    check(rows().length === 3 && host.querySelector('#clear-search').hidden, 'clear button restores all customers');
    dispose();

    dispose = renderCustomersScreen(host, { customerService: { list: async () => [] } });
    await waitFor(settled);
    check(host.querySelector('#state-title').textContent === 'No customers yet', 'empty directory has its own state');
    host.querySelector('#state-action').click();
    check(!settled(), 'empty directory refresh starts a new request');
    await waitFor(settled);
    dispose();

    let resolveOld;
    let resolveNew;
    let firstSignal;
    dispose = renderCustomersScreen(host, {
      customerService: { list: ({ query, signal }) => new Promise((resolve) => {
        if (query) { resolveNew = resolve; } else { resolveOld = resolve; firstSignal = signal; }
      }) },
    });
    submit('New');
    resolveNew([{ customer_id: 'NEW', organisation_name: '<script>bad()</script>', support_email: 'test@example.test', site: 'New site' }]);
    await waitFor(settled);
    resolveOld([{ customer_id: 'OLD', organisation_name: 'Old result', support_email: '', site: '' }]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    check(firstSignal.aborted && rows().length === 1 && rows()[0].textContent.includes('NEW'),
      'an older response cannot overwrite a newer search');
    check(!host.querySelector('script') && rows()[0].textContent.includes('<script>'),
      'server content is rendered as text');
    dispose();

    let resolveDisposed;
    let disposedSignal;
    dispose = renderCustomersScreen(host, { customerService: { list: ({ signal }) => {
      disposedSignal = signal;
      return new Promise((resolve) => { resolveDisposed = resolve; });
    } } });
    dispose();
    host.textContent = 'Another screen';
    resolveDisposed([]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    check(disposedSignal.aborted && host.textContent === 'Another screen', 'cleanup cancels work without changing another screen');
    return checks;
  })()`);
  assert.ok(passed.length >= 15);
  for (const message of passed) {
    console.log(`PASS ${message}`);
  }
  clearTimeout(timeout);
  window.destroy();
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
