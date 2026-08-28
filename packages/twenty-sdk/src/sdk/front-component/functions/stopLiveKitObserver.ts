import { isDefined } from 'twenty-shared/utils';

import { frontComponentHostCommunicationApi } from '../globals/frontComponentHostCommunicationApi';
import { liveKitObserverEventListeners } from '../globals/liveKitObserverEventListeners';

export const stopLiveKitObserver = async (
  observationId: string,
): Promise<void> => {
  liveKitObserverEventListeners.delete(observationId);
  const stopFunction = frontComponentHostCommunicationApi.liveKitObserverStop;

  if (!isDefined(stopFunction)) {
    return;
  }

  try {
    await stopFunction({ observationId });
  } catch {
    // The local listener is already gone, so teardown remains fail-closed.
  }
};
