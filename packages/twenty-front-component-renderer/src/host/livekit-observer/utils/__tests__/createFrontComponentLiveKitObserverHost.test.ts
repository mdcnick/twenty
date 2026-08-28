import { createFrontComponentLiveKitObserverHost } from '../createFrontComponentLiveKitObserverHost';

type RoomAdapter = {
  connect: jest.Mock<Promise<void>, [string, string]>;
  disconnect: jest.Mock<Promise<void>, []>;
  setAudioEnabled: jest.Mock<Promise<void>, [boolean]>;
  onTranscript: jest.Mock;
  onDisconnected: jest.Mock;
};

const createRoomAdapter = (): RoomAdapter => ({
  connect: jest.fn<Promise<void>, [string, string]>(async () => {}),
  disconnect: jest.fn(async () => {}),
  setAudioEnabled: jest.fn<Promise<void>, [boolean]>(async () => {}),
  onTranscript: jest.fn(),
  onDisconnected: jest.fn(),
});

describe('createFrontComponentLiveKitObserverHost', () => {
  it('connects only to the allowlisted room server and starts muted', async () => {
    const roomAdapter = createRoomAdapter();
    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => roomAdapter,
    });

    await expect(
      host.liveKitObserverStart({
        observationId: 'observation-1',
        serverUrl: 'wss://other.example.com',
        token: 'observer-token',
      }),
    ).resolves.toEqual({
      status: 'failed',
      errorMessage: 'This LiveKit server is not allowed.',
    });

    await expect(
      host.liveKitObserverStart({
        observationId: 'observation-1',
        serverUrl: 'wss://livekit.example.com',
        token: 'observer-token',
      }),
    ).resolves.toEqual({
      status: 'connected',
      observationId: 'observation-1',
    });

    expect(roomAdapter.setAudioEnabled).toHaveBeenCalledWith(false);
    expect(roomAdapter.connect).toHaveBeenCalledWith(
      'wss://livekit.example.com',
      'observer-token',
    );
  });

  it('delivers transient transcript events without storing them on the host', async () => {
    const roomAdapter = createRoomAdapter();
    const pushLiveKitObserverEvents = jest.fn(async () => {});
    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => roomAdapter,
    });

    host.connectEventTransport({ pushLiveKitObserverEvents });
    await host.liveKitObserverStart({
      observationId: 'observation-1',
      serverUrl: 'wss://livekit.example.com',
      token: 'observer-token',
    });

    const transcriptListener = roomAdapter.onTranscript.mock.calls[0][0];

    transcriptListener({
      id: 'segment-1',
      participantIdentity: 'customer',
      text: 'The furnace is not heating.',
      isFinal: true,
    });

    expect(pushLiveKitObserverEvents).toHaveBeenCalledWith({
      events: [
        {
          type: 'transcript',
          observationId: 'observation-1',
          segment: {
            id: 'segment-1',
            participantIdentity: 'customer',
            text: 'The furnace is not heating.',
            isFinal: true,
          },
        },
      ],
    });
    expect(JSON.stringify(host)).not.toContain('furnace');
  });

  it('controls remote audio without exposing or invoking publish capabilities', async () => {
    const roomAdapter = createRoomAdapter();
    const publishTrack = jest.fn();
    const publishData = jest.fn();
    Object.assign(roomAdapter, { publishTrack, publishData });
    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => roomAdapter,
    });

    await host.liveKitObserverStart({
      observationId: 'observation-1',
      serverUrl: 'wss://livekit.example.com',
      token: 'observer-token',
    });
    await host.liveKitObserverSetAudioEnabled({
      observationId: 'observation-1',
      enabled: true,
    });
    await host.liveKitObserverSetAudioEnabled({
      observationId: 'observation-1',
      enabled: false,
    });

    expect(roomAdapter.setAudioEnabled).toHaveBeenNthCalledWith(2, true);
    expect(roomAdapter.setAudioEnabled).toHaveBeenNthCalledWith(3, false);
    expect(publishTrack).not.toHaveBeenCalled();
    expect(publishData).not.toHaveBeenCalled();
  });

  it('tears down pending and connected rooms and reports safe failures', async () => {
    const roomAdapter = createRoomAdapter();
    let resolveConnect = () => {};
    const connectPromise = new Promise<void>((resolve) => {
      resolveConnect = resolve;
    });

    roomAdapter.connect.mockReturnValue(connectPromise);

    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => roomAdapter,
    });
    const startPromise = host.liveKitObserverStart({
      observationId: 'observation-1',
      serverUrl: 'wss://livekit.example.com',
      token: 'secret-observer-token',
    });

    await Promise.resolve();
    host.stopAllSessions();
    resolveConnect();

    await expect(startPromise).resolves.toEqual({
      status: 'failed',
      errorMessage: 'Live call observation was interrupted.',
    });
    expect(roomAdapter.disconnect).toHaveBeenCalled();

    const failingRoomAdapter = createRoomAdapter();

    failingRoomAdapter.connect.mockRejectedValue(
      new Error('failed with secret-observer-token'),
    );

    const failingHost = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => failingRoomAdapter,
    });

    await expect(
      failingHost.liveKitObserverStart({
        observationId: 'observation-2',
        serverUrl: 'wss://livekit.example.com',
        token: 'secret-observer-token',
      }),
    ).resolves.toEqual({
      status: 'failed',
      errorMessage: 'Live call observation could not connect.',
    });
  });

  it('reserves the observer slot before creating a room adapter', async () => {
    const firstRoomAdapter = createRoomAdapter();
    let resolveFirstAdapter = () => {};
    const firstAdapterPromise = new Promise<RoomAdapter>((resolve) => {
      resolveFirstAdapter = () => resolve(firstRoomAdapter);
    });
    const createAdapter = jest
      .fn<Promise<RoomAdapter>, []>()
      .mockReturnValueOnce(firstAdapterPromise);
    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: createAdapter,
    });

    const firstStart = host.liveKitObserverStart({
      observationId: 'observation-1',
      serverUrl: 'wss://livekit.example.com',
      token: 'observer-token',
    });

    await expect(
      host.liveKitObserverStart({
        observationId: 'observation-2',
        serverUrl: 'wss://livekit.example.com',
        token: 'observer-token',
      }),
    ).resolves.toEqual({
      status: 'failed',
      errorMessage: 'A live call is already being observed.',
    });

    resolveFirstAdapter();

    await expect(firstStart).resolves.toEqual({
      status: 'connected',
      observationId: 'observation-1',
    });
    expect(createAdapter).toHaveBeenCalledTimes(1);
  });

  it('drops oversized transcript events at the host boundary', async () => {
    const roomAdapter = createRoomAdapter();
    const pushLiveKitObserverEvents = jest.fn(async () => {});
    const host = createFrontComponentLiveKitObserverHost({
      allowedServerUrl: 'wss://livekit.example.com',
      createRoomAdapter: async () => roomAdapter,
    });

    host.connectEventTransport({ pushLiveKitObserverEvents });
    await host.liveKitObserverStart({
      observationId: 'observation-1',
      serverUrl: 'wss://livekit.example.com',
      token: 'observer-token',
    });

    const transcriptListener = roomAdapter.onTranscript.mock.calls[0][0];

    transcriptListener({
      id: 'segment-1',
      participantIdentity: 'participant-1',
      text: 'x'.repeat(16_385),
      isFinal: false,
    });

    expect(pushLiveKitObserverEvents).not.toHaveBeenCalled();
  });
});
