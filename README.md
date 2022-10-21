# Cover Art

Generate images on the fly.

## Usage

```ts
const pngData = renderContent({
  width: 1000,
  height: 1000,
  content: VStack(undefined, [
    Text("Hello,", interFontOfSize(12, 700), "#f00"),
    Text("World", interFontOfSize(12, 700), "#00f")
  ])
});
const res = new Response(pngData, { headers: new Headers({ "Content-Type": "image/png" })});
```

## Content primitives

Declare your content using primitives that are inspired by SwiftUI’s layout system.

### Text

```ts
const heading = Text(
  "Some text",
  interFontOfSize(24, 400),
  "#000",
);
```

### RemoteImage

```ts
const avatarImage = await RemoteImage({
  url: "https://github.com/BurntCaramel.png",
  maxWidth: 200,
  rounded: true,
});
```

### Layout primitives

```ts
const font = interFontOfSize(24, 400);
const color = "#000";

const row = HStack(undefined, [
  Text(
    "First in row",
    font,
    color,
  ),
  Spacer(12),
  Text(
    "Second in row",
    font,
    color,
  )
]);

const column = VStack(undefined, [
  Text(
    "First",
    font,
    color,
  ),
  Spacer(20),
  Text(
    "Second",
    font,
    color,
  )
]);
```

## Development


```sh
npm ci
npm run dev
```

Open up [http://localhost:8002](http://localhost:8002) and you should be ready to go!

