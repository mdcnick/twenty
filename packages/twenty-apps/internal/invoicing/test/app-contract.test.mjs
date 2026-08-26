import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const source = join(root, 'src');
const read = (path) => readFileSync(path, 'utf8');
const files = (directory) => readdirSync(directory).filter((file) => file.endsWith('.ts')).map((file) => join(directory, file));
const uuid = /['"][0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}['"]/gi;

test('declares a manifest-extractable app, objects, fields, indexes, and least-privilege role', () => {
  assert.match(read(join(source, 'application.config.ts')), /export\s+default\s+defineApplication\s*\(/);
  for (const [directory, definition] of [['objects', 'defineObject'], ['fields', 'defineField'], ['indexes', 'defineIndex']]) {
    for (const file of files(join(source, directory))) assert.match(read(file), new RegExp(`export\\s+default\\s+${definition}\\s*\\(`));
  }
  const role = read(join(source, 'roles/default-role.ts'));
  assert.match(role, /defineApplicationRole/);
  assert.match(role, /canReadAllObjectRecords:\s*false/);
  assert.match(role, /canUpdateAllObjectRecords:\s*false/);
});

test('defines every object, unique source ID index, and reciprocal relationship', () => {
  for (const objectName of ['invoice', 'invoice-item', 'payment']) {
    const object = read(join(source, 'objects', `${objectName}.object.ts`));
    assert.match(object, /name: 'sourceExternalId'/);
    assert.match(object, uuid);
  }
  for (const index of files(join(source, 'indexes'))) assert.match(read(index), /isUnique:\s*true/);
  for (const pair of [['company-on-invoice', 'invoices-on-company'], ['person-on-invoice', 'invoices-on-person'], ['invoice-on-invoice-item', 'invoice-items-on-invoice'], ['invoice-on-payment', 'payments-on-invoice']]) {
    assert.equal(existsSync(join(source, 'fields', `${pair[0]}.field.ts`)), true);
    assert.equal(existsSync(join(source, 'fields', `${pair[1]}.field.ts`)), true);
    assert.match(read(join(source, 'fields', `${pair[0]}.field.ts`)), /RelationType\.MANY_TO_ONE/);
    assert.match(read(join(source, 'fields', `${pair[1]}.field.ts`)), /RelationType\.ONE_TO_MANY/);
  }
});

test('does not include provider credentials or an unsafe live migration writer', () => {
  const allSource = [...files(join(source, 'objects')), ...files(join(source, 'fields')), ...files(join(source, 'migration'))].map(read).join('\n');
  assert.doesNotMatch(allSource, /clientSecret|accessToken|refreshToken|password|apiKey|fetch\(/i);
});

test('restricts invoice deletion while child invoice items or payments exist', () => {
  for (const field of ['invoice-on-invoice-item.field.ts', 'invoice-on-payment.field.ts']) {
    assert.match(read(join(source, 'fields', field)), /onDelete:\s*OnDeleteAction\.RESTRICT/);
  }
  assert.match(read(join(source, 'logic-functions/recalculate-invoice.function.ts')), /workflowActionTriggerSettings/);
});

test('routes the sidebar to a standalone invoice workspace instead of the object table', () => {
  const navigationItem = read(
    join(source, 'navigation-menu-items/invoicing.navigation-menu-item.ts'),
  );
  const pageLayout = read(
    join(source, 'page-layouts/invoice-workspace.page-layout.ts'),
  );
  const frontComponent = read(
    join(source, 'front-components/invoice-workspace.front-component.tsx'),
  );

  assert.match(navigationItem, /NavigationMenuItemType\.PAGE_LAYOUT/);
  assert.doesNotMatch(navigationItem, /targetObjectUniversalIdentifier/);
  assert.match(pageLayout, /type:\s*'STANDALONE_PAGE'/);
  assert.match(pageLayout, /type:\s*'FRONT_COMPONENT'/);
  assert.match(frontComponent, /defineFrontComponent/);
  assert.match(frontComponent, /InvoiceWorkspace/);
});

test('allows the app runtime to read invoice workspace records and linked customers', () => {
  const role = read(join(source, 'roles/default-role.ts'));

  for (const objectIdentifier of [
    'INVOICE_UNIVERSAL_IDENTIFIER',
    'INVOICE_ITEM_UNIVERSAL_IDENTIFIER',
    'PAYMENT_UNIVERSAL_IDENTIFIER',
    'STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier',
    'STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier',
  ]) {
    assert.match(
      role,
      new RegExp(
        `objectUniversalIdentifier:\\s*${objectIdentifier.replaceAll('.', '\\.')}` +
          `[\\s\\S]*?canReadObjectRecords:\\s*true`,
      ),
    );
  }
});
