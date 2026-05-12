import { Icon_Item_Setting } from "default_icons";
import { App, Editor, Scope } from "obsidian";

let activePickerClose: (() => void) | null = null;

export function createIconPicker(
	app: App,
	editor: Editor,
	_theme: string,
	icons: Icon_Item_Setting[],
	customTrigger: string,
	lineNumber: number,
	lineText: string
) {
	activePickerClose?.();

	if (icons.length === 0) {
		return;
	}

	const pickerEl = document.createElement("div");
	pickerEl.className = "icon-picker";

	let selectedIndex = 0;
	const numColumns = 4; // Number of columns for the grid
	const optionEls: HTMLElement[] = [];

	icons.forEach(({ name, icon, value }, index) => {
		const iconEl = document.createElement("div");
		iconEl.className = "icon-option";

		const iconSpan = document.createElement("span");
		iconSpan.className = "icon";
		iconSpan.textContent = icon;

		const nameSpan = document.createElement("span");
		nameSpan.textContent = name;

		iconEl.appendChild(iconSpan);
		iconEl.appendChild(nameSpan);

		iconEl.tabIndex = 0; // Make the div focusable
		iconEl.onclick = () => {
			selectIcon(value);
		};

		if (index === 0) {
			iconEl.classList.add("selected"); // Highlight the first option
		}

		optionEls.push(iconEl);
		pickerEl.appendChild(iconEl);
	});

	function getLeadingSpaces(str: string): string {
		const match = str.match(/^[>\s]+/);

		return match ? match[0] : "";
	}

	function checkIsRightTrigger(text: string, customTrigger: string): boolean {
		const regex = new RegExp(
			`^(>? ?(- ?(\\[ \\] ?)?|\\d+\\. ?))${customTrigger}$`
		);
		return regex.test(text);
	}

	function getPrefixLength(text: string): number {
		const prefixRegex = /^(?:- |\d+\. )(?:\[[^\]]*\] )?/;
		const match = text.match(prefixRegex);
		return match ? match[0].length : 0;
	}

	const selectIcon = (value: string) => {
		const leadingSpaces = getLeadingSpaces(lineText);
		const spaceLength = leadingSpaces.length;
		const lTrimedLineText = lineText.slice(spaceLength);
		const triggerLength = checkIsRightTrigger(
			lTrimedLineText,
			customTrigger
		)
			? lTrimedLineText.length
			: getPrefixLength(lTrimedLineText);
		editor.replaceRange(
			`${leadingSpaces}${value}`,
			{ line: lineNumber, ch: 0 },
			{ line: lineNumber, ch: spaceLength + triggerLength }
		);
		closePicker();

		// Move the cursor to the end of the inserted text
		setTimeout(() => {
			editor.setCursor(lineNumber, editor.getLine(lineNumber).length);
			editor.focus();
		}, 0);
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
		} else if (key === " " || key === "Enter") {
			selectIcon(icons[selectedIndex].value);
		} else if (key === "Escape") {
			closePicker();
		} else {
			return false;
		}

		return true;
	};

	const withKeyboardCapture = (key: string) => {
		return (event: KeyboardEvent) => {
			// Like Obsidian's EditorSuggest, popup navigation owns these keys
			// while the picker is open. Returning false also prevents default.
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

	// @ts-ignore
	const cursorCoords = editor.cm.coordsAtPos(
		editor.posToOffset(editor.getCursor())
	);

	pickerEl.style.left = `${cursorCoords.left}px`;
	pickerEl.style.top = `${cursorCoords.top + 20}px`; // Adjust the offset as needed

	document.body.appendChild(pickerEl);
	app.keymap.pushScope(pickerScope);
	document.addEventListener("keydown", handleKeyDownCapture, true);

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
			document.body.removeChild(pickerEl);
		}
		document.removeEventListener("click", handleClickOutside);
		document.removeEventListener("keydown", handleKeyDownCapture, true);
		app.keymap.popScope(pickerScope);
		if (activePickerClose === closePicker) {
			activePickerClose = null;
		}
	};

	activePickerClose = closePicker;

	setTimeout(() => {
		if (!isClosed) {
			document.addEventListener("click", handleClickOutside);
		}
	}, 0);
}
