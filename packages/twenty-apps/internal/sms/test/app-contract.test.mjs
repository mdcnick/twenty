import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const appPath = process.cwd();
const sourcePath = path.join(appPath, 'src');
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const read = (relativePath) => readFile(path.join(appPath, relativePath), 'utf8');

test('uses unique UUIDv4 universal identifiers', async () => {
  const source = await read('src/constants/universal-identifiers.ts');
  const identifiers = [...source.matchAll(/'([0-9a-f-]{36})'/gi)].map((match) => match[1]);
  assert.ok(identifiers.length >= 40);
  assert.ok(identifiers.every((identifier) => UUID_V4.test(identifier)));
  assert.equal(new Set(identifiers).size, identifiers.length);
});

test('declares the model, unique keys, reciprocal relations, and default-deny role', async () => {
  const [conversation, message, consent, fields, role] = await Promise.all([
    read('src/objects/sms-conversation.object.ts'), read('src/objects/sms-message.object.ts'), read('src/objects/sms-consent-event.object.ts'),
    Promise.all((await readdir(path.join(sourcePath, 'fields'))).map((file) => read(`src/fields/${file}`))).then((files) => files.join('\n')),
    read('src/roles/default-role.ts'),
  ]);
  for (const object of [conversation, message, consent]) assert.match(object, /defineObject/);
  assert.match(message, /providerMessageId/); assert.match(message, /providerContactId/); assert.match(message, /lastDeliveryDedupeKey/); assert.match(message, /lastDeliveryOccurredAt/); assert.match(message, /lastProviderDeliveryStatus/); assert.match(message, /dedupeKey/); assert.match(consent, /dedupeKey/);
  assert.match(fields, /STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS\.person/); assert.match(fields, /STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS\.company/);
  assert.match(fields, /OnDeleteAction\.SET_NULL/); assert.match(fields, /OnDeleteAction\.CASCADE/);
  assert.match(role, /canReadAllObjectRecords: false/);
  for (const name of ['SMS_CONVERSATION_OBJECT_UNIVERSAL_IDENTIFIER', 'SMS_MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER', 'SMS_CONSENT_EVENT_OBJECT_UNIVERSAL_IDENTIFIER']) assert.match(role, new RegExp(name));
  assert.doesNotMatch(role, /STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS/);
});

test('requires appropriately secret Sinch variables and does not include credentials', async () => {
  const config = await read('src/application.config.ts');
  for (const name of ['SINCH_PROJECT_ID', 'SINCH_CONVERSATION_APP_ID', 'SINCH_KEY_ID', 'SINCH_KEY_SECRET', 'SINCH_SMS_FROM_NUMBER', 'SINCH_WEBHOOK_SECRET', 'SINCH_CONVERSATION_REGION']) assert.match(config, new RegExp(name));
  for (const name of ['SINCH_KEY_SECRET', 'SINCH_WEBHOOK_SECRET']) assert.match(config, new RegExp(`${name}: \\{[^}]*isSecret: true`));
  assert.doesNotMatch(config, /SINCH_ACCESS_TOKEN/);
  assert.doesNotMatch(config, /(?:sk_|api[_-]?key|bearer)\s*[:=]\s*['"][^'"]{12,}/i);
});

test('owns an inbox page instead of exposing the conversation object table', async () => {
  const [navigation, pageLayout, frontComponent, sendRoute] = await Promise.all([
    read('src/navigation-menu-items/sms.navigation-menu-item.ts'),
    read('src/page-layouts/sms-inbox.page-layout.ts'),
    read('src/front-components/sms-inbox.front-component.tsx'),
    read('src/logic-functions/send-sms-route.ts'),
  ]);

  assert.match(navigation, /NavigationMenuItemType\.PAGE_LAYOUT/);
  assert.match(navigation, /SMS_INBOX_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER/);
  assert.doesNotMatch(navigation, /NavigationMenuItemType\.OBJECT/);
  assert.match(pageLayout, /type:\s*'STANDALONE_PAGE'/);
  assert.match(pageLayout, /configurationType:\s*'FRONT_COMPONENT'/);
  assert.match(frontComponent, /defineFrontComponent/);
  assert.match(frontComponent, /SmsInbox/);
  assert.match(sendRoute, /path:\s*'\/sms\/send'/);
  assert.match(sendRoute, /isAuthRequired:\s*true/);
});

test('exposes one unauthenticated Sinch callback route with only signature headers forwarded', async () => {
  const webhook = await read('src/logic-functions/sinch-webhook.ts');

  assert.match(webhook, /path:\s*'\/sms\/sinch\/webhook'/);
  assert.match(webhook, /httpMethod:\s*'POST'/);
  assert.match(webhook, /isAuthRequired:\s*false/);
  for (const header of [
    'x-sinch-webhook-signature',
    'x-sinch-webhook-signature-nonce',
    'x-sinch-webhook-signature-timestamp',
    'x-sinch-webhook-signature-algorithm',
  ]) {
    assert.match(webhook, new RegExp(header));
  }
});
