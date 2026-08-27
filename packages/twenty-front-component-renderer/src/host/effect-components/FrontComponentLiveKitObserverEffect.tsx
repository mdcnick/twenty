import { useEffect } from 'react';

import { type FrontComponentLiveKitObserverHost } from '@/host/livekit-observer/types/FrontComponentLiveKitObserverHost';
import { type FrontComponentThread } from '@/types/FrontComponentThread';

type FrontComponentLiveKitObserverEffectProps = {
  thread: FrontComponentThread;
  liveKitObserverHost: FrontComponentLiveKitObserverHost;
};

export const FrontComponentLiveKitObserverEffect = ({
  thread,
  liveKitObserverHost,
}: FrontComponentLiveKitObserverEffectProps) => {
  useEffect(() => {
    liveKitObserverHost.connectEventTransport(thread.imports);

    return () => {
      liveKitObserverHost.disconnectEventTransport();
      liveKitObserverHost.stopAllSessions();
    };
  }, [thread, liveKitObserverHost]);

  return null;
};
