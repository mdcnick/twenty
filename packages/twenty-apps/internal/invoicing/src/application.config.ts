import { defineApplication } from 'twenty-sdk/define';

export const APPLICATION_UNIVERSAL_IDENTIFIER =
  '1c62a88b-bce7-45ea-8ea4-595ccfb0efb8';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Invoicing',
  description: 'Manual and historical invoice records with offline Perfex migration helpers',
});
