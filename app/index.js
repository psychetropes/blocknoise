// polyfills — separate module so side effects run before app tree evaluates
import './polyfills';
import 'react-native-get-random-values';

import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './src/app';

registerRootComponent(App);

if (Platform.OS !== 'web') {
  try {
    const TrackPlayer = require('react-native-track-player').default;
    const { playbackService } = require('./src/services/track-player');
    TrackPlayer.registerPlaybackService(() => playbackService);
  } catch (e) {
    console.warn('track-player unavailable:', e.message);
  }
}
