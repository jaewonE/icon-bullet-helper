import { Plugin, MarkdownView, PluginSettingTab, Setting } from "obsidian";
import { createIconPicker } from "iconPicker";
import { Icon_Item_Setting, icons_setting } from "default_icons";

interface IconCheckboxPluginSettings {
	theme: string;
	icons: Icon_Item_Setting[];
	customTrigger: string;
}

const DEFAULT_SETTINGS: IconCheckboxPluginSettings = {
	theme: "Else",
	icons: icons_setting["Else"],
	customTrigger: ":", // Default trigger
};

export default class IconCheckboxPlugin extends Plugin {
	settings: IconCheckboxPluginSettings;

	async onload() {
		console.log("Loading IconCheckboxPlugin");

		await this.loadSettings();

		this.addSettingTab(new IconCheckboxSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-change", this.handleEditorChange)
		);

		this.addCommand({
			id: "open-icon-picker",
			name: "Open icon picker",
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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	checkIsRightTrigger(text: string): boolean {
		const customTrigger = this.settings.customTrigger ?? ":";
		const regex = new RegExp(
			`^(>? ?(- ?(\\[ \\] ?)?|\\d+\\. ?))${customTrigger}$`
		);
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
		const trimedLineText = lineText.trimStart();
		if (forceOpen || this.checkIsRightTrigger(trimedLineText)) {
			createIconPicker(
				this.app,
				editor,
				this.settings.theme,
				this.settings.icons,
				this.settings.customTrigger,
				line,
				lineText
			);
		}
	}

	handleEditorChange = () => {
		this.openIconPicker();
	};

	onunload() {
		console.log("Unloading IconCheckboxPlugin");
	}
}

class IconCheckboxSettingTab extends PluginSettingTab {
	plugin: IconCheckboxPlugin;

	constructor(app: any, plugin: IconCheckboxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Custom Modal Trigger")
			.setDesc("Set custom word to trigger the icon picker")
			.addText((text) =>
				text
					.setPlaceholder("Enter a custom trigger")
					.setValue(this.plugin.settings.customTrigger)
					.onChange(async (value) => {
						this.plugin.settings.customTrigger = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Select Theme")
			.setDesc(
				"Choose the available icons and order according to your theme!"
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("Else", "Else")
					.addOption("Minimal", "Minimal")
					.addOption("Things", "Things")
					.setValue(this.plugin.settings.theme)
					.onChange(async (value) => {
						const userConfirmed = confirm(
							"If you change themes, the icon order in your current theme will be reset to default. Are you sure you want to change it?"
						);
						if (userConfirmed) {
							this.plugin.settings.theme = value;
							this.plugin.settings.icons = icons_setting[value];
							await this.plugin.saveSettings();
							renderIcons();
						} else {
							dropdown.setValue(this.plugin.settings.theme);
						}
					})
			);

		// Create icon grid container
		const iconGrid = containerEl.createDiv({ cls: "setting-icon-grid" });
		let draggedItem: HTMLElement | null = null;

		const renderIcons = () => {
			iconGrid.empty();
			this.plugin.settings.icons.forEach(({ name, icon }, index) => {
				const iconEl = document.createElement("div");
				iconEl.className = "setting-icon-option";
				iconEl.setAttribute("draggable", "true");
				iconEl.setAttribute("data-index", index.toString());

				const iconSpan = document.createElement("span");
				iconSpan.className = "icon";
				iconSpan.textContent = icon;

				const nameSpan = document.createElement("span");
				nameSpan.textContent = name;

				iconEl.appendChild(iconSpan);
				iconEl.appendChild(nameSpan);

				iconEl.tabIndex = 0; // Make the div focusable

				iconEl.addEventListener("dragstart", handleDragStart);
				iconEl.addEventListener("dragover", handleDragOver);
				iconEl.addEventListener("drop", handleDrop);
				iconEl.addEventListener("dragleave", handleDragLeave);

				iconGrid.appendChild(iconEl);
			});
		};

		const handleDragStart = (e: DragEvent) => {
			draggedItem = e.target as HTMLElement;
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData(
					"text/plain",
					(e.target as HTMLElement).dataset.index!
				);
			}
		};

		const handleDragOver = (e: DragEvent) => {
			if (e.preventDefault) {
				e.preventDefault();
			}
			(e.target as HTMLElement).classList.add("hovered");
			return false;
		};

		const handleDrop = (e: DragEvent) => {
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			if (draggedItem && draggedItem !== e.target) {
				const draggedIndex = parseInt(
					draggedItem.getAttribute("data-index")!
				);
				const targetIndex = parseInt(
					(e.target as HTMLElement)
						.closest(".setting-icon-option")!
						.getAttribute("data-index")!
				);
				const newOrder = Array.from(this.plugin.settings.icons);
				[newOrder[draggedIndex], newOrder[targetIndex]] = [
					newOrder[targetIndex],
					newOrder[draggedIndex],
				];
				this.plugin.settings.icons = newOrder;
				this.plugin.saveSettings();
				renderIcons();
			}
			(e.target as HTMLElement).classList.remove("hovered");
			return false;
		};

		const handleDragLeave = (e: DragEvent) => {
			(e.target as HTMLElement).classList.remove("hovered");
		};

		renderIcons();
	}
}
