import { isDefined } from 'twenty-shared/utils';

import {
  type SetLiveKitObserverAudioResult,
  frontComponentHostCommunicationApi,
} from '../globals/frontComponentHostCommunicationApi';

export const setLiveKitObserverAudioEnabled = async (
  observationId: string,
  enabled: boolean,
): Promise<SetLiveKitObserverAudioResult> => {
  const setAudioEnabledFunction =
    frontComponentHostCommunicationApi.liveKitObserverSetAudioEnabled;

  if (!isDefined(setAudioEnabledFunction)) {
    return {
      status: 'failed',
      errorMessage: 'Live call audio is not available in this surface.',
    };
  }

  try {
    return await setAudioEnabledFunction({ observationId, enabled });
  } catch {
    return {
      status: 'failed',
      errorMessage: 'Live call audio could not be changed.',
    };
  }
};
