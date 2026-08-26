# Invoicing

Twenty 2.35 app for manual invoice records and read-only historical Perfex imports.

It defines `Invoice`, `InvoiceItem`, and `Payment`, links invoices optionally to a Company and Person, and exposes offline mappers for a strict joined Perfex export. Source external IDs are unique for idempotent imports; display invoice numbers intentionally are not globally unique.

Money helpers use `bigint` cents and writer DTOs convert them exactly to Twenty CURRENCY `{ amountMicros, currencyCode }` values. Recalculation is a pure, tested service for `MANUAL` invoices only: it preserves the stored discount and adjustment while recalculating line and payment totals through an injected transactional repository. Historical/imported invoices are rejected before any write and preserve their stored totals with an explicit discrepancy result. The included **Recalculate invoice** workflow action deliberately fails closed because Twenty 2.35 exposes no transactional object-record writer to an app logic function. It never pretends to update an invoice.

## Required Perfex export contract

This app does **not** accept raw table dumps or infer missing financial data. Prepare a joined, read-only export with these aliases before passing records to the mapper:

- Invoice rows: `id`, `clientid` (optional), `formatted_number`, `status`, `date`, `duedate`, `currency_code`, `subtotal`, `total_tax`, `discount_total`, `adjustment`, `total`, `payment_total`, `credit_total`, `amount_paid`, and `balance_due`.
- Item rows from `tblitemable`: `id`, `rel_id`, `rel_type = 'invoice'`, `description`, `long_description` (optional), `qty`, `unit` (optional), `rate`, `subtotal`, `total_tax`, `total`, and `currency_code`. Join and aggregate `tblitem_tax` into `total_tax`, then project `total = subtotal + total_tax` before export.
- Payment rows from `tblinvoicepaymentrecords`: `paymentid`, `invoiceid`, `date`, `amount`, `currency_code`, `name`/`paymentmode` (optional), `transactionid` (optional), and `note` (optional).

The invoice export must pre-aggregate payment and credit rows, enforce `subtotal + total_tax - discount_total + adjustment = total`, enforce `amount_paid = payment_total + credit_total`, and enforce `balance_due = total - amount_paid`. The item rows must aggregate back to each parent invoice's `subtotal` and `total_tax`; a zero-item invoice is accepted only when both parent fields are zero. The preview rejects duplicate source IDs, orphan children, cross-currency children, invalid line equations, item aggregates, and per-invoice payment totals. Official Perfex status codes 1–6 are validated and stored both as the original `sourceStatus` and in source metadata. `preview:migration` produces count and bigint-string aggregate reports per currency before any future writer is authorized.

## Local checks

```bash
yarn install --immutable
yarn typecheck && yarn lint && yarn test && yarn test:contract
yarn preview:migration
yarn twenty dev:typecheck
yarn twenty dev:build
```

No PDF/email, reminders, payment gateway, tax engine, credits, recurring invoices, ledger/GL, foreign exchange, live Perfex writeback, or database connection is included.
