import { EditorView } from "@codemirror/view";
import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { createIconPicker } from "iconPicker";
import {
	DEFAULT_ICON_BULLETS,
	DEFAULT_TRIGGER,
	IconBulletSetting,
	buildIconBulletConfig,
	createIconElement,
	escapeRegExp,
	getEnabledIconBullets,
	isValidMarker,
	isInsertItem,
	normalizeColor,
	normalizeIconBulletSettings,
	normalizeMarker,
	sanitizeSvg,
} from "default_icons";
import {
	iconBulletConfigField,
	iconBulletExtension,
	setIconBulletConfig,
} from "iconBulletExtension";
import { buildIconBulletPostProcessor } from "postProcessor";

interface IconBulletPluginSettings {
	icons: IconBulletSetting[];
	customTrigger: string;
}

const DEFAULT_SETTINGS: IconBulletPluginSettings = {
	icons: DEFAULT_ICON_BULLETS,
	customTrigger: DEFAULT_TRIGGER,
};

export default class IconBulletPlugin extends Plugin {
	settings: IconBulletPluginSettings;

	async onload() {
		console.log("Loading IconBulletPlugin");

		await this.loadSettings();

		this.addSettingTab(new IconBulletSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-change", this.handleEditorChange)
		);

		this.registerMarkdownPostProcessor(
			buildIconBulletPostProcessor(() =>
				buildIconBulletConfig(this.settings.icons)
			),
			10000
		);

		this.registerEditorExtension([
			iconBulletConfigField.init(() =>
				buildIconBulletConfig(this.settings.icons)
			),
			iconBulletExtension,
		]);

		this.addCommand({
			id: "open-icon-bullet-picker",
			name: "Open icon bullet picker",
			callback: async () => {
				this.openIconPicker(true);
			},
			hotkeys: [
				{
					modifiers: ["Mod"],
					key: ";",
				},
			],
		});
	}

	async loadSettings() {
		const loaded = (await this.loadData()) as
			| Partial<IconBulletPluginSettings>
			| undefined;
		const loadedIcons = loaded?.icons;
		const hasNewIconSettings =
			Array.isArray(loadedIcons) &&
			loadedIcons.some(
				(icon) =>
					typeof icon === "object" && icon !== null && "marker" in icon
			);
		const defaultIcons = normalizeIconBulletSettings(DEFAULT_ICON_BULLETS);
		const defaultMarkers = new Set(defaultIcons.map((icon) => icon.marker));
		const customLoadedIcons = hasNewIconSettings
			? normalizeIconBulletSettings(loadedIcons).filter(
					(icon) => icon.custom || !defaultMarkers.has(icon.marker)
				)
			: [];

		this.settings = {
			customTrigger: hasNewIconSettings
				? loaded?.customTrigger ?? DEFAULT_TRIGGER
				: DEFAULT_TRIGGER,
			icons: [...defaultIcons, ...customLoadedIcons],
		};
	}

	async saveSettings() {
		this.settings.icons = normalizeIconBulletSettings(this.settings.icons);
		await this.saveData(this.settings);
		this.refreshEditorDecorations();
	}

	checkIsRightTrigger(text: string): boolean {
		const trigger = escapeRegExp(this.settings.customTrigger || DEFAULT_TRIGGER);
		const regex = new RegExp(`^[>\\s]*(?:[-*+]|\\d+[.)])\\s*${trigger}$`);
		return regex.test(text);
	}

	openIconPicker(forceOpen = false) {
		const editor =
			this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) return;

		const cursor = editor.getCursor();
		const line = cursor?.line;
		if (line === undefined) return;

		const lineText = editor.getLine(line);
		const icons = getEnabledIconBullets(this.settings.icons);

		if (forceOpen || this.checkIsRightTrigger(lineText)) {
			createIconPicker(
				this.app,
				editor,
				icons,
				this.settings.customTrigger,
				line,
				lineText
			);
		}
	}

	handleEditorChange = () => {
		this.openIconPicker();
	};

	refreshEditorDecorations() {
		const config = buildIconBulletConfig(this.settings.icons);

		this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view as MarkdownView;
			const editorView = (view.editor as any).cm as EditorView | undefined;

			editorView?.dispatch({
				effects: [setIconBulletConfig.of(config)],
			});
		});
	}

	onunload() {
		console.log("Unloading IconBulletPlugin");
	}
}

class IconBulletSettingTab extends PluginSettingTab {
	plugin: IconBulletPlugin;

	constructor(app: App, plugin: IconBulletPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Popup trigger")
			.setDesc("Type this after a list marker, for example '- {', to open the picker.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TRIGGER)
					.setValue(this.plugin.settings.customTrigger)
					.onChange(async (value) => {
						this.plugin.settings.customTrigger =
							value.trim() || DEFAULT_TRIGGER;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Icon bullets")
			.setDesc("Markers are written as '- {marker} text'. SVG is rendered only by the plugin; the Markdown source stays unchanged.")
			.addButton((button) =>
				button.setButtonText("Add marker").onClick(async () => {
					const defaultSvg =
						DEFAULT_ICON_BULLETS.find((icon) => !isInsertItem(icon))?.svg ??
						"";
					this.plugin.settings.icons.push({
						kind: "icon",
						marker: "new",
						label: "New marker",
						color: "var(--text-normal)",
						svg: sanitizeSvg(defaultSvg),
						enabled: true,
						custom: true,
					});
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addButton((button) =>
				button.setButtonText("Restore defaults").onClick(async () => {
					this.plugin.settings.icons = normalizeIconBulletSettings(
						DEFAULT_ICON_BULLETS
					);
					await this.plugin.saveSettings();
					this.display();
				})
			);

		const iconListEl = containerEl.createDiv({
			cls: "icon-bullet-settings-list",
		});

		this.plugin.settings.icons.forEach((icon, index) => {
			this.renderIconSetting(iconListEl, icon, index);
		});
	}

	private renderIconSetting(
		containerEl: HTMLElement,
		icon: IconBulletSetting,
		index: number
	) {
		const rowEl = containerEl.createEl("details", {
			cls: "icon-bullet-setting-row",
		});
		const summaryEl = rowEl.createEl("summary", {
			cls: "icon-bullet-setting-summary",
		});
		const previewEl = summaryEl.createSpan({
			cls: "icon-bullet-setting-preview",
		});
		previewEl.appendChild(
			createIconElement(icon, "icon-bullet-icon icon-bullet-settings-icon")
		);
		summaryEl.createSpan({
			cls: "icon-bullet-setting-title",
			text: icon.label,
		});
		summaryEl.createSpan({
			cls: "icon-bullet-setting-marker",
			text: isInsertItem(icon) ? icon.insertText ?? "" : `{${icon.marker}}`,
		});
		summaryEl.createSpan({
			cls: icon.enabled
				? "icon-bullet-setting-status is-enabled"
				: "icon-bullet-setting-status",
			text: icon.enabled ? "Enabled" : "Disabled",
		});

		const controlsEl = rowEl.createDiv({ cls: "icon-bullet-setting-controls" });

		new Setting(controlsEl)
			.setName(
				isInsertItem(icon)
					? `${icon.label} (${icon.insertText ?? ""})`
					: `${icon.label} {${icon.marker}}`
			)
			.addToggle((toggle) =>
				toggle.setValue(icon.enabled).onChange(async (value) => {
					icon.enabled = value;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		if (!isInsertItem(icon)) {
			new Setting(controlsEl)
				.setName("Marker")
				.addText((text) =>
					text.setValue(icon.marker).onChange(async (value) => {
						const marker = normalizeMarker(value);
						if (isValidMarker(marker)) {
							icon.marker = marker;
							await this.plugin.saveSettings();
						}
					})
				);
		}

		new Setting(controlsEl)
			.setName("Label")
			.addText((text) =>
				text.setValue(icon.label).onChange(async (value) => {
					icon.label = value.trim() || icon.marker;
					await this.plugin.saveSettings();
				})
			);

		if (isInsertItem(icon)) {
			new Setting(controlsEl)
				.setName("Insert text")
				.addText((text) =>
					text.setValue(icon.insertText ?? "").onChange(async (value) => {
						icon.insertText = value;
						await this.plugin.saveSettings();
					})
				);
		} else {
			new Setting(controlsEl)
				.setName("Color")
				.addText((text) =>
					text.setValue(icon.color ?? "").onChange(async (value) => {
						icon.color = normalizeColor(value);
						await this.plugin.saveSettings();
					})
				);

			new Setting(controlsEl)
				.setName("SVG")
				.setDesc("Scripts, external resources, event handlers, and unsafe URLs are stripped.")
				.addTextArea((text) => {
					text.inputEl.rows = 4;
					text
						.setPlaceholder("<svg ...>")
						.setValue(icon.svg ?? "")
						.onChange(async (value) => {
							icon.svg = sanitizeSvg(value);
							await this.plugin.saveSettings();
						});
				});
		}

		new Setting(controlsEl).addButton((button) =>
			button
				.setButtonText("Remove")
				.setDisabled(!icon.custom)
				.onClick(async () => {
					this.plugin.settings.icons.splice(index, 1);
					await this.plugin.saveSettings();
					this.display();
				})
		);
	}
}
