import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import {
  clearTimeZoneFormatterCacheForTests,
  getTimeZoneFormatterCacheSizeForTests,
  transformBatch,
  transformEquipment,
  transformJobPhoto,
  transformServiceEvent,
  transformServiceJob,
  type RelationIndex,
} from '../../src/migration/index';

const relationIndex: RelationIndex = {
  company: {
    'perfex:clients:17': ['twenty-company-17'],
    'perfex:clients:18': ['twenty-company-18a', 'twenty-company-18b'],
  },
  person: {
    'perfex:contacts:33': ['twenty-person-33'],
    'perfex:contacts:34': ['twenty-person-34a', 'twenty-person-34b'],
  },
  equipment: {
    'perfex:hvac_hub_equipment:9': ['twenty-equipment-9'],
  },
  serviceJob: {
    'perfex:service_booking_bookings:55': ['twenty-service-job-55'],
  },
  serviceEventToServiceJob: {
    'perfex:hvac_hub_service_events:71': ['twenty-service-job-55'],
  },
  serviceJobToEquipment: {},
};

describe('BC-Perfex offline migration transforms', () => {
  it('maps equipment with a table-qualified source ID and one authoritative company relation', () => {
    const result = transformEquipment(
      {
        id: '9',
        client_id: 17,
        equipment_type: 'Furnace',
        install_date: '2020-01-02',
        active: '1',
      },
      relationIndex,
    );

    expect(result.record).toMatchObject({
      perfexExternalId: 'perfex:hvac_hub_equipment:9',
      values: {
        equipmentType: 'Furnace',
        installDate: '2020-01-02',
        isActive: true,
      },
    });
    expect(result.relations).toEqual([
      {
        relation: 'company',
        targetId: 'twenty-company-17',
        referenceExternalId: 'perfex:clients:17',
        targetObject: 'company',
        fieldName: 'company',
        writeKey: 'companyId',
      },
    ]);
    expect(result.exceptions).toEqual([]);
  });

  it('keeps lead-only and ambiguous equipment outside the write candidate set', () => {
    const leadOnly = transformEquipment(
      { id: 10, lead_id: '44', equipment_type: 'AC' },
      relationIndex,
    );
    const ambiguous = transformEquipment(
      { id: 11, client_id: 18, equipment_type: 'AC' },
      relationIndex,
    );

    expect(leadOnly.record).toBeNull();
    expect(leadOnly.exceptions.map(({ code }) => code)).toContain(
      'lead_only_equipment',
    );
    expect(ambiguous.record).toBeNull();
    expect(ambiguous.exceptions.map(({ code }) => code)).toContain(
      'ambiguous_company_reference',
    );
  });

  it('maps service jobs without inferring equipment from their company', () => {
    const result = transformServiceJob(
      {
        id: 55,
        client_id: '17',
        service_contact_id: '33',
        service_code: 'NO-HEAT',
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'urgent',
        appointment_window: '8-10 AM',
        source: 'phone',
        start_datetime: '2026-02-03 08:00:00',
        end_datetime: '2026-02-03 10:00:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
      },
      relationIndex,
    );

    expect(result.record?.perfexExternalId).toBe(
      'perfex:service_booking_bookings:55',
    );
    expect(result.relations.map(({ relation }) => relation)).toEqual([
      'company',
      'person',
    ]);
    expect(result.exceptions.map(({ code }) => code)).toContain(
      'missing_equipment_reference',
    );
  });

  it('links service events to jobs only through the explicit bridge map', () => {
    const linked = transformServiceEvent(
      {
        id: 71,
        client_id: 17,
        equipment_id: 9,
        invoice_id: 12,
        service_date: '2026-02-03',
        description: 'Replaced igniter',
        labor_total: '125.50',
        material_total: 44,
      },
      relationIndex,
    );
    const unlinked = transformServiceEvent(
      {
        id: 72,
        client_id: 17,
        service_date: '2026-02-03',
        description: 'Inspection',
      },
      relationIndex,
    );

    expect(linked.relations).toContainEqual({
      relation: 'serviceJob',
      targetId: 'twenty-service-job-55',
      referenceExternalId: 'perfex:hvac_hub_service_events:71',
      targetObject: 'serviceJob',
      fieldName: 'serviceJob',
      writeKey: 'serviceJobId',
    });
    expect(unlinked.relations).not.toContainEqual(
      expect.objectContaining({ relation: 'serviceJob' }),
    );
    expect(unlinked.exceptions.map(({ code }) => code)).toContain(
      'unlinked_service_event',
    );
  });

  it('keeps project-only photos unlinked and never dereferences their source path', () => {
    const result = transformJobPhoto(
      {
        id: 81,
        project_id: 2,
        filename: 'heat-pump.jpg',
        original_name: 'heat-pump-original.jpg',
        file_path: '/private/uploads/heat-pump.jpg',
        file_type: 'image/jpeg',
        file_size: '1234',
      },
      relationIndex,
    );

    expect(result.record?.values).toMatchObject({
      sourceFilePath: '/private/uploads/heat-pump.jpg',
      fileSizeBytes: 1234,
    });
    expect(result.relations).toEqual([]);
    expect(result.exceptions.map(({ code }) => code)).toContain(
      'project_only_photo',
    );
  });

  it('reports invalid values and duplicate source IDs without producing unsafe records', () => {
    const result = transformBatch(
      {
        equipment: [
          { id: 99, client_id: 17, equipment_type: 'Furnace' },
          { id: '99', client_id: 17, equipment_type: 'Furnace' },
        ],
        serviceEvents: [
          {
            id: 101,
            client_id: 17,
            service_date: 'not-a-date',
            description: 'Bad values',
            labor_total: 'not-a-decimal',
          },
        ],
      },
      relationIndex,
    );

    expect(result.summary.byCode.duplicate_source_id).toBe(2);
    expect(result.summary.byCode.invalid_date).toBe(1);
    expect(result.summary.byCode.invalid_decimal).toBe(1);
    expect(result.records).toHaveLength(0);
  });

  it('prints a deterministic, JSON-only bundled offline preview', () => {
    const stdout = execFileSync(process.execPath, ['scripts/preview-migration.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const preview = JSON.parse(stdout) as {
      records: unknown[];
      summary: { byCode: Record<string, number> };
    };

    expect(preview.records).toHaveLength(5);
    expect(preview.summary.byCode).toMatchObject({
      ambiguous_company_reference: 1,
      lead_only_equipment: 1,
      project_only_photo: 1,
      unlinked_service_event: 1,
    });
  });

  it('emits Twenty composite RICH_TEXT and CURRENCY payloads without float rounding', () => {
    const result = transformServiceEvent(
      {
        id: 120,
        client_id: 17,
        service_date: '2026-02-03',
        description: 'Replaced igniter',
        labor_total: '0.000001',
        material_total: '125.50',
      },
      relationIndex,
    );

    expect(result.record?.values.description).toEqual({
      markdown: 'Replaced igniter',
      blocknote: '',
    });
    expect(result.record?.values.laborTotal).toEqual({
      amountMicros: 1,
      currencyCode: 'USD',
    });
    expect(result.record?.values.materialTotal).toEqual({
      amountMicros: 125_500_000,
      currencyCode: 'USD',
    });
  });

  it('requires an unambiguous IANA timezone for local booking datetimes and UTC suffixes for UTC fields', () => {
    const valid = transformServiceJob(
      {
        id: 130,
        client_id: 17,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'urgent',
        source: 'phone',
        start_datetime: '2026-02-03 08:00:00',
        end_datetime: '2026-02-03 10:00:00',
        completed_at_utc: '2026-02-03T16:00:00Z',
        reopened_at_utc: '2026-02-04 10:00:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
      },
      relationIndex,
    );
    const gap = transformServiceJob(
      {
        id: 131,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'urgent',
        source: 'phone',
        start_datetime: '2026-03-08 02:30:00',
        end_datetime: '2026-03-08 03:30:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
      },
      relationIndex,
    );
    const fallback = transformServiceJob(
      {
        id: 132,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'urgent',
        source: 'phone',
        start_datetime: '2026-11-01 01:30:00',
        end_datetime: '2026-11-01 02:30:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
      },
      relationIndex,
    );

    expect(valid.record?.values).toMatchObject({
      startAt: '2026-02-03T14:00:00.000Z',
      endAt: '2026-02-03T16:00:00.000Z',
      completedAt: '2026-02-03T16:00:00.000Z',
      reopenedAt: '2026-02-04T10:00:00.000Z',
    });
    expect(valid.exceptions.map(({ code }) => code)).not.toContain('invalid_date');
    expect(gap.record).toBeNull();
    expect(gap.exceptions.map(({ code }) => code)).toContain(
      'nonexistent_local_datetime',
    );
    expect(fallback.record).toBeNull();
    expect(fallback.exceptions.map(({ code }) => code)).toContain(
      'ambiguous_local_datetime',
    );
  });

  it('allows nullable appointment windows and resolves job equipment only through an explicit bridge', () => {
    const result = transformServiceJob(
      {
        id: 140,
        client_id: 17,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'routine',
        source: 'phone',
        start_datetime: '2026-02-03 08:00:00',
        end_datetime: '2026-02-03 09:00:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
        equipment_id: 999,
      },
      {
        ...relationIndex,
        serviceJobToEquipment: {
          'perfex:service_booking_bookings:140': ['twenty-equipment-9'],
        },
      },
    );

    expect(result.record?.values.appointmentWindow).toBeNull();
    expect(result.exceptions.map(({ code }) => code)).not.toContain(
      'invalid_required_field',
    );
    expect(result.relations).toContainEqual({
      relation: 'equipment',
      targetObject: 'equipment',
      fieldName: 'equipment',
      writeKey: 'equipmentId',
      referenceExternalId: 'perfex:service_booking_bookings:140',
      targetId: 'twenty-equipment-9',
    });
  });

  it('carries complete exception provenance and preserves source defaults without accepting invalid booleans', () => {
    const absent = transformEquipment(
      { id: 150, client_id: 17, equipment_type: 'Furnace' },
      relationIndex,
    );
    const invalid = transformEquipment(
      { id: 151, client_id: 17, equipment_type: 'Furnace', active: 'sometimes' },
      relationIndex,
    );
    const photo = transformJobPhoto(
      {
        id: 152,
        booking_id: 55,
        filename: 'photo.jpg',
        original_name: 'photo.jpg',
        file_path: '/safe/metadata-only.jpg',
        date_taken: '2026-02-03 08:00:00',
      },
      relationIndex,
    );

    expect(absent.record?.values.isActive).toBe(true);
    expect(invalid.record).toBeNull();
    expect(invalid.exceptions).toContainEqual(
      expect.objectContaining({
        code: 'invalid_boolean',
        recordExternalId: 'perfex:hvac_hub_equipment:151',
        field: 'active',
        recommendedAction: 'repair_source_value',
      }),
    );
    expect(photo.record?.values.takenAt).toBeNull();
    expect(photo.exceptions).toContainEqual(
      expect.objectContaining({
        code: 'missing_timezone',
        recordExternalId: 'perfex:job_photos:152',
        field: 'photoTimezone',
        recommendedAction: 'provide_iana_timezone',
      }),
    );
  });

  it('reports relation field write keys and reconciles every preview exception to its source row', () => {
    const job = transformServiceJob(
      {
        id: 160,
        client_id: 17,
        service_contact_id: 33,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'routine',
        source: 'phone',
        start_datetime: '2026-02-03 08:00:00',
        end_datetime: '2026-02-03 09:00:00',
        booking_timezone: 'America/Chicago',
        status: 'pending',
      },
      relationIndex,
    );
    const stdout = execFileSync(process.execPath, ['scripts/preview-migration.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const preview = JSON.parse(stdout) as {
      exceptions: Array<{ recordExternalId?: string; recommendedAction?: string }>;
    };

    expect(job.relations).toContainEqual(
      expect.objectContaining({
        relation: 'person',
        targetObject: 'person',
        fieldName: 'serviceContact',
        writeKey: 'serviceContactId',
      }),
    );
    expect(
      preview.exceptions.every(
        (exception) =>
          exception.recordExternalId !== undefined &&
          exception.recommendedAction !== undefined,
      ),
    ).toBe(true);
  });

  it('accepts actual Perfex UTC DATETIME values only for the explicitly UTC booking fields', () => {
    const result = transformServiceJob(
      {
        id: 170,
        system_type: 'furnace',
        work_intent: 'repair',
        urgency: 'routine',
        source: 'phone',
        start_datetime: '2026-02-03 08:00:00',
        end_datetime: '2026-02-03 09:00:00',
        booking_timezone: 'America/Chicago',
        completed_at_utc: '2026-02-03 16:00:00',
        reopened_at_utc: '2026-02-04 16:00:00',
        status: 'completed',
      },
      relationIndex,
    );

    expect(result.record?.values).toMatchObject({
      completedAt: '2026-02-03T16:00:00.000Z',
      reopenedAt: '2026-02-04T16:00:00.000Z',
    });
  });

  it('uses an explicit export photo timezone without inferring from its booking', () => {
    const withZone = transformJobPhoto(
      {
        id: 171,
        booking_id: 55,
        filename: 'photo.jpg',
        original_name: 'photo.jpg',
        file_path: '/metadata-only.jpg',
        date_taken: '2026-02-03 08:00:00',
      },
      relationIndex,
      { photoTimezone: 'America/Chicago' },
    );
    const withoutZone = transformJobPhoto(
      {
        id: 172,
        booking_id: 55,
        filename: 'photo.jpg',
        original_name: 'photo.jpg',
        file_path: '/metadata-only.jpg',
        date_taken: '2026-02-03 08:00:00',
      },
      relationIndex,
    );

    expect(withZone.record?.values.takenAt).toBe('2026-02-03T14:00:00.000Z');
    expect(withoutZone.record?.values.takenAt).toBeNull();
    expect(withoutZone.exceptions).toContainEqual(
      expect.objectContaining({ code: 'missing_timezone', field: 'photoTimezone' }),
    );
  });

  it('accepts recognized geographic aliases and rejects UTC or Etc zones while finding non-hour DST gaps and folds', () => {
    const base = {
      system_type: 'furnace', work_intent: 'repair', urgency: 'routine', source: 'phone', status: 'pending',
    };
    const kathmandu = transformServiceJob({
      ...base, id: 173, booking_timezone: 'Asia/Kathmandu', start_datetime: '2026-02-03 08:00:00', end_datetime: '2026-02-03 09:00:00',
    }, relationIndex);
    const utc = transformServiceJob({
      ...base, id: 174, booking_timezone: 'UTC', start_datetime: '2026-02-03 08:00:00', end_datetime: '2026-02-03 09:00:00',
    }, relationIndex);
    const etc = transformServiceJob({
      ...base, id: 175, booking_timezone: 'Etc/GMT+5', start_datetime: '2026-02-03 08:00:00', end_datetime: '2026-02-03 09:00:00',
    }, relationIndex);
    const lordHoweGap = transformServiceJob({
      ...base, id: 176, booking_timezone: 'Australia/Lord_Howe', start_datetime: '2026-10-04 02:15:00', end_datetime: '2026-10-04 03:15:00',
    }, relationIndex);
    const lordHoweFold = transformServiceJob({
      ...base, id: 177, booking_timezone: 'Australia/Lord_Howe', start_datetime: '2026-04-05 01:45:00', end_datetime: '2026-04-05 02:45:00',
    }, relationIndex);
    const chathamGap = transformServiceJob({
      ...base, id: 178, booking_timezone: 'Pacific/Chatham', start_datetime: '2026-09-27 03:00:00', end_datetime: '2026-09-27 04:00:00',
    }, relationIndex);
    const chathamFold = transformServiceJob({
      ...base, id: 179, booking_timezone: 'Pacific/Chatham', start_datetime: '2026-04-05 03:00:00', end_datetime: '2026-04-05 04:00:00',
    }, relationIndex);

    expect(kathmandu.record).not.toBeNull();
    expect(utc.exceptions.map(({ code }) => code)).toContain('invalid_timezone');
    expect(etc.exceptions.map(({ code }) => code)).toContain('invalid_timezone');
    expect(lordHoweGap.exceptions.map(({ code }) => code)).toContain('nonexistent_local_datetime');
    expect(lordHoweFold.exceptions.map(({ code }) => code)).toContain('ambiguous_local_datetime');
    expect(chathamGap.exceptions.map(({ code }) => code)).toContain('nonexistent_local_datetime');
    expect(chathamFold.exceptions.map(({ code }) => code)).toContain('ambiguous_local_datetime');
  });

  it('assigns a table and array ordinal to every source row, including rows without source IDs', () => {
    const result = transformBatch({
      equipment: [
        { client_id: 17, equipment_type: 'Furnace' },
        { client_id: 17, equipment_type: 'Furnace' },
      ],
    }, relationIndex);

    expect(result.results.map(({ sourceLocator }) => sourceLocator)).toEqual([
      { table: 'hvac_hub_equipment', ordinal: 0 },
      { table: 'hvac_hub_equipment', ordinal: 1 },
    ]);
    expect(result.exceptions.filter(({ code }) => code === 'missing_source_id').map(({ sourceLocator }) => sourceLocator)).toEqual([
      { table: 'hvac_hub_equipment', ordinal: 0 },
      { table: 'hvac_hub_equipment', ordinal: 1 },
    ]);
  });

  it('rejects fractional seconds and reuses a cached formatter for the resolved timezone', () => {
    clearTimeZoneFormatterCacheForTests();
    const malformed = transformServiceJob({
      id: 180, system_type: 'furnace', work_intent: 'repair', urgency: 'routine', source: 'phone', status: 'pending',
      booking_timezone: 'America/Chicago', start_datetime: '2026-02-03 08:00:00.001', end_datetime: '2026-02-03 09:00:00',
      completed_at_utc: '2026-02-03T16:00:00.001Z',
    }, relationIndex);
    transformServiceJob({
      id: 181, system_type: 'furnace', work_intent: 'repair', urgency: 'routine', source: 'phone', status: 'pending',
      booking_timezone: 'America/Chicago', start_datetime: '2026-02-03 08:00:00', end_datetime: '2026-02-03 09:00:00',
    }, relationIndex);

    expect(malformed.record).toBeNull();
    expect(malformed.exceptions.filter(({ code }) => code === 'invalid_date')).toHaveLength(2);
    expect(getTimeZoneFormatterCacheSizeForTests()).toBe(1);
  });
});
