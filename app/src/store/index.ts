import { create } from 'zustand';
import type { PublicKey } from '@solana/web3.js';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
}

interface GenerationState {
  tier: 'standard' | 'pro';
  generating: boolean;
  audioUrl: string | null;
  stemUrls: string[];
  stemWaveforms: number[][];
  genre: string | null;
  paymentMethod: 'usdc' | 'sol' | 'skr' | null;
  paymentSignature: string | null;
}

interface AppStore {
  wallet: WalletState;
  generation: GenerationState;
  setWallet: (wallet: Partial<WalletState>) => void;
  setGeneration: (generation: Partial<GenerationState>) => void;
  reset: () => void;
}

const initialWallet: WalletState = {
  publicKey: null,
  connected: false,
  connecting: false,
};

const initialGeneration: GenerationState = {
  tier: 'standard',
  generating: false,
  audioUrl: null,
  stemUrls: [],
  stemWaveforms: [],
  genre: null,
  paymentMethod: null,
  paymentSignature: null,
};

export const useAppStore = create<AppStore>((set) => ({
  wallet: initialWallet,
  generation: initialGeneration,
  setWallet: (wallet) =>
    set((state) => ({ wallet: { ...state.wallet, ...wallet } })),
  setGeneration: (generation) =>
    set((state) => ({ generation: { ...state.generation, ...generation } })),
  reset: () => set({ wallet: initialWallet, generation: initialGeneration }),
}));
