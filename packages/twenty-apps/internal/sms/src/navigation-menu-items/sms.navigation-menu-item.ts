import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  SMS_INBOX_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  SMS_INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SMS_INBOX_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'SMS conversations',
  icon: 'IconMessage',
  position: 0,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: SMS_INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
