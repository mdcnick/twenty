# Calls

`Calls` is a standalone Twenty 2.35 app for a simple Sinch Voice call history
and an outbound call-control workflow action. Its built-in `Call history` object
view is the initial UI: users can filter CallEvents and use the two reciprocal
relations on a Person or Company record.

## What it includes

- A `CallEvent` object keyed uniquely by Sinch `providerCallId`.
- Nullable reciprocal Person and Company relations.
- A public, signed Sinch callback route at `/calls/sinch/voice`.
- A `Start Sinch Call` workflow action that creates a basic TTS callout.
- A durable `CallRequest` reservation before outbound provider execution.
- Pure parser, mapper, signature, idempotency, and provider client utilities.

It deliberately does not implement audio streaming, SIP/RTP, a softphone, recording/media, or transcription/AI.

## Server variables

Set these in the Calls app registration; never commit their values.

| Variable | Required | Meaning |
| --- | --- | --- |
| `SINCH_VOICE_BASE_URL` | Yes | Regional Voice API v1 URL, such as `https://calling-use1.api.sinch.com/v1` |
| `SINCH_VOICE_TOKEN` | Yes, secret | `applicationKey:applicationSecret` for Basic outbound authentication |
| `SINCH_VOICE_FROM_NUMBER` | Yes | Verified E.164 caller ID |
| `SINCH_VOICE_WEBHOOK_SECRET` | Yes, secret | Base64 application secret used for callback validation |
| `SINCH_VOICE_FORWARD_TO` | No | E.164 number for authenticated inbound-call forwarding; missing/invalid values safely hang up |

Sinch signs callbacks with the raw body’s MD5, HTTP method, content type,
`x-timestamp`, and callback path. The app verifies that `Authorization` value
before parsing the body. The implementation follows the [Sinch callback signing
contract](https://developers.sinch.com/docs/voice/api-reference/authentication/callback-signed-request).

## Persistence and live boundary

The callback and workflow use Twenty's generated `CoreApiClient`, scoped to this
app's default role, to create or update `CallEvent` records before reporting a
successful callback or outbound action. Provider call IDs have a unique field;
same-payload callbacks are ignored, lifecycle state only moves forward, and a
unique-key create race is re-read before a monotonic update.

Offline checks use a mocked generated client. A local Twenty registration is
still required before production use to generate the workspace schema client,
set server variables, and configure Sinch's public callback URL. No Sinch
credential, live webhook, outbound call, deployment, or media capability is
configured by this app checkout.

## Outbound idempotency

`Start Sinch Call` accepts an optional `requestKey` (8–128 URL-safe characters).
When omitted, the app generates one and first stores a pending `CallRequest`.
The request key is sent as Sinch callout custom metadata. Reusing a key returns
the prior provider outcome without making a second call. A key still marked
`PENDING` is intentionally non-retryable until reconciliation; it never creates
another provider attempt. A timeout or network failure after the provider request
is also non-retryable because Sinch acceptance is unknown. Signed callbacks read
the `custom` request key and reconcile the matching CallRequest with the provider
call ID. If Sinch accepts a
call but the corresponding CallEvent write cannot be confirmed, the result says
`providerAccepted: true`, `persistence: 'uncertain'`, and `retrySafe: false`;
do not retry with a new key.

## Local checks

```bash
yarn install --immutable
yarn typecheck
yarn lint
yarn test
yarn test:contract
yarn twenty dev:typecheck
yarn twenty dev:build
```
