/**
 * Squarified treemap layout, following Bruls, Huizing and van Wijk.
 * Rows are filled while the aspect ratio of the worst cell keeps improving,
 * which keeps the cells close to square instead of degenerating into slivers.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Weighted<T> {
  value: number;
  item: T;
}

export interface Placed<T> extends Rect {
  item: T;
}

function worstRatio(row: number[], length: number, scale: number): number {
  if (row.length === 0 || length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  let max = 0;
  let min = Number.POSITIVE_INFINITY;
  for (const value of row) {
    const scaled = value * scale;
    sum += scaled;
    max = Math.max(max, scaled);
    min = Math.min(min, scaled);
  }
  if (sum === 0 || min === 0) {
    return Number.POSITIVE_INFINITY;
  }
  const squared = sum * sum;
  const side = length * length;
  return Math.max((side * max) / squared, squared / (side * min));
}

export default function treemap<T>(entries: Weighted<T>[], bounds: Rect): Placed<T>[] {
  const placed: Placed<T>[] = [];

  let remaining = [...entries].filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value);

  let { x, y, width, height } = bounds;

  while (remaining.length > 0 && width > 0.5 && height > 0.5) {
    const shorter = Math.min(width, height);
    let total = 0;
    for (const entry of remaining) {
      total += entry.value;
    }
    const scale = (width * height) / total;

    const row: number[] = [];
    let taken = 0;

    while (taken < remaining.length) {
      const candidate = [...row, remaining[taken].value];
      const better = worstRatio(candidate, shorter, scale) <= worstRatio(row, shorter, scale);
      if (row.length === 0 || better) {
        row.push(remaining[taken].value);
        taken += 1;
      } else {
        break;
      }
    }

    let rowValue = 0;
    for (const value of row) {
      rowValue += value;
    }
    const thickness = (rowValue * scale) / shorter;

    let offset = 0;
    for (let i = 0; i < row.length; i += 1) {
      const span = (row[i] * scale) / thickness;
      if (width >= height) {
        placed.push({
          item: remaining[i].item,
          x,
          y: y + offset,
          width: thickness,
          height: span,
        });
      } else {
        placed.push({
          item: remaining[i].item,
          x: x + offset,
          y,
          width: span,
          height: thickness,
        });
      }
      offset += span;
    }

    if (width >= height) {
      x += thickness;
      width -= thickness;
    } else {
      y += thickness;
      height -= thickness;
    }

    remaining = remaining.slice(row.length);
  }

  return placed;
}
