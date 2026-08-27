import { useMemo } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import {
  createFrontComponentLiveKitObserverHost,
  type FrontComponentLiveKitObserverHost,
} from 'twenty-front-component-renderer';

const LIVEKIT_OBSERVER_ENABLED_VARIABLE_NAME = 'LIVEKIT_OBSERVER_ENABLED';
const LIVEKIT_URL_VARIABLE_NAME = 'LIVEKIT_URL';

const isEnabledValue = (value: string | undefined): boolean =>
  value?.trim().toLowerCase() === 'true' || value?.trim() === '1';

export const useFrontComponentLiveKitObserver = (
  applicationVariables?: Record<string, string>,
): FrontComponentLiveKitObserverHost | undefined =>
  useMemo(() => {
    const allowedServerUrl = applicationVariables?.[LIVEKIT_URL_VARIABLE_NAME];
    const isEnabled = isEnabledValue(
      applicationVariables?.[LIVEKIT_OBSERVER_ENABLED_VARIABLE_NAME],
    );

    if (!isEnabled || !isNonEmptyString(allowedServerUrl)) {
      return undefined;
    }

    return createFrontComponentLiveKitObserverHost({ allowedServerUrl });
  }, [applicationVariables]);
