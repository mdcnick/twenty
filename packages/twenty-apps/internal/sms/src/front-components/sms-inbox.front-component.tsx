import { defineFrontComponent } from 'twenty-sdk/define';

import { SMS_INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SmsInbox } from 'src/front-components/components/SmsInbox';

export default defineFrontComponent({
  universalIdentifier: SMS_INBOX_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'sms-inbox',
  description:
    'Conversation-first SMS inbox with a message thread and reply composer.',
  component: SmsInbox,
});
