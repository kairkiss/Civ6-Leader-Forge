import { BadgeCheck, FileArchive, FolderOpen, PackageCheck } from 'lucide-react';
import type { Civ6LeaderProjectConfig } from '../../../generator/src/browser';

interface PreviewPanelProps {
  config: Civ6LeaderProjectConfig;
  imagePreviews: Record<string, string>;
  outputDir: string;
  generatedPath?: string;
  zipPath?: string;
}

export function PreviewPanel({
  config,
  imagePreviews,
  outputDir,
  generatedPath,
  zipPath,
}: PreviewPanelProps) {
  const leaderImage = imagePreviews.leaderPortrait;
  const backgroundImage = imagePreviews.leaderBackground;
  const iconImage = imagePreviews.civilizationIcon;

  return (
    <aside className="preview-panel">
      <div className="preview-card">
        <div
          className="leader-preview"
          style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
        >
          <div className="portrait-frame">
            {leaderImage ? <img src={leaderImage} alt="" /> : <span>Portrait</span>}
          </div>
          <div className="icon-frame">{iconImage ? <img src={iconImage} alt="" /> : <span>Icon</span>}</div>
        </div>
        <div className="preview-copy">
          <h2>{config.leader.name}</h2>
          <p>{config.civilization.name}</p>
          <strong>{config.leader.abilityName}</strong>
          <span>{config.leader.abilityDescription}</span>
        </div>
      </div>

      <div className="status-stack">
        <div>
          <BadgeCheck size={18} />
          <span>Config validates before export</span>
        </div>
        <div>
          <FolderOpen size={18} />
          <span>{outputDir || 'No output directory selected'}</span>
        </div>
        <div>
          <PackageCheck size={18} />
          <span>{generatedPath || 'No generated folder yet'}</span>
        </div>
        <div>
          <FileArchive size={18} />
          <span>{zipPath || 'ZIP not exported yet'}</span>
        </div>
      </div>
    </aside>
  );
}
