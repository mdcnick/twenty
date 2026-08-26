import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  INVOICE_WORKSPACE_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  INVOICE_WORKSPACE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier:
    INVOICE_WORKSPACE_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Invoices',
  icon: 'IconFileInvoice',
  position: 2,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier:
    INVOICE_WORKSPACE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
