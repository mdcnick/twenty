import { type CSSProperties, useMemo, useState } from 'react';
import {
  AppPath,
  enqueueSnackbar,
  navigate,
  useColorScheme,
} from 'twenty-sdk/front-component';

import { useInvoiceWorkspace } from 'src/front-components/hooks/use-invoice-workspace';
import {
  filterInvoices,
  formatCurrency,
  formatInvoiceDate,
  getInvoiceCustomerName,
  getInvoiceDisplayNumber,
  getInvoiceStatusLabel,
  getInvoiceSummary,
  type InvoiceStatusFilter,
  type InvoiceWorkspaceRecord,
} from 'src/front-components/utils/invoice-workspace';

const INVOICE_WORKSPACE_STYLES = `
  .invoice-workspace-root {
    background: var(--invoice-background);
    color: var(--invoice-text);
    display: flex;
    flex-direction: column;
    font-size: 13px;
    height: 100%;
    min-height: 600px;
    overflow: hidden;
    width: 100%;
  }

  .invoice-workspace-root * { box-sizing: border-box; }
  .invoice-workspace-root button,
  .invoice-workspace-root input { font: inherit; }

  .invoice-workspace-topbar {
    align-items: center;
    background: var(--invoice-panel);
    border-bottom: 1px solid var(--invoice-border);
    display: flex;
    flex: 0 0 58px;
    gap: 18px;
    justify-content: space-between;
    padding: 0 16px 0 20px;
  }
  .invoice-workspace-title { min-width: 0; }
  .invoice-workspace-title h1 {
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
    line-height: 20px;
    margin: 0;
  }
  .invoice-workspace-title p {
    color: var(--invoice-text-secondary);
    font-size: 11px;
    line-height: 16px;
    margin: 1px 0 0;
  }
  .invoice-workspace-actions { align-items: center; display: flex; gap: 8px; }
  .invoice-workspace-button {
    align-items: center;
    background: var(--invoice-panel);
    border: 1px solid var(--invoice-border-strong);
    border-radius: 7px;
    color: var(--invoice-text);
    cursor: pointer;
    display: inline-flex;
    font-size: 12px;
    font-weight: 600;
    height: 32px;
    justify-content: center;
    padding: 0 11px;
  }
  .invoice-workspace-button:hover { background: var(--invoice-hover); }
  .invoice-workspace-button[data-primary="true"] {
    background: var(--invoice-accent);
    border-color: var(--invoice-accent);
    color: #fff;
  }
  .invoice-workspace-button[data-primary="true"]:hover {
    background: var(--invoice-accent-hover);
    border-color: var(--invoice-accent-hover);
  }
  .invoice-workspace-button:disabled { cursor: default; opacity: 0.55; }
  .invoice-workspace-button:focus-visible,
  .invoice-workspace-filter:focus-visible,
  .invoice-workspace-row:focus-visible,
  .invoice-workspace-search:focus-visible {
    outline: 2px solid var(--invoice-focus);
    outline-offset: 2px;
  }

  .invoice-workspace-status-strip {
    background: var(--invoice-panel);
    border-bottom: 1px solid var(--invoice-border);
    display: grid;
    flex: 0 0 54px;
    grid-template-columns: minmax(170px, 1.4fr) repeat(5, minmax(88px, 0.75fr));
    min-width: 0;
  }
  .invoice-workspace-summary,
  .invoice-workspace-filter {
    align-items: center;
    border: 0;
    border-right: 1px solid var(--invoice-border);
    display: flex;
    min-width: 0;
    padding: 0 16px;
  }
  .invoice-workspace-summary { gap: 10px; }
  .invoice-workspace-summary-label,
  .invoice-workspace-filter-label {
    color: var(--invoice-text-secondary);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }
  .invoice-workspace-summary-value {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .invoice-workspace-filter {
    background: transparent;
    color: var(--invoice-text);
    cursor: pointer;
    justify-content: space-between;
    text-align: left;
  }
  .invoice-workspace-filter:hover { background: var(--invoice-hover); }
  .invoice-workspace-filter[aria-pressed="true"] {
    background: var(--invoice-selected);
    box-shadow: inset 0 -2px 0 var(--invoice-accent);
  }
  .invoice-workspace-filter-count {
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
  }

  .invoice-workspace-error {
    align-items: center;
    background: var(--invoice-error-background);
    border-bottom: 1px solid var(--invoice-error-border);
    color: var(--invoice-error-text);
    display: flex;
    font-size: 12px;
    justify-content: space-between;
    min-height: 40px;
    padding: 8px 14px;
  }
  .invoice-workspace-error button {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    font-weight: 650;
  }

  .invoice-workspace-layout {
    display: grid;
    flex: 1;
    grid-template-columns: 308px minmax(480px, 1fr) 272px;
    min-height: 0;
  }
  .invoice-workspace-queue,
  .invoice-workspace-inspector { background: var(--invoice-panel); min-height: 0; }
  .invoice-workspace-queue {
    border-right: 1px solid var(--invoice-border);
    display: flex;
    flex-direction: column;
  }
  .invoice-workspace-inspector {
    border-left: 1px solid var(--invoice-border);
    overflow: auto;
    padding: 18px;
  }

  .invoice-workspace-search-wrap {
    border-bottom: 1px solid var(--invoice-border);
    padding: 11px 12px;
  }
  .invoice-workspace-search {
    background: var(--invoice-input);
    border: 1px solid var(--invoice-border);
    border-radius: 8px;
    color: var(--invoice-text);
    height: 34px;
    outline: 0;
    padding: 0 10px;
    width: 100%;
  }
  .invoice-workspace-search::placeholder { color: var(--invoice-text-tertiary); }
  .invoice-workspace-list { flex: 1; min-height: 0; overflow: auto; padding: 6px; }
  .invoice-workspace-row {
    background: transparent;
    border: 0;
    border-radius: 9px;
    color: inherit;
    cursor: pointer;
    display: block;
    padding: 10px;
    text-align: left;
    width: 100%;
  }
  .invoice-workspace-row:hover { background: var(--invoice-hover); }
  .invoice-workspace-row[aria-selected="true"] { background: var(--invoice-selected); }
  .invoice-workspace-row-top,
  .invoice-workspace-row-bottom { align-items: center; display: flex; gap: 10px; justify-content: space-between; }
  .invoice-workspace-row-number {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .invoice-workspace-row-customer {
    display: block;
    font-size: 13px;
    font-weight: 550;
    line-height: 18px;
    margin-top: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .invoice-workspace-row-bottom {
    color: var(--invoice-text-secondary);
    font-size: 11px;
    line-height: 17px;
    margin-top: 3px;
  }
  .invoice-workspace-row-amount {
    color: var(--invoice-text);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  .invoice-workspace-status {
    background: var(--invoice-status-neutral-background);
    border-radius: 999px;
    color: var(--invoice-status-neutral-text);
    display: inline-flex;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.035em;
    line-height: 20px;
    padding: 0 7px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .invoice-workspace-status[data-status="PAID"] {
    background: var(--invoice-success-background);
    color: var(--invoice-success-text);
  }
  .invoice-workspace-status[data-status="OVERDUE"] {
    background: var(--invoice-danger-background);
    color: var(--invoice-danger-text);
  }
  .invoice-workspace-status[data-status="UNPAID"],
  .invoice-workspace-status[data-status="PARTIALLY_PAID"] {
    background: var(--invoice-warning-background);
    color: var(--invoice-warning-text);
  }
  .invoice-workspace-status[data-status="HISTORICAL"] {
    background: var(--invoice-history-background);
    color: var(--invoice-history-text);
  }

  .invoice-workspace-stage {
    background: var(--invoice-stage);
    min-height: 0;
    min-width: 0;
    overflow: auto;
    padding: 24px clamp(18px, 3vw, 42px) 42px;
  }
  .invoice-workspace-document-toolbar {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin: 0 auto 10px;
    max-width: 780px;
  }
  .invoice-workspace-back {
    background: transparent;
    border: 0;
    color: var(--invoice-text-secondary);
    cursor: pointer;
    display: none;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 0;
  }
  .invoice-workspace-document-caption {
    color: var(--invoice-text-secondary);
    font-size: 11px;
  }
  .invoice-workspace-document {
    background: var(--invoice-paper);
    border: 1px solid var(--invoice-paper-border);
    border-radius: 12px;
    box-shadow: 0 12px 34px var(--invoice-paper-shadow);
    color: var(--invoice-paper-text);
    margin: 0 auto;
    max-width: 780px;
    min-height: 660px;
    padding: clamp(28px, 4vw, 54px);
  }
  .invoice-workspace-document-header {
    align-items: flex-start;
    display: flex;
    gap: 28px;
    justify-content: space-between;
  }
  .invoice-workspace-document-title {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 720;
    letter-spacing: -0.035em;
    line-height: 1;
    margin: 0;
  }
  .invoice-workspace-document-number {
    color: var(--invoice-paper-secondary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    line-height: 18px;
    margin-top: 8px;
  }
  .invoice-workspace-document-meta {
    display: grid;
    gap: 7px;
    grid-template-columns: auto auto;
    margin: 0;
    text-align: right;
  }
  .invoice-workspace-document-meta dt {
    color: var(--invoice-paper-secondary);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }
  .invoice-workspace-document-meta dd {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    margin: 0;
  }
  .invoice-workspace-bill-to {
    border-top: 1px solid var(--invoice-paper-border);
    margin-top: 32px;
    padding-top: 24px;
  }
  .invoice-workspace-document-label {
    color: var(--invoice-paper-secondary);
    font-size: 10px;
    font-weight: 650;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .invoice-workspace-customer-name {
    font-size: 16px;
    font-weight: 650;
    line-height: 22px;
    margin-top: 7px;
  }
  .invoice-workspace-customer-contact {
    color: var(--invoice-paper-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .invoice-workspace-line-items {
    border-collapse: collapse;
    margin-top: 30px;
    table-layout: fixed;
    width: 100%;
  }
  .invoice-workspace-line-items th {
    border-bottom: 1px solid var(--invoice-paper-border-strong);
    color: var(--invoice-paper-secondary);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.045em;
    padding: 0 8px 9px;
    text-align: right;
    text-transform: uppercase;
  }
  .invoice-workspace-line-items th:first-child,
  .invoice-workspace-line-items td:first-child { padding-left: 0; text-align: left; width: 48%; }
  .invoice-workspace-line-items th:last-child,
  .invoice-workspace-line-items td:last-child { padding-right: 0; }
  .invoice-workspace-line-items td {
    border-bottom: 1px solid var(--invoice-paper-border);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    padding: 12px 8px;
    text-align: right;
    vertical-align: top;
  }
  .invoice-workspace-item-description { font-weight: 600; line-height: 17px; }
  .invoice-workspace-item-note {
    color: var(--invoice-paper-secondary);
    font-size: 11px;
    line-height: 16px;
    margin-top: 2px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .invoice-workspace-no-lines {
    color: var(--invoice-paper-secondary);
    padding: 28px 0 !important;
    text-align: center !important;
  }

  .invoice-workspace-totals {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) minmax(210px, 42%);
    margin-top: 22px;
  }
  .invoice-workspace-notes {
    color: var(--invoice-paper-secondary);
    font-size: 11px;
    line-height: 17px;
    overflow-wrap: anywhere;
    padding-right: 26px;
    white-space: pre-wrap;
  }
  .invoice-workspace-totals-list { margin: 0; }
  .invoice-workspace-total-row {
    display: flex;
    font-size: 11px;
    gap: 16px;
    justify-content: space-between;
    line-height: 18px;
    padding: 2px 0;
  }
  .invoice-workspace-total-row dt { color: var(--invoice-paper-secondary); }
  .invoice-workspace-total-row dd {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    margin: 0;
  }
  .invoice-workspace-total-row[data-total="true"] {
    border-top: 1px solid var(--invoice-paper-border-strong);
    font-size: 14px;
    margin-top: 7px;
    padding-top: 10px;
  }
  .invoice-workspace-total-row[data-balance="true"] {
    color: var(--invoice-balance-text);
    font-size: 13px;
    margin-top: 3px;
  }
  .invoice-workspace-document-footer {
    border-top: 1px solid var(--invoice-paper-border);
    color: var(--invoice-paper-secondary);
    font-size: 10px;
    line-height: 15px;
    margin-top: 38px;
    padding-top: 14px;
  }

  .invoice-workspace-inspector h2 {
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.04em;
    margin: 0 0 15px;
    text-transform: uppercase;
  }
  .invoice-workspace-inspector-section + .invoice-workspace-inspector-section {
    border-top: 1px solid var(--invoice-border);
    margin-top: 22px;
    padding-top: 20px;
  }
  .invoice-workspace-inspector-heading {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .invoice-workspace-inspector-heading h3 {
    font-size: 12px;
    font-weight: 650;
    margin: 0;
  }
  .invoice-workspace-inspector-heading span {
    color: var(--invoice-text-tertiary);
    font-size: 10px;
  }
  .invoice-workspace-payment {
    display: grid;
    gap: 2px 10px;
    grid-template-columns: 8px minmax(0, 1fr) auto;
    padding: 7px 0;
  }
  .invoice-workspace-payment-dot {
    background: var(--invoice-success);
    border-radius: 50%;
    height: 7px;
    margin-top: 6px;
    width: 7px;
  }
  .invoice-workspace-payment-name { font-size: 11px; font-weight: 600; line-height: 17px; }
  .invoice-workspace-payment-date,
  .invoice-workspace-payment-note {
    color: var(--invoice-text-secondary);
    font-size: 10px;
    line-height: 15px;
  }
  .invoice-workspace-payment-amount {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    line-height: 17px;
  }
  .invoice-workspace-payment-note { grid-column: 2 / 4; overflow-wrap: anywhere; }
  .invoice-workspace-empty-note {
    color: var(--invoice-text-secondary);
    font-size: 11px;
    line-height: 17px;
  }
  .invoice-workspace-detail-list { margin: 0; }
  .invoice-workspace-detail-row {
    align-items: start;
    display: grid;
    font-size: 11px;
    gap: 10px;
    grid-template-columns: 82px minmax(0, 1fr);
    line-height: 17px;
    padding: 5px 0;
  }
  .invoice-workspace-detail-row dt { color: var(--invoice-text-secondary); }
  .invoice-workspace-detail-row dd { margin: 0; overflow-wrap: anywhere; text-align: right; }
  .invoice-workspace-discrepancy {
    background: var(--invoice-error-background);
    border: 1px solid var(--invoice-error-border);
    border-radius: 10px;
    color: var(--invoice-error-text);
    font-size: 11px;
    line-height: 17px;
    margin-top: 14px;
    padding: 10px;
    white-space: pre-wrap;
  }
  .invoice-workspace-inspector .invoice-workspace-button { margin-top: 18px; width: 100%; }

  .invoice-workspace-empty {
    align-items: center;
    color: var(--invoice-text-secondary);
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-height: 190px;
    padding: 28px;
    text-align: center;
  }
  .invoice-workspace-empty strong { color: var(--invoice-text); font-size: 14px; font-weight: 650; }
  .invoice-workspace-empty span { font-size: 12px; line-height: 18px; margin-top: 5px; max-width: 300px; }
  .invoice-workspace-loading-row {
    animation: invoice-workspace-pulse 1.35s ease-in-out infinite;
    background: var(--invoice-loading);
    border-radius: 8px;
    height: 76px;
    margin: 6px;
  }
  @keyframes invoice-workspace-pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.9; }
  }
  @media (prefers-reduced-motion: reduce) {
    .invoice-workspace-loading-row { animation: none; }
  }

  @media (max-width: 1160px) {
    .invoice-workspace-layout { grid-template-columns: 294px minmax(480px, 1fr); }
    .invoice-workspace-inspector { display: none; }
  }

  @media (max-width: 760px) {
    .invoice-workspace-root { min-height: 500px; }
    .invoice-workspace-topbar { flex-basis: 54px; padding-left: 14px; }
    .invoice-workspace-title p { display: none; }
    .invoice-workspace-actions .invoice-workspace-button:first-child { display: none; }
    .invoice-workspace-status-strip {
      display: flex;
      flex-basis: 50px;
      overflow-x: auto;
    }
    .invoice-workspace-summary { display: none; }
    .invoice-workspace-filter { flex: 0 0 104px; padding: 0 12px; }
    .invoice-workspace-layout { display: block; position: relative; }
    .invoice-workspace-queue,
    .invoice-workspace-stage { height: 100%; width: 100%; }
    .invoice-workspace-root[data-mobile-view="list"] .invoice-workspace-stage { display: none; }
    .invoice-workspace-root[data-mobile-view="document"] .invoice-workspace-queue { display: none; }
    .invoice-workspace-stage { padding: 12px 10px 28px; }
    .invoice-workspace-document-toolbar { margin-bottom: 8px; }
    .invoice-workspace-back { display: inline-flex; }
    .invoice-workspace-document { border-radius: 10px; min-height: 0; padding: 24px 18px; }
    .invoice-workspace-document-title { font-size: 29px; }
    .invoice-workspace-document-header { gap: 18px; }
    .invoice-workspace-document-meta { grid-template-columns: 1fr; gap: 2px; }
    .invoice-workspace-document-meta dt { margin-top: 4px; }
    .invoice-workspace-line-items th:nth-child(2),
    .invoice-workspace-line-items td:nth-child(2),
    .invoice-workspace-line-items th:nth-child(3),
    .invoice-workspace-line-items td:nth-child(3) { display: none; }
    .invoice-workspace-line-items th:first-child,
    .invoice-workspace-line-items td:first-child { width: 64%; }
    .invoice-workspace-totals { grid-template-columns: 1fr; }
    .invoice-workspace-notes { order: 2; padding: 18px 0 0; }
  }
`;

type InvoiceWorkspaceColors = CSSProperties & {
  '--invoice-background': string;
  '--invoice-panel': string;
  '--invoice-stage': string;
  '--invoice-input': string;
  '--invoice-hover': string;
  '--invoice-selected': string;
  '--invoice-border': string;
  '--invoice-border-strong': string;
  '--invoice-text': string;
  '--invoice-text-secondary': string;
  '--invoice-text-tertiary': string;
  '--invoice-accent': string;
  '--invoice-accent-hover': string;
  '--invoice-focus': string;
  '--invoice-paper': string;
  '--invoice-paper-text': string;
  '--invoice-paper-secondary': string;
  '--invoice-paper-border': string;
  '--invoice-paper-border-strong': string;
  '--invoice-paper-shadow': string;
  '--invoice-balance-text': string;
  '--invoice-success': string;
  '--invoice-success-background': string;
  '--invoice-success-text': string;
  '--invoice-danger-background': string;
  '--invoice-danger-text': string;
  '--invoice-warning-background': string;
  '--invoice-warning-text': string;
  '--invoice-history-background': string;
  '--invoice-history-text': string;
  '--invoice-status-neutral-background': string;
  '--invoice-status-neutral-text': string;
  '--invoice-error-background': string;
  '--invoice-error-border': string;
  '--invoice-error-text': string;
  '--invoice-loading': string;
};

const LIGHT_COLORS: InvoiceWorkspaceColors = {
  '--invoice-background': '#f5f6f8',
  '--invoice-panel': '#ffffff',
  '--invoice-stage': '#eef0f3',
  '--invoice-input': '#f8f8f9',
  '--invoice-hover': '#f1f2f4',
  '--invoice-selected': '#e9eefb',
  '--invoice-border': '#e4e6e9',
  '--invoice-border-strong': '#d3d6dc',
  '--invoice-text': '#202124',
  '--invoice-text-secondary': '#62676f',
  '--invoice-text-tertiary': '#7a8089',
  '--invoice-accent': '#315fd6',
  '--invoice-accent-hover': '#264fb9',
  '--invoice-focus': '#315fd6',
  '--invoice-paper': '#ffffff',
  '--invoice-paper-text': '#1f2328',
  '--invoice-paper-secondary': '#626871',
  '--invoice-paper-border': '#e5e7ea',
  '--invoice-paper-border-strong': '#cfd3d8',
  '--invoice-paper-shadow': 'rgba(31, 35, 40, 0.12)',
  '--invoice-balance-text': '#a33b24',
  '--invoice-success': '#2e7d52',
  '--invoice-success-background': '#e7f4ec',
  '--invoice-success-text': '#246a44',
  '--invoice-danger-background': '#fdebec',
  '--invoice-danger-text': '#a52d3a',
  '--invoice-warning-background': '#fff1d6',
  '--invoice-warning-text': '#895b00',
  '--invoice-history-background': '#eceaf6',
  '--invoice-history-text': '#625685',
  '--invoice-status-neutral-background': '#eceef1',
  '--invoice-status-neutral-text': '#5f6570',
  '--invoice-error-background': '#fff0f1',
  '--invoice-error-border': '#f2c4c9',
  '--invoice-error-text': '#8f1f2d',
  '--invoice-loading': '#e6e8eb',
};

const DARK_COLORS: InvoiceWorkspaceColors = {
  '--invoice-background': '#171717',
  '--invoice-panel': '#1d1d1d',
  '--invoice-stage': '#161719',
  '--invoice-input': '#242424',
  '--invoice-hover': '#262626',
  '--invoice-selected': '#26334f',
  '--invoice-border': '#2c2c2c',
  '--invoice-border-strong': '#3b3b3b',
  '--invoice-text': '#f1f1f1',
  '--invoice-text-secondary': '#b7b7b7',
  '--invoice-text-tertiary': '#999999',
  '--invoice-accent': '#3f6fdb',
  '--invoice-accent-hover': '#4b7ce7',
  '--invoice-focus': '#6e98f3',
  '--invoice-paper': '#222326',
  '--invoice-paper-text': '#f4f4f5',
  '--invoice-paper-secondary': '#b8bac0',
  '--invoice-paper-border': '#37393e',
  '--invoice-paper-border-strong': '#4a4d53',
  '--invoice-paper-shadow': 'rgba(0, 0, 0, 0.38)',
  '--invoice-balance-text': '#ff9c86',
  '--invoice-success': '#62bd8b',
  '--invoice-success-background': '#21392d',
  '--invoice-success-text': '#8fd9af',
  '--invoice-danger-background': '#412529',
  '--invoice-danger-text': '#ffadb5',
  '--invoice-warning-background': '#45371f',
  '--invoice-warning-text': '#f7ca70',
  '--invoice-history-background': '#332e45',
  '--invoice-history-text': '#c9bcec',
  '--invoice-status-neutral-background': '#303136',
  '--invoice-status-neutral-text': '#c8c9cc',
  '--invoice-error-background': '#321f22',
  '--invoice-error-border': '#613038',
  '--invoice-error-text': '#ffb9c0',
  '--invoice-loading': '#292a2d',
};

const STATUS_FILTERS: Array<{
  filter: InvoiceStatusFilter;
  label: string;
  countKey:
    | 'totalCount'
    | 'openCount'
    | 'overdueCount'
    | 'paidCount'
    | 'historicalCount';
}> = [
  { filter: 'ALL', label: 'All', countKey: 'totalCount' },
  { filter: 'OPEN', label: 'Open', countKey: 'openCount' },
  { filter: 'OVERDUE', label: 'Overdue', countKey: 'overdueCount' },
  { filter: 'PAID', label: 'Paid', countKey: 'paidCount' },
  { filter: 'HISTORICAL', label: 'History', countKey: 'historicalCount' },
];

const getOutstandingLabel = (
  outstandingByCurrency: Record<string, number>,
): string => {
  const entries = Object.entries(outstandingByCurrency);

  if (entries.length === 0) {
    return '$0.00';
  }

  if (entries.length === 1) {
    const [currencyCode, amountMicros] = entries[0];

    return formatCurrency({ amountMicros, currencyCode }, currencyCode);
  }

  return `${entries.length} currencies`;
};

const InvoiceQueue = ({
  invoices,
  selectedInvoiceId,
  searchTerm,
  isLoading,
  onSearchTermChange,
  onSelectInvoice,
}: {
  invoices: InvoiceWorkspaceRecord[];
  selectedInvoiceId: string | null;
  searchTerm: string;
  isLoading: boolean;
  onSearchTermChange: (value: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}) => (
  <aside className="invoice-workspace-queue" aria-label="Invoice list">
    <div className="invoice-workspace-search-wrap">
      <input
        className="invoice-workspace-search"
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Search invoices or customers"
        aria-label="Search invoices"
      />
    </div>
    <div className="invoice-workspace-list" role="listbox" aria-label="Invoices">
      {isLoading ? (
        <>
          <div className="invoice-workspace-loading-row" />
          <div className="invoice-workspace-loading-row" />
          <div className="invoice-workspace-loading-row" />
        </>
      ) : invoices.length === 0 ? (
        <div className="invoice-workspace-empty">
          <strong>{searchTerm === '' ? 'No invoices here' : 'No matches'}</strong>
          <span>
            {searchTerm === ''
              ? 'Invoices that match this status will appear here.'
              : 'Try an invoice number, customer name, or another status.'}
          </span>
        </div>
      ) : (
        invoices.map((invoice) => (
          <button
            className="invoice-workspace-row"
            key={invoice.id}
            type="button"
            role="option"
            aria-selected={invoice.id === selectedInvoiceId}
            onClick={() => onSelectInvoice(invoice.id)}
          >
            <span className="invoice-workspace-row-top">
              <span className="invoice-workspace-row-number">
                {getInvoiceDisplayNumber(invoice)}
              </span>
              <span className="invoice-workspace-status" data-status={invoice.status}>
                {getInvoiceStatusLabel(invoice.status)}
              </span>
            </span>
            <span className="invoice-workspace-row-customer">
              {getInvoiceCustomerName(invoice)}
            </span>
            <span className="invoice-workspace-row-bottom">
              <span>Due {formatInvoiceDate(invoice.dueDate)}</span>
              <span className="invoice-workspace-row-amount">
                {formatCurrency(invoice.balanceDue, invoice.currencyCode)}
              </span>
            </span>
          </button>
        ))
      )}
    </div>
  </aside>
);

const InvoiceDocument = ({
  invoice,
  onBack,
}: {
  invoice: InvoiceWorkspaceRecord | null;
  onBack: () => void;
}) => (
  <main className="invoice-workspace-stage" aria-label="Invoice preview">
    <div className="invoice-workspace-document-toolbar">
      <button className="invoice-workspace-back" type="button" onClick={onBack}>
        Back to invoices
      </button>
      {invoice !== null && (
        <span className="invoice-workspace-document-caption">
          Review mode · Edit from the invoice record
        </span>
      )}
    </div>
    {invoice === null ? (
      <div className="invoice-workspace-empty">
        <strong>Select an invoice</strong>
        <span>Choose an invoice to review its document, balance, and payments.</span>
      </div>
    ) : (
      <article className="invoice-workspace-document">
        <header className="invoice-workspace-document-header">
          <div>
            <h2 className="invoice-workspace-document-title">Invoice</h2>
            <div className="invoice-workspace-document-number">
              {getInvoiceDisplayNumber(invoice)}
            </div>
          </div>
          <dl className="invoice-workspace-document-meta">
            <dt>Status</dt>
            <dd>
              <span className="invoice-workspace-status" data-status={invoice.status}>
                {getInvoiceStatusLabel(invoice.status)}
              </span>
            </dd>
            <dt>Issued</dt>
            <dd>{formatInvoiceDate(invoice.issueDate)}</dd>
            <dt>Due</dt>
            <dd>{formatInvoiceDate(invoice.dueDate)}</dd>
          </dl>
        </header>

        <section className="invoice-workspace-bill-to">
          <div className="invoice-workspace-document-label">Bill to</div>
          <div className="invoice-workspace-customer-name">
            {getInvoiceCustomerName(invoice)}
          </div>
          {invoice.company !== null && invoice.person !== null && (
            <div className="invoice-workspace-customer-contact">
              {[invoice.person.firstName, invoice.person.lastName]
                .filter(Boolean)
                .join(' ')}
            </div>
          )}
        </section>

        <table className="invoice-workspace-line-items">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td className="invoice-workspace-no-lines" colSpan={4}>
                  No line items are linked to this invoice.
                </td>
              </tr>
            ) : (
              invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="invoice-workspace-item-description">
                      {item.description}
                    </div>
                    {item.longDescription !== null && (
                      <div className="invoice-workspace-item-note">
                        {item.longDescription}
                      </div>
                    )}
                  </td>
                  <td>
                    {Number.isInteger(item.quantity)
                      ? item.quantity
                      : item.quantity.toFixed(2)}
                    {item.unit ? ` ${item.unit}` : ''}
                  </td>
                  <td>{formatCurrency(item.unitPrice, invoice.currencyCode)}</td>
                  <td>{formatCurrency(item.total, invoice.currencyCode)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <section className="invoice-workspace-totals">
          <div className="invoice-workspace-notes">
            {invoice.clientNote === null ? (
              <span>No customer note on this invoice.</span>
            ) : (
              <>
                <div className="invoice-workspace-document-label">Note</div>
                <div>{invoice.clientNote}</div>
              </>
            )}
          </div>
          <dl className="invoice-workspace-totals-list">
            <div className="invoice-workspace-total-row">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(invoice.subtotal, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row">
              <dt>Tax</dt>
              <dd>{formatCurrency(invoice.tax, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row">
              <dt>Discount</dt>
              <dd>−{formatCurrency(invoice.discount, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row">
              <dt>Adjustment</dt>
              <dd>{formatCurrency(invoice.adjustment, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row" data-total="true">
              <dt>Total</dt>
              <dd>{formatCurrency(invoice.total, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row">
              <dt>Paid</dt>
              <dd>−{formatCurrency(invoice.amountPaid, invoice.currencyCode)}</dd>
            </div>
            <div className="invoice-workspace-total-row" data-balance="true">
              <dt>Balance due</dt>
              <dd>{formatCurrency(invoice.balanceDue, invoice.currencyCode)}</dd>
            </div>
          </dl>
        </section>

        <footer className="invoice-workspace-document-footer">
          This workspace reflects the invoice totals stored in Twenty. Open the record
          to edit fields or related line items.
        </footer>
      </article>
    )}
  </main>
);

const InvoiceInspector = ({
  invoice,
  onOpenInvoice,
}: {
  invoice: InvoiceWorkspaceRecord | null;
  onOpenInvoice: () => Promise<void>;
}) => (
  <aside className="invoice-workspace-inspector" aria-label="Invoice details">
    <h2>Invoice details</h2>
    {invoice === null ? (
      <div className="invoice-workspace-empty">
        <span>Select an invoice to see its payments and source details.</span>
      </div>
    ) : (
      <>
        <section className="invoice-workspace-inspector-section">
          <div className="invoice-workspace-inspector-heading">
            <h3>Payments</h3>
            <span>{invoice.payments.length}</span>
          </div>
          {invoice.payments.length === 0 ? (
            <div className="invoice-workspace-empty-note">
              No payments are linked to this invoice.
            </div>
          ) : (
            invoice.payments.map((payment) => (
              <div className="invoice-workspace-payment" key={payment.id}>
                <span className="invoice-workspace-payment-dot" aria-hidden="true" />
                <div>
                  <div className="invoice-workspace-payment-name">
                    {payment.method || 'Payment'}
                  </div>
                  <div className="invoice-workspace-payment-date">
                    {formatInvoiceDate(payment.paymentDate)}
                  </div>
                </div>
                <div className="invoice-workspace-payment-amount">
                  {formatCurrency(payment.amount, invoice.currencyCode)}
                </div>
                {(payment.transactionId !== null || payment.note !== null) && (
                  <div className="invoice-workspace-payment-note">
                    {[payment.transactionId, payment.note].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        <section className="invoice-workspace-inspector-section">
          <div className="invoice-workspace-inspector-heading">
            <h3>Record</h3>
          </div>
          <dl className="invoice-workspace-detail-list">
            <div className="invoice-workspace-detail-row">
              <dt>Customer</dt>
              <dd>{getInvoiceCustomerName(invoice)}</dd>
            </div>
            <div className="invoice-workspace-detail-row">
              <dt>Source</dt>
              <dd>{invoice.sourceSystem || 'Manual'}</dd>
            </div>
            <div className="invoice-workspace-detail-row">
              <dt>Source status</dt>
              <dd>{invoice.sourceStatus || 'Not set'}</dd>
            </div>
            <div className="invoice-workspace-detail-row">
              <dt>Currency</dt>
              <dd>{invoice.currencyCode}</dd>
            </div>
            <div className="invoice-workspace-detail-row">
              <dt>Line items</dt>
              <dd>{invoice.items.length}</dd>
            </div>
          </dl>
          {invoice.hasDiscrepancy && (
            <div className="invoice-workspace-discrepancy" role="alert">
              <strong>Totals need review.</strong>
              <br />
              {invoice.discrepancyNotes ||
                'This imported invoice has a reconciliation discrepancy.'}
            </div>
          )}
          {invoice.adminNote !== null && (
            <div className="invoice-workspace-discrepancy">
              <strong>Internal note</strong>
              <br />
              {invoice.adminNote}
            </div>
          )}
        </section>

        <button
          className="invoice-workspace-button"
          data-primary="true"
          type="button"
          onClick={() => void onOpenInvoice()}
        >
          Open invoice record
        </button>
      </>
    )}
  </aside>
);

export const InvoiceWorkspace = () => {
  const colorScheme = useColorScheme();
  const { invoices, isLoading, isRefreshing, errorMessage, refreshInvoices } =
    useInvoiceWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'document'>('list');

  const summary = useMemo(() => getInvoiceSummary(invoices), [invoices]);
  const visibleInvoices = useMemo(
    () => filterInvoices(invoices, searchTerm, statusFilter),
    [invoices, searchTerm, statusFilter],
  );
  const selectedInvoice =
    visibleInvoices.find((invoice) => invoice.id === selectedInvoiceId) ??
    visibleInvoices[0] ??
    null;

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setMobileView('document');
  };

  const handleOpenInvoice = async () => {
    if (selectedInvoice === null) {
      return;
    }

    try {
      await navigate(AppPath.RecordShowPage, {
        objectNameSingular: 'invoice',
        objectRecordId: selectedInvoice.id,
      });
    } catch (error) {
      await enqueueSnackbar({
        message:
          error instanceof Error
            ? error.message
            : 'The invoice record could not be opened.',
        variant: 'error',
      });
    }
  };

  return (
    <div
      className="invoice-workspace-root"
      data-mobile-view={mobileView}
      style={colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS}
    >
      <style>{INVOICE_WORKSPACE_STYLES}</style>
      <header className="invoice-workspace-topbar">
        <div className="invoice-workspace-title">
          <h1>Invoices</h1>
          <p>Review balances, due dates, line items, and recorded payments</p>
        </div>
        <div className="invoice-workspace-actions">
          <button
            className="invoice-workspace-button"
            type="button"
            disabled={isRefreshing}
            onClick={() => void refreshInvoices()}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="invoice-workspace-button"
            data-primary="true"
            type="button"
            disabled={selectedInvoice === null}
            onClick={() => void handleOpenInvoice()}
          >
            Open record
          </button>
        </div>
      </header>

      <nav className="invoice-workspace-status-strip" aria-label="Invoice status filters">
        <div className="invoice-workspace-summary">
          <span className="invoice-workspace-summary-label">Outstanding</span>
          <span className="invoice-workspace-summary-value">
            {getOutstandingLabel(summary.outstandingByCurrency)}
          </span>
        </div>
        {STATUS_FILTERS.map(({ filter, label, countKey }) => (
          <button
            className="invoice-workspace-filter"
            key={filter}
            type="button"
            aria-pressed={statusFilter === filter}
            onClick={() => setStatusFilter(filter)}
          >
            <span className="invoice-workspace-filter-label">{label}</span>
            <span className="invoice-workspace-filter-count">
              {summary[countKey]}
            </span>
          </button>
        ))}
      </nav>

      {errorMessage !== null && (
        <div className="invoice-workspace-error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void refreshInvoices(true)}>
            Try again
          </button>
        </div>
      )}

      <div className="invoice-workspace-layout">
        <InvoiceQueue
          invoices={visibleInvoices}
          selectedInvoiceId={selectedInvoice?.id ?? null}
          searchTerm={searchTerm}
          isLoading={isLoading}
          onSearchTermChange={setSearchTerm}
          onSelectInvoice={handleSelectInvoice}
        />
        <InvoiceDocument
          invoice={selectedInvoice}
          onBack={() => setMobileView('list')}
        />
        <InvoiceInspector
          invoice={selectedInvoice}
          onOpenInvoice={handleOpenInvoice}
        />
      </div>
    </div>
  );
};
