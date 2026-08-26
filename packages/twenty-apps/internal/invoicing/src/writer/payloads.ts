import type { InvoiceStatus, MoneySnapshot } from '../accounting/recalculation';

export type CurrencyWriteValue = { amountMicros: number; currencyCode: string };
export type RichTextWriteValue = { markdown: string; blocknote: string };
export type RelationWriteValue = { fieldName: 'company' | 'person' | 'invoice'; writeKey: 'companyId' | 'personId' | 'invoiceId'; referenceExternalId: string };

const MICROS_PER_CENT = 10_000n;
const MAX_SAFE_MICROS = BigInt(Number.MAX_SAFE_INTEGER);

export function currencyWriteValue(cents: bigint, currencyCode: string): CurrencyWriteValue {
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new Error('currency must be ISO-4217 uppercase');
  const amountMicros = cents * MICROS_PER_CENT;
  if (amountMicros > MAX_SAFE_MICROS || amountMicros < -MAX_SAFE_MICROS) throw new Error('money amount exceeds safe storage range');
  return { amountMicros: Number(amountMicros), currencyCode };
}

export function richTextWriteValue(markdown: string | null): RichTextWriteValue | null {
  return markdown === null ? null : { markdown, blocknote: '' };
}

export type InvoiceWritePayload = {
  name: string; invoiceNumber: string; sourceExternalId: string; sourceSystem: 'PERFEX' | 'MANUAL'; sourceStatus: string | null; status: InvoiceStatus;
  issueDate: string | null; dueDate: string | null; currencyCode: string; subtotal: CurrencyWriteValue; tax: CurrencyWriteValue; discount: CurrencyWriteValue; adjustment: CurrencyWriteValue; total: CurrencyWriteValue; amountPaid: CurrencyWriteValue; balanceDue: CurrencyWriteValue;
  clientNote: RichTextWriteValue | null; adminNote: RichTextWriteValue | null; hasDiscrepancy: boolean; discrepancyNotes: RichTextWriteValue | null; sourceMetadata: string | null;
};

export type InvoiceItemWritePayload = { name: string; sourceExternalId: string; description: string; longDescription: RichTextWriteValue | null; quantity: number; unit: string | null; currencyCode: string; unitPrice: CurrencyWriteValue; subtotal: CurrencyWriteValue; tax: CurrencyWriteValue; total: CurrencyWriteValue };
export type PaymentWritePayload = { name: string; sourceExternalId: string; paymentDate: string | null; amount: CurrencyWriteValue; currencyCode: string; method: string | null; transactionId: string | null; note: RichTextWriteValue | null };

export function invoiceCurrencyPayload(snapshot: MoneySnapshot): Pick<InvoiceWritePayload, 'subtotal' | 'tax' | 'discount' | 'adjustment' | 'total' | 'amountPaid' | 'balanceDue'> {
  return { subtotal: currencyWriteValue(snapshot.subtotal, snapshot.currencyCode), tax: currencyWriteValue(snapshot.tax, snapshot.currencyCode), discount: currencyWriteValue(snapshot.discount, snapshot.currencyCode), adjustment: currencyWriteValue(snapshot.adjustment, snapshot.currencyCode), total: currencyWriteValue(snapshot.total, snapshot.currencyCode), amountPaid: currencyWriteValue(snapshot.amountPaid, snapshot.currencyCode), balanceDue: currencyWriteValue(snapshot.balanceDue, snapshot.currencyCode) };
}
