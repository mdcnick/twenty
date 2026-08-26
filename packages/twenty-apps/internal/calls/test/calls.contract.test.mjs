import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const source = (path) => readFileSync(join(root, path), 'utf8');
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('declares a standalone Calls manifest with the required secure server variables', () => {
  const manifest = source('src/application.config.ts');
  assert.match(manifest, /displayName:\s*'Calls'/);
  for (const variable of [
    'SINCH_VOICE_BASE_URL',
    'SINCH_VOICE_TOKEN',
    'SINCH_VOICE_FROM_NUMBER',
    'SINCH_VOICE_WEBHOOK_SECRET',
    'SINCH_VOICE_FORWARD_TO',
  ]) assert.match(manifest, new RegExp(variable));
  assert.match(manifest, /SINCH_VOICE_TOKEN[\s\S]{0,300}isSecret:\s*true/);
  assert.match(manifest, /SINCH_VOICE_WEBHOOK_SECRET[\s\S]{0,300}isSecret:\s*true/);
  assert.doesNotMatch(manifest, /value:\s*['"][^'"]+['"]/);
});

test('defines the CallEvent object and UUIDv4-backed reciprocal Person and Company relations', () => {
  const object = source('src/objects/call-event.object.ts');
  for (const field of ['providerCallId', 'parentCallId', 'fromNumber', 'toNumber', 'direction', 'status', 'providerStatus', 'durationSeconds', 'answeredBy', 'startedAt', 'endedAt', 'providerEventType', 'providerError', 'payloadHash', 'externalSourceId']) {
    assert.match(object, new RegExp(`name:\\s*'${field}'`));
  }
  assert.match(object, /isUnique:\s*true/);
  const request = source('src/objects/call-request.object.ts');
  assert.match(request, /name:\s*'requestKey'/);
  assert.match(request, /isUnique:\s*true/);
  for (const file of ['src/fields/person-on-call-event.field.ts', 'src/fields/call-events-on-person.field.ts', 'src/fields/company-on-call-event.field.ts', 'src/fields/call-events-on-company.field.ts']) {
    assert.equal(existsSync(join(root, file)), true, `${file} must exist`);
  }
  const allSource = readdirSync(join(root, 'src'), { recursive: true })
    .filter((file) => typeof file === 'string' && file.endsWith('.ts'))
    .map((file) => source(`src/${file}`)).join('\n');
  for (const value of allSource.matchAll(/[0-9a-f]{8}-[0-9a-f-]{27,36}/g)) assert.match(value[0], uuidV4);
});

test('keeps the default role least-privilege and scopes CallEvent writes', () => {
  const role = source('src/roles/default-role.ts');
  for (const permission of ['canReadAllObjectRecords: false', 'canUpdateAllObjectRecords: false', 'canSoftDeleteAllObjectRecords: false', 'canDestroyAllObjectRecords: false', 'canUpdateAllSettings: false']) assert.match(role, new RegExp(permission));
  assert.match(role, /CALL_EVENT_UNIVERSAL_IDENTIFIER/);
});

test('does not include excluded stream or softphone implementations', () => {
  const readTree = (directory) => readdirSync(directory, { recursive: true })
    .filter((file) => typeof file === 'string' && file.endsWith('.ts'))
    .map((file) => readFileSync(join(directory, file), 'utf8')).join('\n');
  assert.doesNotMatch(readTree(join(root, 'src')), /\b(connectStream|WebSocket|softphone)\b/i);
  assert.match(source('README.md'), /does not implement audio streaming, SIP\/RTP, a softphone, recording\/media, or transcription\/AI/i);
});
