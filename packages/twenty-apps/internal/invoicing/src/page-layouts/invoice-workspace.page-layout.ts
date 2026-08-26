import {
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  INVOICE_WORKSPACE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  INVOICE_WORKSPACE_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  INVOICE_WORKSPACE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  INVOICE_WORKSPACE_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: INVOICE_WORKSPACE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Invoices',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier:
        INVOICE_WORKSPACE_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Invoice workspace',
      position: 0,
      icon: 'IconFileInvoice',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            INVOICE_WORKSPACE_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Invoices',
          type: 'FRONT_COMPONENT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              INVOICE_WORKSPACE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
