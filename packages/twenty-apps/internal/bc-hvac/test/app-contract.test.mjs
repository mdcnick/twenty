import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const APP_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIRECTORY = join(APP_ROOT, 'src');
const OBJECTS_DIRECTORY = join(SOURCE_DIRECTORY, 'objects');
const FIELDS_DIRECTORY = join(SOURCE_DIRECTORY, 'fields');
const INDEXES_DIRECTORY = join(SOURCE_DIRECTORY, 'indexes');
const NAVIGATION_MENU_ITEMS_DIRECTORY = join(
  SOURCE_DIRECTORY,
  'navigation-menu-items',
);
const ROLES_DIRECTORY = join(SOURCE_DIRECTORY, 'roles');
const VIEWS_DIRECTORY = join(SOURCE_DIRECTORY, 'views');
const LOGIC_FUNCTIONS_DIRECTORY = join(SOURCE_DIRECTORY, 'logic-functions');

const REQUIRED_OBJECTS = [
  'equipment.object.ts',
  'service-job.object.ts',
  'service-event.object.ts',
  'job-photo.object.ts',
  'maintenance-agreement.object.ts',
  'maintenance-coverage.object.ts',
  'maintenance-visit.object.ts',
];

const REQUIRED_RELATIONS = [
  ['company-on-equipment.field.ts', 'equipment-on-company.field.ts'],
  ['company-on-service-job.field.ts', 'service-jobs-on-company.field.ts'],
  ['service-contact-on-service-job.field.ts', 'service-jobs-on-person.field.ts'],
  ['equipment-on-service-job.field.ts', 'service-jobs-on-equipment.field.ts'],
  ['company-on-service-event.field.ts', 'service-events-on-company.field.ts'],
  ['equipment-on-service-event.field.ts', 'service-events-on-equipment.field.ts'],
  ['service-job-on-service-event.field.ts', 'service-events-on-service-job.field.ts'],
  ['service-job-on-job-photo.field.ts', 'job-photos-on-service-job.field.ts'],
  [
    'company-on-maintenance-agreement.field.ts',
    'maintenance-agreements-on-company.field.ts',
  ],
  [
    'primary-contact-on-maintenance-agreement.field.ts',
    'maintenance-agreements-on-person.field.ts',
  ],
  [
    'maintenance-agreement-on-maintenance-coverage.field.ts',
    'maintenance-coverages-on-maintenance-agreement.field.ts',
  ],
  [
    'equipment-on-maintenance-coverage.field.ts',
    'maintenance-coverages-on-equipment.field.ts',
  ],
  [
    'maintenance-agreement-on-maintenance-visit.field.ts',
    'maintenance-visits-on-maintenance-agreement.field.ts',
  ],
  [
    'service-job-on-maintenance-visit.field.ts',
    'maintenance-visits-on-service-job.field.ts',
  ],
];

const EXTERNAL_ID_INDEXES = [
  {
    fileName: 'equipment-perfex-external-id.index.ts',
    objectIdentifier: 'EQUIPMENT_UNIVERSAL_IDENTIFIER',
    fieldIdentifier: 'EQUIPMENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER',
  },
  {
    fileName: 'service-job-perfex-external-id.index.ts',
    objectIdentifier: 'SERVICE_JOB_UNIVERSAL_IDENTIFIER',
    fieldIdentifier: 'SERVICE_JOB_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER',
  },
  {
    fileName: 'service-event-perfex-external-id.index.ts',
    objectIdentifier: 'SERVICE_EVENT_UNIVERSAL_IDENTIFIER',
    fieldIdentifier: 'SERVICE_EVENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER',
  },
  {
    fileName: 'job-photo-perfex-external-id.index.ts',
    objectIdentifier: 'JOB_PHOTO_UNIVERSAL_IDENTIFIER',
    fieldIdentifier: 'JOB_PHOTO_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER',
  },
];

const readSource = (path) => readFileSync(path, 'utf8');

const sourceFiles = (directory) =>
  readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.ts'))
    .map((fileName) => join(directory, fileName));

const entitySourceFiles = () => [
  join(SOURCE_DIRECTORY, 'application.config.ts'),
  ...sourceFiles(OBJECTS_DIRECTORY),
  ...sourceFiles(FIELDS_DIRECTORY),
  ...sourceFiles(INDEXES_DIRECTORY),
  ...sourceFiles(NAVIGATION_MENU_ITEMS_DIRECTORY),
  ...sourceFiles(VIEWS_DIRECTORY),
];

const assertDirectDefaultDefinition = (path, definition) => {
  assert.match(
    readSource(path),
    new RegExp(`export\\s+default\\s+${definition}\\s*\\(`),
    `${path} must directly default-export ${definition}(...) for manifest extraction`,
  );
};

const resolveAppImport = (sourcePath, specifier) => {
  const importPath = specifier.startsWith('src/')
    ? resolve(APP_ROOT, specifier)
    : resolve(dirname(sourcePath), specifier);
  const candidates = [
    importPath,
    `${importPath}.ts`,
    `${importPath}.tsx`,
    `${importPath}.js`,
    `${importPath}.mjs`,
    join(importPath, 'index.ts'),
  ];

  return candidates.find(existsSync);
};

const identifierValue = (sourcePath, identifier) => {
  const source = readSource(sourcePath);
  const match = source.match(
    new RegExp(`export\\s+const\\s+${identifier}\\s*=\\s*['\"]([^'\"]+)['\"]`),
  );

  if (match) {
    return match[1];
  }

  const importPattern = new RegExp(
    `import\\s*{[^}]*\\b${identifier}\\b[^}]*}\\s*from\\s*['\"]((?:\\.\\.?\\/|src\\/)[^'\"]+)['\"]`,
  );
  const importMatch = source.match(importPattern);

  assert.ok(importMatch, `${identifier} must resolve to a local app constant`);

  const importedSourcePath = resolveAppImport(sourcePath, importMatch[1]);

  assert.ok(importedSourcePath, `${identifier} import must resolve`);

  return identifierValue(importedSourcePath, identifier);
};

const entityUniversalIdentifier = (sourcePath) => {
  const source = readSource(sourcePath);
  const match = source.match(/universalIdentifier:\s*([A-Z0-9_]+),/);

  assert.ok(match, 'entity must set universalIdentifier from a local constant');

  return identifierValue(sourcePath, match[1]);
};

const relationTargetFieldIdentifier = (source) => {
  const match = source.match(
    /relationTargetFieldMetadataUniversalIdentifier:\s*([A-Z0-9_]+),/,
  );

  assert.ok(match, 'relation must reference its reciprocal field identifier');

  return match[1];
};

test('uses direct default entity declarations discoverable by the Twenty manifest extractor', () => {
  assertDirectDefaultDefinition(
    join(SOURCE_DIRECTORY, 'application.config.ts'),
    'defineApplication',
  );

  for (const sourceFile of sourceFiles(OBJECTS_DIRECTORY)) {
    assertDirectDefaultDefinition(sourceFile, 'defineObject');
  }

  for (const sourceFile of sourceFiles(FIELDS_DIRECTORY)) {
    assertDirectDefaultDefinition(sourceFile, 'defineField');
  }

  for (const sourceFile of sourceFiles(INDEXES_DIRECTORY)) {
    assertDirectDefaultDefinition(sourceFile, 'defineIndex');
  }

  for (const sourceFile of sourceFiles(NAVIGATION_MENU_ITEMS_DIRECTORY)) {
    assertDirectDefaultDefinition(sourceFile, 'defineNavigationMenuItem');
  }

  for (const sourceFile of sourceFiles(VIEWS_DIRECTORY)) {
    assertDirectDefaultDefinition(sourceFile, 'defineView');
  }

  assertDirectDefaultDefinition(
    join(ROLES_DIRECTORY, 'default-role.ts'),
    'defineApplicationRole',
  );
});

test('resolves every local app import', () => {
  const appImportPattern = /from\s+['\"]((?:\.\.?\/|src\/)[^'\"]+)['\"]/g;

  for (const sourceFile of entitySourceFiles()) {
    const source = readSource(sourceFile);

    for (const match of source.matchAll(appImportPattern)) {
      assert.ok(
        resolveAppImport(sourceFile, match[1]),
        `${sourceFile} has an unresolved local import: ${match[1]}`,
      );
    }
  }
});

test('keeps idempotency fields on the four BC-Perfex migration objects', () => {
  for (const objectFileName of REQUIRED_OBJECTS.slice(0, 4)) {
    const objectPath = join(OBJECTS_DIRECTORY, objectFileName);

    assert.equal(existsSync(objectPath), true, `${objectFileName} must exist`);

    const source = readSource(objectPath);
    assert.match(source, /name:\s*'perfexExternalId'/);
    assert.match(source, /type:\s*FieldType\.TEXT/);
  }
});

test('uses distinct singular and plural API names for every custom object', () => {
  for (const objectFile of sourceFiles(OBJECTS_DIRECTORY)) {
    const object = readSource(objectFile);
    const singular = object.match(/nameSingular:\s*'([^']+)'/)?.[1];
    const plural = object.match(/namePlural:\s*'([^']+)'/)?.[1];

    assert.notEqual(singular, plural, objectFile);
  }
});

test('keeps a files field and migration metadata on job photos', () => {
  const source = readSource(join(OBJECTS_DIRECTORY, 'job-photo.object.ts'));

  assert.match(source, /name:\s*'content'/);
  assert.match(source, /type:\s*FieldType\.FILES/);
  assert.match(source, /name:\s*'sourceFilePath'/);
  assert.doesNotMatch(source, /clientSecret|accessToken|refreshToken/i);
});

test('defines resolvable reciprocal CRM, equipment, job, event, photo, and maintenance relations', () => {
  for (const [manyToOneFileName, oneToManyFileName] of REQUIRED_RELATIONS) {
    const manyToOnePath = join(FIELDS_DIRECTORY, manyToOneFileName);
    const oneToManyPath = join(FIELDS_DIRECTORY, oneToManyFileName);

    assert.equal(existsSync(manyToOnePath), true, `${manyToOneFileName} must exist`);
    assert.equal(existsSync(oneToManyPath), true, `${oneToManyFileName} must exist`);

    const manyToOneSource = readSource(manyToOnePath);
    const oneToManySource = readSource(oneToManyPath);

    assert.match(manyToOneSource, /relationType:\s*RelationType\.MANY_TO_ONE/);
    assert.match(
      manyToOneSource,
      /onDelete:\s*OnDeleteAction\.(?:SET_NULL|RESTRICT)/,
    );
    assert.match(manyToOneSource, /joinColumnName:/);
    assert.match(oneToManySource, /relationType:\s*RelationType\.ONE_TO_MANY/);

    const manyToOneTargetIdentifier = relationTargetFieldIdentifier(manyToOneSource);
    const oneToManyTargetIdentifier = relationTargetFieldIdentifier(oneToManySource);

    assert.equal(
      identifierValue(manyToOnePath, manyToOneTargetIdentifier),
      entityUniversalIdentifier(oneToManyPath),
      `${manyToOneFileName} must resolve to ${oneToManyFileName}`,
    );
    assert.equal(
      identifierValue(oneToManyPath, oneToManyTargetIdentifier),
      entityUniversalIdentifier(manyToOnePath),
      `${oneToManyFileName} must resolve to ${manyToOneFileName}`,
    );
  }
});

test('indexes every perfexExternalId uniquely', () => {
  for (const { fileName, objectIdentifier, fieldIdentifier } of EXTERNAL_ID_INDEXES) {
    const indexPath = join(INDEXES_DIRECTORY, fileName);

    assert.equal(existsSync(indexPath), true, `${fileName} must exist`);

    const source = readSource(indexPath);
    assertDirectDefaultDefinition(indexPath, 'defineIndex');
    assert.match(source, /isUnique:\s*true/);
    assert.match(source, new RegExp(`objectUniversalIdentifier:\\s*${objectIdentifier}`));
    assert.match(source, new RegExp(`fieldUniversalIdentifier:\\s*${fieldIdentifier}`));
  }
});

test('defines a reachable service call booking calendar with start and end times', () => {
  const calendarPath = join(
    VIEWS_DIRECTORY,
    'service-call-booking-calendar.view.ts',
  );
  const navigationPath = join(
    NAVIGATION_MENU_ITEMS_DIRECTORY,
    'service-jobs.navigation-menu-item.ts',
  );

  assert.equal(existsSync(calendarPath), true, 'booking calendar view must exist');
  assert.equal(
    existsSync(navigationPath),
    true,
    'service jobs must be reachable from workspace navigation',
  );

  const calendar = readSource(calendarPath);
  const navigation = readSource(navigationPath);

  assert.match(calendar, /name:\s*'Service call booking calendar'/);
  assert.match(calendar, /objectUniversalIdentifier:\s*SERVICE_JOB_UNIVERSAL_IDENTIFIER/);
  assert.match(calendar, /type:\s*ViewType\.CALENDAR/);
  assert.match(calendar, /calendarLayout:\s*ViewCalendarLayout\.WEEK/);
  assert.match(
    calendar,
    /calendarFieldMetadataUniversalIdentifier:\s*SERVICE_JOB_START_DATETIME_FIELD_UNIVERSAL_IDENTIFIER/,
  );
  assert.match(
    calendar,
    /calendarEndFieldMetadataUniversalIdentifier:\s*SERVICE_JOB_END_DATETIME_FIELD_UNIVERSAL_IDENTIFIER/,
  );
  assert.match(
    navigation,
    /targetObjectUniversalIdentifier:\s*SERVICE_JOB_UNIVERSAL_IDENTIFIER/,
  );
});

test('uses UUID v4 constants and has no provider secret fields', () => {
  const uuidV4Pattern =
    /['\"][0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}['\"]/gi;

  for (const sourceFile of entitySourceFiles()) {
    const source = readSource(sourceFile);
    assert.doesNotMatch(source, /clientSecret|accessToken|refreshToken|smsPayload|ocrPayload/i);
  }

  for (const objectFileName of REQUIRED_OBJECTS) {
    assert.match(
      readSource(join(OBJECTS_DIRECTORY, objectFileName)),
      uuidV4Pattern,
      `${objectFileName} must contain UUID v4 constants`,
    );
  }
});

test('exposes only the two server-owned HVAC tool functions', () => {
  const submitPath = join(
    LOGIC_FUNCTIONS_DIRECTORY,
    'submit-hvac-appointment.ts',
  );
  const lookupPath = join(
    LOGIC_FUNCTIONS_DIRECTORY,
    'lookup-existing-appointment.ts',
  );

  assert.equal(existsSync(submitPath), true);
  assert.equal(existsSync(lookupPath), true);
  assertDirectDefaultDefinition(submitPath, 'defineLogicFunction');
  assertDirectDefaultDefinition(lookupPath, 'defineLogicFunction');
  assert.match(readSource(submitPath), /name:\s*'submit-hvac-appointment'/);
  assert.match(readSource(lookupPath), /name:\s*'lookup-existing-appointment'/);
  assert.match(readSource(submitPath), /toolTriggerSettings:/);
  assert.match(readSource(lookupPath), /toolTriggerSettings:/);
});

test('uniquely indexes voice sourceRequestId and stores address and SMS state', () => {
  const serviceJobSource = readSource(
    join(OBJECTS_DIRECTORY, 'service-job.object.ts'),
  );
  const sourceRequestIndex = readSource(
    join(INDEXES_DIRECTORY, 'service-job-source-request-id.index.ts'),
  );

  assert.match(serviceJobSource, /name:\s*'serviceAddress'/);
  assert.match(serviceJobSource, /name:\s*'confirmationSmsSentAt'/);
  assert.match(sourceRequestIndex, /isUnique:\s*true/);
  assert.match(
    sourceRequestIndex,
    /SERVICE_JOB_SOURCE_FIELD_UNIVERSAL_IDENTIFIER/,
  );
  assert.match(
    sourceRequestIndex,
    /SERVICE_JOB_SOURCE_REQUEST_ID_FIELD_UNIVERSAL_IDENTIFIER/,
  );
});

test('grants app functions only required CRM record access', () => {
  const roleSource = readSource(join(ROLES_DIRECTORY, 'default-role.ts'));

  assert.match(roleSource, /STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS\.person/);
  assert.match(roleSource, /STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS\.company/);
  assert.match(roleSource, /SERVICE_JOB_UNIVERSAL_IDENTIFIER/);
  assert.match(roleSource, /canReadObjectRecords:\s*true/);
  assert.match(roleSource, /canUpdateObjectRecords:\s*true/);
  assert.match(roleSource, /canSoftDeleteObjectRecords:\s*false/);
  assert.match(roleSource, /canDestroyObjectRecords:\s*false/);
  assert.doesNotMatch(roleSource, /canReadAllObjectRecords:\s*true/);
  assert.doesNotMatch(roleSource, /canUpdateAllObjectRecords:\s*true/);
});
