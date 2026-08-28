import { type FrontComponentHostCommunicationApi } from '@/types/FrontComponentHostCommunicationApi';
import { type HostFetchFunction } from '@/types/HostFetchFunction';
import { type MediaSessionHostFunctions } from '@/types/MediaSession';
import { type LiveKitObserverHostFunctions } from 'twenty-sdk/front-component';

export type FrontComponentHostThreadExports =
  FrontComponentHostCommunicationApi &
    MediaSessionHostFunctions &
    LiveKitObserverHostFunctions & {
      hostFetch: HostFetchFunction;
      observeElementGeometry: (remoteElementIds: string[]) => Promise<void>;
      unobserveElementGeometry: (remoteElementIds: string[]) => Promise<void>;
    };
