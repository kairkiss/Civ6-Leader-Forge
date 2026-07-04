export type BonusKey =
  | 'science'
  | 'culture'
  | 'gold'
  | 'faith'
  | 'production'
  | 'combat'
  | 'growth'
  | 'trade';

export type AiPersonalityKey =
  | 'aggression'
  | 'science'
  | 'culture'
  | 'religion'
  | 'naval'
  | 'trade'
  | 'wonders';

export type AssetRole = 'leaderPortrait' | 'leaderBackground' | 'civilizationIcon';

export interface ProjectAsset {
  role: AssetRole;
  sourcePath?: string;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Civ6LeaderProjectConfig {
  version: 1;
  metadata: {
    modName: string;
    author: string;
    internalIdPrefix: string;
  };
  civilization: {
    name: string;
    adjective: string;
    abilityName: string;
    abilityDescription: string;
  };
  leader: {
    name: string;
    abilityName: string;
    abilityDescription: string;
  };
  bonuses: Record<BonusKey, number>;
  ai: Record<AiPersonalityKey, number>;
  text: {
    leaderIntro: string;
    civilizationIntro: string;
    loadingScreen: string;
    greeting: string;
    denounce: string;
    declareWar: string;
    defeat: string;
  };
  assets: ProjectAsset[];
}

export interface GeneratedFile {
  path: string;
  kind: 'text' | 'asset' | 'directory';
}

export interface GenerateResult {
  modId: string;
  modFolderName: string;
  outputPath: string;
  files: GeneratedFile[];
}

export interface PresetDefinition {
  id: string;
  name: string;
  summary: string;
  config: Civ6LeaderProjectConfig;
}
