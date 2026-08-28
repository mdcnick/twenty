import { type LiveKitObserverEventBatch } from 'twenty-sdk/front-component';

const LIVEKIT_OBSERVER_EVENT_LISTENERS_KEY =
  '__twentyLiveKitObserverEventListeners__';

type LiveKitObserverEventListeners = Map<
  string,
  (event: LiveKitObserverEventBatch['events'][number]) => void
>;

export const dispatchLiveKitObserverEvents = (
  batch: LiveKitObserverEventBatch,
): void => {
  const listeners = (
    globalThis as typeof globalThis & {
      [LIVEKIT_OBSERVER_EVENT_LISTENERS_KEY]?: LiveKitObserverEventListeners;
    }
  )[LIVEKIT_OBSERVER_EVENT_LISTENERS_KEY];

  for (const event of batch.events) {
    listeners?.get(event.observationId)?.(event);

    if (event.type === 'disconnected') {
      listeners?.delete(event.observationId);
    }
  }
};
