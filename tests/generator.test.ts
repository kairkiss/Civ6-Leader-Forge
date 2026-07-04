import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import demoProject from '../examples/demo-project.json';
import {
  escapeSql,
  generateMod,
  getTemplateRoot,
  sanitizeId,
  type Civ6LeaderProjectConfig,
} from '../generator/src';

async function withTempDir<T>(run: (tempRoot: string) => Promise<T>): Promise<T> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'civ6-leader-forge-'));
  try {
    return await run(tempRoot);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

describe('generateMod', () => {
  it('generates stable modinfo and core SQL files for the demo project', async () => {
    await withTempDir(async (tempRoot) => {
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
      expect(modinfo).toMatchSnapshot('demo modinfo');
      expect(leaderSql).toMatchSnapshot('leader sql');
      expect(traitsSql).toContain("'DEMO_FORGE_LEADER_COMBAT_MODIFIER', 'Amount', '0'");
    });
  });

  it('writes placeholder PNG assets when no user images are provided', async () => {
    await withTempDir(async (tempRoot) => {
      const result = await generateMod(demoProject as Civ6LeaderProjectConfig, tempRoot);
      const portraitPath = path.join(
        result.outputPath,
        'Art',
        'Leaders',
        'leader-portrait-512x512.png',
      );
      const iconPath = path.join(result.outputPath, 'Art', 'Icons', 'civilization-icon-256x256.png');

      await expect(stat(portraitPath)).resolves.toMatchObject({ size: expect.any(Number) });
      await expect(stat(iconPath)).resolves.toMatchObject({ size: expect.any(Number) });
      await expect(sharp(portraitPath).metadata()).resolves.toMatchObject({
        width: 512,
        height: 512,
        format: 'png',
      });
    });
  });
});

describe('template root resolution', () => {
  it('selects the first existing candidate directory', async () => {
    await withTempDir(async (tempRoot) => {
      const missing = path.join(tempRoot, 'missing');
      const first = path.join(tempRoot, 'first');
      const second = path.join(tempRoot, 'second');
      await mkdir(first, { recursive: true });
      await mkdir(second, { recursive: true });

      expect(getTemplateRoot([missing, first, second])).toBe(first);
    });
  });

  it('throws a clear error when no template candidates exist', () => {
    const missing = path.join(os.tmpdir(), `missing-civ6-templates-${Date.now()}`);
    expect(() => getTemplateRoot([missing])).toThrow(/templates directory was not found/);
  });
});

describe('generator safety utilities', () => {
  it('escapes SQL single quotes while preserving Chinese text', () => {
    expect(escapeSql("Avery's plan 领袖的承诺")).toBe("Avery''s plan 领袖的承诺");
  });

  it('sanitizes internal ID prefixes for Civ6 identifiers', () => {
    expect(sanitizeId('123 bad-prefix!')).toBe('L_123_BAD_PREFIX');
    expect(sanitizeId('merchant leader')).toBe('MERCHANT_LEADER');
    expect(sanitizeId('科学领袖')).toBe('CUSTOM_LEADER');
  });
});
