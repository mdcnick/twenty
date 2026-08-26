import fixture from '../fixtures/perfex-invoices.json';
import { mapPerfexInvoice, mapPerfexInvoiceItem, mapPerfexPayment, reconcileJoinedPerfexExport, type JoinedPerfexExport } from '../src/migration';

console.log(JSON.stringify({
  invoices: fixture.invoices.map(mapPerfexInvoice),
  items: fixture.items.map(mapPerfexInvoiceItem),
  payments: fixture.payments.map(mapPerfexPayment),
  reconciliation: reconcileJoinedPerfexExport(fixture as JoinedPerfexExport),
}, null, 2));
