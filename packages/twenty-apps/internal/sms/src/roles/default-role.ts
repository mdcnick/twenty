import { defineApplicationRole } from 'twenty-sdk/define';

import {
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  SMS_CONSENT_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SMS_CONVERSATION_OBJECT_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'SMS default function role',
  description: 'Reads and writes only the SMS app records needed by its synchronous server functions.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    { objectUniversalIdentifier: SMS_CONVERSATION_OBJECT_UNIVERSAL_IDENTIFIER, canReadObjectRecords: true, canUpdateObjectRecords: true, canSoftDeleteObjectRecords: false, canDestroyObjectRecords: false },
    { objectUniversalIdentifier: SMS_MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER, canReadObjectRecords: true, canUpdateObjectRecords: true, canSoftDeleteObjectRecords: false, canDestroyObjectRecords: false },
    { objectUniversalIdentifier: SMS_CONSENT_EVENT_OBJECT_UNIVERSAL_IDENTIFIER, canReadObjectRecords: true, canUpdateObjectRecords: true, canSoftDeleteObjectRecords: false, canDestroyObjectRecords: false },
  ],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
