import { defineView, ViewType } from 'twenty-sdk/define';

import { COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-maintenance-agreement.field';
import {
  MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-agreement.object';

export const AGREEMENT_BOARD_VIEW_UNIVERSAL_IDENTIFIER =
  'eb1e70fc-7d8a-4f92-8f5d-fdaa9e5bb8f6';

const GROUPS = [
  ['ed98c8d9-14b7-4945-8d39-0467fdd2a1b7', 'DRAFT'],
  ['9360b880-d3eb-431a-94db-af225810db11', 'ACTIVE'],
  ['3b082bd8-e145-4cb7-a632-880715f94f46', 'PAUSED'],
  ['8b25c47a-195d-4f5a-bab5-75738ef7855b', 'EXPIRED'],
  ['3781a86c-2ba8-422c-813a-f1728c9e37da', 'CANCELLED'],
] as const;

export default defineView({
  universalIdentifier: AGREEMENT_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Agreement board',
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'f3103d22-5531-4029-8642-3b5600f8c7b3',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '9d7395b3-124a-4b5e-bfaa-4f75ae39b4a5',
      fieldMetadataUniversalIdentifier:
        COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '04712d2a-0f44-4998-8cfe-37612dec020e',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '63835e21-08e8-4c5d-9cf8-acdc0efae4d4',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
  ],
  groups: GROUPS.map(([universalIdentifier, fieldValue], position) => ({
    universalIdentifier,
    fieldValue,
    position,
    isVisible: true,
  })),
});
