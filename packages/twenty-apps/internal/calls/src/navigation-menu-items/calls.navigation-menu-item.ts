import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { CALL_EVENT_UNIVERSAL_IDENTIFIER } from '../constants';

export default defineNavigationMenuItem({
  universalIdentifier: '37d0ffdf-b7a9-445e-867d-158c1692eefd',
  name: 'Calls',
  icon: 'IconPhoneCall',
  position: 1,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: CALL_EVENT_UNIVERSAL_IDENTIFIER,
});
