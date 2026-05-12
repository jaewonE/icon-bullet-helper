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
	defaultIcon("therefore", "Therefore", "#b02a2a", `
		<circle cx="12" cy="5" r="2.65" fill="currentColor" stroke="none"></circle>
		<circle cx="6.3" cy="17" r="2.65" fill="currentColor" stroke="none"></circle>
		<circle cx="17.7" cy="17" r="2.65" fill="currentColor" stroke="none"></circle>
	`),
	defaultIcon("clip", "Clip", "#5c7cfa", `
		<path d="m21 8-10 10a5 5 0 0 1-7-7L15 0a3.5 3.5 0 0 1 5 5L9 16a2 2 0 1 1-3-3L16 3"></path>
	`),
	defaultIcon("p", "Good", "#2f9e44", `
		<path fill="currentColor" stroke="none" d="M2.8 10.2h3.6v10H2.8A1.8 1.8 0 0 1 1 18.4V12a1.8 1.8 0 0 1 1.8-1.8Z"></path>
		<path fill="currentColor" stroke="none" d="M8 10.1 11.2 3a1.9 1.9 0 0 1 3.6 1.2l-.6 4.2h4.4a2.4 2.4 0 0 1 2.3 3l-1.7 6.5a3 3 0 0 1-2.9 2.3H8Z"></path>
	`),
	defaultIcon("c", "Bad", "#e03131", `
		<path fill="currentColor" stroke="none" d="M2.8 13.8h3.6v-10H2.8A1.8 1.8 0 0 0 1 5.6V12a1.8 1.8 0 0 0 1.8 1.8Z"></path>
		<path fill="currentColor" stroke="none" d="M8 13.9 11.2 21a1.9 1.9 0 0 0 3.6-1.2l-.6-4.2h4.4a2.4 2.4 0 0 0 2.3-3L19.2 6a3 3 0 0 0-2.9-2.3H8Z"></path>
	`),
	defaultIcon("q", "Question", "#e03131", `
		<path fill="currentColor" stroke="none" d="M10.1 14.3c0-2.1 1.1-3.1 2.4-4 1.1-.8 2-1.4 2-2.7 0-1.2-1-2-2.5-2-1.4 0-2.4.7-3.1 1.8L5.9 5.8C7 3.6 9.1 2.3 12.2 2.3c3.7 0 6.3 2.1 6.3 5.1 0 2.8-1.9 4.1-3.4 5.1-1 .7-1.6 1.2-1.7 2.2v.7h-3.3Z"></path>
		<circle cx="11.8" cy="20" r="2.35" fill="currentColor" stroke="none"></circle>
	`),
	defaultIcon("important", "Important", "#e03131", `
		<path fill="currentColor" stroke="none" d="M9.4 3h5.2l-.8 12h-3.6Z"></path>
		<circle cx="12" cy="20" r="2.35" fill="currentColor" stroke="none"></circle>
	`),
	defaultIcon("bookmark", "Bookmark", "#fa5252", `
		<path fill="currentColor" stroke="none" d="M6 3h12a1.5 1.5 0 0 1 1.5 1.5V22L12 17.6 4.5 22V4.5A1.5 1.5 0 0 1 6 3Z"></path>
		<path d="M9 8h6" stroke="var(--background-primary)" stroke-width="2.4"></path>
	`),
	defaultIcon("star", "Star", "#fab005", `
		<path fill="currentColor" stroke="none" d="m12 2.2 3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1Z"></path>
	`),
	defaultIcon("fire", "Fire", "#f76707", `
		<path fill="currentColor" stroke="none" d="M12.2 22c-3.9 0-7-2.9-7-6.9 0-2.6 1.4-4.6 3-6.6 1-1.3 1.9-2.5 2-4.4 0-.8.9-1.3 1.6-.8 2.6 1.8 4.2 4.2 4.5 7.1.5-.6.9-1.4 1.1-2.3.2-.9 1.4-1.2 2-.5 1.5 1.8 2.4 4 2.4 6.4 0 4.6-3.5 8-9.6 8Z"></path>
		<path fill="var(--background-primary)" stroke="none" opacity=".9" d="M12.1 19.5c-2.1 0-3.7-1.6-3.7-3.7 0-1.5.8-2.7 1.7-3.8.8-.9 1.4-1.8 1.5-3.1 1.7 1.3 2.6 2.9 2.7 4.8.8-.3 1.5-1 2-2 1 .9 1.5 2.1 1.5 3.4 0 2.7-2.2 4.4-5.7 4.4Z"></path>
	`),
	defaultIcon("up", "Up", "#e03131", `
		<path d="M4 19h16" stroke-width="3.1"></path>
		<path d="M5 15l5-5 4 3 5-8" stroke-width="3.1"></path>
		<path d="M17 5h2v2" stroke-width="3.1"></path>
	`),
	defaultIcon("down", "Down", "#1971c2", `
		<path d="M4 5h16" stroke-width="3.1"></path>
		<path d="M5 9l5 5 4-3 5 8" stroke-width="3.1"></path>
		<path d="M17 19h2v-2" stroke-width="3.1"></path>
	`),
	defaultIcon("forwarded", "Forwarded", "#1971c2", `
		<rect x="3" y="4" width="18" height="16" rx="3"></rect>
		<path d="m8 8 4 4-4 4"></path>
		<path d="m13 8 4 4-4 4"></path>
	`),
	defaultIcon("scheduling", "Scheduling", "#c92a2a", `
		<rect x="2.8" y="4.2" width="18.4" height="17" rx="2.8"></rect>
		<path d="M7.7 2.8v4.1" stroke-width="2.15"></path>
		<path d="M16.3 2.8v4.1" stroke-width="2.15"></path>
		<path d="M3.3 9.8h17.4" stroke-width="2.15"></path>
		<path d="M8 14h3.2" stroke-width="2.05"></path>
		<path d="M8 17.2h6.5" stroke-width="2.05"></path>
	`),
	defaultIcon("i", "Information", "#1971c2", `
		<rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5" fill="currentColor" stroke="none"></rect>
		<path d="M12 10v6.6" stroke="var(--background-primary)" stroke-width="2.35"></path>
		<circle cx="12" cy="7.1" r="1.15" fill="var(--background-primary)" stroke="none"></circle>
	`),
	defaultIcon("location", "Location", "#e03131", `
		<path fill="currentColor" stroke="none" d="M12 22s7.5-5.8 7.5-12.3a7.5 7.5 0 0 0-15 0C4.5 16.2 12 22 12 22Z"></path>
		<circle cx="12" cy="9.8" r="2.3" fill="var(--background-primary)" stroke="none"></circle>
	`),
	defaultIcon("quote", "Quote", "#1971c2", `
		<path fill="currentColor" stroke="none" d="M6.2 18.5c-1.9 0-3.2-1.4-3.2-3.5 0-3.4 2.3-6.9 6.6-9.5l1.5 2.2c-2.1 1.5-3.4 3-3.8 4.7 1.8.2 3 1.4 3 3.1 0 1.7-1.4 3-4.1 3Z"></path>
		<path fill="currentColor" stroke="none" d="M16.2 18.5c-1.9 0-3.2-1.4-3.2-3.5 0-3.4 2.3-6.9 6.6-9.5l1.5 2.2c-2.1 1.5-3.4 3-3.8 4.7 1.8.2 3 1.4 3 3.1 0 1.7-1.4 3-4.1 3Z"></path>
	`),
	defaultIcon("dollar", "Dollar", "#495057", `
		<path d="M12 2v20"></path>
		<path d="M17 6.5c-1.2-1-2.9-1.5-5-1.5-3 0-5 1.4-5 3.5 0 4.8 10 2.3 10 7 0 2-2 3.5-5 3.5-2.2 0-4-.7-5.2-1.8"></path>
	`),
	defaultIcon("idea", "Idea", "#f59f00", `
		<path fill="currentColor" stroke="none" d="M12 2.2a6.7 6.7 0 0 0-4.1 12c1 .8 1.5 1.7 1.7 3.2h4.8c.2-1.5.7-2.5 1.7-3.2A6.7 6.7 0 0 0 12 2.2Z"></path>
		<path d="M9.5 18.8h5" stroke-width="2.4"></path>
		<path d="M10.5 21.5h3" stroke-width="2.4"></path>
		<path d="M9.1 8.2c.6-1.5 1.7-2.5 3.1-2.8" stroke="var(--background-primary)" stroke-width="2.1" opacity=".75"></path>
	`),
	defaultIcon("k", "Key", "#fab005", `
		<circle cx="7.2" cy="16.8" r="4.2" fill="currentColor" stroke="none"></circle>
		<circle cx="7.2" cy="16.8" r="1.45" fill="var(--background-primary)" stroke="none"></circle>
		<path d="M10.3 13.7 21 3" stroke-width="4.2"></path>
		<path d="m16 8 2.7 2.7" stroke-width="3.2"></path>
		<path d="m18.4 5.6 2.7 2.7" stroke-width="3.2"></path>
	`),
	defaultIcon("win", "Win", "#f76707", `
		<path fill="#ffd43b" stroke="none" d="M4.2 20.6 8.5 9.2l7.1 7.1Z"></path>
		<path d="M5.8 16.3 11.3 21" stroke="#f76707" stroke-width="1.9"></path>
		<path d="M7.2 12.4 14.4 18" stroke="#f76707" stroke-width="1.9"></path>
		<path d="M4.1 20.5c-1 .1-1.7.6-2 1.4" stroke="#f76707" stroke-width="2.3"></path>
		<path d="M10.5 10.1c.9-2.2 2.2-3.6 4-4.2" stroke="#12b886" stroke-width="2.3"></path>
		<path d="M12.6 11.6c2.1-1.2 3.8-1.4 5.5-.7" stroke="#228be6" stroke-width="2.3"></path>
		<path d="M14.6 14.1c1.8-.4 3.2-.1 4.4.9" stroke="#f76707" stroke-width="2.3"></path>
		<path d="M13.3 7.6c.8.1 1.4-.2 1.8-.8.5-.7.4-1.5-.1-2.1" stroke="#1971c2" stroke-width="2.1"></path>
		<path d="M18.1 8.3c.9-.9 1.8-1.2 2.8-.8" stroke="#40c057" stroke-width="2.1"></path>
		<path d="M18 16.8c.9.3 1.9.1 2.7-.7" stroke="#e03131" stroke-width="2.1"></path>
		<circle cx="9.3" cy="6.5" r="1" fill="#12b886" stroke="none"></circle>
		<circle cx="12" cy="3.3" r="1" fill="#ffd43b" stroke="none"></circle>
		<circle cx="18.7" cy="4.7" r="1.15" fill="#ffd43b" stroke="none"></circle>
		<circle cx="21" cy="10.4" r="1" fill="#15aabf" stroke="none"></circle>
		<circle cx="21.4" cy="18.7" r="1" fill="#ffd43b" stroke="none"></circle>
		<circle cx="16.3" cy="18.9" r=".75" fill="#12b886" stroke="none"></circle>
		<circle cx="6.3" cy="8.3" r=".75" fill="#15aabf" stroke="none"></circle>
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
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
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
