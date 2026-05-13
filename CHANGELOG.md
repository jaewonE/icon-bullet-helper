# Changelog

All notable changes to Icon Bullet Helper are documented here.

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
