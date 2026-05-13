import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import {
	IconBulletConfig,
	IconBulletSetting,
	IconBulletVariant,
	buildIconBulletConfig,
	createIconElement,
	iconBulletCalloutStyle,
} from "default_icons";

export const setIconBulletConfig = StateEffect.define<IconBulletConfig>();

export const iconBulletConfigField = StateField.define<IconBulletConfig>({
	create() {
		return buildIconBulletConfig([]);
	},
	update(value, transaction) {
		for (const effect of transaction.effects) {
			if (effect.is(setIconBulletConfig)) {
				return effect.value;
			}
		}

		return value;
	},
});

class IconBulletWidget extends WidgetType {
	constructor(private readonly icon: IconBulletSetting) {
		super();
	}

	toDOM(): HTMLElement {
		return createIconElement(this.icon, "icon-bullet-icon icon-bullet-cm-icon");
	}

	eq(other: IconBulletWidget): boolean {
		return (
			other.icon.marker === this.icon.marker &&
			other.icon.label === this.icon.label &&
			other.icon.color === this.icon.color &&
			other.icon.svg === this.icon.svg
		);
	}

	ignoreEvent(): boolean {
		return false;
	}
}

function buildDecorations(view: EditorView): DecorationSet {
	const config = view.state.field(iconBulletConfigField);
	if (!config.editorRegex || view.visibleRanges.length === 0) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();

	for (const range of view.visibleRanges) {
		let position = range.from;

		while (position <= range.to) {
			const line = view.state.doc.lineAt(position);
			const match = line.text.match(config.editorRegex);

			if (match) {
				const marker = match[5];
				const icon = config.iconsByMarker[marker];
				const variant: IconBulletVariant =
					match[4] === "!" ? "callout" : "common";

				if (icon) {
					const replaceFrom = line.from + match[1].length;
					const replaceTo =
						line.from +
						match[1].length +
						match[2].length +
						match[3].length +
						match[6].length;
					const lineAttributes: Record<string, string> = {
						class:
							variant === "callout"
								? "icon-bullet-cm-line icon-bullet-callout"
								: "icon-bullet-cm-line",
						"data-icon-bullet-marker": marker,
						"data-icon-bullet-variant": variant,
					};

					if (variant === "callout") {
						lineAttributes.style = iconBulletCalloutStyle(icon);
					}

					builder.add(
						line.from,
						line.from,
						Decoration.line({
							attributes: lineAttributes,
						})
					);
					builder.add(
						replaceFrom,
						replaceTo,
						Decoration.replace({
							widget: new IconBulletWidget(icon),
							inclusive: false,
						})
					);
				}
			}

			if (line.to >= range.to || line.to === view.state.doc.length) {
				break;
			}

			position = line.to + 1;
		}
	}

	return builder.finish();
}

export const iconBulletExtension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = buildDecorations(view);
		}

		update(update: ViewUpdate) {
			if (
				update.docChanged ||
				update.viewportChanged ||
				update.transactions.some((transaction) =>
					transaction.effects.some((effect) => effect.is(setIconBulletConfig))
				)
			) {
				this.decorations = buildDecorations(update.view);
			}
		}
	},
	{
		decorations: (plugin) => plugin.decorations,
	}
);
