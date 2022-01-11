import type { SKRSContext2D } from "@napi-rs/canvas";
import type { LayoutItem } from "./base";
import { applyFont } from "./renderingFactory";

export function drawItemsIntoContext2D(
  ctx: SKRSContext2D,
  items: Iterable<LayoutItem>,
) {
  // const fillStyle = '#6F13FF';

  loop:
  for (const item of items) {
    switch (item.type) {
      case "text": {
        for (const line of item.lines) {
          applyFont(ctx, line.font);
          ctx.fillStyle = item.sourceContent.color;
          // ctx.fillText(line.text, line.minX, line.baselineY);
          ctx.fillText(line.text, line.minX, line.maxY);
        }
        continue loop;
      }
      case "image": {
        ctx.save();
        if (item.rounded && item.width > 0 && item.height > 0) {
          ctx.beginPath();
          const rx = item.width / 2;
          const ry = item.height / 2;
          ctx.ellipse(
            item.minX + rx,
            item.minY + ry,
            rx,
            ry,
            0,
            0,
            2 * Math.PI,
          );
          // ctx.closePath();
          ctx.clip();
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
          item.image,
          item.minX,
          item.minY,
          item.width,
          item.height,
        );
        ctx.restore();

        continue loop;
      }
      case "rectangle": {
        ctx.save();
        ctx.fillStyle = item.fillColor;
        ctx.fillRect(
          item.minX,
          item.minY,
          Math.max(0, item.maxX - item.minX),
          Math.max(0, item.maxY - item.minY),
        );
        ctx.restore();
        continue loop;
      }
      case "shape": {
        ctx.save();
        // ctx.rotate(45);
        ctx.translate(
          -item.minX + 2 * item.offsetX,
          -item.minY + 2 * item.offsetY,
        );
        ctx.scale(item.scale, item.scale);
        // ctx.translate(20, 20); // TODO: remove
        ctx.fillStyle = item.fillColor;
        for (const path of item.paths) {
          ctx.fill(path, "nonzero");
        }
        ctx.restore();
        continue loop;
      }
      case "linearGradient": {
        if (item.colors.length === 0) {
          continue loop;
        }

        ctx.save();

        const gradient = ctx.createLinearGradient(
          item.startPoint.x,
          item.startPoint.y,
          item.endPoint.x,
          item.endPoint.y,
        );
        if (item.colors.length === 1) {
          gradient.addColorStop(0, item.colors[0]);
          gradient.addColorStop(1, item.colors[0]);
        } else {
          let i = 0;
          for (const color of item.colors) {
            gradient.addColorStop(i / (item.colors.length - 1), color);
            i++;
          }
        }
        ctx.fillStyle = gradient;
        // ctx.globalCompositeOperation = "multiply";

        const width = Math.abs(item.maxX - item.minX);
        const height = Math.abs(item.maxY - item.minY);
        ctx.fillRect(item.minX, item.minY, width, height);

        ctx.restore();
        continue loop;
      }
      case "row":
      case "stack": {
        drawItemsIntoContext2D(ctx, item.items);
        continue loop;
      }
    }
  }
}

export function drawItemBounds(
  ctx: SKRSContext2D,
  items: Iterable<LayoutItem>,
) {
  let index = 0;

  loop:
  for (const item of items) {
    index++;
    switch (item.type) {
      case "text": {
        for (const line of item.lines) {
          // ctx.beginPath();
          // ctx.moveTo(line.minX, line.minY);
          // ctx.lineTo(line.maxX, line.minY);
          // ctx.strokeStyle = ["lightblue", "orange", "pink"][index % 3];
          // ctx.stroke();

          // ctx.beginPath();
          // ctx.moveTo(line.minX, line.baselineY);
          // ctx.lineTo(line.maxX, line.baselineY);
          // ctx.strokeStyle = ["lightblue", "orange", "pink"][index % 3];
          // ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(line.minX, line.maxY);
          ctx.lineTo(line.maxX, line.maxY);
          ctx.strokeStyle = ["lightblue", "orange", "pink"][index % 3];
          ctx.stroke();

          index++;
        }
        continue loop;
      }
      case "image": {
        ctx.beginPath();
        ctx.moveTo(item.minX, item.minY);
        ctx.lineTo(item.maxX, item.minY);
        ctx.strokeStyle = ["lightblue", "orange", "pink"][index % 3];
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(item.minY, item.maxY);
        ctx.lineTo(item.maxX, item.maxY);
        ctx.strokeStyle = ["lightblue", "orange", "pink"][index % 3];
        ctx.stroke();
        continue loop;
      }
      case "shape": {
        // TODO
        continue loop;
      }
      case "row":
      case "stack": {
        drawItemBounds(ctx, item.items);
        continue loop;
      }
    }
  }
}
