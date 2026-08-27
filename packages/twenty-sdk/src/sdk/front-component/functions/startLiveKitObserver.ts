import { isDefined } from 'twenty-shared/utils';

import {
  type LiveKitObserverEvent,
  type StartLiveKitObserverResult,
  frontComponentHostCommunicationApi,
} from '../globals/frontComponentHostCommunicationApi';
import { liveKitObserverEventListeners } from '../globals/liveKitObserverEventListeners';

let observationSequence = 0;

const createObservationId = (): string => {
  observationSequence += 1;

  return `observation-${Date.now()}-${observationSequence}`;
};

export type StartLiveKitObserverParams = {
  serverUrl: string;
  token: string;
  onEvent: (event: LiveKitObserverEvent) => void;
};

export const startLiveKitObserver = async ({
  serverUrl,
  token,
  onEvent,
}: StartLiveKitObserverParams): Promise<StartLiveKitObserverResult> => {
  const startFunction = frontComponentHostCommunicationApi.liveKitObserverStart;

  if (!isDefined(startFunction)) {
    return {
      status: 'failed',
      errorMessage: 'Live call observation is not available in this surface.',
    };
  }

  const observationId = createObservationId();

  liveKitObserverEventListeners.set(observationId, onEvent);

  try {
    const result = await startFunction({ observationId, serverUrl, token });

    if (result.status === 'failed') {
      liveKitObserverEventListeners.delete(observationId);
    }

    return result;
  } catch {
    liveKitObserverEventListeners.delete(observationId);

    return {
      status: 'failed',
      errorMessage: 'Live call observation is not available in this surface.',
    };
  }
};
