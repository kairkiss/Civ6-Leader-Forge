import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bot,
  Download,
  FileText,
  FolderOpen,
  Hammer,
  Home,
  Image,
  Package,
  Save,
  SlidersHorizontal,
  Sparkles,
  Swords,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  presets,
  projectConfigSchema,
  type Civ6LeaderProjectConfig,
  type GenerateResult,
} from '../../../generator/src/browser';
import { Field, TextArea } from '../components/Field';
import { FormSection } from '../components/FormSection';
import { PreviewPanel } from '../components/PreviewPanel';
import { useProjectStore } from '../store/projectStore';

type StepId =
  | 'home'
  | 'templates'
  | 'basic'
  | 'abilities'
  | 'ai'
  | 'text'
  | 'images'
  | 'export';

const steps: Array<{ id: StepId; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'templates', label: 'Templates', icon: Sparkles },
  { id: 'basic', label: 'Basic Info', icon: FileText },
  { id: 'abilities', label: 'Abilities', icon: SlidersHorizontal },
  { id: 'ai', label: 'AI Personality', icon: Bot },
  { id: 'text', label: 'Text', icon: Hammer },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'export', label: 'Export', icon: Package },
];

const bonusLabels: Array<[keyof Civ6LeaderProjectConfig['bonuses'], string]> = [
  ['science', 'Science bonus'],
  ['culture', 'Culture bonus'],
  ['gold', 'Gold bonus'],
  ['faith', 'Faith bonus'],
  ['production', 'Production bonus'],
  ['combat', 'Combat strength bonus'],
  ['growth', 'City growth bonus'],
  ['trade', 'Trade bonus'],
];

const aiLabels: Array<[keyof Civ6LeaderProjectConfig['ai'], string]> = [
  ['aggression', 'Aggression'],
  ['science', 'Science preference'],
  ['culture', 'Culture preference'],
  ['religion', 'Religion preference'],
  ['naval', 'Naval preference'],
  ['trade', 'Trade preference'],
  ['wonders', 'Wonder preference'],
];

const assetLabels: Array<[Civ6LeaderProjectConfig['assets'][number]['role'], string]> = [
  ['leaderPortrait', 'Leader portrait'],
  ['leaderBackground', 'Leader background'],
  ['civilizationIcon', 'Civilization icon'],
];

export function App() {
  const { config, updateConfig, activePresetId, setPreset, setAssetPath } = useProjectStore();
  const [activeStep, setActiveStep] = useState<StepId>('home');
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [outputDir, setOutputDir] = useState('');
  const [defaultModsPath, setDefaultModsPath] = useState('');
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [zipPath, setZipPath] = useState('');
  const [message, setMessage] = useState('');

  const form = useForm<Civ6LeaderProjectConfig>({
    resolver: zodResolver(projectConfigSchema),
    mode: 'onChange',
    values: config,
  });

  const watched = form.watch();

  useEffect(() => {
    const subscription = form.watch((value) => {
      updateConfig(value as Civ6LeaderProjectConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, updateConfig]);

  useEffect(() => {
    void window.forgeApi.getDefaultCiv6ModsPath().then(setDefaultModsPath);
  }, []);

  const stepIndex = useMemo(
    () => steps.findIndex((step) => step.id === activeStep),
    [activeStep],
  );

  async function chooseOutputDir() {
    const selected = await window.forgeApi.selectOutputDirectory();
    if (selected) {
      setOutputDir(selected);
      setMessage(`Output directory selected: ${selected}`);
    }
  }

  async function chooseImage(role: Civ6LeaderProjectConfig['assets'][number]['role']) {
    const selected = await window.forgeApi.selectImageFile();
    if (!selected) {
      return;
    }
    setAssetPath(role, selected.path);
    setImagePreviews((current) => ({ ...current, [role]: selected.dataUrl }));
  }

  async function generate() {
    const valid = await form.trigger();
    if (!valid) {
      setMessage('Please fix validation errors before generating.');
      return;
    }
    if (!outputDir) {
      await chooseOutputDir();
      if (!outputDir) {
        return;
      }
    }
    const result = await window.forgeApi.generateMod(form.getValues(), outputDir);
    setGenerated(result);
    setMessage(`Generated ${result.modFolderName}`);
  }

  async function exportZip() {
    if (!generated) {
      setMessage('Generate the mod folder before exporting ZIP.');
      return;
    }
    const result = await window.forgeApi.exportZip(generated.outputPath);
    setZipPath(result.zipPath);
    setMessage(`ZIP exported: ${result.zipPath}`);
  }

  async function install() {
    if (!generated) {
      setMessage('Generate the mod folder before installing.');
      return;
    }
    const result = await window.forgeApi.installToCiv6Mods(generated.outputPath);
    setMessage(`Installed to ${result.destination}`);
  }

  function nextStep() {
    setActiveStep(steps[Math.min(steps.length - 1, stepIndex + 1)].id);
  }

  function previousStep() {
    setActiveStep(steps[Math.max(0, stepIndex - 1)].id);
  }

  return (
    <FormProvider {...form}>
      <div className="app-shell">
        <nav className="sidebar">
          <div className="brand">
            <Swords size={25} />
            <span>Civ6 Leader Forge</span>
          </div>
          <div className="step-list">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  className={activeStep === step.id ? 'active' : ''}
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  title={step.label}
                >
                  <Icon size={18} />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="workspace">
          <header className="topbar">
            <div>
              <h1>{steps[stepIndex].label}</h1>
              <p>Build a local, asset-safe Civilization VI leader mod scaffold.</p>
            </div>
            <button className="ghost-button" type="button" onClick={chooseOutputDir}>
              <FolderOpen size={18} />
              Choose Output
            </button>
          </header>

          <form className="editor-surface">
            <div className="editor-panel">
              {activeStep === 'home' ? (
                <FormSection
                  title="Project overview"
                  description="This first phase focuses on visual editing, template generation, and local file export without bundling official assets."
                >
                  <div className="notice-grid">
                    <article>
                      <strong>Generator-first</strong>
                      <span>.modinfo, SQL, localization, README, and art folders are generated from JSON.</span>
                    </article>
                    <article>
                      <strong>Asset-safe</strong>
                      <span>Only user-imported images and generated placeholders are exported.</span>
                    </article>
                    <article>
                      <strong>Windows-ready</strong>
                      <span>Exports ZIPs and copies generated folders to the default Civ6 Mods path.</span>
                    </article>
                  </div>
                </FormSection>
              ) : null}

              {activeStep === 'templates' ? (
                <FormSection title="Template" description="Pick a style preset. Names are generic and do not reference official leaders.">
                  <div className="preset-grid">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={activePresetId === preset.id ? 'preset-card selected' : 'preset-card'}
                        onClick={() => {
                          setPreset(preset.id);
                          form.reset(preset.config);
                        }}
                      >
                        <strong>{preset.name}</strong>
                        <span>{preset.summary}</span>
                      </button>
                    ))}
                  </div>
                </FormSection>
              ) : null}

              {activeStep === 'basic' ? (
                <FormSection title="Basic Info" description="These fields drive file names, localization tags, and in-game labels.">
                  <Field label="Mod name" registration={form.register('metadata.modName')} error={form.formState.errors.metadata?.modName} />
                  <Field label="Author name" registration={form.register('metadata.author')} error={form.formState.errors.metadata?.author} />
                  <Field label="Leader name" registration={form.register('leader.name')} error={form.formState.errors.leader?.name} />
                  <Field label="Civilization name" registration={form.register('civilization.name')} error={form.formState.errors.civilization?.name} />
                  <Field label="Civilization adjective" registration={form.register('civilization.adjective')} error={form.formState.errors.civilization?.adjective} />
                  <Field label="Internal ID prefix" registration={form.register('metadata.internalIdPrefix')} error={form.formState.errors.metadata?.internalIdPrefix} />
                  <Field label="Leader ability name" registration={form.register('leader.abilityName')} error={form.formState.errors.leader?.abilityName} />
                  <Field label="Civilization ability name" registration={form.register('civilization.abilityName')} error={form.formState.errors.civilization?.abilityName} />
                </FormSection>
              ) : null}

              {activeStep === 'abilities' ? (
                <FormSection title="Abilities and values" description="MVP values are conservative SQL scaffolding and should be play-tested.">
                  {bonusLabels.map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      type="number"
                      min={-100}
                      max={100}
                      registration={form.register(`bonuses.${key}`, { valueAsNumber: true })}
                      error={form.formState.errors.bonuses?.[key]}
                    />
                  ))}
                </FormSection>
              ) : null}

              {activeStep === 'ai' ? (
                <FormSection title="AI Personality" description="Set 0-10 tendencies for agenda scaffolding.">
                  {aiLabels.map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      type="number"
                      min={0}
                      max={10}
                      registration={form.register(`ai.${key}`, { valueAsNumber: true })}
                      error={form.formState.errors.ai?.[key]}
                    />
                  ))}
                </FormSection>
              ) : null}

              {activeStep === 'text' ? (
                <FormSection title="Text" description="Write original text. Do not paste official Firaxis or 2K copy.">
                  <TextArea label="Leader introduction" registration={form.register('text.leaderIntro')} error={form.formState.errors.text?.leaderIntro} />
                  <TextArea label="Civilization introduction" registration={form.register('text.civilizationIntro')} error={form.formState.errors.text?.civilizationIntro} />
                  <TextArea label="Leader ability description" registration={form.register('leader.abilityDescription')} error={form.formState.errors.leader?.abilityDescription} />
                  <TextArea label="Civilization ability description" registration={form.register('civilization.abilityDescription')} error={form.formState.errors.civilization?.abilityDescription} />
                  <TextArea label="Loading screen text" registration={form.register('text.loadingScreen')} error={form.formState.errors.text?.loadingScreen} />
                  <TextArea label="Diplomacy greeting" registration={form.register('text.greeting')} error={form.formState.errors.text?.greeting} />
                  <TextArea label="Denounce text" registration={form.register('text.denounce')} error={form.formState.errors.text?.denounce} />
                  <TextArea label="Declare war text" registration={form.register('text.declareWar')} error={form.formState.errors.text?.declareWar} />
                  <TextArea label="Defeat text" registration={form.register('text.defeat')} error={form.formState.errors.text?.defeat} />
                </FormSection>
              ) : null}

              {activeStep === 'images' ? (
                <FormSection title="Images" description="Import original or user-owned artwork. The generator exports PNG placeholders and resized previews.">
                  <div className="asset-grid">
                    {assetLabels.map(([role, label]) => (
                      <button className="asset-picker" type="button" key={role} onClick={() => void chooseImage(role)}>
                        <span>{label}</span>
                        {imagePreviews[role] ? <img src={imagePreviews[role]} alt="" /> : <em>Select image</em>}
                      </button>
                    ))}
                  </div>
                </FormSection>
              ) : null}

              {activeStep === 'export' ? (
                <FormSection title="Generate Mod" description="Generate a folder, export a ZIP, or copy the folder into the default Windows Mods directory.">
                  <div className="export-actions">
                    <button type="button" onClick={() => void generate()}>
                      <Save size={18} />
                      Generate Mod
                    </button>
                    <button type="button" onClick={() => void exportZip()}>
                      <Download size={18} />
                      Export ZIP
                    </button>
                    <button type="button" onClick={() => void install()}>
                      <Package size={18} />
                      Install to Mods
                    </button>
                    <button
                      type="button"
                      onClick={() => generated && void window.forgeApi.openFolder(generated.outputPath)}
                    >
                      <FolderOpen size={18} />
                      Open Folder
                    </button>
                  </div>
                  <div className="path-box">
                    <strong>Default Civ6 Mods directory</strong>
                    <span>{defaultModsPath}</span>
                  </div>
                </FormSection>
              ) : null}
            </div>

            <PreviewPanel
              config={watched as Civ6LeaderProjectConfig}
              imagePreviews={imagePreviews}
              outputDir={outputDir}
              generatedPath={generated?.outputPath}
              zipPath={zipPath}
            />
          </form>

          <footer className="actionbar">
            <button type="button" className="ghost-button" onClick={previousStep} disabled={stepIndex === 0}>
              Back
            </button>
            <span>{message || 'Ready'}</span>
            <button type="button" onClick={nextStep} disabled={stepIndex === steps.length - 1}>
              Next
            </button>
          </footer>
        </main>
      </div>
    </FormProvider>
  );
}
