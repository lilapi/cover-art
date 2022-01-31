import type { Image, Path2D } from "@napi-rs/canvas";

export interface FontDefinition {
  readonly face: string;
  readonly size: number;
  readonly weight: 400 | 700;
}

export type Alignment = 'topLeading' | 'top' | 'topTrailing' | 'leading' | 'center' | 'trailing' | 'bottomLeading' | 'bottom' | 'bottomTrailing';
export type TextAlignment = 'leading' | 'center' | 'trailing';

export type InsetDefinition = number | Record<'x' | 'y', number> | Record<'l' | 'r' | 't' | 'b', number>;

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface ContentTextItem {
  readonly type: "text";
  readonly text: string;
  readonly font: FontDefinition;
  readonly color: string;
  readonly multilineTextAlignment: TextAlignment;
}
export interface ContentSpacerItem {
  readonly type: "spacer";
  readonly dimension: number | undefined;
}
export interface ContentImageItem {
  readonly type: "image";
  readonly image: Image;
  readonly grow: boolean; // Scales up to fit, maybe I’ll find a better name.
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly rounded: boolean;
}
export interface ContentRectangleItem {
  readonly type: "rectangle";
  readonly width: number;
  readonly height: number;
  readonly fillColor: string;
}
export interface ContentShapeItem {
  readonly type: "shape";
  readonly svgPaths: Array<string>;
  readonly fillColor: string;
  readonly offsetXFraction: number;
  readonly offsetYFraction: number;
  readonly scale: number;
}
export interface ContentLinearGradientItem {
  readonly type: "linearGradient";
  readonly colors: ReadonlyArray<string>;
  // readonly dimension: number | undefined;
  readonly startPoint: Point2D;
  readonly endPoint: Point2D;
}
export interface ContentHStackItem {
  readonly type: "hstack";
  readonly items: Array<ContentItem>;
  readonly alignment?: Alignment;
  readonly maxWidth?: number;
  readonly inset: InsetDefinition;
}
export interface ContentVStackItem {
  readonly type: "vstack";
  readonly items: Array<ContentItem>;
  readonly alignment?: Alignment;
  readonly maxWidth?: number;
}
export interface ContentZStackItem {
  readonly type: "zstack";
  readonly items: Array<ContentItem>;
  readonly alignment: Alignment;
  // readonly maxWidth?: number;
}
export type ContentItem =
  | ContentTextItem
  | ContentSpacerItem
  | ContentImageItem
  | ContentRectangleItem
  | ContentShapeItem
  | ContentLinearGradientItem
  | ContentHStackItem
  | ContentVStackItem
  | ContentZStackItem;

export interface LayoutBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}
export interface LayoutTextLine extends LayoutBounds {
  readonly text: string;
  readonly font: FontDefinition;
  readonly minX: number;
  readonly maxX: number;
  readonly baselineY: number;
  readonly minY: number;
  readonly maxY: number;
}
export interface LayoutTextItem extends LayoutBounds {
  readonly type: "text";
  readonly sourceContent: ContentTextItem;
  // readonly typeface: Typeface;
  // readonly paragraph: Paragraph | null;
  readonly lines: Array<LayoutTextLine>;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}
export interface LayoutSpacerItem {
  readonly type: "spacer";
  readonly dimension: number;
  readonly elastic: boolean;
}
export interface LayoutImageItem extends LayoutBounds {
  readonly type: "image";
  readonly image: Image;
  readonly width: number;
  readonly height: number;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly rounded: boolean;
}
export interface LayoutRectangleItem extends LayoutBounds {
  readonly type: "rectangle";
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly fillColor: string;
}
export interface LayoutShapeItem extends LayoutBounds {
  readonly type: "shape";
  readonly paths: Array<Path2D>;
  readonly fillColor: string;
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}
export interface LayoutLinearGradientItem extends LayoutBounds {
  readonly type: "linearGradient";
  readonly colors: ReadonlyArray<string>;
  readonly startPoint: Point2D;
  readonly endPoint: Point2D;
}
export interface LayoutRowItem extends LayoutBounds {
  readonly type: "row";
  readonly items: Array<LayoutItem>;
}
export interface LayoutStackItem extends LayoutBounds {
  readonly type: "stack";
  readonly items: Array<LayoutItem>;
}
export type LayoutItem =
  | LayoutTextItem
  | LayoutSpacerItem
  | LayoutImageItem
  | LayoutRectangleItem
  | LayoutShapeItem
  | LayoutLinearGradientItem
  | LayoutRowItem
  | LayoutStackItem;
