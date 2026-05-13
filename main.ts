import { EditorView } from "@codemirror/view";
import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { createIconPicker, selectActiveIconPicker } from "iconPicker";
import {
	DEFAULT_ICON_BULLETS,
	DEFAULT_TRIGGER,
	IconBulletSetting,
	IconBulletVariant,
	NEW_MARKER_DEFAULT_SVG,
	buildIconBulletConfig,
	calloutMarkerToken,
	createIconElement,
	escapeRegExp,
	getEnabledIconBullets,
	isValidMarker,
	isInsertItem,
	markerToken,
	normalizeColor,
	normalizeIconBulletSettings,
	normalizeMarker,
	normalizeSolidColor,
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
	popupSize: PopupSize;
	gridColumns: number;
	gridRows: number;
}

const DEFAULT_GRID_COLUMNS = 4;
const DEFAULT_GRID_ROWS = 1;
const NEW_MARKER_SCROLL_OFFSET = -50;

const DEFAULT_SETTINGS: IconBulletPluginSettings = {
	icons: DEFAULT_ICON_BULLETS,
	customTrigger: DEFAULT_TRIGGER,
	popupSize: "medium",
	gridColumns: DEFAULT_GRID_COLUMNS,
	gridRows: DEFAULT_GRID_ROWS,
};

type PopupSize = "small" | "medium" | "big";
type SettingsSection = "general" | "layout" | "bullets";

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

		this.addCommand({
			id: "insert-selected-common-icon-bullet",
			name: "Picker: insert selected icon bullet",
			callback: () => {
				this.selectActivePickerIcon("common");
			},
		});

		this.addCommand({
			id: "insert-selected-callout-icon-bullet",
			name: "Picker: insert selected callout icon bullet",
			callback: () => {
				this.selectActivePickerIcon("callout");
			},
		});

		this.addCommand({
			id: "toggle-icon-bullet-callout",
			name: "Toggle current icon bullet callout state",
			callback: () => {
				this.toggleCurrentIconBulletVariant();
			},
			hotkeys: [
				{
					modifiers: ["Mod"],
					key: ".",
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
		const loadedIconSettings = hasNewIconSettings
			? normalizeIconBulletSettings(loadedIcons)
			: [];
		const icons = hasNewIconSettings
			? mergeLoadedIconsWithDefaults(loadedIconSettings, defaultIcons)
			: defaultIcons;
		if (!icons.some((icon) => icon.enabled) && icons[0]) {
			icons[0].enabled = true;
		}
		const gridColumns = normalizeGridSize(
			loaded?.gridColumns,
			DEFAULT_GRID_COLUMNS
		);
		const gridRows = normalizeGridSize(
			loaded?.gridRows,
			getResetGridRows(icons, gridColumns)
		);

		this.settings = {
			customTrigger: hasNewIconSettings
				? loaded?.customTrigger ?? DEFAULT_TRIGGER
				: DEFAULT_TRIGGER,
			popupSize: normalizePopupSize(loaded?.popupSize),
			gridColumns,
			gridRows,
			icons: fitIconsToGridCapacity(icons, gridColumns * gridRows),
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
				this.settings.popupSize,
				line,
				lineText
			);
		}
	}

	selectActivePickerIcon(variant: IconBulletVariant) {
		if (!selectActiveIconPicker(variant)) {
			new Notice("Open the icon bullet picker first.");
		}
	}

	toggleCurrentIconBulletVariant() {
		const editor =
			this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) return;

		const cursor = editor.getCursor();
		const lineNumber = cursor.line;
		const lineText = editor.getLine(lineNumber);
		const config = buildIconBulletConfig(this.settings.icons);
		const match = config.editorRegex ? lineText.match(config.editorRegex) : null;
		if (!match) {
			new Notice("No icon bullet marker on the current line.");
			return;
		}

		const marker = match[5];
		const replacement =
			match[4] === "!" ? markerToken(marker) : calloutMarkerToken(marker);
		const replaceFrom = match[1].length + match[2].length;
		const replaceTo = replaceFrom + match[3].length;
		const delta = replacement.length - match[3].length;

		editor.replaceRange(
			replacement,
			{ line: lineNumber, ch: replaceFrom },
			{ line: lineNumber, ch: replaceTo }
		);

		if (cursor.ch >= replaceTo) {
			editor.setCursor(lineNumber, cursor.ch + delta);
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
	private activeSection: SettingsSection = "general";
	private pendingOpenMarker: string | null = null;
	private pendingScrollMarker: string | null = null;

	constructor(app: App, plugin: IconBulletPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.renderSettingsTabs(containerEl);

		const sectionEl = containerEl.createDiv({
			cls: "icon-bullet-settings-section",
		});

		if (this.activeSection === "general") {
			this.renderGeneralSettings(sectionEl);
		} else if (this.activeSection === "layout") {
			this.renderIconLayoutSetting(sectionEl);
		} else {
			this.renderIconBulletsSettings(sectionEl);
		}
	}

	private renderSettingsTabs(containerEl: HTMLElement) {
		const tabsEl = containerEl.createDiv({ cls: "icon-bullet-settings-tabs" });
		const sections: { id: SettingsSection; label: string }[] = [
			{ id: "general", label: "General" },
			{ id: "layout", label: "Icon Layout" },
			{ id: "bullets", label: "Icon Bullets" },
		];

		sections.forEach((section) => {
			const tabEl = tabsEl.createEl("button", {
				cls: "icon-bullet-settings-tab",
				text: section.label,
			});
			tabEl.type = "button";
			tabEl.setAttribute(
				"aria-selected",
				String(this.activeSection === section.id)
			);
			tabEl.toggleClass("is-active", this.activeSection === section.id);
			tabEl.addEventListener("click", () => {
				if (this.activeSection === section.id) {
					return;
				}

				this.activeSection = section.id;
				this.display();
			});
		});
	}

	private renderGeneralSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Popup size")
			.setDesc("Controls picker size, including text and SVG icon size.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("small", "Small")
					.addOption("medium", "Medium")
					.addOption("big", "Big")
					.setValue(this.plugin.settings.popupSize)
					.onChange(async (value) => {
						this.plugin.settings.popupSize = normalizePopupSize(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Popup trigger")
			.setDesc("Type this after a list marker, for example '- !', to open the picker.")
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
			.setName("Picker selection shortcuts")
			.setDesc("Space inserts a common marker like '{p}'. Enter inserts a callout marker like '{!p}'. Command + . toggles the current icon bullet between both forms. To add more shortcuts, assign hotkeys to the picker or toggle commands in Obsidian Hotkeys.");

		new Setting(containerEl)
			.setName("Restore defaults")
			.setDesc("Restore popup settings, icon layout, and icon bullet definitions to the built-in defaults.")
			.addButton((button) =>
				button.setButtonText("Restore defaults").onClick(async () => {
					this.plugin.settings.customTrigger = DEFAULT_TRIGGER;
					this.plugin.settings.popupSize = DEFAULT_SETTINGS.popupSize;
					this.plugin.settings.icons = normalizeIconBulletSettings(
						DEFAULT_ICON_BULLETS
					);
					this.resetGridShape();
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}

	private renderIconBulletsSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Icon bullets")
			.setDesc("Markers are written as '- {marker} text' or '- {!marker} text'. SVG is rendered only by the plugin; the Markdown source stays unchanged.")
			.addButton((button) =>
				button.setButtonText("Add marker").onClick(async () => {
					const marker = this.getNextNewMarker();
					this.plugin.settings.icons.push({
						kind: "icon",
						marker,
						label: "New marker",
						color: "#5c7cfa",
						svg: sanitizeSvg(NEW_MARKER_DEFAULT_SVG),
						enabled: true,
						custom: true,
					});
					this.expandGridToFitEnabled();
					this.pendingOpenMarker = marker;
					this.pendingScrollMarker = marker;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		containerEl.createDiv({
			cls: "icon-bullet-setting-warning",
			text: "Some SVGs use hard-coded fill or stroke colors. Changing Color only affects SVG parts that use currentColor.",
		});

		const iconListEl = containerEl.createDiv({
			cls: "icon-bullet-settings-list",
		});

		this.plugin.settings.icons.forEach((icon, index) => {
			this.renderIconSetting(iconListEl, icon, index);
		});
	}

	private renderIconLayoutSetting(containerEl: HTMLElement) {
		const applyGridSizeChange = async () => {
			this.applyGridCapacity();
			await this.plugin.saveSettings();
			this.display();
		};

		new Setting(containerEl)
			.setName("Icon layout")
			.setDesc("Choose the picker grid size, then drag icons between the grid and disabled area.")
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = "1";
				text
					.setPlaceholder(String(DEFAULT_GRID_COLUMNS))
					.setValue(String(this.plugin.settings.gridColumns));
				text.inputEl.addEventListener("change", async () => {
					const nextValue = normalizeGridSize(
						text.inputEl.value,
						this.plugin.settings.gridColumns
					);
					if (nextValue !== this.plugin.settings.gridColumns) {
						this.plugin.settings.gridColumns = nextValue;
						await applyGridSizeChange();
					} else {
						text.setValue(String(this.plugin.settings.gridColumns));
					}
				});
				text.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						this.plugin.settings.gridColumns = normalizeGridSize(
							text.inputEl.value,
							this.plugin.settings.gridColumns
						);
						void applyGridSizeChange();
					}
				});
			})
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = "1";
				text
					.setPlaceholder(String(DEFAULT_GRID_ROWS))
					.setValue(String(this.plugin.settings.gridRows));
				text.inputEl.addEventListener("change", async () => {
					const nextValue = normalizeGridSize(
						text.inputEl.value,
						this.plugin.settings.gridRows
					);
					if (nextValue !== this.plugin.settings.gridRows) {
						this.plugin.settings.gridRows = nextValue;
						await applyGridSizeChange();
					} else {
						text.setValue(String(this.plugin.settings.gridRows));
					}
				});
				text.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						this.plugin.settings.gridRows = normalizeGridSize(
							text.inputEl.value,
							this.plugin.settings.gridRows
						);
						void applyGridSizeChange();
					}
				});
			});

		const layoutEl = containerEl.createDiv({ cls: "icon-bullet-layout" });
		const gridEl = layoutEl.createDiv({ cls: "icon-bullet-layout-grid" });
		const disabledEl = layoutEl.createDiv({
			cls: "icon-bullet-layout-disabled",
		});
		const enabledIcons = this.getEnabledIcons();
		const disabledIcons = this.getDisabledIcons();
		const capacity = this.getGridCapacity();

		gridEl.style.setProperty(
			"--icon-bullet-layout-columns",
			String(this.plugin.settings.gridColumns)
		);

		for (let slotIndex = 0; slotIndex < capacity; slotIndex++) {
			const slotEl = gridEl.createDiv({ cls: "icon-bullet-layout-slot" });
			slotEl.dataset.slotIndex = String(slotIndex);
			this.registerGridDropTarget(slotEl, slotIndex);

			const icon = enabledIcons[slotIndex];
			if (icon) {
				slotEl.appendChild(this.createLayoutIcon(icon, "enabled"));
			}
		}

		disabledEl.createDiv({
			cls: "icon-bullet-layout-disabled-title",
			text: "Disabled",
		});
		const disabledListEl = disabledEl.createDiv({
			cls: "icon-bullet-layout-disabled-list",
		});
		this.registerDisabledDropTarget(disabledListEl);

		if (disabledIcons.length === 0) {
			disabledListEl.createDiv({
				cls: "icon-bullet-layout-empty",
				text: "Drop icons here to disable them.",
			});
		} else {
			disabledIcons.forEach((icon) => {
				disabledListEl.appendChild(this.createLayoutIcon(icon, "disabled"));
			});
		}
	}

	private createLayoutIcon(
		icon: IconBulletSetting,
		state: "enabled" | "disabled"
	): HTMLElement {
		const iconEl = document.createElement("div");
		iconEl.className = `icon-bullet-layout-item is-${state}`;
		iconEl.draggable = true;
		iconEl.dataset.marker = icon.marker;

		iconEl.appendChild(
			createIconElement(icon, "icon-bullet-icon icon-bullet-layout-icon")
		);
		iconEl.createSpan({
			cls: "icon-bullet-layout-label",
			text: icon.label,
		});

		iconEl.addEventListener("dragstart", (event) => {
			if (!event.dataTransfer) {
				return;
			}

			event.dataTransfer.setData("text/plain", icon.marker);
			event.dataTransfer.setData("application/x-icon-bullet", icon.marker);
			event.dataTransfer.effectAllowed = "move";
		});

		return iconEl;
	}

	private registerGridDropTarget(slotEl: HTMLElement, slotIndex: number) {
		slotEl.addEventListener("dragover", (event) => {
			event.preventDefault();
			slotEl.addClass("is-drop-target");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		slotEl.addEventListener("dragleave", () => {
			slotEl.removeClass("is-drop-target");
		});
		slotEl.addEventListener("drop", async (event) => {
			event.preventDefault();
			slotEl.removeClass("is-drop-target");
			const marker = getDraggedMarker(event);
			if (!marker) {
				return;
			}

			this.moveIconToGrid(marker, slotIndex);
			await this.plugin.saveSettings();
			this.display();
		});
	}

	private registerDisabledDropTarget(disabledEl: HTMLElement) {
		disabledEl.addEventListener("dragover", (event) => {
			event.preventDefault();
			disabledEl.addClass("is-drop-target");
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
		});
		disabledEl.addEventListener("dragleave", () => {
			disabledEl.removeClass("is-drop-target");
		});
		disabledEl.addEventListener("drop", async (event) => {
			event.preventDefault();
			disabledEl.removeClass("is-drop-target");
			const marker = getDraggedMarker(event);
			if (!marker) {
				return;
			}

			if (!this.moveIconToDisabled(marker)) {
				return;
			}
			await this.plugin.saveSettings();
			this.display();
		});
	}

	private moveIconToGrid(marker: string, slotIndex: number) {
		const icon = this.plugin.settings.icons.find(
			(candidate) => candidate.marker === marker
		);
		if (!icon) {
			return;
		}

		const enabledIcons = this.getEnabledIcons().filter(
			(candidate) => candidate.marker !== marker
		);
		const disabledIcons = this.getDisabledIcons().filter(
			(candidate) => candidate.marker !== marker
		);
		icon.enabled = true;

		const insertIndex = Math.min(slotIndex, enabledIcons.length);
		enabledIcons.splice(insertIndex, 0, icon);

		while (enabledIcons.length > this.getGridCapacity()) {
			const overflow = enabledIcons.pop();
			if (overflow) {
				overflow.enabled = false;
				disabledIcons.unshift(overflow);
			}
		}

		this.plugin.settings.icons = [...enabledIcons, ...disabledIcons];
	}

	private moveIconToDisabled(marker: string): boolean {
		const enabledIcons = this.getEnabledIcons();
		if (
			enabledIcons.length <= 1 &&
			enabledIcons.some((icon) => icon.marker === marker)
		) {
			new Notice("At least one icon must stay enabled.");
			return false;
		}

		const icon = this.plugin.settings.icons.find(
			(candidate) => candidate.marker === marker
		);
		if (!icon) {
			return false;
		}

		icon.enabled = false;
		const remainingEnabled = this.getEnabledIcons().filter(
			(candidate) => candidate.marker !== marker
		);
		const disabledIcons = this.getDisabledIcons().filter(
			(candidate) => candidate.marker !== marker
		);
		this.plugin.settings.icons = [...remainingEnabled, ...disabledIcons, icon];
		return true;
	}

	private applyGridCapacity() {
		this.plugin.settings.icons = fitIconsToGridCapacity(
			this.plugin.settings.icons,
			this.getGridCapacity()
		);
	}

	private expandGridToFitEnabled() {
		const rows = getResetGridRows(
			this.plugin.settings.icons,
			this.plugin.settings.gridColumns
		);
		this.plugin.settings.gridRows = Math.max(
			this.plugin.settings.gridRows,
			rows
		);
	}

	private resetGridShape() {
		this.plugin.settings.gridColumns = DEFAULT_GRID_COLUMNS;
		this.plugin.settings.gridRows = getResetGridRows(
			this.plugin.settings.icons,
			DEFAULT_GRID_COLUMNS
		);
	}

	private getEnabledIcons(): IconBulletSetting[] {
		return this.plugin.settings.icons.filter((icon) => icon.enabled);
	}

	private getDisabledIcons(): IconBulletSetting[] {
		return this.plugin.settings.icons.filter((icon) => !icon.enabled);
	}

	private getGridCapacity(): number {
		return Math.max(
			1,
			this.plugin.settings.gridColumns * this.plugin.settings.gridRows
		);
	}

	private renderIconSetting(
		containerEl: HTMLElement,
		icon: IconBulletSetting,
		index: number
	) {
		const rowEl = containerEl.createEl("details", {
			cls: "icon-bullet-setting-row",
		});
		if (this.pendingOpenMarker === icon.marker) {
			rowEl.open = true;
			this.pendingOpenMarker = null;
		}
		if (this.pendingScrollMarker === icon.marker) {
			this.pendingScrollMarker = null;
			setTimeout(() => {
				scrollElementIntoViewWithOffset(rowEl, NEW_MARKER_SCROLL_OFFSET);
			}, 0);
		}

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
		const statusEl = summaryEl.createSpan({
			cls: icon.enabled
				? "icon-bullet-setting-status is-enabled"
				: "icon-bullet-setting-status is-disabled",
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
					if (!value && this.getEnabledIcons().length <= 1) {
						toggle.setValue(true);
						new Notice("At least one icon must stay enabled.");
						return;
					}
					icon.enabled = value;
					if (value) {
						this.expandGridToFitEnabled();
					}
					updateStatus(statusEl, value);
					await this.plugin.saveSettings();
					this.display();
				})
			);

		if (isInsertItem(icon)) {
			return;
		}

		new Setting(controlsEl)
			.setName("Marker")
			.addText((text) => {
				text.setValue(icon.marker);
				this.registerCommitText(text.inputEl, async (value) => {
					const marker = normalizeMarker(value);
					if (!isValidMarker(marker)) {
						text.setValue(icon.marker);
						new Notice("Marker must resolve to 1-32 letters, numbers, underscores, or hyphens.");
						return;
					}

					if (
						marker !== icon.marker &&
						this.plugin.settings.icons.some(
							(candidate) => candidate !== icon && candidate.marker === marker
						)
					) {
						text.setValue(icon.marker);
						new Notice("Marker already exists.");
						return;
					}

					icon.marker = marker;
					this.pendingOpenMarker = marker;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(controlsEl)
			.setName("Label")
			.addText((text) => {
				text.setValue(icon.label);
				this.registerCommitText(text.inputEl, async (value) => {
					icon.label = value.trim() || icon.marker;
					this.pendingOpenMarker = icon.marker;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(controlsEl)
			.setName("Color")
			.addText((text) => {
				text.setValue(icon.color ?? "");
				this.registerCommitText(text.inputEl, async (value) => {
					icon.color = normalizeColor(value);
					this.pendingOpenMarker = icon.marker;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(controlsEl)
			.setName("Callout background")
			.setDesc("Optional solid background color for callout markers. Leave empty to derive it from the icon color.")
			.addText((text) => {
				text
					.setPlaceholder("Uses icon color")
					.setValue(icon.calloutBackgroundColor ?? "");
				this.registerCommitText(text.inputEl, async (value) => {
					icon.calloutBackgroundColor = normalizeSolidColor(value);
					this.pendingOpenMarker = icon.marker;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(controlsEl)
			.setName("SVG")
			.setDesc("Scripts, external resources, event handlers, and unsafe URLs are stripped.")
			.addTextArea((text) => {
				text.inputEl.rows = 4;
				text
					.setPlaceholder("<svg ...>")
					.setValue(icon.svg ?? "");
				this.registerCommitText(text.inputEl, async (value) => {
					icon.svg = sanitizeSvg(value);
					this.pendingOpenMarker = icon.marker;
					await this.plugin.saveSettings();
					this.display();
				});
			});

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

	private registerCommitText(
		inputEl: HTMLInputElement | HTMLTextAreaElement,
		onCommit: (value: string) => Promise<void>
	) {
		let lastCommittedValue = inputEl.value;
		let isCommitting = false;

		const commit = async () => {
			const value = inputEl.value;
			if (isCommitting || value === lastCommittedValue) {
				return;
			}

			isCommitting = true;
			const scrollParent = getScrollParent(inputEl);
			const scrollTop = scrollParent.scrollTop;
			try {
				await onCommit(value);
			} finally {
				lastCommittedValue = inputEl.value;
				isCommitting = false;
				setTimeout(() => {
					scrollParent.scrollTop = scrollTop;
				}, 0);
			}
		};

		inputEl.addEventListener("blur", () => {
			void commit();
		});
		inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" && !(inputEl instanceof HTMLTextAreaElement)) {
				event.preventDefault();
				inputEl.blur();
			}
		});
	}

	private getNextNewMarker(): string {
		const markers = new Set(this.plugin.settings.icons.map((icon) => icon.marker));
		let marker = "new";
		let suffix = 2;

		while (markers.has(marker)) {
			marker = `new-${suffix}`;
			suffix++;
		}

		return marker;
	}
}

function normalizePopupSize(value: unknown): PopupSize {
	return value === "small" || value === "big" ? value : "medium";
}

function mergeLoadedIconsWithDefaults(
	loadedIcons: IconBulletSetting[],
	defaultIcons: IconBulletSetting[]
): IconBulletSetting[] {
	const loadedMarkers = new Set(loadedIcons.map((icon) => icon.marker));
	const missingDefaults = defaultIcons.filter(
		(icon) => !loadedMarkers.has(icon.marker)
	);
	return [...loadedIcons, ...missingDefaults];
}

function normalizeGridSize(value: unknown, fallback: number): number {
	const parsed =
		typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : fallback;
}

function getResetGridRows(
	icons: IconBulletSetting[],
	columns: number = DEFAULT_GRID_COLUMNS
): number {
	const enabledCount = Math.max(1, icons.filter((icon) => icon.enabled).length);
	return Math.max(1, Math.ceil(enabledCount / Math.max(1, columns)));
}

function fitIconsToGridCapacity(
	icons: IconBulletSetting[],
	capacity: number
): IconBulletSetting[] {
	const enabledIcons = icons.filter((icon) => icon.enabled);
	const disabledIcons = icons.filter((icon) => !icon.enabled);
	const normalizedCapacity = Math.max(1, capacity);

	while (enabledIcons.length > normalizedCapacity) {
		const overflow = enabledIcons.pop();
		if (overflow) {
			overflow.enabled = false;
			disabledIcons.unshift(overflow);
		}
	}

	if (enabledIcons.length === 0) {
		const firstIcon = disabledIcons.shift() ?? icons[0];
		if (firstIcon) {
			firstIcon.enabled = true;
			enabledIcons.push(firstIcon);
		}
	}

	return [...enabledIcons, ...disabledIcons];
}

function getDraggedMarker(event: DragEvent): string {
	return (
		event.dataTransfer?.getData("application/x-icon-bullet") ||
		event.dataTransfer?.getData("text/plain") ||
		""
	);
}

function scrollElementIntoViewWithOffset(element: HTMLElement, offset: number) {
	const scrollParent = getScrollParent(element);
	const elementRect = element.getBoundingClientRect();
	const parentRect = scrollParent.getBoundingClientRect();
	const targetTop =
		scrollParent.scrollTop + elementRect.bottom - parentRect.bottom + offset;

	scrollParent.scrollTo({
		top: Math.max(0, targetTop),
		behavior: "smooth",
	});
}

function getScrollParent(element: HTMLElement): HTMLElement {
	let current = element.parentElement;

	while (current) {
		const style = getComputedStyle(current);
		if (
			/(auto|scroll)/.test(`${style.overflow}${style.overflowY}`) &&
			current.scrollHeight > current.clientHeight
		) {
			return current;
		}

		current = current.parentElement;
	}

	return document.documentElement;
}

function updateStatus(statusEl: HTMLElement, enabled: boolean) {
	statusEl.textContent = enabled ? "Enabled" : "Disabled";
	statusEl.classList.toggle("is-enabled", enabled);
	statusEl.classList.toggle("is-disabled", !enabled);
}
