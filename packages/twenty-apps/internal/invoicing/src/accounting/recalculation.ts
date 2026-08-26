import { assertStorableCents, moneyFromDecimal, sumMoney } from './money';

export const INVOICE_STATUSES = ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'HISTORICAL'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type MoneySnapshot = { subtotal: bigint; tax: bigint; discount: bigint; adjustment: bigint; total: bigint; amountPaid: bigint; balanceDue: bigint; currencyCode: string };
type ManualLine = { quantity: string; unitPrice: string; tax?: string };
type ImportedSnapshot = { subtotal: string; tax: string; discount: string; adjustment: string; total: string; amountPaid: string; balanceDue: string };

const toAmount = (value: string, currencyCode: string) => moneyFromDecimal(value, currencyCode).amount;
const add = (left: bigint, right: bigint) => assertStorableCents(left + right);
const subtract = (left: bigint, right: bigint) => assertStorableCents(left - right);
const multiply = (left: bigint, right: bigint) => assertStorableCents(left * right);

function snapshot(currencyCode: string, subtotal: bigint, tax: bigint, discount: bigint, adjustment: bigint, amountPaid: bigint): MoneySnapshot {
  const total = add(subtract(add(subtotal, tax), discount), adjustment);
  return { subtotal, tax, discount, adjustment, total, amountPaid, balanceDue: subtract(total, amountPaid), currencyCode };
}

function calculateItems(currencyCode: string, items: readonly ManualLine[]) {
  return items.reduce((result, item) => {
    const lineSubtotal = multiply(toAmount(item.unitPrice, currencyCode), moneyFromDecimal(item.quantity, currencyCode).amount) / 100n;
    return { subtotal: add(result.subtotal, lineSubtotal), tax: add(result.tax, toAmount(item.tax ?? '0', currencyCode)) };
  }, { subtotal: 0n, tax: 0n });
}

export function recalculateManualInvoice(input: { currencyCode: string; dueDate?: string; today: string; status?: InvoiceStatus; items: readonly ManualLine[]; discount?: string; adjustment?: string; payments: readonly string[] }): { snapshot: MoneySnapshot; status: InvoiceStatus } {
  const calculated = calculateItems(input.currencyCode, input.items);
  const amountPaid = sumMoney(input.payments.map((payment) => moneyFromDecimal(payment, input.currencyCode))).amount;
  const result = snapshot(input.currencyCode, calculated.subtotal, calculated.tax, toAmount(input.discount ?? '0', input.currencyCode), toAmount(input.adjustment ?? '0', input.currencyCode), amountPaid);
  if (input.status === 'DRAFT' || input.status === 'CANCELLED') return { snapshot: result, status: input.status };
  if (result.balanceDue <= 0n) return { snapshot: result, status: 'PAID' };
  if (input.dueDate !== undefined && input.dueDate < input.today) return { snapshot: result, status: 'OVERDUE' };
  if (amountPaid > 0n) return { snapshot: result, status: 'PARTIALLY_PAID' };
  return { snapshot: result, status: 'UNPAID' };
}

export function reconcileImportedInvoice(input: { currencyCode: string; stored: ImportedSnapshot; items: readonly ManualLine[]; payments: readonly string[] }): { snapshot: MoneySnapshot; discrepancy: { hasDiscrepancy: boolean; notes: string | null } } {
  const stored = snapshot(input.currencyCode, toAmount(input.stored.subtotal, input.currencyCode), toAmount(input.stored.tax, input.currencyCode), toAmount(input.stored.discount, input.currencyCode), toAmount(input.stored.adjustment, input.currencyCode), toAmount(input.stored.amountPaid, input.currencyCode));
  const preserved = { ...stored, total: toAmount(input.stored.total, input.currencyCode), balanceDue: toAmount(input.stored.balanceDue, input.currencyCode) };
  const expected = recalculateManualInvoice({ currencyCode: input.currencyCode, today: '9999-12-31', items: input.items, discount: input.stored.discount, adjustment: input.stored.adjustment, payments: input.payments }).snapshot;
  const mismatches = (['subtotal', 'tax', 'total', 'amountPaid', 'balanceDue'] as const).filter((key) => preserved[key] !== expected[key]);
  return { snapshot: preserved, discrepancy: { hasDiscrepancy: mismatches.length > 0, notes: mismatches.length === 0 ? null : `Imported snapshot differs from recomputation: ${mismatches.join(', ')}` } };
}
