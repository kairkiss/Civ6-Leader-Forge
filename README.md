# Civ6 Leader Forge

Civ6 Leader Forge is an open-source Windows desktop app for generating first-pass custom leader and civilization mod folders for Sid Meier's Civilization VI. It is designed for ordinary players who want a visual editor instead of hand-writing `.modinfo`, SQL, localization, and folder structure files.

## Disclaimer

This is an unofficial fan tooling project. It is not affiliated with, endorsed by, or sponsored by Firaxis Games, 2K, Take-Two Interactive, or the Civilization franchise owners.

The repository does not include Firaxis, 2K, or Civilization VI official images, text, music, icons, models, or other copyrighted assets. Presets store only custom parameter structures, style data, and original sample text.

## Features

- Electron + React + TypeScript desktop app.
- Template selection for Blank, Conqueror, Scientist, Patron, Theocrat, Merchant, Builder, and Navigator styles.
- Forms for leader, civilization, ability, AI personality, and diplomacy text.
- User image import, crop/preview flow, multi-size PNG export, and resource directory placeholders for portrait, background, and civilization icon.
- Generator library that can be reused by a future CLI.
- Generates `.modinfo`, `Data/*.sql`, `Text/*.sql`, `Art/*`, and `README.txt`.
- Exports ZIP archives and copies generated folders to the default Windows Civ6 Mods directory.

## Install and Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm test
npm run build
npm run build:win
```

## Generate a Mod

1. Start the app with `npm run dev`.
2. Choose a preset or start from the blank template.
3. Fill in basic info, ability values, AI personality, and original text.
4. Import user-owned images or leave the generated placeholders.
5. Choose an output directory.
6. Select `Generate Mod`, then optionally `Export ZIP` or `Install to Mods`.

The default Windows Civilization VI Mods directory is:

```text
%UserProfile%\Documents\My Games\Sid Meier's Civilization VI\Mods
```

## Current Limits

- First phase focuses on visual filling, template generation, and local file export.
- Generated SQL is conservative scaffolding and should be play-tested.
- Current image import only handles crop/preview behavior, multi-size PNG export, and placeholder resource directories.
- PNG exports do not guarantee full in-game leader art display.
- The app does not perform a complete Civilization VI art asset build.
- Complete DDS conversion, ArtDefs, XLP, icon atlas generation, leader scenes, and ModBuddy integration are planned for later versions.
- The generated output is intended as a starting point for local testing, not a full game mechanics overhaul framework.

## Asset Pipeline TODO

- DDS export and mipmap options.
- ArtDefs and XLP generation.
- Icon atlas generation.
- Optional ModBuddy project export.
- CLI support such as:

```bash
civ6-leader-forge generate config.json --out ./dist
```

## License

MIT License. See `LICENSE`.
