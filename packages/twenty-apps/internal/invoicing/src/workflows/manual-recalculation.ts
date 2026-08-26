import { recalculateManualInvoice, type InvoiceStatus } from '../accounting/recalculation';
import { invoiceCurrencyPayload, type InvoiceWritePayload } from '../writer/payloads';

type ManualItem = { quantity: string; unitPrice: string; tax?: string; currencyCode?: string };
type ManualPayment = string | { amount: string; currencyCode: string };
export type ManualInvoiceRecord = { sourceSystem: 'MANUAL' | 'PERFEX' | null; currencyCode: string; dueDate: string | null; status: InvoiceStatus; discount: string; adjustment: string; items: readonly ManualItem[]; payments: readonly ManualPayment[] };
export type ManualInvoiceRepository = { readInvoice(invoiceId: string): Promise<ManualInvoiceRecord>; updateInvoice(invoiceId: string, update: Pick<InvoiceWritePayload, 'status' | 'subtotal' | 'tax' | 'discount' | 'adjustment' | 'total' | 'amountPaid' | 'balanceDue'>): Promise<void> };

function assertCurrencyConsistency(invoice: ManualInvoiceRecord): void {
  for (const item of invoice.items) if (item.currencyCode !== undefined && item.currencyCode !== invoice.currencyCode) throw new Error('currency mismatch between invoice and item');
  for (const payment of invoice.payments) if (typeof payment !== 'string' && payment.currencyCode !== invoice.currencyCode) throw new Error('currency mismatch between invoice and payment');
}

export function createManualRecalculationWorkflow(repository: ManualInvoiceRepository) {
  return async (invoiceId: string, today: string) => {
    const invoice = await repository.readInvoice(invoiceId);
    if (invoice.sourceSystem !== 'MANUAL' || invoice.status === 'HISTORICAL') throw new Error('manual recalculation is not available for historical or imported invoices');
    assertCurrencyConsistency(invoice);
    const result = recalculateManualInvoice({ currencyCode: invoice.currencyCode, dueDate: invoice.dueDate ?? undefined, status: invoice.status, discount: invoice.discount, adjustment: invoice.adjustment, today, items: invoice.items, payments: invoice.payments.map((payment) => typeof payment === 'string' ? payment : payment.amount) });
    await repository.updateInvoice(invoiceId, { status: result.status, ...invoiceCurrencyPayload(result.snapshot) });
    return result;
  };
}
