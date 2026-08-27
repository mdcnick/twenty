import { type LiveKitObserverEvent } from './frontComponentHostCommunicationApi';

export const LIVEKIT_OBSERVER_EVENT_LISTENERS_KEY =
  '__twentyLiveKitObserverEventListeners__';

type LiveKitObserverEventListener = (event: LiveKitObserverEvent) => void;

declare global {
  var __twentyLiveKitObserverEventListeners__: Map<
    string,
    LiveKitObserverEventListener
  >;
}

globalThis[LIVEKIT_OBSERVER_EVENT_LISTENERS_KEY] ??= new Map();

export const liveKitObserverEventListeners =
  globalThis.__twentyLiveKitObserverEventListeners__;
