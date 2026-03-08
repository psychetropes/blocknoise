import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './src/app';
import { playbackService } from './src/services/track-player';

registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => playbackService);
