import { isDefined } from 'twenty-shared/utils';

import {
  type CreateFrontComponentLiveKitObserverHostInput,
  type FrontComponentLiveKitObserverHost,
  type LiveKitObserverEventTransport,
  type LiveKitObserverRoomAdapter,
} from '@/host/livekit-observer/types/FrontComponentLiveKitObserverHost';
import { createLiveKitObserverRoomAdapter } from '@/host/livekit-observer/utils/createLiveKitObserverRoomAdapter';
import { type LiveKitObserverEvent } from 'twenty-sdk/front-component';

const OBSERVATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_OBSERVER_TOKEN_LENGTH = 32_768;
const MAX_TRANSCRIPT_SEGMENT_ID_LENGTH = 256;
const MAX_TRANSCRIPT_PARTICIPANT_IDENTITY_LENGTH = 256;
const MAX_TRANSCRIPT_TEXT_LENGTH = 16_384;
const MAX_PENDING_TRANSCRIPT_DELIVERIES = 64;

const normalizeServerUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    const isSecure =
      url.protocol === 'wss:' ||
      (url.protocol === 'ws:' &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1'));

    if (!isSecure || url.username !== '' || url.password !== '') {
      return null;
    }

    url.hash = '';
    url.search = '';

    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
};

export const createFrontComponentLiveKitObserverHost = ({
  allowedServerUrl,
  createRoomAdapter = createLiveKitObserverRoomAdapter,
}: CreateFrontComponentLiveKitObserverHostInput): FrontComponentLiveKitObserverHost => {
  const normalizedAllowedServerUrl = normalizeServerUrl(allowedServerUrl);
  let eventTransport: LiveKitObserverEventTransport | null = null;
  let activeSession:
    | {
        observationId: string;
        roomAdapter: LiveKitObserverRoomAdapter;
        generation: number;
      }
    | undefined;
  let pendingObservationId: string | undefined;
  let pendingTranscriptDeliveryCount = 0;
  let teardownGeneration = 0;

  const pushEvent = (event: LiveKitObserverEvent): void => {
    if (
      event.type === 'transcript' &&
      (event.segment.id.length > MAX_TRANSCRIPT_SEGMENT_ID_LENGTH ||
        event.segment.participantIdentity.length >
          MAX_TRANSCRIPT_PARTICIPANT_IDENTITY_LENGTH ||
        event.segment.text.length > MAX_TRANSCRIPT_TEXT_LENGTH ||
        pendingTranscriptDeliveryCount >= MAX_PENDING_TRANSCRIPT_DELIVERIES)
    ) {
      return;
    }

    const transport = eventTransport;

    if (!isDefined(transport)) {
      return;
    }

    if (event.type === 'transcript') {
      pendingTranscriptDeliveryCount += 1;
    }

    void transport
      .pushLiveKitObserverEvents({ events: [event] })
      .catch(() => {
        // The event is intentionally ephemeral and is dropped if its worker is gone.
      })
      .finally(() => {
        if (event.type === 'transcript') {
          pendingTranscriptDeliveryCount -= 1;
        }
      });
  };

  const liveKitObserverStart: FrontComponentLiveKitObserverHost['liveKitObserverStart'] =
    async ({ observationId, serverUrl, token }) => {
      const normalizedServerUrl = normalizeServerUrl(serverUrl);

      if (
        !isDefined(normalizedAllowedServerUrl) ||
        normalizedServerUrl !== normalizedAllowedServerUrl
      ) {
        return {
          status: 'failed',
          errorMessage: 'This LiveKit server is not allowed.',
        };
      }

      if (
        !OBSERVATION_ID_PATTERN.test(observationId) ||
        token.length === 0 ||
        token.length > MAX_OBSERVER_TOKEN_LENGTH
      ) {
        return {
          status: 'failed',
          errorMessage: 'The live call observer request is invalid.',
        };
      }

      if (isDefined(activeSession) || isDefined(pendingObservationId)) {
        return {
          status: 'failed',
          errorMessage: 'A live call is already being observed.',
        };
      }

      const startGeneration = teardownGeneration;
      pendingObservationId = observationId;
      let roomAdapter: LiveKitObserverRoomAdapter;

      try {
        roomAdapter = await createRoomAdapter();
      } catch {
        if (pendingObservationId === observationId) {
          pendingObservationId = undefined;
        }

        return {
          status: 'failed',
          errorMessage: 'Live call observation is not available.',
        };
      }

      if (
        startGeneration !== teardownGeneration ||
        pendingObservationId !== observationId
      ) {
        await roomAdapter.disconnect().catch(() => {});

        return {
          status: 'failed',
          errorMessage: 'Live call observation was interrupted.',
        };
      }

      pendingObservationId = undefined;
      activeSession = {
        observationId,
        roomAdapter,
        generation: startGeneration,
      };
      roomAdapter.onTranscript((segment) => {
        if (activeSession?.observationId !== observationId) {
          return;
        }

        pushEvent({ type: 'transcript', observationId, segment });
      });
      roomAdapter.onDisconnected(() => {
        if (activeSession?.observationId !== observationId) {
          return;
        }

        activeSession = undefined;
        pushEvent({ type: 'disconnected', observationId });
      });

      try {
        await roomAdapter.setAudioEnabled(false);
        await roomAdapter.connect(normalizedServerUrl, token);
      } catch {
        if (activeSession?.observationId === observationId) {
          activeSession = undefined;
        }

        await roomAdapter.disconnect().catch(() => {});

        return {
          status: 'failed',
          errorMessage: 'Live call observation could not connect.',
        };
      }

      if (
        startGeneration !== teardownGeneration ||
        activeSession?.observationId !== observationId
      ) {
        await roomAdapter.disconnect().catch(() => {});

        return {
          status: 'failed',
          errorMessage: 'Live call observation was interrupted.',
        };
      }

      return { status: 'connected', observationId };
    };

  const liveKitObserverSetAudioEnabled: FrontComponentLiveKitObserverHost['liveKitObserverSetAudioEnabled'] =
    async ({ observationId, enabled }) => {
      if (activeSession?.observationId !== observationId) {
        return {
          status: 'failed',
          errorMessage: 'The live call is no longer connected.',
        };
      }

      try {
        await activeSession.roomAdapter.setAudioEnabled(enabled);

        return { status: 'updated', enabled };
      } catch {
        return {
          status: 'failed',
          errorMessage: 'Live call audio could not be changed.',
        };
      }
    };

  const liveKitObserverStop: FrontComponentLiveKitObserverHost['liveKitObserverStop'] =
    async ({ observationId }) => {
      if (pendingObservationId === observationId) {
        pendingObservationId = undefined;
        teardownGeneration += 1;

        return;
      }

      if (activeSession?.observationId !== observationId) {
        return;
      }

      const roomAdapter = activeSession.roomAdapter;

      activeSession = undefined;
      await roomAdapter.disconnect().catch(() => {});
    };

  const stopAllSessions = (): void => {
    teardownGeneration += 1;
    pendingObservationId = undefined;
    const roomAdapter = activeSession?.roomAdapter;

    activeSession = undefined;

    if (isDefined(roomAdapter)) {
      void roomAdapter.disconnect().catch(() => {});
    }
  };

  return {
    liveKitObserverStart,
    liveKitObserverSetAudioEnabled,
    liveKitObserverStop,
    connectEventTransport: (transport) => {
      eventTransport = transport;
    },
    disconnectEventTransport: () => {
      eventTransport = null;
    },
    stopAllSessions,
  };
};
