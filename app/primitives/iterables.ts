import { bitsy } from "itsybitsy";

export function* mapping<I, O>(
  transform: (element: I) => O,
  items: Iterable<I> | (() => Iterable<I>),
): Iterable<O> {
  for (const element of typeof items === "function" ? items() : items) {
    yield transform(element);
  }
}

export function* compact<T>(
  items: Iterable<T> | (() => Iterable<T>),
): Iterable<Exclude<T, false | null | undefined>> {
  for (const element of typeof items === "function" ? items() : items) {
    if (
      element == null || (typeof element === "boolean" && element === false)
    ) {
      continue;
    }
    yield element as Exclude<T, false | null | undefined>;
  }
}

export function toArray<T>(
  items: Iterable<T> | (() => Iterable<T>),
): Array<T> {
  return Array.from(typeof items === "function" ? items() : items);
}

export function toArrayWithResult<T, Result>(
  items: () => Generator<T, Result>,
): Readonly<{ array: Array<T>; result: Result }> {
  let result: Result | undefined;
  function* all() {
    result = yield* items();
  }
  return Object.freeze({
    array: Array.from(all()),
    result: result as unknown as Result,
  });
}

// deno-lint-ignore require-yield
export function* sum(item: number, accum: number) {
  return accum + item;
}

// deno-lint-ignore require-yield
export function* max(item: number, accum: number) {
  return Math.max(accum, item);
}

export function sumBy<A>(
  iterable: Iterable<A>,
  mapper: (a: A) => number,
): number {
  return bitsy(function* (a: A) {
    yield mapper(a);
  }).then(sum, 0).result(iterable);
}

export function maxBy<A>(
  iterable: Iterable<A>,
  mapper: (a: A) => number,
): number {
  return bitsy(function* (a: A) {
    yield mapper(a);
  }).then(max, 0).result(iterable);
}

export function groupByHighestToLowest<A>(source: Iterable<A>, mapper: (a: A) => number): Map<number, Array<A>> {
  // Get all possible group keys, and sort them from highest to lowest.
  const sortedKeys = Array.from(source, mapper).sort((a, b) => b - a);
  // Create the groups with arrays for each key ahead of time. We do this because we want the groups in order, from lowest to highest.
  // And Maps are sorted by insertion order.
  const groups = new Map<number, Array<A>>(sortedKeys.map(key => [key, []]));

  for (const item of source) {
    const key = mapper(item);
    groups.get(key)!.push(item);
  }
  return groups;
}
