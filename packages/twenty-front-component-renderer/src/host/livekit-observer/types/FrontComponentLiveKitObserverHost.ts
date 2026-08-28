import {
  type LiveKitObserverEventBatch,
  type LiveKitObserverHostFunctions,
  type LiveKitObserverTranscriptSegment,
} from 'twenty-sdk/front-component';

export type LiveKitObserverEventTransport = {
  pushLiveKitObserverEvents: (
    batch: LiveKitObserverEventBatch,
  ) => Promise<void>;
};

export type LiveKitObserverRoomAdapter = {
  connect: (serverUrl: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setAudioEnabled: (enabled: boolean) => Promise<void>;
  onTranscript: (
    listener: (segment: LiveKitObserverTranscriptSegment) => void,
  ) => void;
  onDisconnected: (listener: () => void) => void;
};

export type CreateFrontComponentLiveKitObserverHostInput = {
  allowedServerUrl: string;
  createRoomAdapter?: () => Promise<LiveKitObserverRoomAdapter>;
};

export type FrontComponentLiveKitObserverHost = LiveKitObserverHostFunctions & {
  connectEventTransport: (transport: LiveKitObserverEventTransport) => void;
  disconnectEventTransport: () => void;
  stopAllSessions: () => void;
};
