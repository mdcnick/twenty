# SMS

Twenty app for Sinch Conversation API SMS records and a minimal **Send SMS** workflow action.

## What is included

- `SmsConversation`, `SmsMessage`, and `SmsConsentEvent` objects with unique provider/dedupe keys.
- Nullable Person and Company relations, plus a message-to-conversation relation.
- One callback route for `MESSAGE_INBOUND`, `MESSAGE_DELIVERY`, and `MESSAGE_SUBMIT`, with raw-body HMAC validation before JSON parsing.
- Exact `STOP`, `UNSUBSCRIBE`, `CANCEL`, and `END` suppression detection.
- A native-`fetch` Conversation API client with a short-lived OAuth access-key exchange, timeout, and classified failures.

## Configure locally

```bash
node ../../../../.yarn/releases/yarn-4.13.0.cjs install --immutable
node ../../../../.yarn/releases/yarn-4.13.0.cjs twenty remote:add --local --as local
node ../../../../.yarn/releases/yarn-4.13.0.cjs twenty dev
```

Set the declared Sinch variables only in Twenty’s application settings. Do not put provider values in this repository or an `.env` file.

The callback path is `/sms/sinch/webhook`. After the app is synced, copy the complete HTTP-trigger URL shown by Twenty and use it as the target for all three triggers. Configure the same secret in Sinch and the app's `SINCH_WEBHOOK_SECRET` variable so the receiver can validate `x-sinch-webhook-signature`, `x-sinch-webhook-signature-nonce`, `x-sinch-webhook-signature-timestamp`, and `x-sinch-webhook-signature-algorithm`.

Self-hosted production instances disable logic functions by default. The server and worker must use an enabled logic-function driver before this route or the workflow action can execute. `LOGIC_FUNCTION_TYPE=LOCAL` is the practical option for trusted internal apps, but it runs app code without a sandbox; use the Lambda driver instead if untrusted apps may be installed.

## Persistence and delivery boundary

`sms-repository.ts` uses Twenty's generated `CoreApiClient` custom-object API and deterministic IDs with the API's `upsert: true` path. The public webhook acknowledges only after that repository completes; invalid signatures return `401`, malformed callbacks return `400`, and unavailable persistence returns `503` so Sinch can retry.

Delivery receipts are ordered by their provider timestamp. The app records the latest accepted provider event key, timestamp, and raw provider status. Exact replays and older receipts are no-ops. Successful states only move forward (`PENDING` → `DELIVERED` → `READ`); `FAILED` can replace only `PENDING`/`RECEIVED`, never a successful state, while a later `DELIVERED` or `READ` can supersede a prior `FAILED`. Unknown provider statuses are retained as raw status metadata but do not advance the CRM status.

The adapter is covered by mocked contract tests, but it has not been synced to or exercised against a live Twenty workspace in this repository task. Configure the application role and run a staged live callback before treating production persistence as verified.

## Verification

```bash
node ../../../../.yarn/releases/yarn-4.13.0.cjs lint
node ../../../../.yarn/releases/yarn-4.13.0.cjs typecheck
node ../../../../.yarn/releases/yarn-4.13.0.cjs test:unit
node ../../../../.yarn/releases/yarn-4.13.0.cjs test:contract
```
