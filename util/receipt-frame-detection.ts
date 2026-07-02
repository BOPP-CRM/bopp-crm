export type ReceiptPoint = {
  x: number;
  y: number;
};

export type DetectedReceiptFrame = {
  points: ReceiptPoint[];
  areaRatio: number;
};

const MIN_RECEIPT_AREA_RATIO = 0.08;
const MAX_RECEIPT_AREA_RATIO = 0.72;
const MIN_RECEIPT_ASPECT_RATIO = 1.15;
const MAX_RECEIPT_ASPECT_RATIO = 8;
const IDEAL_RECEIPT_AREA_RATIO = 0.34;

type Bounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type EdgeBand = {
  start: number;
  end: number;
  strength: number;
};

function orderQuadrilateralPoints(points: ReceiptPoint[]): ReceiptPoint[] {
  const sortedByY = [...points].sort((a, b) => a.y - b.y);
  const top = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sortedByY.slice(2).sort((a, b) => a.x - b.x);

  return [top[0], top[1], bottom[1], bottom[0]];
}

function distanceBetweenPoints(a: ReceiptPoint, b: ReceiptPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isValidReceiptFrame(
  points: ReceiptPoint[],
  width: number,
  height: number,
): DetectedReceiptFrame | null {
  const averageWidth =
    (distanceBetweenPoints(points[0], points[1]) +
      distanceBetweenPoints(points[3], points[2])) /
    2;
  const averageHeight =
    (distanceBetweenPoints(points[0], points[3]) +
      distanceBetweenPoints(points[1], points[2])) /
    2;

  if (averageWidth <= 0 || averageHeight <= 0) return null;

  const aspectRatio =
    Math.max(averageHeight, averageWidth) /
    Math.max(Math.min(averageHeight, averageWidth), 1);

  if (
    aspectRatio < MIN_RECEIPT_ASPECT_RATIO ||
    aspectRatio > MAX_RECEIPT_ASPECT_RATIO
  ) {
    return null;
  }

  const area = averageWidth * averageHeight;
  const areaRatio = area / (width * height);

  if (areaRatio < MIN_RECEIPT_AREA_RATIO || areaRatio > MAX_RECEIPT_AREA_RATIO) {
    return null;
  }

  return {
    points,
    areaRatio,
  };
}

function boundsToFrame(
  bounds: Bounds,
  width: number,
  height: number,
): DetectedReceiptFrame | null {
  const points = orderQuadrilateralPoints([
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom },
  ]);

  return isValidReceiptFrame(points, width, height);
}

function toGrayscale(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    gray[i] =
      data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }

  return gray;
}

function boxBlur(gray: Float32Array, width: number, height: number) {
  const blurred = new Float32Array(gray.length);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          sum += gray[(y + dy) * width + (x + dx)];
        }
      }
      blurred[y * width + x] = sum / 9;
    }
  }

  return blurred;
}

function sobelEdges(gray: Float32Array, width: number, height: number) {
  const edges = new Uint8Array(width * height);
  const magnitudes = new Float32Array(width * height);
  let maxMagnitude = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = gray[(y - 1) * width + (x - 1)];
      const top = gray[(y - 1) * width + x];
      const topRight = gray[(y - 1) * width + (x + 1)];
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];
      const bottomLeft = gray[(y + 1) * width + (x - 1)];
      const bottom = gray[(y + 1) * width + x];
      const bottomRight = gray[(y + 1) * width + (x + 1)];

      const gx =
        -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
      const gy =
        -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      const magnitude = Math.hypot(gx, gy);
      const index = y * width + x;

      magnitudes[index] = magnitude;
      maxMagnitude = Math.max(maxMagnitude, magnitude);
    }
  }

  const threshold = Math.max(38, maxMagnitude * 0.28);
  for (let i = 0; i < magnitudes.length; i += 1) {
    edges[i] = magnitudes[i] >= threshold ? 255 : 0;
  }

  return edges;
}

function erode(binary: Uint8Array, width: number, height: number) {
  const eroded = new Uint8Array(binary.length);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let min = 255;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          min = Math.min(min, binary[(y + dy) * width + (x + dx)]);
        }
      }
      eroded[y * width + x] = min;
    }
  }

  return eroded;
}

function dilate(binary: Uint8Array, width: number, height: number) {
  const dilated = new Uint8Array(binary.length);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let max = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          max = Math.max(max, binary[(y + dy) * width + (x + dx)]);
        }
      }
      dilated[y * width + x] = max;
    }
  }

  return dilated;
}

function getEdgeBands(
  counts: Uint32Array,
  thresholdRatio: number,
): EdgeBand[] {
  const max = Math.max(...counts, 1);
  const threshold = max * thresholdRatio;
  const bands: EdgeBand[] = [];
  let start = -1;
  let sum = 0;

  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] >= threshold) {
      if (start < 0) start = i;
      sum += counts[i];
    } else if (start >= 0) {
      bands.push({
        start,
        end: i - 1,
        strength: sum / (i - start),
      });
      start = -1;
      sum = 0;
    }
  }

  if (start >= 0) {
    bands.push({
      start,
      end: counts.length - 1,
      strength: sum / (counts.length - start),
    });
  }

  return bands.sort((a, b) => b.strength - a.strength);
}

function getProjections(edges: Uint8Array, width: number, height: number) {
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!edges[y * width + x]) continue;
      rowCounts[y] += 1;
      colCounts[x] += 1;
    }
  }

  return { rowCounts, colCounts };
}

function getBorderEdgeScore(
  bounds: Bounds,
  edges: Uint8Array,
  width: number,
  height: number,
) {
  const { top, bottom, left, right } = bounds;
  let hits = 0;
  let samples = 0;

  for (let x = left; x <= right; x += 1) {
    hits += edges[top * width + x] ? 1 : 0;
    hits += edges[bottom * width + x] ? 1 : 0;
    samples += 2;
  }

  for (let y = top; y <= bottom; y += 1) {
    hits += edges[y * width + left] ? 1 : 0;
    hits += edges[y * width + right] ? 1 : 0;
    samples += 2;
  }

  return hits / Math.max(samples, 1);
}

function getBrightnessContrastScore(
  bounds: Bounds,
  gray: Float32Array,
  width: number,
  height: number,
) {
  let inner = 0;
  let outer = 0;
  let innerCount = 0;
  let outerCount = 0;
  const padding = Math.max(4, Math.round(Math.min(width, height) * 0.02));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const inside =
        x >= bounds.left + padding &&
        x <= bounds.right - padding &&
        y >= bounds.top + padding &&
        y <= bounds.bottom - padding;

      if (inside) {
        inner += gray[index];
        innerCount += 1;
      } else if (
        x >= bounds.left - padding &&
        x <= bounds.right + padding &&
        y >= bounds.top - padding &&
        y <= bounds.bottom + padding
      ) {
        outer += gray[index];
        outerCount += 1;
      }
    }
  }

  if (innerCount === 0 || outerCount === 0) return 0;

  const contrast = inner / innerCount - outer / outerCount;
  return Math.max(0, Math.min(1, contrast / 35));
}

function scoreCandidate(
  bounds: Bounds,
  edges: Uint8Array,
  gray: Float32Array,
  width: number,
  height: number,
) {
  const frame = boundsToFrame(bounds, width, height);
  if (!frame) return -1;

  const borderScore = getBorderEdgeScore(bounds, edges, width, height);
  const areaScore =
    1 - Math.min(1, Math.abs(frame.areaRatio - IDEAL_RECEIPT_AREA_RATIO) / 0.34);
  const contrastScore = getBrightnessContrastScore(bounds, gray, width, height);

  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const centerDistance =
    Math.hypot(centerX - width / 2, centerY - height / 2) /
    Math.hypot(width / 2, height / 2);
  const centerScore = 1 - Math.min(1, centerDistance);

  const margin = Math.min(width, height) * 0.03;
  const touchesOuterEdge =
    bounds.top <= margin ||
    bounds.left <= margin ||
    bounds.bottom >= height - margin ||
    bounds.right >= width - margin;

  let penalty = 0;
  if (touchesOuterEdge) penalty += 0.18;
  if (frame.areaRatio > 0.58) penalty += (frame.areaRatio - 0.58) * 1.4;

  return (
    borderScore * 0.42 +
    areaScore * 0.28 +
    contrastScore * 0.18 +
    centerScore * 0.12 -
    penalty
  );
}

function findBestBoundsFromEdges(
  edges: Uint8Array,
  gray: Float32Array,
  width: number,
  height: number,
): Bounds | null {
  const { rowCounts, colCounts } = getProjections(edges, width, height);
  const rowBands = getEdgeBands(rowCounts, 0.2).slice(0, 8);
  const colBands = getEdgeBands(colCounts, 0.2).slice(0, 8);

  let bestBounds: Bounds | null = null;
  let bestScore = 0.45;

  for (let topBandIndex = 0; topBandIndex < rowBands.length; topBandIndex += 1) {
    for (
      let bottomBandIndex = topBandIndex + 1;
      bottomBandIndex < rowBands.length;
      bottomBandIndex += 1
    ) {
      const top = rowBands[topBandIndex].end;
      const bottom = rowBands[bottomBandIndex].start;

      for (let leftBandIndex = 0; leftBandIndex < colBands.length; leftBandIndex += 1) {
        for (
          let rightBandIndex = leftBandIndex + 1;
          rightBandIndex < colBands.length;
          rightBandIndex += 1
        ) {
          const left = colBands[leftBandIndex].end;
          const right = colBands[rightBandIndex].start;
          const bounds = { top, bottom, left, right };
          const score = scoreCandidate(bounds, edges, gray, width, height);

          if (score > bestScore) {
            bestScore = score;
            bestBounds = bounds;
          }
        }
      }
    }
  }

  return bestBounds;
}

function tightenBounds(
  bounds: Bounds,
  edges: Uint8Array,
  gray: Float32Array,
  width: number,
  height: number,
): Bounds {
  let current = { ...bounds };
  let currentScore = scoreCandidate(current, edges, gray, width, height);

  const maxInset = Math.round(Math.min(width, height) * 0.08);
  for (let inset = 1; inset <= maxInset; inset += 1) {
    const candidate = {
      top: current.top + inset,
      bottom: current.bottom - inset,
      left: current.left + inset,
      right: current.right - inset,
    };
    const score = scoreCandidate(candidate, edges, gray, width, height);

    if (score >= currentScore) {
      current = candidate;
      currentScore = score;
      continue;
    }

    break;
  }

  return current;
}

function detectFromEdges(imageData: ImageData): DetectedReceiptFrame | null {
  const { width, height } = imageData;
  const gray = boxBlur(toGrayscale(imageData), width, height);
  const edges = dilate(erode(sobelEdges(gray, width, height), width, height), width, height);

  let bounds = findBestBoundsFromEdges(edges, gray, width, height);
  if (!bounds) return null;

  bounds = tightenBounds(bounds, edges, gray, width, height);
  return boundsToFrame(bounds, width, height);
}

function detectFromBrightness(imageData: ImageData): DetectedReceiptFrame | null {
  const { width, height } = imageData;
  const gray = toGrayscale(imageData);
  let sum = 0;

  for (let i = 0; i < gray.length; i += 1) {
    sum += gray[i];
  }

  const mean = sum / gray.length;
  const brightMask = new Uint8Array(width * height);

  for (let i = 0; i < gray.length; i += 1) {
    brightMask[i] = gray[i] > mean + 18 ? 255 : 0;
  }

  const eroded = erode(erode(brightMask, width, height), width, height);
  const edges = sobelEdges(gray, width, height);
  const bounds = findBestBoundsFromEdges(edges, gray, width, height);

  if (bounds) {
    const tightened = tightenBounds(bounds, edges, gray, width, height);
    const frame = boundsToFrame(tightened, width, height);
    if (frame && frame.areaRatio <= MAX_RECEIPT_AREA_RATIO) {
      return frame;
    }
  }

  const { rowCounts, colCounts } = getProjections(eroded, width, height);
  const rowBands = getEdgeBands(rowCounts, 0.25).slice(0, 6);
  const colBands = getEdgeBands(colCounts, 0.25).slice(0, 6);

  let bestBounds: Bounds | null = null;
  let bestScore = 0.4;

  for (let topBandIndex = 0; topBandIndex < rowBands.length; topBandIndex += 1) {
    for (
      let bottomBandIndex = topBandIndex + 1;
      bottomBandIndex < rowBands.length;
      bottomBandIndex += 1
    ) {
      const top = rowBands[topBandIndex].start;
      const bottom = rowBands[bottomBandIndex].end;

      for (let leftBandIndex = 0; leftBandIndex < colBands.length; leftBandIndex += 1) {
        for (
          let rightBandIndex = leftBandIndex + 1;
          rightBandIndex < colBands.length;
          rightBandIndex += 1
        ) {
          const left = colBands[leftBandIndex].start;
          const right = colBands[rightBandIndex].end;
          const candidate = { top, bottom, left, right };
          const score = scoreCandidate(candidate, edges, gray, width, height);

          if (score > bestScore) {
            bestScore = score;
            bestBounds = candidate;
          }
        }
      }
    }
  }

  if (!bestBounds) return null;
  return boundsToFrame(
    tightenBounds(bestBounds, edges, gray, width, height),
    width,
    height,
  );
}

export function detectReceiptFrame(
  imageData: ImageData,
): DetectedReceiptFrame | null {
  const edgeFrame = detectFromEdges(imageData);
  if (edgeFrame) return edgeFrame;

  return detectFromBrightness(imageData);
}
