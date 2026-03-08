// polyfills — MUST be first imports (before any solana/web3 code)
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './src/app';
import { playbackService } from './src/services/track-player';

registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => playbackService);
