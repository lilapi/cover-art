export default function Examples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <img src={buildPath({
        template: 'overlay-left',
        width: 1200,
        height: 630,
        backgroundColor: "#19C36B",
        text: [
          { text: 'What We Expect from VUL in 2022', size: 48, weight: 700, color: '#ffffff' },
        ],
        imageURL: 'https://sdcms-prod.s3.amazonaws.com/original_images/default-ni-image.jpeg',
        logoURL: 'test3',
        logo2URL: 'https://sdcms-prod.s3.ap-southeast-2.amazonaws.com/original_images/ni-01.png',
      }, { type: "png" })} />

      <img src={buildPath({
        template: 'overlay-left',
        width: 1200,
        height: 630,
        text: [
          { text: 'What We Expect from VUL in 2022', size: 48, weight: 700, color: '#ffffff' },
        ],
        imageURL: 'https://sdcms-prod.s3.amazonaws.com/original_images/default-ni-image.jpeg',
        logoURL: 'test3',
        logo2URL: 'https://sdcms-prod.s3.ap-southeast-2.amazonaws.com/original_images/ni-01.png',
      }, { type: "png" })} />

      <img src={buildPath({
        template: 'overlay',
        width: 1200,
        height: 630,
        text: [
          { text: 'WhiteHawk Ltd (ASX:WHK)', size: 32, weight: 700, color: '#d4d9d6' },
          { text: 'Clock’s Ticking for WhiteHawk Catalysts: Contract Announcements Overdue', size: 20, weight: 700, color: 'white' },
        ],
        imageURL: 'https://sdcms-prod.s3.amazonaws.com/original_images/default-ni-image.jpeg',
        logoURL: 'https://sdcms-prod.s3.ap-southeast-2.amazonaws.com/original_images/ni-01.png',
        logoPosition: 'topRight',
      }, { type: "png" })} />
    </div>
  );
}

export interface TemplateOptions {
  template: 'plain' | 'overlay' | 'overlay-left' | 'message';
  width?: number;
  height?: number;
  text: Array<{ text: string; size: number | `${number}`; weight: number | `${number}`; color: string }>;
  gap?: number;
  backgroundColor?: string;
  imageURL?: string;
  imagePosition?: 'left' | 'right';
  logoURL?: string;
  logoPosition?: 'topLeft' | 'bottomLeft' | 'topRight' | 'bottomRight';
  logo2URL?: string;
}

export function buildPath(
  options: TemplateOptions,
  format: { type: "png" } | { type: "jpeg"; quality: number },
) {
  const searchParams = new URLSearchParams();
  for (const [index, line] of options.text.entries()) {
    const base = `t${index + 1}`;
    if (line.text.trim() === '') {
      continue;
    }

    searchParams.set(base, line.text);

    if (line.size > 0) {
      searchParams.set(`${base}-size`, `${line.size}`);
    }

    if (line.weight > 0) {
      searchParams.set(`${base}-weight`, `${line.weight}`);
    }

    if (line.color.trim() !== '') {
      searchParams.set(`${base}-color`, line.color);
    }
  }

  if (typeof options.width === 'number' && options.width > 0) {
    searchParams.set('w', options.width.toString());
  }
  if (typeof options.height === 'number' && options.height > 0) {
    searchParams.set('h', options.height.toString());
  }
  if (typeof options.backgroundColor === 'string' && options.backgroundColor.trim() !== '') {
    searchParams.set('bg-color', options.backgroundColor);
  }
  if (typeof options.gap === 'number' && options.gap > 0) {
    searchParams.set('gap', options.gap.toString());
  }

  if (typeof options.imageURL === 'string' && options.imageURL.trim() !== '') {
    searchParams.set('img', options.imageURL);
  }
  if (typeof options.imagePosition === 'string' && options.imagePosition.trim() !== '') {
    searchParams.set('img-pos', options.imagePosition);
  }

  if (typeof options.logoURL === 'string' && options.logoURL.trim() !== '') {
    searchParams.set('logo', options.logoURL);
    if (typeof options.logoPosition === 'string' && options.logoPosition.trim() !== '') {
      searchParams.set('logo-pos', options.logoPosition);
    }
  }
  if (typeof options.logo2URL === 'string' && options.logo2URL.trim() !== '') {
    searchParams.set('logo2', options.logo2URL);
  }

  if (format.type === "png") {
    searchParams.set('format', 'png');
  } else {
    searchParams.set('format', 'jpeg');
  }

  return `/1/${options.template}?${searchParams}`;
}
