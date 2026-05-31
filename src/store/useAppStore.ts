import { create } from 'zustand';

interface AppState {
  activeModule: string;
  setActiveModule: (m: string) => void;
  selectedPropertyId: number | null;
  setSelectedPropertyId: (id: number | null) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  mapboxToken: string;
  setMapboxToken: (token: string) => void;
  isDemoMode: boolean;
  setDemoMode: (v: boolean) => void;
  demoStep: number;
  setDemoStep: (s: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'home',
  setActiveModule: (m) => set({ activeModule: m }),
  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  geminiApiKey: '',
  setGeminiApiKey: (key) => set({ geminiApiKey: key }),
  mapboxToken: '',
  setMapboxToken: (token) => set({ mapboxToken: token }),
  isDemoMode: false,
  setDemoMode: (v) => set({ isDemoMode: v }),
  demoStep: 0,
  setDemoStep: (s) => set({ demoStep: s }),
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
