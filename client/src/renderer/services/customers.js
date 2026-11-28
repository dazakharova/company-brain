/**
 * @typedef {Object} Customer
 * @property {string} customer_id
 * @property {string} organisation_name
 * @property {string} support_email
 * @property {string} site
 *
 * @typedef {Object} CustomersService
 * @property {(options?: {query?: string, signal?: AbortSignal}) => Promise<Customer[]>} list
 */

// Fictional records from sample-data/data/customers.csv.
const customers = [
  {
    customer_id: 'CUST-001',
    organisation_name: 'Birchline Design Studio',
    support_email: 'it@birchline.example',
    site: 'Studio Office',
  },
  {
    customer_id: 'CUST-002',
    organisation_name: 'West Quay Accounting',
    support_email: 'it@westquay.example',
    site: 'Central Office',
  },
  {
    customer_id: 'CUST-003',
    organisation_name: 'Harbour Room Events',
    support_email: 'it@harbourroom.example',
    site: 'Event Office',
  },
];

/**
 * A replaceable async adapter. The screen only depends on CustomersService;
 * an HTTP/IPC adapter can later implement the same contract.
 * shouldFail is a development/test hook, evaluated once per request.
 * @param {{delayMs?: number, shouldFail?: () => boolean}} options
 * @returns {CustomersService}
 */
export function createMockCustomersService({ delayMs = 450, shouldFail = () => false } = {}) {
  return {
    async list({ query = '', signal } = {}) {
      signal?.throwIfAborted();
      await new Promise((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(signal.reason);
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, delayMs);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
      signal?.throwIfAborted();
      if (shouldFail()) {
        throw new Error('Mock customer request failed.');
      }

      const term = query.trim().toLowerCase();
      return customers
        .filter((customer) => customer.organisation_name.toLowerCase().includes(term)
          || customer.customer_id.toLowerCase().includes(term))
        .map((customer) => ({ ...customer }));
    },
  };
}

export const mockCustomersService = createMockCustomersService();
