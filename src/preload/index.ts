import { contextBridge, ipcRenderer } from 'electron';
import type { Civ6LeaderProjectConfig } from '../../generator/src';
import type { ForgeApi } from '../shared/ipc';

const api: ForgeApi = {
  selectOutputDirectory: () => ipcRenderer.invoke('dialog:selectOutputDirectory'),
  selectImageFile: () => ipcRenderer.invoke('dialog:selectImageFile'),
  generateMod: (config: Civ6LeaderProjectConfig, outputDir: string) =>
    ipcRenderer.invoke('generator:generateMod', config, outputDir),
  exportZip: (folderPath: string) => ipcRenderer.invoke('export:zip', folderPath),
  installToCiv6Mods: (folderPath: string) => ipcRenderer.invoke('export:installToCiv6Mods', folderPath),
  openFolder: (folderPath: string) => ipcRenderer.invoke('shell:openFolder', folderPath),
  getDefaultCiv6ModsPath: () => ipcRenderer.invoke('paths:getDefaultCiv6ModsPath'),
};

contextBridge.exposeInMainWorld('forgeApi', api);
