import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';

export default defineNavigationMenuItem({
  universalIdentifier: 'e729823b-96bd-46db-8e03-17b1040c0afc',
  position: 3,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
});
