# Presets

MVP presets are currently implemented in `generator/src/presets.ts` so they can be imported by both tests and renderer code without a runtime JSON loader.

Future versions can move each preset to JSON files in this directory, validated by the same Zod schema before use.
