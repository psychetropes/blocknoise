// web stub — react-native-track-player is android-only
const noop = () => {};
const noopAsync = () => Promise.resolve();
const Event = {
  RemotePlay: 'remote-play',
  RemotePause: 'remote-pause',
  RemoteNext: 'remote-next',
  RemotePrevious: 'remote-previous',
  RemoteStop: 'remote-stop',
};

module.exports = {
  __esModule: true,
  default: {
    addEventListener: noop,
    registerPlaybackService: noop,
    setupPlayer: noopAsync,
    add: noopAsync,
    play: noopAsync,
    pause: noopAsync,
    reset: noopAsync,
    skip: noopAsync,
    skipToNext: noopAsync,
    skipToPrevious: noopAsync,
    getState: noopAsync,
    getQueue: () => Promise.resolve([]),
    getActiveTrack: () => Promise.resolve(null),
  },
  Event,
  State: { Playing: 'playing', Paused: 'paused', None: 'none' },
  usePlaybackState: () => ({ state: 'none' }),
  useActiveTrack: () => null,
};
