## Icon Bullet Helper

This Obsidian plugin prototype replaces unordered-list bullets with semantic SVG icons without relying on checkbox styling or theme-specific CSS.

The Markdown source stays readable and portable:

```markdown
- {p} Fast enough for interactive work.
- {c} Uses more memory.
- {i} Works in Live Preview and Reading mode.
```

When the plugin is enabled, the `{p}`, `{c}`, and `{i}` markers are rendered as icon bullets. The original Markdown is not rewritten.

### Usage

Press `Command + ;` on macOS or `Ctrl + ;` on Windows/Linux to open the icon picker at the cursor. Choose an icon with the mouse, arrow keys, `Enter`, or `Space`.

You can also type the popup trigger after an unordered-list marker:

```markdown
- {
```

Selecting an icon converts it to:

```markdown
- {p}
```

The popup trigger can be changed in the plugin settings.

### Default picker items

The picker also includes raw syntax entries that do not render as SVG markers:

| Item | Inserted text |
|---|---|
| Number | `1. ` |
| Default | `- ` |
| Unchecked | `- [ ] ` |
| Incomplete | `- [/] ` |
| Checked | `- [x] ` |

SVG icon marker entries:

| Marker | Meaning |
|---|---|
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

### Settings

The settings tab lets you expand each item only when needed, enable or disable it, edit labels, and edit SVG/color for icon marker entries. SVG input is sanitized before storage and rendering.

### Current prototype scope

- Supports unordered lists using `-`, `*`, or `+`.
- Supports Live Preview through a CodeMirror decoration extension.
- Supports Reading mode through a Markdown post processor.
- Keeps shortcut-triggered popup selection behavior from the previous implementation.
- Does not implement ordered-list replacement, task status integration, Dataview integration, or full export guarantees yet.
