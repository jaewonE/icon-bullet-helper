export interface IconBulletSetting {
	kind?: "icon" | "insert";
	marker: string;
	label: string;
	svg?: string;
	color?: string;
	insertText?: string;
	displaySvg?: string;
	displayColor?: string;
	enabled: boolean;
	custom?: boolean;
}

export interface IconBulletConfig {
	iconsByMarker: Record<string, IconBulletSetting>;
	editorRegex: RegExp | null;
	readingRegex: RegExp | null;
}

const MAX_SVG_LENGTH = 12000;

export const DEFAULT_TRIGGER = "{";

export const FALLBACK_SVG = svgIcon(`
	<circle cx="12" cy="12" r="8"></circle>
	<path d="M12 8v4"></path>
	<path d="M12 16h.01"></path>
`);

export const DEFAULT_ICON_BULLETS: IconBulletSetting[] = [
	defaultInsert("number", "Number", "1. "),
	defaultInsert("default", "Default", "- ", "#495057", `
		<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"></circle>
	`),
	defaultInsert("unchecked", "Unchecked", "- [ ] ", "#495057", `
		<rect x="5" y="5" width="14" height="14" rx="2"></rect>
	`),
	defaultInsert("incomplete", "Incomplete", "- [/] ", "#f08c00", `
		<rect x="5" y="5" width="14" height="14" rx="2"></rect>
		<path d="M8 16 16 8"></path>
	`),
	defaultInsert("checked", "Checked", "- [x] ", "#2f9e44", `
		<rect x="5" y="5" width="14" height="14" rx="2"></rect>
		<path d="m8.5 12.5 2.5 2.5 5-6"></path>
	`),
	defaultIcon("next-step", "Next step", "#495057", `
		<path d="M4 5v8a3 3 0 0 0 3 3h11"></path>
		<path d="m14 12 4 4-4 4"></path>
	`),
	defaultIcon("next", "Next", "#495057", `
		<path d="M5 12h14"></path>
		<path d="m13 6 6 6-6 6"></path>
	`),
	defaultIcon("therefore", "Therefore", "#495057", `
		<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"></circle>
		<circle cx="7" cy="17" r="1.4" fill="currentColor" stroke="none"></circle>
		<circle cx="17" cy="17" r="1.4" fill="currentColor" stroke="none"></circle>
	`),
	defaultIcon("clip", "Clip", "#5c7cfa", `
		<path d="m21 8-10 10a5 5 0 0 1-7-7L15 0a3.5 3.5 0 0 1 5 5L9 16a2 2 0 1 1-3-3L16 3"></path>
	`),
	defaultIcon("p", "Good", "#2f9e44", `
		<path d="M7 11v9"></path>
		<path d="M7 11H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h3"></path>
		<path d="M7 11l4-8a2 2 0 0 1 3 2v4h4a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"></path>
	`),
	defaultIcon("c", "Bad", "#e03131", `
		<path d="M7 13V4"></path>
		<path d="M7 13H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3"></path>
		<path d="M7 13l4 8a2 2 0 0 0 3-2v-4h4a2 2 0 0 0 2-2l-1-7a2 2 0 0 0-2-2H7"></path>
	`),
	defaultIcon("q", "Question", "#e03131", `
		<path d="M9.5 8.5a3 3 0 1 1 5 2.2c-1.4 1-2.5 1.7-2.5 3.3"></path>
		<path d="M12 18h.01"></path>
	`),
	defaultIcon("important", "Important", "#e03131", `
		<path d="M12 3v11"></path>
		<path d="M12 19h.01"></path>
	`),
	defaultIcon("bookmark", "Bookmark", "#fa5252", `
		<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"></path>
		<path d="M9 8h6"></path>
	`),
	defaultIcon("star", "Star", "#fab005", `
		<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9Z"></path>
	`),
	defaultIcon("fire", "Fire", "#f76707", `
		<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a5.5 5.5 0 0 0 5.5-5.5c0-3-1.7-5.1-3.7-7.1-.3 2.1-1.2 3.4-2.6 4.2.2-2.8-.7-5.4-3-7.6.1 3.2-2.7 5.2-2.7 8.5Z"></path>
	`),
	defaultIcon("up", "Up", "#e03131", `
		<path d="M4 19h16"></path>
		<path d="M5 15l5-5 4 3 5-8"></path>
		<path d="M17 5h2v2"></path>
	`),
	defaultIcon("down", "Down", "#1971c2", `
		<path d="M4 5h16"></path>
		<path d="M5 9l5 5 4-3 5 8"></path>
		<path d="M17 19h2v-2"></path>
	`),
	defaultIcon("forwarded", "Forwarded", "#1971c2", `
		<rect x="3" y="4" width="18" height="16" rx="3"></rect>
		<path d="m8 8 4 4-4 4"></path>
		<path d="m13 8 4 4-4 4"></path>
	`),
	defaultIcon("scheduling", "Scheduling", "#c92a2a", `
		<rect x="4" y="5" width="16" height="15" rx="2"></rect>
		<path d="M8 3v4"></path>
		<path d="M16 3v4"></path>
		<path d="M4 10h16"></path>
		<path d="M8 14h3"></path>
		<path d="M8 17h6"></path>
	`),
	defaultIcon("i", "Information", "#1971c2", `
		<rect x="4" y="4" width="16" height="16" rx="4"></rect>
		<path d="M12 10v6"></path>
		<path d="M12 7h.01"></path>
	`),
	defaultIcon("location", "Location", "#e03131", `
		<path d="M12 22s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12Z"></path>
		<circle cx="12" cy="10" r="2"></circle>
	`),
	defaultIcon("quote", "Quote", "#495057", `
		<path d="M8 7h.01"></path>
		<path d="M12 7h.01"></path>
		<path d="M8 7v5"></path>
		<path d="M12 7v5"></path>
	`),
	defaultIcon("dollar", "Dollar", "#495057", `
		<path d="M12 2v20"></path>
		<path d="M17 6.5c-1.2-1-2.9-1.5-5-1.5-3 0-5 1.4-5 3.5 0 4.8 10 2.3 10 7 0 2-2 3.5-5 3.5-2.2 0-4-.7-5.2-1.8"></path>
	`),
	defaultIcon("idea", "Idea", "#f59f00", `
		<path d="M9 18h6"></path>
		<path d="M10 22h4"></path>
		<path d="M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.8-1.5 3.5h-4c0-1.7-.6-2.8-1.5-3.5Z"></path>
	`),
	defaultIcon("k", "Key", "#fab005", `
		<circle cx="7.5" cy="14.5" r="3.5"></circle>
		<path d="M10 12 20 2"></path>
		<path d="m15 7 3 3"></path>
		<path d="m17 5 3 3"></path>
	`),
	defaultIcon("win", "Win", "#f08c00", `
		<path d="M4 12h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
		<path d="M4 12c0-2 1.8-4 4-4h8c2.2 0 4 2 4 4"></path>
		<path d="M8 8V5"></path>
		<path d="M12 8V5"></path>
		<path d="M16 8V5"></path>
		<path d="M8 5h.01"></path>
		<path d="M12 5h.01"></path>
		<path d="M16 5h.01"></path>
	`),
];

function defaultIcon(
	marker: string,
	label: string,
	color: string,
	paths: string
): IconBulletSetting {
	return {
		kind: "icon",
		marker,
		label,
		color,
		enabled: true,
		svg: svgIcon(paths),
	};
}

function defaultInsert(
	marker: string,
	label: string,
	insertText: string,
	displayColor?: string,
	displayPaths?: string
): IconBulletSetting {
	return {
		kind: "insert",
		marker,
		label,
		insertText,
		displayColor,
		displaySvg: displayPaths ? svgIcon(displayPaths) : undefined,
		enabled: true,
	};
}

function svgIcon(paths: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export function markerToken(marker: string): string {
	return `{${normalizeMarker(marker)}}`;
}

export function syntaxForMarker(marker: string): string {
	return `- ${markerToken(marker)} `;
}

export function normalizeMarker(marker: string): string {
	return marker.replace(/[{}]/g, "").trim();
}

export function isValidMarker(marker: string): boolean {
	return /^[A-Za-z0-9_-]{1,32}$/.test(normalizeMarker(marker));
}

export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeColor(color: string | undefined): string {
	const value = (color ?? "").trim();
	if (/^#[0-9a-f]{3,8}$/i.test(value)) {
		return value;
	}
	if (/^var\(--[a-z0-9-]+\)$/i.test(value)) {
		return value;
	}
	return "var(--text-normal)";
}

export function sanitizeSvg(svg: string | undefined): string {
	const source = (svg ?? "").trim();
	if (!source || source.length > MAX_SVG_LENGTH) {
		return FALLBACK_SVG;
	}

	try {
		const parser = new DOMParser();
		const document = parser.parseFromString(source, "image/svg+xml");
		const svgElement = document.documentElement;

		if (
			svgElement.nodeName.toLowerCase() !== "svg" ||
			svgElement.querySelector("parsererror")
		) {
			return FALLBACK_SVG;
		}

		svgElement
			.querySelectorAll(
				"script, foreignObject, iframe, object, embed, audio, video, canvas, image, use"
			)
			.forEach((element) => element.remove());

		[svgElement, ...Array.from(svgElement.querySelectorAll("*"))].forEach(
			(element) => {
				Array.from(element.attributes).forEach((attribute) => {
					const name = attribute.name.toLowerCase();
					const value = attribute.value;

					if (
						name.startsWith("on") ||
						name === "style" ||
						/javascript:|data:|https?:|url\(/i.test(value)
					) {
						element.removeAttribute(attribute.name);
					}
				});
			}
		);

		svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		svgElement.setAttribute("aria-hidden", "true");
		svgElement.setAttribute("focusable", "false");
		return svgElement.outerHTML;
	} catch {
		return FALLBACK_SVG;
	}
}

export function isInsertItem(icon: IconBulletSetting): boolean {
	return icon.kind === "insert";
}

export function isIconItem(icon: IconBulletSetting): boolean {
	return icon.kind !== "insert";
}

export function normalizeIconBulletSettings(
	icons: unknown,
	fallback = DEFAULT_ICON_BULLETS
): IconBulletSetting[] {
	if (!Array.isArray(icons)) {
		return fallback.map((icon) => normalizeIconBulletSetting(icon));
	}

	const seen = new Set<string>();
	const normalized: IconBulletSetting[] = [];

	for (const icon of icons) {
		const candidate = icon as Partial<IconBulletSetting>;
		const marker = normalizeMarker(String(candidate.marker ?? ""));

		if (!isValidMarker(marker) || seen.has(marker)) {
			continue;
		}

		seen.add(marker);
		normalized.push(normalizeIconBulletSetting({ ...candidate, marker }));
	}

	return normalized.length > 0
		? normalized
		: fallback.map((icon) => normalizeIconBulletSetting(icon));
}

function normalizeIconBulletSetting(
	icon: Partial<IconBulletSetting>
): IconBulletSetting {
	const kind = icon.kind === "insert" ? "insert" : "icon";
	const marker = normalizeMarker(String(icon.marker ?? ""));

	if (kind === "insert") {
		return {
			kind,
			marker,
			label: String(icon.label ?? marker),
			insertText: String(icon.insertText ?? "- "),
			displayColor: normalizeColor(icon.displayColor),
			displaySvg: icon.displaySvg ? sanitizeSvg(icon.displaySvg) : undefined,
			enabled: icon.enabled !== false,
			custom: icon.custom === true,
		};
	}

	return {
		kind,
		marker,
		label: String(icon.label ?? marker),
		color: normalizeColor(icon.color),
		svg: sanitizeSvg(icon.svg),
		enabled: icon.enabled !== false,
		custom: icon.custom === true,
	};
}

export function getEnabledIconBullets(
	icons: IconBulletSetting[]
): IconBulletSetting[] {
	return icons.filter((icon) => icon.enabled && isValidMarker(icon.marker));
}

export function getRenderableIconBullets(
	icons: IconBulletSetting[]
): IconBulletSetting[] {
	return getEnabledIconBullets(icons).filter(isIconItem);
}

export function buildIconBulletConfig(
	icons: IconBulletSetting[]
): IconBulletConfig {
	const enabledIcons = getRenderableIconBullets(icons);
	const iconsByMarker = enabledIcons.reduce<Record<string, IconBulletSetting>>(
		(record, icon) => {
			record[icon.marker] = icon;
			return record;
		},
		{}
	);

	if (enabledIcons.length === 0) {
		return { iconsByMarker, editorRegex: null, readingRegex: null };
	}

	const markerAlternatives = enabledIcons
		.map((icon) => escapeRegExp(icon.marker))
		.join("|");

	return {
		iconsByMarker,
		editorRegex: new RegExp(
			`^(\\s*)([-*+]\\s+)(\\{(${markerAlternatives})\\})(\\s*)`
		),
		readingRegex: new RegExp(`^(\\s*)(\\{(${markerAlternatives})\\})(\\s*)`),
	};
}

export function createIconElement(
	icon: IconBulletSetting,
	className: string
): HTMLElement {
	const element = document.createElement("span");
	element.className = className;
	element.setAttribute("aria-label", icon.label);
	element.setAttribute(
		"title",
		isInsertItem(icon)
			? `${icon.label} ${icon.insertText ?? ""}`
			: `${icon.label} ${markerToken(icon.marker)}`
	);

	if (isInsertItem(icon)) {
		if (icon.displaySvg) {
			element.style.setProperty(
				"--icon-bullet-color",
				normalizeColor(icon.displayColor)
			);
			element.innerHTML = sanitizeSvg(icon.displaySvg);
			return element;
		}

		element.classList.add("icon-bullet-text-symbol");
		element.textContent = icon.insertText?.trim() || icon.label;
		return element;
	}

	element.style.setProperty("--icon-bullet-color", normalizeColor(icon.color));
	element.innerHTML = sanitizeSvg(icon.svg);
	return element;
}
