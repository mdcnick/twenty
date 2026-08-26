import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from 'src/objects/service-job.object';

export default defineNavigationMenuItem({
  universalIdentifier: '36b55255-38d5-4e1f-9fbe-c7ef83733bda',
  position: 2,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
});
