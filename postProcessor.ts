import { MarkdownPostProcessor } from "obsidian";
import {
	IconBulletConfig,
	IconBulletVariant,
	applyIconBulletCalloutStyle,
	createIconElement,
} from "default_icons";

function getFirstTextNode(li: HTMLElement): Text | null {
	const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);

	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		const parent = node.parentElement;

		if (!parent || node.nodeValue?.trim() === "") {
			continue;
		}

		if (parent.closest("li") !== li) {
			continue;
		}

		if (parent.closest("ul, ol") !== li.closest("ul, ol")) {
			continue;
		}

		return node;
	}

	return null;
}

export function buildIconBulletPostProcessor(
	getConfig: () => IconBulletConfig
): MarkdownPostProcessor {
	return (element) => {
		const config = getConfig();
		const readingRegex = config.readingRegex;
		if (!readingRegex) {
			return;
		}

		element.findAll("li").forEach((li) => {
			const textNode = getFirstTextNode(li);
			const text = textNode?.nodeValue;
			if (!text || li.hasClass("icon-bullet-reading")) {
				return;
			}

			const match = text.match(readingRegex);
			if (!match) {
				return;
			}

			const marker = match[4];
			const icon = config.iconsByMarker[marker];
			const variant: IconBulletVariant =
				match[3] === "!" ? "callout" : "common";
			if (!icon) {
				return;
			}

			textNode.nodeValue = `${match[1]}${text.slice(match[0].length)}`;

			li.addClass("icon-bullet-reading");
			if (variant === "callout") {
				li.addClass("icon-bullet-callout");
				applyIconBulletCalloutStyle(li, icon);
			}
			li.setAttribute("data-icon-bullet-marker", marker);
			li.setAttribute("data-icon-bullet-variant", variant);
			li.prepend(
				createIconElement(
					icon,
					"icon-bullet-icon icon-bullet-reading-icon"
				)
			);
		});
	};
}
