import { defineLogicFunction } from 'twenty-sdk/define';

// The SDK exposes no transactional object-record writer to logic functions in 2.35.
const handler = async () => {
  throw new Error('Manual recalculation requires an injected transactional repository; no update was attempted.');
};

export default defineLogicFunction({
  universalIdentifier: '073a0d71-1d4a-47c8-b0d5-d3d7fc18a8e6',
  name: 'recalculate-invoice',
  description: 'Fails closed until a transactional invoice repository is configured.',
  timeoutSeconds: 5,
  handler,
  workflowActionTriggerSettings: {
    label: 'Recalculate invoice',
    icon: 'IconCalculator',
  },
});
