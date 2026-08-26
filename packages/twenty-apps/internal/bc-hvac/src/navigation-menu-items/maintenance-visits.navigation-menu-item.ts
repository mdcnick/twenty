import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-visit.object';

export default defineNavigationMenuItem({
  universalIdentifier: 'ae17a829-14c6-4568-b7e9-d4676cede310',
  position: 4,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
});
