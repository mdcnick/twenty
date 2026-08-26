export const CALL_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export const CALL_STATUSES = ['RINGING', 'ANSWERED', 'COMPLETED', 'MISSED', 'FAILED'] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];
export type CallStatus = (typeof CALL_STATUSES)[number];

export type NormalizedCallEvent = {
  providerCallId: string;
  parentCallId?: string;
  fromNumber?: string;
  toNumber?: string;
  direction: CallDirection;
  status: CallStatus;
  providerStatus?: string;
  durationSeconds?: number;
  answeredBy?: string;
  startedAt?: string;
  endedAt?: string;
  providerEventType: string;
  providerError?: string;
  payloadHash: string;
  externalSourceId?: string;
  occurredAt: string;
};

export type CallEventUpsertResult = { action: 'create' | 'update' | 'ignore'; id: string };
export type CallEventRepository = {
  upsert(event: NormalizedCallEvent): Promise<CallEventUpsertResult>;
};
