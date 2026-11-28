/**
 * @param {HTMLElement} container
 * @param {{customerService: import('../services/customers.js').CustomersService}} options
 * @returns {() => void} Cleanup for a future screen/navigation change.
 */
export function renderCustomersScreen(container, { customerService }) {
  // Only static markup goes into templates. Customer and search text is always
  // assigned with textContent, including when a real service supplies the data.
  container.innerHTML = `
    <section class="customers-screen" aria-labelledby="customers-title">
      <h1 id="customers-title" class="visually-hidden">Customers</h1>
        <form class="search-form" role="search" aria-label="Find customers">
          <label for="customer-search" class="visually-hidden">Search by organisation name or customer ID</label>
          <input id="customer-search" type="search" name="query"
            placeholder="Search by organisation name or customer ID"
            autocomplete="off" spellcheck="false">
          <button id="clear-search" type="button" aria-label="Clear search" hidden>&times;</button>
        </form>

        <p id="results-status" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>
        <div id="customer-results" aria-busy="true">
          <div class="table-scroll" tabindex="0" role="region" aria-label="Customer results" hidden>
            <table>
              <caption class="visually-hidden">Customers and support contact details</caption>
              <thead><tr>
                <th scope="col">Organisation</th>
                <th scope="col">Customer ID</th>
                <th scope="col">Support email</th>
                <th scope="col">Office / site</th>
              </tr></thead>
              <tbody id="customer-rows"></tbody>
            </table>
          </div>
          <div class="result-state" id="customer-state">
            <p id="state-title"></p>
            <p id="customer-error" role="alert" hidden></p>
            <button id="state-action" type="button" hidden></button>
          </div>
        </div>
    </section>
  `;

  const form = container.querySelector('form');
  const input = container.querySelector('#customer-search');
  const clearButton = container.querySelector('#clear-search');
  const status = container.querySelector('#results-status');
  const results = container.querySelector('#customer-results');
  const table = container.querySelector('.table-scroll');
  const rows = container.querySelector('#customer-rows');
  const state = container.querySelector('#customer-state');
  const stateTitle = container.querySelector('#state-title');
  const errorMessage = container.querySelector('#customer-error');
  const stateAction = container.querySelector('#state-action');
  const events = new AbortController();
  let requestController;
  let requestId = 0;
  let searchTimer;
  let disposed = false;

  function showState(title, { loading = false, action = '', error = false } = {}) {
    table.hidden = true;
    rows.replaceChildren();
    state.hidden = false;
    stateTitle.hidden = error;
    stateTitle.textContent = error ? '' : title;
    errorMessage.hidden = !error;
    errorMessage.textContent = error ? title : '';
    stateAction.textContent = action;
    stateAction.hidden = !action;
    results.setAttribute('aria-busy', String(loading));
  }

  function showLoading() {
    clearButton.hidden = !input.value;
    status.textContent = input.value.trim() ? 'Searching customers…' : 'Loading customers…';
    showState(status.textContent, { loading: true });
  }

  async function loadCustomers() {
    clearTimeout(searchTimer);
    requestController?.abort();
    requestController = new AbortController();
    const id = ++requestId;
    const query = input.value.trim();
    showLoading();

    try {
      const customers = await customerService.list({ query, signal: requestController.signal });
      // Also guard against services that cannot cancel an in-flight request.
      if (disposed || id !== requestId) {
        return;
      }
      const count = customers.length;
      status.textContent = `${count} customer${count === 1 ? '' : 's'}${query ? ` found for “${query}”` : ''}`;
      if (count === 0) {
        showState(query ? 'No matching customers' : 'No customers yet',
          { action: query ? 'Clear search' : 'Refresh' });
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const customer of customers) {
        const row = document.createElement('tr');
        for (const field of ['organisation_name', 'customer_id', 'support_email', 'site']) {
          const cell = document.createElement(field === 'organisation_name' ? 'th' : 'td');
          if (field === 'organisation_name') {
            cell.scope = 'row';
          }
          cell.textContent = customer[field];
          row.append(cell);
        }
        fragment.append(row);
      }
      rows.replaceChildren(fragment);
      state.hidden = true;
      table.hidden = false;
      results.setAttribute('aria-busy', 'false');
    } catch {
      if (disposed || id !== requestId) {
        return;
      }
      status.textContent = '';
      showState('Unable to load customers', {
        action: 'Try again',
        error: true,
      });
    }
  }

  function clearSearch() {
    input.value = '';
    input.focus();
    loadCustomers();
  }

  const listenerOptions = { signal: events.signal };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    loadCustomers();
  }, listenerOptions);
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    requestId += 1;
    requestController?.abort();
    showLoading();
    searchTimer = setTimeout(loadCustomers, 250);
  }, listenerOptions);
  clearButton.addEventListener('click', clearSearch, listenerOptions);
  stateAction.addEventListener('click', () => {
    if (stateAction.textContent === 'Clear search') {
      clearSearch();
    } else {
      loadCustomers();
    }
  }, listenerOptions);

  loadCustomers();
  return () => {
    disposed = true;
    requestId += 1;
    clearTimeout(searchTimer);
    requestController?.abort();
    events.abort();
  };
}
