import type { Civ6LeaderProjectConfig, PresetDefinition } from './types';

type PresetPatch = {
  [Key in keyof Civ6LeaderProjectConfig]?: Civ6LeaderProjectConfig[Key] extends Array<infer Item>
    ? Item[]
    : Civ6LeaderProjectConfig[Key] extends Record<string, unknown>
      ? Partial<Civ6LeaderProjectConfig[Key]>
      : Civ6LeaderProjectConfig[Key];
};

const baseConfig: Civ6LeaderProjectConfig = {
  version: 1,
  metadata: {
    modName: 'My Custom Leader',
    author: 'Player',
    internalIdPrefix: 'MY_LEADER',
  },
  civilization: {
    name: 'New Civilization',
    adjective: 'New',
    abilityName: 'Civic Identity',
    abilityDescription: 'Cities and districts receive flexible bonuses based on your chosen style.',
  },
  leader: {
    name: 'New Leader',
    abilityName: 'Personal Vision',
    abilityDescription: 'This leader gains a focused bonus that can be tuned before export.',
  },
  bonuses: {
    science: 0,
    culture: 0,
    gold: 0,
    faith: 0,
    production: 0,
    combat: 0,
    growth: 0,
    trade: 0,
  },
  ai: {
    aggression: 5,
    science: 5,
    culture: 5,
    religion: 5,
    naval: 5,
    trade: 5,
    wonders: 5,
  },
  text: {
    leaderIntro: 'A new leader rises with a clear identity and a player-authored story.',
    civilizationIntro: 'A custom civilization ready for local testing and iteration.',
    loadingScreen: 'Shape your people through careful choices and a style all your own.',
    greeting: 'Welcome. Let our peoples decide what future they deserve.',
    denounce: 'Your choices have made trust impossible.',
    declareWar: 'History now turns on the edge of conflict.',
    defeat: 'Our chapter closes, but our name will remain.',
  },
  assets: [
    { role: 'leaderPortrait' },
    { role: 'leaderBackground' },
    { role: 'civilizationIcon' },
  ],
};

function preset(
  id: string,
  name: string,
  summary: string,
  patch: PresetPatch,
): PresetDefinition {
  return {
    id,
    name,
    summary,
    config: {
      ...baseConfig,
      ...patch,
      metadata: { ...baseConfig.metadata, ...patch.metadata },
      civilization: { ...baseConfig.civilization, ...patch.civilization },
      leader: { ...baseConfig.leader, ...patch.leader },
      bonuses: { ...baseConfig.bonuses, ...patch.bonuses },
      ai: { ...baseConfig.ai, ...patch.ai },
      text: { ...baseConfig.text, ...patch.text },
      assets: patch.assets ?? baseConfig.assets,
    },
  };
}

export const presets: PresetDefinition[] = [
  preset('blank', 'Blank Template', 'Start from neutral fields and tune everything yourself.', {}),
  preset('conqueror', 'Conqueror', 'War-focused leader with combat pressure and assertive AI.', {
    metadata: { modName: 'Conqueror Leader', internalIdPrefix: 'CONQUEROR' },
    leader: {
      name: 'Conqueror',
      abilityName: 'Decisive Campaign',
      abilityDescription: 'Units gain combat strength during sustained offensives.',
    },
    bonuses: { combat: 7, production: 2 },
    ai: { aggression: 9, trade: 3 },
  }),
  preset('scientist', 'Scientist', 'Science-focused bonuses for research and infrastructure.', {
    metadata: { modName: 'Scientist Leader', internalIdPrefix: 'SCIENTIST' },
    leader: {
      name: 'Scientist',
      abilityName: 'Experimental Method',
      abilityDescription: 'Campuses and scientific buildings support faster research planning.',
    },
    bonuses: { science: 7, production: 2 },
    ai: { science: 9, aggression: 3 },
  }),
  preset('patron', 'Patron', 'Culture-focused style for civics, artists, and civic identity.', {
    metadata: { modName: 'Patron Leader', internalIdPrefix: 'PATRON' },
    leader: {
      name: 'Patron',
      abilityName: 'Public Works',
      abilityDescription: 'Cultural development is strengthened by thriving cities.',
    },
    bonuses: { culture: 7, growth: 2 },
    ai: { culture: 9, wonders: 7 },
  }),
  preset('theocrat', 'Theocrat', 'Faith-focused template with religious priorities.', {
    metadata: { modName: 'Theocrat Leader', internalIdPrefix: 'THEOCRAT' },
    bonuses: { faith: 7, culture: 2 },
    ai: { religion: 9, aggression: 4 },
  }),
  preset('merchant', 'Merchant', 'Economic template emphasizing gold and routes.', {
    metadata: { modName: 'Merchant Leader', internalIdPrefix: 'MERCHANT' },
    bonuses: { gold: 7, trade: 5 },
    ai: { trade: 9, naval: 6 },
  }),
  preset('builder', 'Builder', 'Production and wonder-oriented city planning style.', {
    metadata: { modName: 'Builder Leader', internalIdPrefix: 'BUILDER' },
    bonuses: { production: 6, growth: 4 },
    ai: { wonders: 9, aggression: 2 },
  }),
  preset('navigator', 'Navigator', 'Ocean and trade style for naval exploration.', {
    metadata: { modName: 'Navigator Leader', internalIdPrefix: 'NAVIGATOR' },
    bonuses: { trade: 6, gold: 4 },
    ai: { naval: 9, trade: 8 },
  }),
];

export function getPreset(id: string): PresetDefinition {
  return presets.find((presetItem) => presetItem.id === id) ?? presets[0];
}
