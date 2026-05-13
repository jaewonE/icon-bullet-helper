# Release and Community Submission Checklist

Use this checklist when preparing Icon Bullet Helper for Obsidian Community Plugins distribution.

## Required Repository Files

Keep these files in the repository root before submitting:

- `README.md`: describes what the plugin does and how to use it in English.
- `README.ko.md`: describes what the plugin does and how to use it in Korean.
- `LICENSE`: defines how the plugin source may be used.
- `manifest.json`: declares the plugin ID, name, version, author, minimum Obsidian version, description.
- `versions.json`: maps plugin versions to the minimum compatible Obsidian version.

## Version Rules

Before creating a release:

1. Update `version` in `manifest.json`.
2. Update `version` in `package.json`.
3. Update `versions.json`.
4. Use a semantic version in `x.y.z` format.
5. Create a GitHub release tag that exactly matches the `manifest.json` version.
6. Do not prefix the tag with `v`.

## Build

Run:

```bash
npm install
npm run build
```

The build must type-check the plugin, create `main.js`, and copy release assets into `build/`.

Before publishing, also run:

```bash
git diff --check
git status --short
```

Review the diff for accidental generated artifacts, temporary files, debug logging, and unrelated changes.

## Release Assets

Attach these files to the GitHub release:

- `main.js`
- `manifest.json`
- `styles.css`

Obsidian installs these files from the GitHub release whose tag matches the version in `manifest.json`.

## Initial Community Submission

After the first release is published:

1. Sign in at [community.obsidian.md](https://community.obsidian.md).
2. Link the GitHub account that owns the repository.
3. Open **Plugins** and choose **New plugin**.
4. Enter the repository URL.
5. Review and accept Obsidian's developer policies.
6. Submit the plugin for review.

The submitted repository should have the correct `manifest.json` committed on the default branch before submission.

## Compliance Notes

Icon Bullet Helper should remain aligned with these project constraints:

- Keep the plugin ID as `checkbox-styling-helper` while this project is distributed through the existing checkbox-styling-helper Obsidian plugin path.
- Keep Markdown source text unchanged.
- Do not depend on theme checkbox styling for icon rendering.
- Do not add telemetry or network behavior.
- Sanitize custom SVG input before rendering.
- Prefer Obsidian lifecycle registration APIs for commands, editor extensions, events, post processors, and cleanup-sensitive resources.
- Do not commit generated artifacts such as `main.js`, `build/`, `data.json`, or `node_modules/`.

## Useful Obsidian References

- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)
- [Manifest reference](https://docs.obsidian.md/Reference/Manifest)
- [Obsidian releases repository](https://github.com/obsidianmd/obsidian-releases)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
