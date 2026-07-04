import { create } from 'zustand';
import { getPreset, presets, type Civ6LeaderProjectConfig } from '../../../generator/src/browser';

interface ProjectStore {
  config: Civ6LeaderProjectConfig;
  activePresetId: string;
  setPreset: (presetId: string) => void;
  updateConfig: (next: Civ6LeaderProjectConfig) => void;
  setAssetPath: (role: Civ6LeaderProjectConfig['assets'][number]['role'], sourcePath: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  config: presets[0].config,
  activePresetId: 'blank',
  setPreset: (presetId) =>
    set({
      activePresetId: presetId,
      config: structuredClone(getPreset(presetId).config),
    }),
  updateConfig: (next) => set({ config: next }),
  setAssetPath: (role, sourcePath) =>
    set((state) => {
      const assets = [...state.config.assets];
      const index = assets.findIndex((asset) => asset.role === role);
      if (index >= 0) {
        assets[index] = { ...assets[index], sourcePath };
      } else {
        assets.push({ role, sourcePath });
      }
      return { config: { ...state.config, assets } };
    }),
}));
