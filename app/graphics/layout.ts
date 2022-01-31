import { bitsy } from "itsybitsy";
import { Alignment, ContentImageItem, ContentItem, ContentTextItem, InsetDefinition, LayoutBounds, LayoutItem, LayoutTextItem, LayoutTextLine, ContentVStackItem, ContentZStackItem, ContentHStackItem } from "./base";
import { groupByHighestToLowest, mapping, max, sum, sumBy, toArray, toArrayWithResult } from "../primitives/iterables";
import { RenderingFactory } from "./renderingFactory";

function tuple<T extends unknown[]>(...args: Readonly<T>): Readonly<T> {
  return Object.freeze(args);
}

function valueForInset(inset: InsetDefinition, value: 'l' | 'r' | 't' | 'b'): number {
  if (typeof inset === 'number') {
    return inset;
  }

  if ('l' in inset) {
    return inset[value];
  }

  switch (value) {
    case 'l': case 'r': return inset.x;
    default: return inset.y;
  }
}

function calculateChildSizesX(items: Array<ContentItem>, proposedSize: readonly [number, number], context: { factory: RenderingFactory }): ReadonlyArray<readonly [number, number]> {
  console.log("calculateChildSizesX 1", items);
  // Inspired by SwiftUI: https://github.com/objcio/S01E232-swiftui-layout-explained-hstack-with-flexible-views/blob/2c0543def5c976e0165cb64ec7f47ee2d8dc21b2/SwiftUILayout/HStack.swift#L47
  // https://github.com/objcio/S01E238-swiftui-layout-explained-grids-with-flexible-columns/blob/master/SwiftUILayout/Shared/NotSwiftUI/HStack.swift

  // Calculate the range that each item can fit within. We do this my proposing the smallest and largest size possible.
  const flexibility = Array.from(items.entries(), ([index, item]) => {
    const lower = calculateSizeForContent(item, tuple(0, proposedSize[1]), context, 'horizontal')[0];
    const upper = calculateSizeForContent(item, tuple(1e15, proposedSize[1]), context, 'horizontal')[0];
    const priority  = 'grow' in item ? 1 : item.type === 'spacer' ? typeof item.dimension === 'number' ? 0 : -1 : 0;
    return Object.freeze({ index, item, lower, upper, flex: upper - lower, priority });
  }).sort((a, b) => a.flex - b.flex);

  console.log("calculateChildSizesX 2");

  const allMinWidths = sumBy(flexibility, ({ lower }) => lower);
  let remainingWidth = proposedSize[0] - allMinWidths;
  const sizes = new Array<readonly [number, number]>(items.length);

  const groups = groupByHighestToLowest(flexibility, f => f.priority);
  console.log("HStack sorted by flexibility", flexibility, groups);

  for (const group of groups.values()) {
    const remaining = Array.from(group);
    remainingWidth += sumBy(group, ({ lower }) => lower);

    // We iterate through each index, and calculate its size with the remaining space.
    while (remaining.length > 0) {
      const width = remainingWidth / remaining.length;
      const { item: child, index } = remaining.shift()!
      const size = calculateSizeForContent(child, tuple(width, proposedSize[1]), context, 'horizontal');
      console.log("X item", index, child, { remainingWidth, width }, "measured:", size);
      sizes[index] = size
      remainingWidth = Math.max(0, remainingWidth - size[0]);
    }
  }
  return Object.freeze(sizes);
}

function calculateChildSizesY(items: Array<ContentItem>, proposedSize: readonly [number, number], context: { factory: RenderingFactory }): ReadonlyArray<readonly [number, number]> {
  // Inspired by SwiftUI: https://github.com/objcio/S01E232-swiftui-layout-explained-hstack-with-flexible-views/blob/2c0543def5c976e0165cb64ec7f47ee2d8dc21b2/SwiftUILayout/HStack.swift#L47
  // Calculate the range that each item can fit within. We do this my proposing the smallest and largest size possible.
  const flexibility = items.map(child => {
    const lower = calculateSizeForContent(child, tuple(proposedSize[0], 0), context, 'vertical')[1];
    const upper = calculateSizeForContent(child, tuple(proposedSize[0], 1e15), context, 'vertical')[1];
    return upper - lower;
  });
  // const remainingIndices = Array.from(items.keys()).sort((l, r) => flexibility[l] < flexibility[r] ? -1 : 1)
  // We then sort the item‘s indices by their flexibility.
  const remainingIndices = Array.from(items.keys()).sort((l, r) => flexibility[l] - flexibility[r])
  console.log("VStack sorted by flexibility", remainingIndices, flexibility, remainingIndices.map(i => items[i].type));
  let remainingHeight = proposedSize[1];
  const sizes = new Array<readonly [number, number]>(items.length);
  // We iterate through each index, and calculate its size with the remaining space.
  while (remainingIndices.length > 0) {
    const remainingSpacers = remainingIndices.map(idx => items[idx]).filter(item => item.type === "spacer").length;
    const height = remainingHeight / Math.max(1, remainingSpacers === remainingIndices.length ? remainingSpacers : remainingIndices.length - remainingSpacers);
    const idx = remainingIndices.shift()!
    const child = items[idx]
    const size = calculateSizeForContent(child, tuple(proposedSize[0], height), context, 'vertical');
    console.log("Y item", idx, child, { remainingHeight, height }, "measured:", size);
    sizes[idx] = size
    remainingHeight = Math.max(0, remainingHeight - size[1]);
  }
  return Object.freeze(sizes);
}

function calculateSizeForContent(item: ContentItem, proposedSize: readonly [number, number], context: { factory: RenderingFactory }, direction: 'vertical' | 'horizontal' | 'both'): readonly [number, number] {
  console.log("calculateSizeForContent", item);
  switch (item.type) {
    case "spacer": {
      return tuple(
        Math.min(proposedSize[0], direction === 'vertical' ? 0 : item.dimension ?? Infinity),
        Math.min(proposedSize[1], direction === 'horizontal' ? 0 : item.dimension ?? Infinity)
      );
    }
    case "rectangle": {
      return tuple(item.width, item.height);
    }
    case "text": {
      if (item.text.trim() === "") {
        return [0, 0];
      }

      const layoutItem = layoutTextLines(item, {
        measure: proposedSize[0],
        x: 0,
        y: 0,
        factory: context.factory,
      });

      const size = (direction === "both")
      ? tuple(proposedSize[0], Math.ceil(layoutItem.maxY - layoutItem.minY))
      : tuple(
        Math.ceil(layoutItem.maxX - layoutItem.minX),
        Math.ceil(layoutItem.maxY - layoutItem.minY),
        );

      cleanUpLayoutItem(layoutItem);
      return size;
    }
    case "image": {
      const { width, height } = sizeImageWithin(item, proposedSize, direction);
      return tuple(width, height);
    }
    case "shape": {
      const paths = Array.from(
        bitsy(function*(svgPath: string) {
          const path = context.factory.makePath(svgPath);
          if (path) {
            yield path.computeTightBounds();
          }
        }).then(function*(bounds) {
          const width = Math.abs(bounds[2] - bounds[0]);
          const height = Math.abs(bounds[3] - bounds[1]);
          yield Object.freeze({
            width,
            height,
            minX: bounds[0],
            minY: bounds[1],
            maxX: bounds[2],
            maxY: bounds[3],
          })
        }).from(item.svgPaths));

      if (paths.length === 0) return tuple(0, 0);

      const minX = Math.min(...mapping(i => i.minX, paths));
      const maxX = Math.max(...mapping(i => i.maxX, paths));
      const minY = Math.min(...mapping(i => i.minY, paths));
      const maxY = Math.max(...mapping(i => i.maxY, paths));
      const width = Math.abs(maxX - minX);
      const height = Math.abs(maxY - minY);

      const viewportWidth = proposedSize[0];
      const viewportHeight = proposedSize[1];
      const ratioToCanvas = Math.min(viewportWidth, viewportHeight) / Math.min(width, height);
      const scale = item.scale * ratioToCanvas;

      return tuple(width * scale, height * scale);
    }
    case "hstack": {
      const sizes = calculateChildSizesX(item.items, proposedSize, context);
      const width = bitsy(function*([width, _height]: readonly [number, number]) { yield width }).then(sum, 0).result(sizes);
      // const width = bitsy(function*([width, _height]: readonly [number, number]) { yield width }).from(sizes).reduce(sum, 0);
      // const width = bitsy.from(sizes, ([width]) => width).reduce(sum, 0);
      const height = bitsy(function*([_width, height]: readonly [number, number]) { yield height }).then(max, 0).result(sizes);
      // const width = sizes.reduce((n, [width]) => n + width, 0);
      console.log("CALC ROW SIZE", proposedSize, width, sizes);
      return tuple(width, height);
    }
    case "vstack": {
      // const sizes = item.items.map(child => calculateSizeForContent(child, proposedSize, context, "vertical"));
      const sizes = calculateChildSizesY(item.items, proposedSize, context);

      const width = bitsy(function*([width, _height]: readonly [number, number]) { yield width }).then(max, 0).result(sizes);
      const height = bitsy(function*([_width, height]: readonly [number, number]) { yield height }).then(sum, 0).result(sizes);
      console.log("CALC STACK SIZE", proposedSize, width, sizes);
      return tuple(width, height);
    }
    default:
      return proposedSize;
  }
}

function sizeImageWithin(item: ContentImageItem, proposedSize: readonly [number, number], direction: 'vertical' | 'horizontal' | 'both') {
  const actualWidth = item.image.naturalWidth;
  const actualHeight = item.image.naturalHeight;
  const maxWidth = Math.min(item.maxWidth ?? Infinity, item.grow ? Infinity : actualWidth, proposedSize[0]);
  const maxHeight = Math.min(item.maxHeight ?? Infinity, item.grow ? Infinity : actualHeight, proposedSize[1]);
  const scaleFactor = direction === 'both' ? Math.max(maxWidth / actualWidth, maxHeight / actualHeight) : Math.min(maxWidth / actualWidth, maxHeight / actualHeight);
  console.log("sizeImageWithin", proposedSize, direction, scaleFactor, maxWidth / actualWidth, { maxWidth, actualWidth })
  const width = actualWidth * scaleFactor;
  const height = actualHeight * scaleFactor;
  return { width, height };
}

export function* layoutHStackItems(
  content: Array<ContentItem>,
  { alignment, measure, x, minY, maxY, factory }: { alignment: Alignment, measure: number; x: number; minY: number; maxY: number; factory: RenderingFactory }
): Generator<LayoutItem, { minX: number; maxX: number; }, never> {
  const proposedSize = tuple(measure, maxY - minY);
  console.log("layoutHStackItems");
  const sizes = calculateChildSizesX(content, proposedSize, { factory });
  console.log("sizes", sizes);

  let currentX = x;
  function next(x: (x: number) => number, _y: (y: number) => number): readonly [number, number] {
    currentX = x(currentX);
    return Object.freeze([currentX, minY] as const);
  }

  return yield* layoutContentItemsUsing((x, _y) => x, next, sizes, content, alignment, 'hstack', {
    measure,
    minX: x,
    minY,
    maxY,
    factory
  });
}

export function* layoutVStackItems(
  content: Array<ContentItem>,
  { alignment, measure, minX, minY, maxY, factory }: { alignment: Alignment, measure: number; minX: number; minY: number; maxY: number; factory: RenderingFactory }
): Generator<LayoutItem, { minX: number; maxX: number; }, never> {
  const proposedSize = tuple(measure, maxY - minY);
  const sizes = calculateChildSizesY(content, proposedSize, { factory });

  let currentY = minY;
  function next(_x: (x: number) => number, y: (y: number) => number): readonly [number, number] {
    currentY = y(currentY);
    return Object.freeze([minX, currentY] as const);
  }

  return yield* layoutContentItemsUsing((_x, y) => y, next, sizes, content, alignment, 'vstack', {
    measure,
    minX,
    minY,
    maxY,
    factory
  });
}

export function* layoutZStackItems(
  content: Array<ContentItem>,
  alignment: Alignment,
  { measure, minX, minY, maxY, factory }: { measure: number; minX: number; minY: number; maxY: number; factory: RenderingFactory }
): Generator<LayoutItem, { minX: number; maxX: number; }, never> {
  const proposedSize = tuple(measure, maxY - minY);
  const sizes = content.map(item => calculateSizeForContent(item, proposedSize, { factory }, 'both'));

  function next(): readonly [number, number] {
    return Object.freeze([minX, minY] as const);
  }

  // const items = toArray(layoutContentItemsUsing(Math.min, next, sizes, canvas, ctx, content, alignment, {
  //   measure,
  //   minX,
  //   minY,
  //   maxY,
  //   fontMgr
  // }));
  // return yield* alignItemsCenterY(items);

  return yield* layoutContentItemsUsing(Math.min, next, sizes, content, alignment, 'zstack', {
    measure,
    minX,
    minY,
    maxY,
    factory
  });
}

function* layoutContentItemsUsing(
  getMajor: (x: number, y: number) => number,
  next: (x: (x: number) => number, y: (y: number) => number) => readonly [number, number],
  sizes: readonly (readonly [number, number])[],
  content: Array<ContentItem>,
  parentAlignment: Alignment,
  parentType: ContentHStackItem['type'] | ContentVStackItem['type'] | ContentZStackItem['type'],
  { measure, minX, minY, maxY, factory }: { measure: number; minX: number; minY: number; maxY: number; factory: RenderingFactory }
): Generator<LayoutItem, { minX: number; maxX: number; minY: number; maxY: number }, never> {
  const viewportWidth = measure;
  const viewportHeight = maxY - minY;
  let currentX = minX;
  let currentY = minY;

  loop: for (const [index, item] of content.entries()) {
    const [width, height] = sizes[index];

    switch (item.type) {
      case "spacer": {
        const layoutItem = {
          type: "spacer",
          dimension: getMajor(width, height),
          elastic: item.dimension === undefined,
        } as const;
        yield layoutItem;
        [currentX, currentY] = next(x => x + layoutItem.dimension, y => y + layoutItem.dimension);
        continue loop;
      }
      case "rectangle": {
        const layoutItem = {
          type: "rectangle",
          minX: currentX,
          minY: currentY,
          maxX: currentX + width,
          maxY: currentY + height,
          fillColor: item.fillColor,
        } as const;
        yield layoutItem;
        [currentX, currentY] = next(x => x + width, y => y + height);
        continue loop;
      }
      case "text": {
        // We crash unless we skip empty strings.
        if (item.text.trim() === "") {
          continue loop;
        }

        // TODO: use existing size instead of laying out again?
        const layoutItem = layoutTextLines(item, {
          measure: width,
          x: currentX,
          y: currentY,
          factory
        });
        console.log("NEW ROW layout text", layoutItem, currentY);
        yield layoutItem;
        [currentX, currentY] = next(() => layoutItem.maxX, () => layoutItem.maxY);
        continue loop;
      }
      case "image": {
        let offsetY = 0;

        // FIXME: This is a hack and should be done in a better way.
        if (parentType === 'zstack' && (parentAlignment === 'center' || parentAlignment === 'leading' || parentAlignment === 'trailing')) {
          offsetY = ((maxY - minY) - height) / 2;
        }

        console.log("Produced image", width, height);

        yield Object.freeze({
          type: "image",
          image: item.image,
          width,
          height,
          minX: currentX,
          minY: currentY + offsetY,
          maxX: currentX + width,
          maxY: currentY + offsetY + height,
          rounded: item.rounded
        });
        [currentX, currentY] = next(x => x + width, y => y + height);
        continue loop;
      }
      case "shape": {
        const paths = Array.from(
          bitsy(function*(svgPath: string) {
            const path = factory.makePath(svgPath);
            if (path) yield path;
          }).then(function*(path) {
            const bounds = path.computeTightBounds();
            const width = Math.abs(bounds[2] - bounds[0]);
            const height = Math.abs(bounds[3] - bounds[1]);
            yield Object.freeze({
              path,
              width,
              height,
              minX: bounds[0],
              minY: bounds[1],
              maxX: bounds[2],
              maxY: bounds[3],
            })
          }).from(item.svgPaths));

        if (paths.length === 0) continue loop;

        const minX = Math.min(...mapping(i => i.minX, paths));
        const maxX = Math.max(...mapping(i => i.maxX, paths));
        const minY = Math.min(...mapping(i => i.minY, paths));
        const maxY = Math.max(...mapping(i => i.maxY, paths));
        const width = Math.abs(maxX - minX);
        const height = Math.abs(maxY - minY);

        const ratioToCanvas = Math.min(viewportWidth, viewportHeight) / Math.min(width, height);
        const scale = item.scale * ratioToCanvas;

        const offsetX = item.offsetXFraction * (viewportWidth - scale * width);
        const offsetY = item.offsetYFraction * (viewportHeight - scale * height);

        const layoutItem = Object.freeze({
          type: "shape",
          paths: Array.from(paths, p => p.path),
          fillColor: item.fillColor,
          scale,
          offsetX,
          offsetY,
          minX: currentX + offsetX,
          minY: currentY + offsetY,
          maxX: currentX +  width + offsetX,
          maxY: currentY + height + offsetY,
        } as const);
        yield layoutItem;
        [currentX, currentY] = next(() => layoutItem.maxX, () => layoutItem.maxY);
        continue loop;
      }
      case "linearGradient": {
        yield Object.freeze({
          type: "linearGradient",
          colors: item.colors,
          startPoint: { x: measure * item.startPoint.x, y: (maxY - minY) * item.startPoint.y },
          endPoint: { x: measure * item.endPoint.x, y: (maxY - minY) * item.endPoint.y },
          minX: minX ,
          minY: minY,
          maxX: minX + measure,
          maxY: maxY,
        });
        continue loop;
      }
      case "hstack": {
        console.log("row method A", item.inset);
        const rowMeasure = Math.max(0, Math.min(measure, item.maxWidth ?? Infinity) - valueForInset(item.inset, 'l') - valueForInset(item.inset, 'r'));

        const alignment = item.alignment ?? parentAlignment;
        const { array: items, result: { minX, maxX } } = toArrayWithResult(layoutHStackItems.bind(null, item.items, {
          alignment,
          measure: rowMeasure,
          x: currentX + valueForInset(item.inset, 'l'),
          minY: currentY + valueForInset(item.inset, 't'),
          maxY, // TODO: use valueForInset(item.inset, 'r')
          factory
        }));

        let itemsToReturn = items;
        const { result: bounds, array: yAlignedItems } = toArrayWithResult(alignItemsCenterY.bind(null, items));
        // Center items vertically.
        if (alignment === 'leading' || alignment === 'center' || alignment === 'trailing') {
          itemsToReturn = yAlignedItems;
        }

        yield Object.freeze({ type: "row", items: itemsToReturn, ...bounds });
        [currentX, currentY] = next(() => bounds.maxX, () => bounds.maxY);
        continue loop;
      }
      case "vstack": {
        const alignment = item.alignment ?? parentAlignment;
        const items = toArray(layoutVStackItems(item.items, {
          alignment,
          measure: width,
          minX: currentX,
          minY: currentY,
          maxY,
          factory
        }));

        if (alignment === 'center') {
          const { result: bounds, array: laidOutItems } = toArrayWithResult(alignItemsCenterX.bind(null, items));
          console.log("CENTERD", laidOutItems);
          yield Object.freeze({ type: "stack", items: laidOutItems, ...bounds } as const);
          [currentX, currentY] = next(() => bounds.maxX, () => bounds.maxY);
          continue loop;
        } else {
          const bounds = measureBoundsOfItems(items);
          yield Object.freeze({ type: "stack", items, ...bounds } as const);
          [currentX, currentY] = next(() => bounds.maxX, () => bounds.maxY);
          continue loop;
        }

      }
      case "zstack": {
        const items = toArray(layoutZStackItems(item.items, item.alignment, {
          measure: width,
          minX: currentX,
          minY: currentY,
          maxY,
          factory
        }));
        // const bounds = measureBoundsOfItems(items);

        let itemsToReturn = items;
        const { result: bounds, array: yAlignedItems } = toArrayWithResult(alignItemsCenterY.bind(null, items));
        // Center items vertically.
        if (item.alignment === 'leading' || item.alignment === 'center' || item.alignment === 'trailing') {
          itemsToReturn = yAlignedItems;
        }

        yield Object.freeze({ type: "stack", items: itemsToReturn, ...bounds } as const);
        [currentX, currentY] = next(() => bounds.maxX, () => bounds.maxY);
        continue loop;
      }
    }
  }

  return Object.freeze({ minX, maxX: currentX, minY, maxY: currentY });
}

function layoutTextLines(
  content: ContentTextItem,
  { measure, x, y, factory }: { measure: number; x: number; y: number; factory: RenderingFactory }
): LayoutTextItem {
  console.log("layoutTextLines");
  const { text, font } = content;

  const lines = new Array<LayoutTextLine>();

  const paragraph = factory.paragraphForTextContent(content);
  console.log("paragraph", paragraph);
  paragraph.layout(measure);

  if (text.trim() === "") {
    return Object.freeze({
      type: "text",
      sourceContent: content,
      paragraph,
      lines,
      minX: x,
      maxX: x + paragraph.getLongestLine(),
      minY: y,
      // maxY: y + (paragraph.getLineMetrics().length + 1) * lineHeight,
      maxY: y + paragraph.getHeight(),
    });
  }

  // console.log("paragraph", paragraph);
  // const rects = paragraph.getRectsForRange(
  //   0,
  //   text.length,
  //   Canvas.RectHeightStyle.IncludeLineSpacingMiddle,
  //   Canvas.RectWidthStyle.Tight
  // );
  // console.log("RECTS", JSON.stringify(text), rects.toString());
  // console.log("layout text", JSON.stringify(text));
  // console.log("longest line", paragraph.getLongestLine());
  // console.log("height", paragraph.getHeight());
  // console.log("line metrics", paragraph.getLineMetrics());
  // console.log("shaped lines", paragraph.getShapedLines());

  const utf8Encoded = new TextEncoder().encode(text);
  const utf8Decoder = new TextDecoder();
  // TODO: use paragraph.getShapedLines() instead, might kern better.
  for (const lineMetrics of paragraph.getLineMetrics()) {
    console.log("LINE METRICS", `(${lineMetrics.lineNumber})`, lineMetrics.left, measure, [lineMetrics.width, lineMetrics.height], [lineMetrics.startIndex, lineMetrics.endIndex, lineMetrics.endExcludingWhitespaces]);
    const baselineY = y + (lineMetrics.lineNumber + 1) * lineMetrics.height;
    console.log("baselineY", baselineY);
    lines.push(Object.freeze({
      // text: text.slice(lineMetrics.startIndex, lineMetrics.endIndex + 1),
      text: utf8Decoder.decode(utf8Encoded.slice(lineMetrics.startIndex, lineMetrics.endIndex)),
      font,
      // minX: content.multilineTextAlignment === 'center' ? x : x + lineMetrics.left,
      // maxX: content.multilineTextAlignment === 'center' ? x + measure : x + lineMetrics.left + lineMetrics.width,
      minX: x + lineMetrics.left,
      maxX: x + lineMetrics.left + lineMetrics.width,
      baselineY: lineMetrics.baseline,
      minY: baselineY - lineMetrics.height,
      maxY: baselineY,
    }));
  }

  return Object.freeze({
    type: "text",
    sourceContent: content,
    paragraph,
    lines,
    minX: x,
    maxX: x + paragraph.getLongestLine(),
    minY: y,
    // maxY: y + (paragraph.getLineMetrics().length + 1) * lineHeight,
    maxY: y + paragraph.getHeight(),
  });
}

function measureBoundsOfItems(items: Array<LayoutItem>) {
  let minX = Infinity;
  let maxX = 0;
  let minY = Infinity;
  let maxY = 0;
  for (const item of items) {
    if ('minX' in item) {
      minX = Math.min(minX, item.minX);
      maxX = Math.max(maxX, item.maxX);
    }
    if ('minY' in item) {
      minY = Math.min(minY, item.minY);
      maxY = Math.max(maxY, item.maxY);
    }
  }
  return { minX, maxX, minY, maxY };
}

export function* layoutItemsCenterX(width: number, items: Array<LayoutItem>) {
  for (const item of items) {
    if (item.type === "text") {
      const span = item.maxX - item.minX;
      const minX = (width - span) / 2;
      yield {
        ...item,
        minX,
        maxX: item.maxX - item.minX + minX,
        lines: item.lines.map((line) => ({
          ...line,
          minX: (width - (line.maxX - line.minX)) / 2,
          maxX: (width - (line.maxX - line.minX)) / 2 + (line.maxX - line.minX),
        })),
      };
    } else {
      yield item;
    }
  }
}

export function* layoutItemsCenterY(height: number, items: Array<LayoutItem>) {
  const { minY, maxY } = measureBoundsOfItems(items);
  const offsetY = (height - (maxY - minY)) / 2 - minY;

  console.log({ maxY, minY, offsetY });
  if (offsetY < 0) {
    yield* items;
    return;
  }

  for (const item of items) {
    if (item.type === "text") {
      yield {
        ...item,
        minY: item.minY + offsetY,
        maxY: item.maxY + offsetY,
        lines: item.lines.map((line) => ({
          ...line,
          baselineY: line.baselineY + offsetY,
          minY: line.minY + offsetY,
          maxY: line.maxY + offsetY,
        })),
      };
    } else {
      yield item;
    }
  }
}

function offsetItemByX(offsetX: number, item: LayoutItem): LayoutItem {
  if ('minX' in item) {
    if (item.type === "text") {
      return {
        ...item,
        minX: item.minX + offsetX,
        maxX: item.maxX + offsetX,
        lines: item.lines.map((line) => ({
          ...line,
          minX: line.minX + offsetX,
          maxX: line.maxX + offsetX,
        })),
      };
    } else if ('items' in item) {
      return {
        ...item,
        minX: item.minX + offsetX,
        maxX: item.maxX + offsetX,
        items: item.items.map(offsetItemByX.bind(null, offsetX)),
      };
    } else {
      return {
        ...item,
        minX: item.minX + offsetX,
        maxX: item.maxX + offsetX,
      };
    }
  } else {
    return item;
  }
}

function offsetItemByY(offsetY: number, item: LayoutItem): LayoutItem {
  if ('minY' in item) {
    if (item.type === "text") {
      return {
        ...item,
        minY: item.minY + offsetY,
        maxY: item.maxY + offsetY,
        lines: item.lines.map((line) => ({
          ...line,
          baselineY: line.baselineY + offsetY,
          minY: line.minY + offsetY,
          maxY: line.maxY + offsetY,
        })),
      };
    } else if ('items' in item) {
      return {
        ...item,
        minY: item.minY + offsetY,
        maxY: item.maxY + offsetY,
        items: item.items.map(offsetItemByY.bind(null, offsetY)),
      };
    } else {
      return {
        ...item,
        minY: item.minY + offsetY,
        maxY: item.maxY + offsetY,
      };
    }
  } else {
    return item;
  }
}

/**
 *
 * @param items
 * Similar to: https://css-tricks.com/snippets/css/a-guide-to-flexbox/#align-items
 * @returns
 */
function* alignItemsCenterY(items: Array<LayoutItem>): Generator<LayoutItem, LayoutBounds> {
  const bounds = measureBoundsOfItems(items);
  const { minY, maxY } = bounds;
  const centerY = minY + (maxY - minY) / 2;

  for (const item of items) {
    if ('minY' in item) {
      const itemCenterY = item.minY + (item.maxY - item.minY) / 2;
      const offsetY = centerY - itemCenterY;
      yield offsetItemByY(offsetY, item);
    } else {
      yield item;
    }
  }

  // return { minY, maxY, centerY };
  return bounds;
}

function* alignItemsCenterX(items: Array<LayoutItem>): Generator<LayoutItem, LayoutBounds> {
  const bounds = measureBoundsOfItems(items);
  const { minX, maxX } = bounds;
  const centerX = minX + (maxX - minX) / 2;

  for (const item of items) {
    if ('minX' in item) {
      const itemCenterX = item.minX + (item.maxX - item.minX) / 2;
      const offsetX = centerX - itemCenterX;
      yield offsetItemByX(offsetX, item);
    } else {
      yield item;
    }
  }

  // return { minY, maxY, centerY };
  return bounds;
}

export function cleanUpLayoutItem(layoutItem: LayoutItem): void {
  switch (layoutItem.type) {
    case "image":
      // layoutItem.image.delete();
      break;
    case "text":
      // layoutItem.paragraph?.delete();
      break;
    case "shape":
      // layoutItem.paths.forEach(path => path.delete());
      break;
    case "stack": case "row":
      layoutItem.items.forEach(child => cleanUpLayoutItem(child));
      break;
  }
}
