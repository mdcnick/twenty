# BC HVAC for Twenty

This private Twenty app supplies the operational HVAC records needed for service work, recurring maintenance, and a BC-Perfex migration without copying customer snapshots into service records. Companies and people remain Twenty's native objects.

## Service call booking

Service jobs are available from the default workspace navigation with a weekly Service call booking calendar. Each calendar entry spans its `startAt` and `endAt` times and surfaces its status, Company, service contact, Equipment, appointment window, and urgency.

## Voice-agent MCP tools

The app defines two server-owned logic functions that Twenty exposes through its MCP tool provider after the app is installed and logic functions are enabled:

- `app_submit_hvac_appointment` validates the confirmed Chicago appointment time, reuses only one exact phone-and-name customer match, checks active Service jobs for overlap, creates the customer and booking idempotently, and optionally requests a confirmation through the authenticated SMS app route.
- `app_lookup_existing_appointment` finds an active appointment by normalized phone number and returns only `found`, `status`, and `startDatetime`. Multiple matches return `found: false` so the voice agent does not disclose ambiguous customer data.

The submit tool requires a stable `sourceRequestId` for retries. Business callers also require `companyName`; `customerName` remains the named contact. The app stores no provider credentials and never accepts caller-supplied SMS text. Logic-function runtime enablement, app installation, MCP configuration, and voice-agent rollout remain separate deployment steps.

## Maintenance agreements

The app includes Maintenance agreements, Maintenance coverage, and Maintenance visits. Agreements track status, plan type, start/end and renewal dates, visit entitlement, annual value, billing frequency, and auto-renewal. Coverage connects each agreement to the equipment it protects. Visits connect the promised work to both its agreement and the resulting Service job.

The default workspace navigation includes Maintenance agreements and Maintenance visits. Agreement records have a status board and renewal calendar; visits have a due-date calendar. Installation creates the schema and views only—it does not seed customer data, activate workflows, or contact customers.

## Perfex sources

| Twenty record | Perfex source |
| --- | --- |
| Company | `tblclients` |
| Person | `tblcontacts` |
| Equipment | `tblhvac_hub_equipment` |
| Service job | `tblservice_booking_bookings` |
| Service event | `tblhvac_hub_service_events` |
| Job photo | `tbljob_photos` |

The app relates equipment, service jobs, and service events to native Companies. Service jobs also relate to the native Person used as the confirmed service contact. It deliberately does not copy Perfex customer names, phones, emails, addresses, client IDs, or contact IDs into the HVAC objects.

## Migration order

1. Upsert Companies and People, preserving their source IDs in the migration mapping.
2. Upsert Equipment only when the source has an authoritative customer link. Keep lead-only equipment out of the customer migration until the lead is converted or a dispatcher supplies an approved mapping.
3. Upsert Service jobs and connect their Company, service contact, and Equipment only when those source links are authoritative. A booking without an authoritative equipment link remains unlinked; never infer equipment from its Company when that Company has multiple units.
4. Upsert Service events and Job photos, then connect their parent records only when their source IDs resolve. A service event without a job ID remains unlinked. A photo with a project-only link or no booking link remains unlinked from Service job.
5. Keep Job photos metadata-only in this preflight. File reads and `content` uploads are outside this slice and require separate approval.

Every skipped or intentionally unlinked relationship must go into an exception report with its Perfex table-qualified ID, missing or ambiguous source key, and recommended manual mapping. Resolve those exceptions manually before a later reconciliation run; do not manufacture links from matching company/customer data.

## Offline preflight

Run the deterministic bundled preview with:

```bash
yarn preview:migration
```

It reads only [fixtures/preview-input.json](fixtures/preview-input.json) and prints a JSON report to stdout. The input has a `relationIndex` with explicit source-ID-to-Twenty-ID candidates, an optional export-wide `options` object, and an `input` object with `equipment`, `serviceJobs`, `serviceEvents`, and `jobPhotos` arrays. Raw values may be MySQL-style strings, nulls, or numbers.

The preflight emits a record only when its required source values are valid. It reports each missing, ambiguous, lead-only, duplicate, invalid, project-only, or unlinked condition as a machine-readable exception. A relation is emitted only when its explicit index has exactly one candidate. Service events use only `serviceEventToServiceJob`; service jobs never get equipment inferred from a Company; project-only photos intentionally stay unlinked.

The relation index also has a `serviceJobToEquipment` bridge keyed by the booking's table-qualified ID. Its only valid output is the app's `equipmentId` relation write key. Other emitted relation write keys are `companyId`, `serviceContactId`, and `serviceJobId`; each relation includes its target object and field name for a later writer.

Twenty 2.35 composite fields are emitted in their native shapes: rich text is `{ "markdown", "blocknote" }`, and money is `{ "amountMicros", "currencyCode" }`. Source decimals are converted exactly to integer micros (without floating-point rounding). Currency defaults to `USD` for BC HVAC and can be overridden only through the offline transform options.

Booking start/end timestamps are local wall-clock values and require a valid geographic IANA `booking_timezone`; the preflight converts only unambiguous local times to UTC. It rejects missing/invalid zones, `UTC`, `Etc/*`, and DST gaps or fall-back ambiguities. `completed_at_utc` and `reopened_at_utc` accept either Perfex's actual UTC MySQL `YYYY-MM-DD HH:mm:ss` form or ISO `Z`, and always emit ISO UTC. A photo's `date_taken` uses only the explicit export-wide `options.photoTimezone` (never its booking timezone or a fabricated row column); without it, the row remains in the report with a timestamp exception. The source path is still metadata only and is never read.

Every result and exception contains a stable source locator (`table` and zero-based input `ordinal`), plus the record ID when available. Exceptions also include their relevant relation or field, source reference, candidate IDs, and a recommended manual action. This makes even two malformed ID-less rows distinguishable without guessing a repair.

This command is strictly read-only: it opens no database or API connection, accepts no credentials, uploads no files, and never reads the `sourceFilePath` stored in a photo row. The resulting JSON is a preflight artifact only; a later, separately approved writer must perform any Twenty upserts or file uploads.

Each custom record has a text `perfexExternalId`. Populate it with a table-qualified stable key such as `perfex:service_booking_bookings:1842`; upsert on that field on every run. This gives retry-safe imports while avoiding collisions between unrelated Perfex tables.

## Outside this CRM schema

Provider credentials and tokens, Google Calendar synchronization state, Google Business Profile credentials and publishing queues, SMS delivery/webhook logs, OCR payloads, and raw integration audit data stay in the migration or integration service. The Job photo object keeps only migration-useful, non-secret file metadata and the uploaded Twenty file reference.
