import { App, Editor, Scope } from "obsidian";
import {
	DEFAULT_TRIGGER,
	IconBulletSetting,
	IconBulletVariant,
	calloutMarkerToken,
	createIconElement,
	escapeRegExp,
	isInsertItem,
	markerToken,
} from "default_icons";

let activePickerClose: (() => void) | null = null;
let activePickerSelect: ((variant: IconBulletVariant) => boolean) | null = null;

const PICKER_SIZE_METRICS = {
	small: {
		columnWidth: 100,
		gapX: 6,
		maxWidth: 520,
	},
	medium: {
		columnWidth: 116,
		gapX: 8,
		maxWidth: 600,
	},
	big: {
		columnWidth: 132,
		gapX: 12,
		maxWidth: 680,
	},
};

export function selectActiveIconPicker(variant: IconBulletVariant): boolean {
	return activePickerSelect?.(variant) ?? false;
}

export function createIconPicker(
	app: App,
	editor: Editor,
	icons: IconBulletSetting[],
	customTrigger: string,
	pickerSize: "small" | "medium" | "big",
	gridColumns: number,
	lineNumber: number,
	lineText: string
) {
	activePickerClose?.();

	if (icons.length === 0) {
		return;
	}

	const pickerDocument = activeDocument;
	const pickerEl = pickerDocument.createElement("div");
	pickerEl.className = `icon-picker icon-picker-${pickerSize}`;

	let selectedIndex = 0;
	const numColumns = Math.max(1, Math.floor(gridColumns));
	const optionEls: HTMLElement[] = [];
	pickerEl.style.setProperty("--icon-picker-columns", String(numColumns));
	pickerEl.style.setProperty(
		"--icon-picker-max-width",
		`${getPickerMaxWidth(pickerSize, numColumns)}px`
	);

	icons.forEach((icon, index) => {
		const iconEl = pickerDocument.createElement("button");
		iconEl.type = "button";
		iconEl.className = "icon-option";

		iconEl.appendChild(
			createIconElement(icon, "icon-bullet-icon icon-picker-svg", pickerDocument)
		);

		const nameSpan = pickerDocument.createElement("span");
		nameSpan.className = "icon-picker-label";
		nameSpan.textContent = icon.label;
		iconEl.appendChild(nameSpan);

		iconEl.onclick = () => {
			selectIcon(icon, "common");
		};

		if (index === 0) {
			iconEl.classList.add("selected");
		}

		optionEls.push(iconEl);
		pickerEl.appendChild(iconEl);
	});

	function getReplacementForLine(
		text: string,
		icon: IconBulletSetting,
		variant: IconBulletVariant
	): { insertText: string; replaceTo: number } {
		const leadingMatch = text.match(/^[>\s]*/);
		const leading = leadingMatch ? leadingMatch[0] : "";
		const rest = text.slice(leading.length);
		const trigger = escapeRegExp(customTrigger || DEFAULT_TRIGGER);
		const triggerMatch = rest.match(
			new RegExp(`^((?:[-*+]|\\d+[.)])\\s*)${trigger}\\s*$`)
		);

		const buildInsertText = (listMarker = "-") => {
			if (isInsertItem(icon)) {
				return `${leading}${icon.insertText ?? "- "}`;
			}

			const token =
				variant === "callout"
					? calloutMarkerToken(icon.marker)
					: markerToken(icon.marker);
			return `${leading}${listMarker} ${token} `;
		};

		if (triggerMatch) {
			const marker = triggerMatch[1].trim();
			const listMarker = /^[-*+]$/.test(marker) ? marker : "-";

			return {
				insertText: buildInsertText(listMarker),
				replaceTo: text.length,
			};
		}

		const listMatch = rest.match(
			/^((?:[-*+]|\d+[.)])\s+)(?:(?:\{!?[A-Za-z0-9_-]+\}|\[[^\]]*\])\s*)?/
		);
		if (listMatch) {
			const marker = listMatch[1].trim();
			const listMarker = /^[-*+]$/.test(marker) ? marker : "-";

			return {
				insertText: buildInsertText(listMarker),
				replaceTo: leading.length + listMatch[0].length,
			};
		}

		const looseListMatch = rest.match(/^((?:[-*+]|\d+[.)])\s*)/);
		if (looseListMatch) {
			const marker = looseListMatch[1].trim();
			const listMarker = /^[-*+]$/.test(marker) ? marker : "-";

			return {
				insertText: buildInsertText(listMarker),
				replaceTo: leading.length + looseListMatch[0].length,
			};
		}

		return {
			insertText: buildInsertText(),
			replaceTo: leading.length,
		};
	}

	const selectIcon = (
		icon: IconBulletSetting,
		variant: IconBulletVariant
	) => {
		const { insertText, replaceTo } = getReplacementForLine(
			lineText,
			icon,
			variant
		);
		editor.replaceRange(
			insertText,
			{ line: lineNumber, ch: 0 },
			{ line: lineNumber, ch: replaceTo }
		);
		closePicker();

		activeWindow.setTimeout(() => {
			editor.setCursor(lineNumber, insertText.length);
			editor.focus();
		}, 0);
	};

	activePickerSelect = (variant: IconBulletVariant) => {
		selectIcon(icons[selectedIndex], variant);
		return true;
	};

	const moveSelection = (nextIndex: number) => {
		optionEls[selectedIndex].classList.remove("selected");
		selectedIndex = nextIndex;
		optionEls[selectedIndex].classList.add("selected");
		optionEls[selectedIndex].scrollIntoView({ block: "nearest" });
	};

	const isPickerKey = (key: string): boolean =>
		key === "ArrowDown" ||
		key === "ArrowUp" ||
		key === "ArrowRight" ||
		key === "ArrowLeft" ||
		key === " " ||
		key === "Enter" ||
		key === "Escape";

	const handleKeyboardAction = (key: string): boolean => {
		if (key === "ArrowDown") {
			moveSelection((selectedIndex + numColumns) % icons.length);
		} else if (key === "ArrowUp") {
			moveSelection((selectedIndex - numColumns + icons.length) % icons.length);
		} else if (key === "ArrowRight") {
			moveSelection((selectedIndex + 1) % icons.length);
		} else if (key === "ArrowLeft") {
			moveSelection((selectedIndex - 1 + icons.length) % icons.length);
		} else if (key === " ") {
			selectIcon(icons[selectedIndex], "common");
		} else if (key === "Enter") {
			selectIcon(icons[selectedIndex], "callout");
		} else if (key === "Escape") {
			closePicker();
		} else {
			return false;
		}

		return true;
	};

	const withKeyboardCapture = (key: string) => {
		return (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();
			handleKeyboardAction(key);
			return false;
		};
	};

	const handleKeyDownCapture = (event: KeyboardEvent) => {
		if (!isPickerKey(event.key)) {
			return;
		}

		if (!event.defaultPrevented) {
			handleKeyboardAction(event.key);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	const pickerScope = new Scope(app.scope);
	pickerScope.register([], "ArrowDown", withKeyboardCapture("ArrowDown"));
	pickerScope.register([], "ArrowUp", withKeyboardCapture("ArrowUp"));
	pickerScope.register([], "ArrowRight", withKeyboardCapture("ArrowRight"));
	pickerScope.register([], "ArrowLeft", withKeyboardCapture("ArrowLeft"));
	pickerScope.register([], "Enter", withKeyboardCapture("Enter"));
	pickerScope.register([], " ", withKeyboardCapture(" "));
	pickerScope.register([], "Escape", withKeyboardCapture("Escape"));

	// @ts-ignore Obsidian's public Editor type does not expose the CM6 view.
	const cursorCoords = editor.cm.coordsAtPos(
		editor.posToOffset(editor.getCursor())
	);

	pickerEl.style.left = `${cursorCoords.left}px`;
	pickerEl.style.top = `${cursorCoords.top + 20}px`;

	pickerDocument.body.appendChild(pickerEl);
	app.keymap.pushScope(pickerScope);
	pickerDocument.addEventListener("keydown", handleKeyDownCapture, true);

	const handleClickOutside = (event: MouseEvent) => {
		if (!pickerEl.contains(event.target as Node)) {
			closePicker();
		}
	};

	let isClosed = false;
	const closePicker = () => {
		if (isClosed) {
			return;
		}

		isClosed = true;
		if (pickerEl.parentNode) {
			pickerEl.remove();
		}
		pickerDocument.removeEventListener("click", handleClickOutside);
		pickerDocument.removeEventListener("keydown", handleKeyDownCapture, true);
		app.keymap.popScope(pickerScope);
		if (activePickerClose === closePicker) {
			activePickerClose = null;
		}
		if (activePickerSelect) {
			activePickerSelect = null;
		}
	};

	activePickerClose = closePicker;

	activeWindow.setTimeout(() => {
		if (!isClosed) {
			pickerDocument.addEventListener("click", handleClickOutside);
		}
	}, 0);
}

function getPickerMaxWidth(
	pickerSize: "small" | "medium" | "big",
	numColumns: number
): number {
	const metrics = PICKER_SIZE_METRICS[pickerSize];
	const contentWidth =
		metrics.columnWidth * numColumns + metrics.gapX * Math.max(0, numColumns - 1);
	return Math.max(metrics.maxWidth, contentWidth + 12);
}
