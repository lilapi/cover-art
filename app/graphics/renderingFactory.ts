import type { AsyncReturnType } from "type-fest";
import type { Path2D, SKRSContext2D } from "@napi-rs/canvas";
import { MemoizedCalculator } from "../primitives/caching";
import { ContentTextItem, FontDefinition } from "./base";
import { importCanvas } from "./deps";
import { maxBy, sumBy, toArray } from "~/primitives/iterables";

export const COLORS = Object.freeze({
  black: Float32Array.of(0, 0, 0, 1),
  white: Float32Array.of(1, 1, 1, 1),
  red: Float32Array.of(1, 0, 0, 1),
  yellow: Float32Array.of(1, 1, 0, 1),
});

export interface RenderingFactory {
  paragraphForTextContent(textContent: ContentTextItem): Paragraph;
  makePath(svgString: string): Path2D;

  clear(): void;
}

interface LineMetric {
  /** The index in the text buffer the line begins. */
  startIndex: number;
  /** The index in the text buffer the line ends. */
  endIndex: number;
  endExcludingWhitespaces: number;
  endIncludingNewline: number;
  /** True if the line ends in a hard break (e.g. newline) */
  isHardBreak: boolean;
  /**
   * The final computed ascent for the line. This can be impacted by
   * the strut, height, scaling, as well as outlying runs that are very tall.
   */
  ascent: number;
  /**
   * The final computed descent for the line. This can be impacted by
   * the strut, height, scaling, as well as outlying runs that are very tall.
   */
  descent: number;
  /** round(ascent + descent) */
  height: number;
  /** width of the line */
  width: number;
  /** The left edge of the line. The right edge can be obtained with `left + width` */
  left: number;
  /** The y position of the baseline for this line from the top of the paragraph. */
  baseline: number;
  /** Zero indexed line number. */
  lineNumber: number;
}

interface Paragraph {
  getLineMetrics(): Array<LineMetric>;
  getLongestLine(): number;
  getHeight(): number;
  layout(measure: number): void;
}

export function applyFont(ctx: SKRSContext2D, font: FontDefinition) {
  ctx.font = `${font.weight} ${font.size}px ${font.face}`;
}

function paragraphForTextContent(
  textContent: ContentTextItem,
  ctx: SKRSContext2D,
): Paragraph {
  const text = textContent.text.trim();

  ctx.fillStyle = textContent.color;
  applyFont(ctx, textContent.font);

  let lineMetrics: Array<LineMetric> = [];

  function layout(measure: number) {
    if (measure < 1) {
      lineMetrics = [];
      return;
    }

    // TODO: handle wider characters like emoji.
    let startUTF16 = 0;
    let endUTF16 = text.length;
    let startUTF8 = 0;
    const utf8Encoder = new TextEncoder();

    lineMetrics = toArray(function* () {
      let lineNumber = 0;
      while (startUTF16 < endUTF16) {
        let substring = text.slice(startUTF16, endUTF16);
        while (substring.startsWith(" ")) {
          startUTF16++;
          startUTF8++;
          substring = text.slice(startUTF16, endUTF16);
        }
        const metrics = ctx.measureText(substring);
        console.log("measure text", measure, metrics.width, substring);
        if (metrics.width > measure) {
          if (substring.includes(" ")) {
            endUTF16 = substring.match(/[ ](\S)+$/)?.index ?? endUTF16 - 1;
          } else {
            endUTF16--;
          }
          continue;
        }

        const utf8Encoded = utf8Encoder.encode(substring);

        const left = textContent.multilineTextAlignment === "trailing"
          ? measure - metrics.width
          : textContent.multilineTextAlignment === "center"
          ? (measure - metrics.width) / 2
          : 0;

        console.log("LINE OF TEXT", { startUTF8, startUTF16, endUTF16 });
        yield {
          lineNumber,
          startIndex: startUTF8,
          endIndex: startUTF8 + utf8Encoded.length,
          endExcludingWhitespaces: startUTF8 + utf8Encoded.length,
          ascent: metrics.fontBoundingBoxAscent,
          descent: metrics.fontBoundingBoxDescent,
          height: Math.round(
            metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent,
          ),
          width: metrics.width,
          left,
          baseline: metrics.fontBoundingBoxAscent +
            metrics.fontBoundingBoxDescent, // FIXME
        } as LineMetric;

        lineNumber += 1;
        startUTF16 = endUTF16;
        endUTF16 = text.length;
        console.log("LINE OF TEXT yielded", {
          startUTF8,
          startUTF16,
          endUTF16,
        });
        startUTF8 += utf8Encoded.length;
      }
    });
  }

  return Object.freeze({
    layout,
    getLineMetrics() {
      return lineMetrics;
    },
    getLongestLine() {
      return maxBy(lineMetrics, m => m.width);
    },
    getHeight() {
      return sumBy(lineMetrics, (m) => m.height);
    },
  });
}

export function makeRenderingFactory(
  canvas: AsyncReturnType<typeof importCanvas>,
  ctx: SKRSContext2D,
): RenderingFactory {
  const textContentParagraphCache = new MemoizedCalculator<
    ContentTextItem,
    Paragraph
  >((textContent) => paragraphForTextContent(textContent, ctx));

  function clear() {
    textContentParagraphCache.clear();
  }

  return Object.freeze({
    paragraphForTextContent: (textContent) =>
      textContentParagraphCache.get(textContent),
    makePath: (source) => new canvas.Path2D(source),
    clear,
  });
}
