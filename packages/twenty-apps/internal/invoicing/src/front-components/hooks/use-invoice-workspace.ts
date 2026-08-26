import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  type InvoiceCurrencyValue,
  type InvoiceWorkspaceItem,
  type InvoiceWorkspacePayment,
  type InvoiceWorkspaceRecord,
} from 'src/front-components/utils/invoice-workspace';

type QueryCurrencyValue = {
  amountMicros?: number | null;
  currencyCode?: string | null;
};

type QueryRichTextValue = {
  markdown?: string | null;
};

type InvoiceQueryNode = {
  id?: string;
  name?: string;
  invoiceNumber?: string;
  status?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  currencyCode?: string;
  subtotal?: QueryCurrencyValue | null;
  tax?: QueryCurrencyValue | null;
  discount?: QueryCurrencyValue | null;
  adjustment?: QueryCurrencyValue | null;
  total?: QueryCurrencyValue | null;
  amountPaid?: QueryCurrencyValue | null;
  balanceDue?: QueryCurrencyValue | null;
  clientNote?: QueryRichTextValue | null;
  adminNote?: QueryRichTextValue | null;
  hasDiscrepancy?: boolean;
  discrepancyNotes?: QueryRichTextValue | null;
  sourceSystem?: string | null;
  sourceStatus?: string | null;
  company?: { id?: string; name?: string | null } | null;
  person?: {
    id?: string;
    name?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
};

type InvoiceItemQueryNode = {
  id?: string;
  invoiceId?: string | null;
  description?: string;
  longDescription?: QueryRichTextValue | null;
  quantity?: number;
  unit?: string | null;
  unitPrice?: QueryCurrencyValue | null;
  subtotal?: QueryCurrencyValue | null;
  tax?: QueryCurrencyValue | null;
  total?: QueryCurrencyValue | null;
};

type PaymentQueryNode = {
  id?: string;
  invoiceId?: string | null;
  paymentDate?: string | null;
  amount?: QueryCurrencyValue | null;
  method?: string | null;
  transactionId?: string | null;
  note?: QueryRichTextValue | null;
};

type InvoiceWorkspaceQueryResult = {
  invoices?: { edges?: Array<{ node?: InvoiceQueryNode | null }> };
  invoiceItems?: { edges?: Array<{ node?: InvoiceItemQueryNode | null }> };
  payments?: { edges?: Array<{ node?: PaymentQueryNode | null }> };
};

type InvoiceWorkspaceState = {
  invoices: InvoiceWorkspaceRecord[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
};

const INVOICE_PAGE_SIZE = 250;
const CHILD_RECORD_PAGE_SIZE = 500;
const REFRESH_INTERVAL_MS = 30_000;

const toCurrency = (
  value: QueryCurrencyValue | null | undefined,
): InvoiceCurrencyValue | null => {
  if (typeof value?.amountMicros !== 'number') {
    return null;
  }

  return {
    amountMicros: value.amountMicros,
    currencyCode:
      typeof value.currencyCode === 'string' ? value.currencyCode : null,
  };
};

const toRichText = (
  value: QueryRichTextValue | null | undefined,
): string | null => {
  const markdown = value?.markdown?.trim();

  return markdown ? markdown : null;
};

const toInvoiceItem = (
  node: InvoiceItemQueryNode | null | undefined,
): (InvoiceWorkspaceItem & { invoiceId: string }) | null => {
  if (
    typeof node?.id !== 'string' ||
    typeof node.invoiceId !== 'string' ||
    typeof node.description !== 'string'
  ) {
    return null;
  }

  return {
    id: node.id,
    invoiceId: node.invoiceId,
    description: node.description,
    longDescription: toRichText(node.longDescription),
    quantity: typeof node.quantity === 'number' ? node.quantity : 0,
    unit: typeof node.unit === 'string' ? node.unit : null,
    unitPrice: toCurrency(node.unitPrice),
    subtotal: toCurrency(node.subtotal),
    tax: toCurrency(node.tax),
    total: toCurrency(node.total),
  };
};

const toPayment = (
  node: PaymentQueryNode | null | undefined,
): (InvoiceWorkspacePayment & { invoiceId: string }) | null => {
  if (typeof node?.id !== 'string' || typeof node.invoiceId !== 'string') {
    return null;
  }

  return {
    id: node.id,
    invoiceId: node.invoiceId,
    paymentDate:
      typeof node.paymentDate === 'string' ? node.paymentDate : null,
    amount: toCurrency(node.amount),
    method: typeof node.method === 'string' ? node.method : null,
    transactionId:
      typeof node.transactionId === 'string' ? node.transactionId : null,
    note: toRichText(node.note),
  };
};

const toInvoice = ({
  node,
  items,
  payments,
}: {
  node: InvoiceQueryNode | null | undefined;
  items: InvoiceWorkspaceItem[];
  payments: InvoiceWorkspacePayment[];
}): InvoiceWorkspaceRecord | null => {
  if (
    typeof node?.id !== 'string' ||
    typeof node.name !== 'string' ||
    typeof node.invoiceNumber !== 'string' ||
    typeof node.status !== 'string'
  ) {
    return null;
  }

  const company =
    typeof node.company?.id === 'string'
      ? { id: node.company.id, name: node.company.name ?? '' }
      : null;
  const person =
    typeof node.person?.id === 'string'
      ? {
          id: node.person.id,
          firstName: node.person.name?.firstName ?? '',
          lastName: node.person.name?.lastName ?? '',
        }
      : null;

  return {
    id: node.id,
    name: node.name,
    invoiceNumber: node.invoiceNumber,
    status: node.status,
    issueDate: typeof node.issueDate === 'string' ? node.issueDate : null,
    dueDate: typeof node.dueDate === 'string' ? node.dueDate : null,
    currencyCode:
      typeof node.currencyCode === 'string' ? node.currencyCode : 'USD',
    subtotal: toCurrency(node.subtotal),
    tax: toCurrency(node.tax),
    discount: toCurrency(node.discount),
    adjustment: toCurrency(node.adjustment),
    total: toCurrency(node.total),
    amountPaid: toCurrency(node.amountPaid),
    balanceDue: toCurrency(node.balanceDue),
    company,
    person,
    clientNote: toRichText(node.clientNote),
    adminNote: toRichText(node.adminNote),
    hasDiscrepancy: node.hasDiscrepancy === true,
    discrepancyNotes: toRichText(node.discrepancyNotes),
    sourceSystem:
      typeof node.sourceSystem === 'string' ? node.sourceSystem : null,
    sourceStatus:
      typeof node.sourceStatus === 'string' ? node.sourceStatus : null,
    items,
    payments,
  };
};

const fetchInvoiceWorkspace = async (): Promise<InvoiceWorkspaceRecord[]> => {
  const result = (await new CoreApiClient().query({
    invoices: {
      __args: {
        first: INVOICE_PAGE_SIZE,
        orderBy: [{ issueDate: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          name: true,
          invoiceNumber: true,
          status: true,
          issueDate: true,
          dueDate: true,
          currencyCode: true,
          subtotal: { amountMicros: true, currencyCode: true },
          tax: { amountMicros: true, currencyCode: true },
          discount: { amountMicros: true, currencyCode: true },
          adjustment: { amountMicros: true, currencyCode: true },
          total: { amountMicros: true, currencyCode: true },
          amountPaid: { amountMicros: true, currencyCode: true },
          balanceDue: { amountMicros: true, currencyCode: true },
          clientNote: { markdown: true },
          adminNote: { markdown: true },
          hasDiscrepancy: true,
          discrepancyNotes: { markdown: true },
          sourceSystem: true,
          sourceStatus: true,
          company: { id: true, name: true },
          person: {
            id: true,
            name: { firstName: true, lastName: true },
          },
        },
      },
    },
    invoiceItems: {
      __args: { first: CHILD_RECORD_PAGE_SIZE },
      edges: {
        node: {
          id: true,
          invoiceId: true,
          description: true,
          longDescription: { markdown: true },
          quantity: true,
          unit: true,
          unitPrice: { amountMicros: true, currencyCode: true },
          subtotal: { amountMicros: true, currencyCode: true },
          tax: { amountMicros: true, currencyCode: true },
          total: { amountMicros: true, currencyCode: true },
        },
      },
    },
    payments: {
      __args: {
        first: CHILD_RECORD_PAGE_SIZE,
        orderBy: [{ paymentDate: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          invoiceId: true,
          paymentDate: true,
          amount: { amountMicros: true, currencyCode: true },
          method: true,
          transactionId: true,
          note: { markdown: true },
        },
      },
    },
  })) as unknown as InvoiceWorkspaceQueryResult;

  const items = (result.invoiceItems?.edges ?? [])
    .map((edge) => toInvoiceItem(edge.node))
    .filter(
      (item): item is InvoiceWorkspaceItem & { invoiceId: string } =>
        item !== null,
    );
  const payments = (result.payments?.edges ?? [])
    .map((edge) => toPayment(edge.node))
    .filter(
      (payment): payment is InvoiceWorkspacePayment & { invoiceId: string } =>
        payment !== null,
    );

  return (result.invoices?.edges ?? [])
    .map((edge) => {
      const invoiceId = edge.node?.id;

      return toInvoice({
        node: edge.node,
        items:
          typeof invoiceId === 'string'
            ? items.filter((item) => item.invoiceId === invoiceId)
            : [],
        payments:
          typeof invoiceId === 'string'
            ? payments.filter((payment) => payment.invoiceId === invoiceId)
            : [],
      });
    })
    .filter((invoice): invoice is InvoiceWorkspaceRecord => invoice !== null);
};

export const useInvoiceWorkspace = () => {
  const [state, setState] = useState<InvoiceWorkspaceState>({
    invoices: [],
    isLoading: true,
    isRefreshing: false,
    errorMessage: null,
  });

  const refreshInvoices = useCallback(async (showLoading = false) => {
    setState((currentState) => ({
      ...currentState,
      isLoading: showLoading && currentState.invoices.length === 0,
      isRefreshing: !showLoading,
      errorMessage: null,
    }));

    try {
      const invoices = await fetchInvoiceWorkspace();

      setState({
        invoices,
        isLoading: false,
        isRefreshing: false,
        errorMessage: null,
      });
    } catch {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        isRefreshing: false,
        errorMessage:
          'Invoices could not be loaded. Check your connection and try again.',
      }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshWhileMounted = async (showLoading = false) => {
      if (isMounted) {
        await refreshInvoices(showLoading);
      }
    };

    void refreshWhileMounted(true);
    const refreshInterval = setInterval(() => {
      void refreshWhileMounted();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [refreshInvoices]);

  return { ...state, refreshInvoices };
};
