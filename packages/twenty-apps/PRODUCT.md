# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

BCHVAC staff who review customer invoices, balances, due dates, line items, and recorded payments inside Twenty.

## Product Purpose

Provide purpose-built operational workspaces for business records that need a task-specific interface instead of a generic CRUD table. For invoicing, success means staff can find an invoice, understand its payment state, and review the complete document without assembling the story from database fields.

## Positioning

The workspace keeps Twenty as the system of record while presenting invoice records as invoices: a status-aware queue connected to a readable document preview, customer context, line items, payments, and source integrity signals.

## Operating Context

Invoices can be created manually or imported as read-only historical Perfex records. Staff work primarily from a desktop CRM and may review invoices from a mobile browser.

## Capabilities and Constraints

- Existing Invoice, InvoiceItem, Payment, Company, and Person records remain authoritative.
- The first invoice workspace release supports browsing, filtering, and document-style review. Editing continues through Twenty's native record experience.
- Historical records remain read-only and preserve imported totals.
- Currency values, balance state, discrepancy flags, and source provenance must remain visible and accurate.
- PDF generation, email delivery, payment processing, reminders, tax calculation, credits, recurring invoices, and ledger accounting are not currently supported and must not be presented as working actions.

## Evidence on Hand

- Invoice object schema: `internal/invoicing/src/objects/invoice.object.ts`
- Line-item schema: `internal/invoicing/src/objects/invoice-item.object.ts`
- Payment schema: `internal/invoicing/src/objects/payment.object.ts`
- Exact-money and reconciliation tests under `internal/invoicing/test/`

## Product Principles

- Present operational records in the form people recognize from the real task.
- Preserve financial truth and source provenance over visual convenience.
- Make status, due date, total, paid amount, and balance understandable at a glance.
- Keep unsupported financial actions absent or explicitly unavailable.
- Adapt the list-to-detail workflow cleanly for smaller screens.
