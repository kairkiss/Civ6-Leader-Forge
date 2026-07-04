# Architecture

Civ6 Leader Forge separates the desktop shell, renderer UI, and generator library.

- `src/renderer`: React forms, previews, workflow navigation, and local UI state.
- `src/main`: Electron IPC, native dialogs, file export, ZIP export, install-to-Mods, and opening folders.
- `src/preload`: Narrow context bridge exposed as `window.forgeApi`.
- `generator/src`: TypeScript library for validation, ID sanitization, template rendering, and asset resizing.
- `generator/templates`: Handlebars templates for `.modinfo`, SQL, localization, and README output.
- `generator/presets`: Preset data belongs here as the project grows. The MVP exports presets from `generator/src/presets.ts`.

Renderer code should never write files directly. Main process code should not own form behavior. Generator code should remain usable from a future CLI.
