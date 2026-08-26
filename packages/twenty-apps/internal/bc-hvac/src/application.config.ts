import { defineApplication } from 'twenty-sdk/define';

export const APPLICATION_UNIVERSAL_IDENTIFIER =
  '7a91dcb8-ac69-413a-9802-df0866158fec';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'BC HVAC',
  description:
    'HVAC equipment, service call booking, job photos, and maintenance agreements',
});
