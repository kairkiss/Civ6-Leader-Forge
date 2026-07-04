import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import sharp from 'sharp';
import { parseProjectConfig } from './schema';
import type { AssetRole, Civ6LeaderProjectConfig, GeneratedFile, GenerateResult } from './types';
import { clamp, escapeSql, escapeXml, sanitizeId, slugify } from './utils';

export { presets, getPreset } from './presets';
export { projectConfigSchema, parseProjectConfig } from './schema';
export type { Civ6LeaderProjectConfig, GenerateResult, PresetDefinition } from './types';
export { escapeSql, sanitizeId, slugify } from './utils';

interface TemplateContext {
  modId: string;
  modGuid: string;
  modName: string;
  author: string;
  prefix: string;
  civilizationType: string;
  leaderType: string;
  traitCivilization: string;
  traitLeader: string;
  agendaType: string;
  safe: Civ6LeaderProjectConfig;
  sql: Civ6LeaderProjectConfig;
  xml: Civ6LeaderProjectConfig;
  bonuses: Record<string, number>;
  ai: Record<string, number>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTemplateRoot(): string {
  if (process.versions.electron && process.resourcesPath) {
    return path.join(process.resourcesPath, 'generator', 'templates');
  }
  return path.resolve(__dirname, '..', 'templates');
}

function stableGuid(seed: string): string {
  let hash = 0x811c9dc5;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `${hex}-0000-4000-8000-${hex}${hex.slice(0, 4)}`;
}

function mapConfig(config: Civ6LeaderProjectConfig, mapValue: (value: string) => string) {
  return {
    ...config,
    metadata: {
      ...config.metadata,
      modName: mapValue(config.metadata.modName),
      author: mapValue(config.metadata.author),
      internalIdPrefix: mapValue(config.metadata.internalIdPrefix),
    },
    civilization: {
      ...config.civilization,
      name: mapValue(config.civilization.name),
      adjective: mapValue(config.civilization.adjective),
      abilityName: mapValue(config.civilization.abilityName),
      abilityDescription: mapValue(config.civilization.abilityDescription),
    },
    leader: {
      ...config.leader,
      name: mapValue(config.leader.name),
      abilityName: mapValue(config.leader.abilityName),
      abilityDescription: mapValue(config.leader.abilityDescription),
    },
    text: {
      ...config.text,
      leaderIntro: mapValue(config.text.leaderIntro),
      civilizationIntro: mapValue(config.text.civilizationIntro),
      loadingScreen: mapValue(config.text.loadingScreen),
      greeting: mapValue(config.text.greeting),
      denounce: mapValue(config.text.denounce),
      declareWar: mapValue(config.text.declareWar),
      defeat: mapValue(config.text.defeat),
    },
  };
}

function buildContext(config: Civ6LeaderProjectConfig): TemplateContext {
  const prefix = sanitizeId(config.metadata.internalIdPrefix);
  const safe = parseProjectConfig(config);
  return {
    modId: slugify(config.metadata.modName),
    modGuid: stableGuid(`${config.metadata.modName}:${config.metadata.author}:${prefix}`),
    modName: config.metadata.modName,
    author: config.metadata.author,
    prefix,
    civilizationType: `CIVILIZATION_${prefix}`,
    leaderType: `LEADER_${prefix}`,
    traitCivilization: `TRAIT_CIVILIZATION_${prefix}_ABILITY`,
    traitLeader: `TRAIT_LEADER_${prefix}_ABILITY`,
    agendaType: `AGENDA_${prefix}`,
    safe,
    sql: mapConfig(config, escapeSql),
    xml: mapConfig(config, escapeXml),
    bonuses: Object.fromEntries(
      Object.entries(config.bonuses).map(([key, value]) => [key, clamp(value, -100, 100)]),
    ),
    ai: Object.fromEntries(
      Object.entries(config.ai).map(([key, value]) => [key, clamp(value, 0, 10)]),
    ),
  };
}

async function renderTemplate(templatePath: string, context: TemplateContext): Promise<string> {
  const source = await readFile(path.join(getTemplateRoot(), templatePath), 'utf8');
  return Handlebars.compile(source, { noEscape: true })(context);
}

async function writeRendered(
  outputRoot: string,
  relativePath: string,
  templatePath: string,
  context: TemplateContext,
  files: GeneratedFile[],
): Promise<void> {
  const destination = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, await renderTemplate(templatePath, context), 'utf8');
  files.push({ path: destination, kind: 'text' });
}

function placeholderSvg(label: string, width: number, height: number): Buffer {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#e8e1cf"/>
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" fill="#f7f4ec" stroke="#9f7b38" stroke-width="3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.floor(width / 12))}" fill="#28322d">${label}</text>
</svg>`);
}

const assetPlans: Record<AssetRole, { dir: string; base: string; sizes: Array<[number, number]> }> = {
  leaderPortrait: {
    dir: path.join('Art', 'Leaders'),
    base: 'leader-portrait',
    sizes: [
      [256, 256],
      [512, 512],
    ],
  },
  leaderBackground: {
    dir: path.join('Art', 'Backgrounds'),
    base: 'leader-background',
    sizes: [[1024, 576]],
  },
  civilizationIcon: {
    dir: path.join('Art', 'Icons'),
    base: 'civilization-icon',
    sizes: [
      [64, 64],
      [128, 128],
      [256, 256],
    ],
  },
};

async function processAssets(
  config: Civ6LeaderProjectConfig,
  outputRoot: string,
  files: GeneratedFile[],
): Promise<void> {
  for (const [role, plan] of Object.entries(assetPlans) as Array<[AssetRole, typeof assetPlans[AssetRole]]>) {
    const asset = config.assets.find((candidate) => candidate.role === role);
    const assetDir = path.join(outputRoot, plan.dir);
    await mkdir(assetDir, { recursive: true });
    files.push({ path: assetDir, kind: 'directory' });

    for (const [width, height] of plan.sizes) {
      const destination = path.join(assetDir, `${plan.base}-${width}x${height}.png`);
      const source = asset?.sourcePath
        ? sharp(asset.sourcePath)
        : sharp(placeholderSvg(role.replace(/([A-Z])/g, ' $1'), width, height));

      let pipeline = source;
      if (asset?.crop) {
        pipeline = pipeline.extract({
          left: Math.round(asset.crop.x),
          top: Math.round(asset.crop.y),
          width: Math.round(asset.crop.width),
          height: Math.round(asset.crop.height),
        });
      }
      await pipeline.resize(width, height, { fit: 'cover' }).png().toFile(destination);
      files.push({ path: destination, kind: 'asset' });
    }
  }
}

export async function generateMod(
  rawConfig: Civ6LeaderProjectConfig,
  outputDir: string,
): Promise<GenerateResult> {
  const config = parseProjectConfig(rawConfig);
  const context = buildContext(config);
  const modFolderName = slugify(config.metadata.modName);
  const outputRoot = path.join(outputDir, modFolderName);
  const files: GeneratedFile[] = [];

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  files.push({ path: outputRoot, kind: 'directory' });

  await writeRendered(outputRoot, `${modFolderName}.modinfo`, 'modinfo.hbs', context, files);
  await writeRendered(outputRoot, path.join('Data', 'Civilization.sql'), 'data/Civilization.sql.hbs', context, files);
  await writeRendered(outputRoot, path.join('Data', 'Leader.sql'), 'data/Leader.sql.hbs', context, files);
  await writeRendered(outputRoot, path.join('Data', 'Traits.sql'), 'data/Traits.sql.hbs', context, files);
  await writeRendered(outputRoot, path.join('Data', 'Agenda.sql'), 'data/Agenda.sql.hbs', context, files);
  await writeRendered(outputRoot, path.join('Data', 'Colors.sql'), 'data/Colors.sql.hbs', context, files);
  await writeRendered(
    outputRoot,
    path.join('Text', 'LocalizedText_en_US.sql'),
    'text/LocalizedText_en_US.sql.hbs',
    context,
    files,
  );
  await writeRendered(
    outputRoot,
    path.join('Text', 'LocalizedText_zh_Hans.sql'),
    'text/LocalizedText_zh_Hans.sql.hbs',
    context,
    files,
  );
  await processAssets(config, outputRoot, files);
  await writeRendered(outputRoot, 'README.txt', 'README.txt.hbs', context, files);

  return {
    modId: context.modId,
    modFolderName,
    outputPath: outputRoot,
    files,
  };
}
