import { useState, useEffect, useCallback } from 'react';

interface RadioTrack {
  id: string;
  wallet_address: string;
  arweave_url: string;
  tier: 'standard' | 'pro';
  genre: string;
}

export function useRadio() {
  const [playlist, setPlaylist] = useState<RadioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/radio`);
      const data = await res.json();
      setPlaylist(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const nowPlaying = playlist[currentIndex] ?? null;

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % Math.max(playlist.length, 1));
  }, [playlist.length]);

  const previous = useCallback(() => {
    setCurrentIndex((i) =>
      i === 0 ? Math.max(playlist.length - 1, 0) : i - 1
    );
  }, [playlist.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
    // todo: integrate react-native-track-player
  }, []);

  return {
    playlist,
    nowPlaying,
    currentIndex,
    isPlaying,
    loading,
    next,
    previous,
    togglePlay,
    refresh: fetchPlaylist,
  };
}
