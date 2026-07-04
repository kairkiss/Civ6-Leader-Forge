import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import demoProject from '../examples/demo-project.json';
import { generateMod, type Civ6LeaderProjectConfig } from '../generator/src';

describe('generateMod', () => {
  it('generates stable modinfo and core SQL files for the demo project', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'civ6-leader-forge-'));
    try {
      const result = await generateMod(demoProject as Civ6LeaderProjectConfig, tempRoot);
      const modinfo = await readFile(
        path.join(result.outputPath, 'demo-forge-leader.modinfo'),
        'utf8',
      );
      const leaderSql = await readFile(path.join(result.outputPath, 'Data', 'Leader.sql'), 'utf8');
      const traitsSql = await readFile(path.join(result.outputPath, 'Data', 'Traits.sql'), 'utf8');

      expect(result.modFolderName).toBe('demo-forge-leader');
      expect(modinfo).toContain('<Name>Demo Forge Leader</Name>');
      expect(modinfo).toContain('<File>Data/Leader.sql</File>');
      expect(leaderSql).toMatchSnapshot();
      expect(traitsSql).toContain("'DEMO_FORGE_LEADER_COMBAT_MODIFIER', 'Amount', '0'");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
