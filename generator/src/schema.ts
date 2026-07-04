import { z } from 'zod';
import type { Civ6LeaderProjectConfig } from './types';

const boundedBonus = z.coerce.number().min(-100).max(100).default(0);
const boundedPersonality = z.coerce.number().min(0).max(10).default(5);

export const projectConfigSchema = z.object({
  version: z.literal(1),
  metadata: z.object({
    modName: z.string().min(1).max(80),
    author: z.string().min(1).max(80),
    internalIdPrefix: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Use letters, numbers, and underscores. Start with a letter.'),
  }),
  civilization: z.object({
    name: z.string().min(1).max(80),
    adjective: z.string().min(1).max(80),
    abilityName: z.string().min(1).max(80),
    abilityDescription: z.string().min(1).max(600),
  }),
  leader: z.object({
    name: z.string().min(1).max(80),
    abilityName: z.string().min(1).max(80),
    abilityDescription: z.string().min(1).max(600),
  }),
  bonuses: z.object({
    science: boundedBonus,
    culture: boundedBonus,
    gold: boundedBonus,
    faith: boundedBonus,
    production: boundedBonus,
    combat: boundedBonus,
    growth: boundedBonus,
    trade: boundedBonus,
  }),
  ai: z.object({
    aggression: boundedPersonality,
    science: boundedPersonality,
    culture: boundedPersonality,
    religion: boundedPersonality,
    naval: boundedPersonality,
    trade: boundedPersonality,
    wonders: boundedPersonality,
  }),
  text: z.object({
    leaderIntro: z.string().min(1).max(1000),
    civilizationIntro: z.string().min(1).max(1000),
    loadingScreen: z.string().min(1).max(1000),
    greeting: z.string().min(1).max(500),
    denounce: z.string().min(1).max(500),
    declareWar: z.string().min(1).max(500),
    defeat: z.string().min(1).max(500),
  }),
  assets: z
    .array(
      z.object({
        role: z.enum(['leaderPortrait', 'leaderBackground', 'civilizationIcon']),
        sourcePath: z.string().optional(),
        crop: z
          .object({
            x: z.number().min(0),
            y: z.number().min(0),
            width: z.number().positive(),
            height: z.number().positive(),
          })
          .optional(),
      }),
    )
    .default([]),
});

export function parseProjectConfig(value: unknown): Civ6LeaderProjectConfig {
  return projectConfigSchema.parse(value);
}
