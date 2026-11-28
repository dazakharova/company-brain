import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createMockCustomersService } from '../src/renderer/services/customers.js';

const service = createMockCustomersService({ delayMs: 0 });

test('mock records match the agreed customer CSV fields and values', async () => {
  const csv = await readFile(new URL('../../sample-data/data/customers.csv', import.meta.url), 'utf8');
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const fields = header.split(',');
  const expected = lines.map((line) => Object.fromEntries(
    line.split(',').map((value, index) => [fields[index], value]),
  ));
  assert.deepEqual(await service.list(), expected);
});

test('searches partial organisation names without case or surrounding whitespace sensitivity', async () => {
  const matches = await service.list({ query: '  wEsT qUaY  ' });
  assert.deepEqual(matches.map((customer) => customer.customer_id), ['CUST-002']);
});

test('searches full and partial customer IDs', async () => {
  assert.equal((await service.list({ query: 'cust-003' }))[0].organisation_name, 'Harbour Room Events');
  assert.equal((await service.list({ query: 'cust-00' })).length, 3);
});

test('blank searches return all records; unmatched terms return no results', async () => {
  assert.equal((await service.list({ query: '   ' })).length, 3);
  assert.deepEqual(await service.list({ query: 'unknown organisation' }), []);
  assert.deepEqual(await service.list({ query: 'it@westquay.example' }), []);
});

test('callers cannot mutate future mock responses', async () => {
  const first = await service.list();
  first[0].organisation_name = 'Changed';
  first.pop();
  const next = await service.list();
  assert.equal(next.length, 3);
  assert.equal(next[0].organisation_name, 'Birchline Design Studio');
});

test('a failed service request can be retried successfully', async () => {
  let fail = true;
  const retryService = createMockCustomersService({ delayMs: 0, shouldFail: () => fail });
  await assert.rejects(retryService.list(), /Mock customer request failed/);
  fail = false;
  assert.equal((await retryService.list()).length, 3);
});

test('pending and already cancelled requests reject with AbortError', async () => {
  const controller = new AbortController();
  const pending = createMockCustomersService({ delayMs: 1000 }).list({ signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(service.list({ signal: controller.signal }), { name: 'AbortError' });
});
