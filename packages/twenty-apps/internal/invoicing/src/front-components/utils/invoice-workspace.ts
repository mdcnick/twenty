export type InvoiceCurrencyValue = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

export type InvoiceWorkspaceItem = {
  id: string;
  description: string;
  longDescription: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: InvoiceCurrencyValue | null;
  subtotal: InvoiceCurrencyValue | null;
  tax: InvoiceCurrencyValue | null;
  total: InvoiceCurrencyValue | null;
};

export type InvoiceWorkspacePayment = {
  id: string;
  paymentDate: string | null;
  amount: InvoiceCurrencyValue | null;
  method: string | null;
  transactionId: string | null;
  note: string | null;
};

export type InvoiceWorkspaceRecord = {
  id: string;
  name: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currencyCode: string;
  subtotal: InvoiceCurrencyValue | null;
  tax: InvoiceCurrencyValue | null;
  discount: InvoiceCurrencyValue | null;
  adjustment: InvoiceCurrencyValue | null;
  total: InvoiceCurrencyValue | null;
  amountPaid: InvoiceCurrencyValue | null;
  balanceDue: InvoiceCurrencyValue | null;
  company: { id: string; name: string } | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  clientNote: string | null;
  adminNote: string | null;
  hasDiscrepancy: boolean;
  discrepancyNotes: string | null;
  sourceSystem: string | null;
  sourceStatus: string | null;
  items: InvoiceWorkspaceItem[];
  payments: InvoiceWorkspacePayment[];
};

export type InvoiceStatusFilter =
  | 'ALL'
  | 'OPEN'
  | 'OVERDUE'
  | 'PAID'
  | 'HISTORICAL';

const OPEN_INVOICE_STATUSES = new Set([
  'DRAFT',
  'UNPAID',
  'PARTIALLY_PAID',
  'OVERDUE',
]);

const toAmountMicros = (value: InvoiceCurrencyValue | null): number =>
  typeof value?.amountMicros === 'number' ? value.amountMicros : 0;

export const formatCurrency = (
  value: InvoiceCurrencyValue | null,
  fallbackCurrencyCode: string,
): string => {
  const currencyCode = value?.currencyCode || fallbackCurrencyCode || 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toAmountMicros(value) / 1_000_000);
  } catch {
    return `${currencyCode} ${(toAmountMicros(value) / 1_000_000).toFixed(2)}`;
  }
};

export const formatInvoiceDate = (value: string | null): string => {
  if (value === null || value.length === 0) {
    return 'Not set';
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const getInvoiceCustomerName = (
  invoice: InvoiceWorkspaceRecord,
): string => {
  const companyName = invoice.company?.name.trim();

  if (companyName) {
    return companyName;
  }

  const personName = [invoice.person?.firstName, invoice.person?.lastName]
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .join(' ')
    .trim();

  return personName || 'No customer';
};

export const getInvoiceDisplayNumber = (
  invoice: InvoiceWorkspaceRecord,
): string => invoice.invoiceNumber.trim() || invoice.name.trim() || 'Draft invoice';

export const getInvoiceStatusLabel = (status: string): string =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const matchesStatus = (
  invoice: InvoiceWorkspaceRecord,
  statusFilter: InvoiceStatusFilter,
): boolean => {
  if (statusFilter === 'ALL') {
    return true;
  }

  if (statusFilter === 'OPEN') {
    return OPEN_INVOICE_STATUSES.has(invoice.status);
  }

  return invoice.status === statusFilter;
};

export const filterInvoices = (
  invoices: InvoiceWorkspaceRecord[],
  searchTerm: string,
  statusFilter: InvoiceStatusFilter,
): InvoiceWorkspaceRecord[] => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return invoices.filter((invoice) => {
    if (!matchesStatus(invoice, statusFilter)) {
      return false;
    }

    if (normalizedSearchTerm.length === 0) {
      return true;
    }

    return [
      invoice.invoiceNumber,
      invoice.name,
      getInvoiceCustomerName(invoice),
      invoice.status,
    ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
  });
};

export const getInvoiceSummary = (invoices: InvoiceWorkspaceRecord[]) => {
  const outstandingByCurrency: Record<string, number> = {};

  for (const invoice of invoices) {
    const balanceMicros = toAmountMicros(invoice.balanceDue);

    if (balanceMicros <= 0) {
      continue;
    }

    const currencyCode =
      invoice.balanceDue?.currencyCode || invoice.currencyCode || 'USD';
    outstandingByCurrency[currencyCode] =
      (outstandingByCurrency[currencyCode] ?? 0) + balanceMicros;
  }

  return {
    totalCount: invoices.length,
    openCount: invoices.filter((invoice) =>
      OPEN_INVOICE_STATUSES.has(invoice.status),
    ).length,
    overdueCount: invoices.filter((invoice) => invoice.status === 'OVERDUE')
      .length,
    paidCount: invoices.filter((invoice) => invoice.status === 'PAID').length,
    historicalCount: invoices.filter(
      (invoice) => invoice.status === 'HISTORICAL',
    ).length,
    outstandingByCurrency,
  };
};
