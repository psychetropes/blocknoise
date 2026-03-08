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

const Capability = {};
const RepeatMode = { Off: 0, Track: 1, Queue: 2 };

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
    setRepeatMode: noopAsync,
    updateOptions: noopAsync,
  },
  Event,
  State: { Playing: 'playing', Paused: 'paused', None: 'none', Stopped: 'stopped', Ready: 'ready', Buffering: 'buffering' },
  Capability,
  RepeatMode,
  usePlaybackState: () => ({ state: 'none' }),
  useActiveTrack: () => null,
  useTrackPlayerEvents: noop,
};
