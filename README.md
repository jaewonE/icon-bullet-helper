# Icon Bullet Helper

Icon Bullet Helper is an Obsidian plugin for writing semantic icon bullets in plain Markdown.

The plugin replaces marker syntax such as `- {p}` with an SVG icon in Live Preview and Reading mode. It does not depend on an Obsidian theme, CSS snippets, or checkbox status styling. The Markdown source stays portable and readable.

```markdown
- {p} This worked well.
- {c} This needs revision.
- {i} This is background information.
```

## Why This Exists

The original experiment started as a checkbox styling helper, but the useful behavior is closer to an icon bullet workflow:

- Write ordinary Markdown list lines.
- Insert a small semantic marker after the list bullet.
- Render that marker as an icon bullet without rewriting the rest of the line.
- Use a keyboard and mouse picker to avoid memorizing every marker.

This repository is the clean project home for that icon bullet helper direction.

## Core Behavior

- Opens an icon picker from a command hotkey.
- Opens the same picker automatically after a list trigger such as `- {`.
- Supports keyboard selection with arrow keys, `Space` for common icon bullets, and `Enter` for callout icon bullets.
- Supports mouse hover and click selection.
- Keeps picker keyboard navigation inside the popup instead of moving the editor cursor at the same time.
- Renders configured SVG markers in Live Preview through CodeMirror decorations.
- Renders configured SVG markers in Reading mode through a Markdown post processor.
- Keeps the underlying Markdown text unchanged after rendering.

## Usage

Press the command hotkey:

- macOS: `Command + ;`
- Windows/Linux: `Ctrl + ;`

Then select a picker item with the mouse or keyboard.

You can also type the configured trigger after a list marker:

```markdown
- {
```

Selecting `Good` converts the current line to:

```markdown
- {p}
```

Pressing `Enter` instead inserts the callout form:

```markdown
- {!p}
```

Callout icon bullets render with a solid-color background tint. If no callout background is set for an icon, the tint is derived from the icon's main color.

The default trigger is `{`, and it can be changed in the plugin settings.

## Supported List Forms

The icon marker renderer currently targets unordered Markdown list markers:

```markdown
- {p} Dash list
- {!p} Dash list callout
* {i} Asterisk list
+ {q} Plus list
```

The picker can also insert compatibility syntax for common Markdown forms:

| Picker item | Inserted text | Rendered as an icon marker |
| --- | --- | --- |
| Number | `1. ` | No |
| Default | `- ` | No |
| Unchecked | `- [ ] ` | No |
| Incomplete | `- [/] ` | No |
| Checked | `- [x] ` | No |

Those entries are insert helpers. They are intentionally not converted into `{marker}` syntax.

## Default SVG Markers

| Marker | Picker label |
| --- | --- |
| `{next-step}` | Next step |
| `{next}` | Next |
| `{therefore}` | Therefore |
| `{clip}` | Clip |
| `{p}` | Good |
| `{c}` | Bad |
| `{q}` | Question |
| `{important}` | Important |
| `{bookmark}` | Bookmark |
| `{star}` | Star |
| `{fire}` | Fire |
| `{up}` | Up |
| `{down}` | Down |
| `{forwarded}` | Forwarded |
| `{scheduling}` | Scheduling |
| `{i}` | Information |
| `{location}` | Location |
| `{quote}` | Quote |
| `{dollar}` | Dollar |
| `{idea}` | Idea |
| `{k}` | Key |
| `{win}` | Win |

## Settings

The settings tab includes:

- Popup size: `Small`, `Medium`, or `Big`.
- Popup trigger text.
- Enable/disable state for each picker item.
- Built-in picker selection keys: `Space` inserts `{marker}`, and `Enter` inserts `{!marker}`. Additional shortcuts can be assigned to the picker selection commands from Obsidian's Hotkeys settings.
- Collapsible configuration blocks for marker entries.
- Label, marker, color, callout background color, and SVG editing for SVG icon entries.
- Add custom marker.
- Restore defaults.

`Number`, `Default`, `Unchecked`, `Incomplete`, and `Checked` are fixed insert helpers. They can be enabled or disabled, but their inserted text is not edited from the settings UI.

Custom SVG input is sanitized before storage and rendering. The sanitizer is intentionally conservative: it keeps SVG markup useful for icons while removing scriptable and externally loaded content.

## Manual Installation

Build the plugin:

```bash
npm install
npm run build
```

Copy the generated release files from `build/` into an Obsidian vault plugin folder:

```text
<Vault>/.obsidian/plugins/icon-bullet-helper/
  main.js
  manifest.json
  styles.css
```

Reload Obsidian and enable **Icon Bullet Helper** from **Settings -> Community plugins**.

## Development

Install dependencies:

```bash
npm install
```

Start the esbuild watcher:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

The production build writes the Obsidian release artifacts to both the repository root and `build/`:

- `main.js`
- `manifest.json`
- `styles.css`

`main.js` and `build/` are generated artifacts and are ignored by git.

## Architecture

The code is intentionally split by feature boundary:

- `main.ts`: plugin lifecycle, settings tab, command registration, trigger handling.
- `default_icons.ts`: default marker definitions, insert helpers, SVG creation, validation, normalization, sanitization.
- `iconPicker.ts`: popup UI, keyboard/mouse interaction, selection insertion.
- `iconBulletExtension.ts`: Live Preview CodeMirror decorations.
- `postProcessor.ts`: Reading mode rendering.
- `styles.css`: popup, settings, and rendered marker styles.
- `esbuild.config.mjs`: Obsidian-compatible bundle build.

## Current Scope

This is a prototype-grade plugin with a clean repository boundary. The main behavior is usable, but some areas are intentionally not claimed as complete:

- No Dataview-specific rendering integration.
- No export guarantee for rendered icons.
- No ordered-list marker replacement beyond the picker insert helper.
- No task plugin status model integration.
- No remote services, telemetry, or network behavior.
