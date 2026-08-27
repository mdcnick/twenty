import { type LiveKitObserverRoomAdapter } from '@/host/livekit-observer/types/FrontComponentLiveKitObserverHost';

export const createLiveKitObserverRoomAdapter =
  async (): Promise<LiveKitObserverRoomAdapter> => {
    const { RemoteAudioTrack, Room, RoomEvent, Track } =
      await import('livekit-client');
    const room = new Room({ adaptiveStream: true, dynacast: true });
    const attachedAudioElements = new Set<HTMLMediaElement>();
    let isAudioEnabled = false;
    let transcriptListener: LiveKitObserverRoomAdapter['onTranscript'] extends (
      listener: infer TListener,
    ) => void
      ? TListener
      : never = () => {};
    let disconnectedListener = () => {};

    room.registerTextStreamHandler(
      'lk.transcription',
      async (reader, participant) => {
        const attributes = reader.info.attributes ?? {};
        const segmentId = attributes['lk.segment_id'] ?? reader.info.id;
        const isFinal = attributes['lk.transcription_final'] === 'true';

        for await (const text of reader) {
          const normalizedText = text.trim();

          if (normalizedText.length === 0) {
            continue;
          }

          transcriptListener({
            id: segmentId,
            participantIdentity: participant.identity,
            text: normalizedText,
            isFinal,
          });
        }
      },
    );

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) {
        return;
      }

      const audioTrack = track as InstanceType<typeof RemoteAudioTrack>;

      audioTrack.setVolume(isAudioEnabled ? 1 : 0);
      const audioElement = audioTrack.attach();

      audioElement.autoplay = true;
      audioElement.hidden = true;
      attachedAudioElements.add(audioElement);
      document.body.append(audioElement);
    });

    room.on(RoomEvent.Disconnected, () => {
      for (const audioElement of attachedAudioElements) {
        audioElement.remove();
      }

      attachedAudioElements.clear();
      disconnectedListener();
    });

    return {
      connect: async (serverUrl, token) => {
        await room.connect(serverUrl, token, { autoSubscribe: true });
      },
      disconnect: async () => {
        await room.disconnect();

        for (const audioElement of attachedAudioElements) {
          audioElement.remove();
        }

        attachedAudioElements.clear();
      },
      setAudioEnabled: async (enabled) => {
        if (enabled) {
          await room.startAudio();
        }

        isAudioEnabled = enabled;

        for (const participant of room.remoteParticipants.values()) {
          participant.setVolume(enabled ? 1 : 0);
        }
      },
      onTranscript: (listener) => {
        transcriptListener = listener;
      },
      onDisconnected: (listener) => {
        disconnectedListener = listener;
      },
    };
  };
