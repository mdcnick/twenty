import { defineLogicFunction } from 'twenty-sdk/define';
import { SMS_SEND_WORKFLOW_ACTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { sendSms } from 'src/logic-functions/handlers';

export default defineLogicFunction({
  universalIdentifier: SMS_SEND_WORKFLOW_ACTION_UNIVERSAL_IDENTIFIER,
  name: 'send-sms',
  description: 'Sends one SMS through Sinch after a suppression check. Provider failures are never recorded as sent.',
  timeoutSeconds: 30,
  workflowActionTriggerSettings: {
    label: 'Send SMS',
    icon: 'IconSend',
    inputSchema: [{ type: 'object', properties: { toNumber: { type: 'string' }, text: { type: 'string', multiline: true }, idempotencyKey: { type: 'string' } } }],
    outputSchema: [{ type: 'object', properties: { success: { type: 'boolean' }, providerMessageId: { type: 'string' }, error: { type: 'string' }, persistence: { type: 'string' } } }],
  },
  handler: (input) => sendSms(input as { toNumber: string; text: string; idempotencyKey: string }),
});
