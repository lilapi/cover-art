import { addWeeks, format, parse } from 'date-fns'
import type { RenderContentOptions } from "~/graphics/render";
import {
  HStack,
  interFontOfSize,
  Rectangle,
  RemoteImage,
  Spacer,
  Text,
  VStack,
} from "~/graphics/builders";
import { ParamsReader } from "~/primitives/params";
import { readBackground, readSize } from "./shared";

function parseDate(s: string) {
  return parse(s, 'yyyy-MM-dd', new Date);
}

export async function npmDownloadsTemplate(
  packageName: string,
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const period = query.string('period', 'last-week');
  const { width, height } = readSize(query);
  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));
  const inset = 50;
  const { backgroundColor } = readBackground(query, "#111");
  const url = new URL(`https://api.npmjs.org/downloads/point/${period}/${packageName}`);
  const lastWeekData = await fetch(url.href).then(res => res.json());

  const weekCount = 22;

  const results = await Promise.all(function* () {
    const { start, end } = lastWeekData;
    const lastWeek = [parseDate(start), parseDate(end)] as const;

    for (let i = weekCount - 1; i >= 1; i--) {
      const week = lastWeek.map(d => addWeeks(d, i * -1));
      const period = week.map(date => format(date, 'yyyy-MM-dd')).join(':');
      yield fetch(new URL(`https://api.npmjs.org/downloads/point/${period}/${packageName}`).href).then(res => res.json());
    }

    yield lastWeekData;
  }.call(null));

  const maxDownloads = results.reduce((soFar, result) => Math.max(soFar, result.downloads), 0);

  const nf = new Intl.NumberFormat('en-US');

  // Try to emulate: https://cdn.littleeagle.io/compare?url=https%3A%2F%2Fkentcdodds.com%2F
  return Object.freeze({
    width,
    height,
    centerY: false,
    centerX: false,
    insetX: 0,
    insetY: 0,
    backgroundColor,
    debug: query.boolean("debug"),
    content: HStack({ inset: { l: 0, r: 0, t: 0, b: 0 } }, [
      Spacer(inset),
      VStack(undefined, [
        Spacer(inset),
        Text(
          `${nf.format(lastWeekData.downloads)} downloads`,
          interFontOfSize(sizeScaleFactor * 36, 700),
          'white',
        ),
        Spacer(12),
        Text(
          `${period.replace('-', ' ')} of `,
          interFontOfSize(sizeScaleFactor * 24, 700),
          'white',
        ),
        Text(
          packageName,
          interFontOfSize(sizeScaleFactor * 36, 700),
          'white',
        ),
        Spacer(),
        // Text(JSON.stringify(results), interFontOfSize(sizeScaleFactor * 12, 700), 'white'),
        HStack({ alignment: "topLeading" }, results.map(result => VStack({}, [
          Spacer(),
          Rectangle(50, result.downloads / maxDownloads * 250, '#FFCB6D')
        ]))),
      ]),
      Spacer()
    ]),
  });
}
