import type { Civ6LeaderProjectConfig, GenerateResult } from '../../generator/src';

export interface ImageSelection {
  path: string;
  dataUrl: string;
}

export interface ExportZipResult {
  zipPath: string;
}

export interface InstallResult {
  destination: string;
}

export interface ForgeApi {
  selectOutputDirectory(): Promise<string | null>;
  selectImageFile(): Promise<ImageSelection | null>;
  generateMod(config: Civ6LeaderProjectConfig, outputDir: string): Promise<GenerateResult>;
  exportZip(folderPath: string): Promise<ExportZipResult>;
  installToCiv6Mods(folderPath: string): Promise<InstallResult>;
  openFolder(folderPath: string): Promise<void>;
  getDefaultCiv6ModsPath(): Promise<string>;
}

declare global {
  interface Window {
    forgeApi: ForgeApi;
  }
}
