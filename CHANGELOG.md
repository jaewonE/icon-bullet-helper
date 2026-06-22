# Changelog

All notable changes to Icon Bullet Helper are documented here.

## 2.2.1

### Fixed

- Keep the plugin settings view responsive after icon layout changes or enabled/disabled toggles when non-editor Markdown leaves are open.

## 2.2.0

### Fixed

- Preserve existing list item text, including wikilinks, when picker selections convert unordered lists, ordered lists, and task checkbox markers into icon bullet or checkbox syntax.

## 2.1.0

### Changed

- Align DOM handling with Obsidian popout window compatibility guidance.
- Remove default command hotkeys so users can assign shortcuts from Obsidian Hotkeys.
- Update English and Korean documentation for configurable Hotkeys commands.

### Fixed

- Avoid direct SVG insertion through `innerHTML`.
- Avoid APIs that require a newer Obsidian minimum version than the plugin declares.

## 2.0.3

### Changed

- Add README callouts explaining that the existing checkbox-styling-helper listing now provides the more complete Codex-built Icon Bullet Helper experience.
- Link users to the renamed `icon-bullet-helper` GitHub repository.

## 2.0.2

### Fixed

- Restore the Obsidian plugin ID to `checkbox-styling-helper`.
- Restore manual installation paths to the existing plugin ID directory.

## 2.0.1

### Changed

- Rename the GitHub repository path to `icon-bullet-helper`.
- Rename the plugin ID to `icon-bullet-helper`.
- Add a demo screenshot to the README.

## 2.0.0

### Changed

- Replace the legacy checkbox styling implementation with theme-independent SVG icon bullets for Markdown list markers.
- Keep the existing `checkbox-styling-helper` plugin ID while replacing the implementation.
- Preserve Markdown source text while rendering `{marker}` and `{!marker}` syntax in Live Preview and Reading view.

## 1.0.1

### Fixed

- Treat rendered icon bullet source markers as a single editable group in Live Preview, including Backspace and Command + Backspace behavior.
- Apply the configured picker grid column count to the actual picker layout and keyboard navigation.
- Use "picker" consistently in settings and documentation.
- Correct project license metadata and documentation to GPL-3.0.
- Split English and Korean README files and add language navigation links.

## 1.0.0 - Initial Community Submission

### Added

- Theme-independent SVG icon bullet rendering for Markdown marker syntax.
- Common marker syntax such as `{p}`.
- Callout marker syntax such as `{!p}` with a solid background tint.
- Live Preview rendering through CodeMirror decorations.
- Reading view rendering through a Markdown post processor.
- Raw source text in Source view and inside fenced code blocks.
- Icon picker opened by command hotkey or list trigger text.
- Keyboard navigation inside the picker.
- `Space` selection for common markers and `Enter` selection for callout markers.
- Command to toggle the current icon bullet between common and callout forms.
- Settings tabs for general behavior, icon layout, and icon bullet definitions.
- Drag-and-drop picker layout management with a disabled area.
- Custom marker creation with editable marker name, label, color, callout background, and SVG.
- SVG sanitization for custom icons.
- Light and dark theme color adjustments.

### Notes

- Disabled icon marker entries are hidden from the picker but still render in existing notes.
- Insert helper entries create ordinary Markdown list or task syntax and are not SVG marker entries.
