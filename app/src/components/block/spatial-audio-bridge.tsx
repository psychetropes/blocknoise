import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface SpatialAudioBridgeProps {
  stemUrls: string[];
  positions: [number, number, number][];
  isPlaying: boolean;
  volumes?: number[];
}

// web audio api spatial panning via webview bridge
// stems are loaded as audio sources, positions drive pannernode in real-time

const SPATIAL_AUDIO_HTML = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:transparent;">
<script>
  let ctx = null;
  let sources = [];
  let panners = [];
  let gains = [];

  function initAudio(stemUrls) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.listener.setPosition(0, 0, 0);

    stemUrls.forEach((url, i) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audio.src = url;

      const source = ctx.createMediaElementSource(audio);
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10;
      panner.rolloffFactor = 1;
      panner.setPosition(0, 0, 0);

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      source.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      sources.push(audio);
      panners.push(panner);
      gains.push(gain);
    });
  }

  function updatePosition(index, x, y, z) {
    if (panners[index]) {
      panners[index].setPosition(x, y, z);
    }
  }

  function play() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    sources.forEach(s => s.play().catch(() => {}));
  }

  function pause() {
    sources.forEach(s => s.pause());
  }

  function setVolume(index, vol) {
    if (gains[index]) gains[index].gain.value = vol;
  }

  // message handler from react native
  window.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'init':
          initAudio(msg.stemUrls);
          break;
        case 'position':
          updatePosition(msg.index, msg.x, msg.y, msg.z);
          break;
        case 'play':
          play();
          break;
        case 'pause':
          pause();
          break;
        case 'volume':
          setVolume(msg.index, msg.volume);
          break;
      }
    } catch {}
  });

  // also listen on document for react native webview
  document.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'init':
          initAudio(msg.stemUrls);
          break;
        case 'position':
          updatePosition(msg.index, msg.x, msg.y, msg.z);
          break;
        case 'play':
          play();
          break;
        case 'pause':
          pause();
          break;
        case 'volume':
          setVolume(msg.index, msg.volume);
          break;
      }
    } catch {}
  });
</script>
</body>
</html>
`;

export function SpatialAudioBridge({
  stemUrls,
  positions,
  isPlaying,
  volumes,
}: SpatialAudioBridgeProps) {
  const webViewRef = useRef<WebView>(null);
  const initializedRef = useRef(false);

  const sendMessage = useCallback((msg: object) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    if (initializedRef.current && stemUrls.length > 0) {
      // update positions in real-time
      positions.forEach((pos, i) => {
        sendMessage({ type: 'position', index: i, x: pos[0], y: pos[1], z: pos[2] });
      });
    }
  }, [positions, sendMessage]);

  useEffect(() => {
    if (initializedRef.current) {
      sendMessage({ type: isPlaying ? 'play' : 'pause' });
    }
  }, [isPlaying, sendMessage]);

  useEffect(() => {
    if (!initializedRef.current || !volumes) return;
    volumes.forEach((volume, index) => {
      sendMessage({ type: 'volume', index, volume });
    });
  }, [sendMessage, volumes]);

  const handleLoad = () => {
    if (stemUrls.length > 0) {
      sendMessage({ type: 'init', stemUrls });
      initializedRef.current = true;
      if (isPlaying) {
        setTimeout(() => sendMessage({ type: 'play' }), 500);
      }
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: SPATIAL_AUDIO_HTML }}
        onLoad={handleLoad}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
