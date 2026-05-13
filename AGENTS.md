# AGENTS.md

This repository contains the Obsidian plugin **Icon Bullet Helper**. Treat it as a standalone icon bullet project, not as a checkbox styling helper.

## Project Goal

Provide theme-independent icon bullets for Obsidian Markdown lists.

The plugin should:

- Preserve Markdown source text.
- Render `{marker}` syntax as SVG icon bullets in Live Preview and Reading mode.
- Offer a picker that can be opened by command hotkey or by typing the configured trigger after a list marker.
- Keep picker keyboard navigation isolated from the editor while the picker is open.
- Avoid dependence on Obsidian theme checkbox styling.

## Important Constraints

- Do not reintroduce theme-dependent checkbox CSS as the primary rendering system.
- Do not rename the plugin ID after release. The intended ID is `icon-bullet-helper`.
- Do not change or remove `LICENSE` unless the repository owner explicitly asks.
- Do not commit generated artifacts unless explicitly requested:
  - `node_modules/`
  - `main.js`
  - `build/`
  - `data.json`
- Keep the plugin compatible with Obsidian's bundled CodeMirror environment. External runtime dependencies should be bundled or marked external only when Obsidian provides them.
- The source of truth for icon markers is `default_icons.ts`.
- The source of truth for picker behavior is `iconPicker.ts`.

## Repository Layout

```text
.
├── main.ts                  # Plugin lifecycle, settings, commands, trigger handling
├── default_icons.ts         # Default icons, insert helpers, validation, sanitization
├── iconPicker.ts            # Picker UI and keyboard/mouse behavior
├── iconBulletExtension.ts   # Live Preview CodeMirror decorations
├── postProcessor.ts         # Reading mode Markdown post processor
├── styles.css               # Rendered icon, picker, and settings styles
├── manifest.json            # Obsidian plugin manifest
├── versions.json            # Obsidian min app version map
├── esbuild.config.mjs       # Bundling configuration
├── version-bump.mjs         # Obsidian sample version helper
└── build/                   # Generated release files after npm run build
```

The project currently uses root-level TypeScript modules. Do not create a new `src/` layout unless the migration is deliberate and all imports/build settings are updated together.

## Common Commands

Install dependencies:

```bash
npm install
```

Development watcher:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

The build command must:

1. Type-check with `tsc`.
2. Bundle `main.ts` into `main.js`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into `build/`.

Before handing off substantial changes, run:

```bash
npm run build
git status --short
```

Use `git diff --check` when whitespace-sensitive edits were made.

## Feature Boundaries

### Picker

The picker must support:

- Hotkey-triggered opening.
- Trigger-text opening after a Markdown list marker.
- Arrow key movement inside the picker.
- `Enter` and `Space` selection.
- Mouse hover and click selection.
- Escape/click-away dismissal.

When the picker is open, keyboard events for navigation and selection should be consumed by the picker handler so the editor cursor does not move at the same time.

### Insert Helpers

These entries insert raw Markdown syntax and are not SVG marker entries:

- Number -> `1. `
- Default -> `- `
- Unchecked -> `- [ ] `
- Incomplete -> `- [/] `
- Checked -> `- [x] `

Settings for these entries should stay limited unless the product direction changes. They currently support enable/disable state only.

### SVG Marker Entries

SVG marker entries render as icon bullets. A marker line has this source shape:

```markdown
- {marker} Text
```

Rules:

- Keep marker validation strict enough to avoid ambiguous Markdown behavior.
- Keep SVG sanitization conservative.
- Do not allow scripts, event attributes, external image loads, or foreign HTML.
- Prefer solid, readable SVG shapes over thin outline-only icons.
- Keep icon colors explicit or Obsidian-theme-variable based.

### Rendering

Live Preview rendering belongs in `iconBulletExtension.ts`.

Reading mode rendering belongs in `postProcessor.ts`.

Both rendering paths should share normalized icon configuration from `default_icons.ts`. Avoid duplicating marker parsing rules in divergent ways.

## Style Guidance

- Match existing code style: tabs, TypeScript, small helper functions, explicit types where useful.
- Keep settings UI practical and compact. Use collapsible blocks for long icon configuration.
- Do not add explanatory text inside the picker; it should remain a picker, not a tutorial.
- Preserve current picker visual direction: compact rows, icon plus label, hover/focus background, no per-item button border.
- Make icon changes in SVG definitions, not by relying on theme CSS.

## Release Notes

For an Obsidian release, the required files are:

- `main.js`
- `manifest.json`
- `styles.css`

The version in `manifest.json`, `package.json`, and `versions.json` should be kept in sync.

GitHub release tags for Obsidian plugins should match the plugin version exactly, without a leading `v`.
