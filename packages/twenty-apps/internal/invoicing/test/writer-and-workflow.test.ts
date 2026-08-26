import { describe, expect, it } from 'vitest';

import { currencyWriteValue, richTextWriteValue } from '../src/writer/payloads';
import { createManualRecalculationWorkflow } from '../src/workflows/manual-recalculation';

describe('Twenty writer DTOs', () => {
  it('converts cents to amountMicros without understating dollar values', () => {
    expect(currencyWriteValue(123n, 'USD')).toEqual({ amountMicros: 1_230_000, currencyCode: 'USD' });
    expect(richTextWriteValue('Imported note')).toEqual({ markdown: 'Imported note', blocknote: '' });
  });

  it('rejects micros values outside Twenty safe-number storage', () => {
    expect(currencyWriteValue(900_719_925_474n, 'USD').amountMicros).toBe(9_007_199_254_740_000);
    expect(() => currencyWriteValue(900_719_925_475n, 'USD')).toThrow('safe storage range');
  });
});

describe('manual recalculate workflow', () => {
  it('writes typed values through an injected repository only after currency validation', async () => {
    const updates: unknown[] = [];
    const run = createManualRecalculationWorkflow({
      readInvoice: async () => ({ sourceSystem: 'MANUAL', currencyCode: 'USD', dueDate: '2026-08-24', status: 'UNPAID', discount: '1', adjustment: '-0.50', items: [{ quantity: '1', unitPrice: '10', tax: '0' }], payments: ['4'] }),
      updateInvoice: async (_id, update) => { updates.push(update); },
    });

    await expect(run('invoice-1', '2026-08-25')).resolves.toMatchObject({ status: 'OVERDUE' });
    expect(updates[0]).toMatchObject({ discount: { amountMicros: 1_000_000, currencyCode: 'USD' }, adjustment: { amountMicros: -500_000, currencyCode: 'USD' }, total: { amountMicros: 8_500_000, currencyCode: 'USD' }, amountPaid: { amountMicros: 4_000_000, currencyCode: 'USD' } });
  });

  it('fails closed before writing when a child currency differs', async () => {
    let wrote = false;
    const run = createManualRecalculationWorkflow({
      readInvoice: async () => ({ sourceSystem: 'MANUAL', currencyCode: 'USD', dueDate: null, status: 'UNPAID', discount: '0', adjustment: '0', items: [{ quantity: '1', unitPrice: '10', tax: '0', currencyCode: 'CAD' }], payments: [] }),
      updateInvoice: async () => { wrote = true; },
    });

    await expect(run('invoice-1', '2026-08-25')).rejects.toThrow('currency');
    expect(wrote).toBe(false);
  });

  it('rejects historical records before any update', async () => {
    let wrote = false;
    const run = createManualRecalculationWorkflow({
      readInvoice: async () => ({ sourceSystem: 'PERFEX', currencyCode: 'USD', dueDate: null, status: 'HISTORICAL', discount: '0', adjustment: '0', items: [], payments: [] }),
      updateInvoice: async () => { wrote = true; },
    });
    await expect(run('invoice-1', '2026-08-25')).rejects.toThrow('manual');
    expect(wrote).toBe(false);
  });
});
