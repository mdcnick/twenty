import {
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  SMS_INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  SMS_INBOX_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  SMS_INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  SMS_INBOX_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: SMS_INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'SMS conversations',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: SMS_INBOX_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Inbox',
      position: 0,
      icon: 'IconMessage',
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      widgets: [
        {
          universalIdentifier:
            SMS_INBOX_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'SMS conversations',
          type: 'FRONT_COMPONENT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              SMS_INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
