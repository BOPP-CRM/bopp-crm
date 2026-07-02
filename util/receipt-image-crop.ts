import type { ReceiptPoint } from "@/util/receipt-frame-detection";

const JPEG_QUALITY = 0.95;

export function createDefaultCropPoints(
  width: number,
  height: number,
): ReceiptPoint[] {
  const marginX = width * 0.14;
  const marginY = height * 0.16;

  return [
    { x: marginX, y: marginY },
    { x: width - marginX, y: marginY },
    { x: width - marginX, y: height - marginY },
    { x: marginX, y: height - marginY },
  ];
}

export function mapDetectionPointsToImage(
  points: ReceiptPoint[],
  detectionWidth: number,
  detectionHeight: number,
  imageWidth: number,
  imageHeight: number,
): ReceiptPoint[] {
  const scaleX = imageWidth / detectionWidth;
  const scaleY = imageHeight / detectionHeight;

  return points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
}

function distanceBetweenPoints(a: ReceiptPoint, b: ReceiptPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampPoint(
  point: ReceiptPoint,
  width: number,
  height: number,
): ReceiptPoint {
  return {
    x: Math.min(Math.max(point.x, 0), width),
    y: Math.min(Math.max(point.y, 0), height),
  };
}

function solveAffineTransform(
  src: [ReceiptPoint, ReceiptPoint, ReceiptPoint],
  dst: [ReceiptPoint, ReceiptPoint, ReceiptPoint],
) {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;

  const denominator =
    (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y);

  if (denominator === 0) {
    return null;
  }

  const a =
    ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) /
    denominator;
  const b =
    ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) /
    denominator;
  const c =
    ((d1.x - d2.x) * (s0.x - s2.x) - (d0.x - d2.x) * (s1.x - s2.x)) /
    denominator;
  const d =
    ((d1.y - d2.y) * (s0.x - s2.x) - (d0.y - d2.y) * (s1.x - s2.x)) /
    denominator;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - d * s0.y;

  return { a, b, c, d, e, f };
}

function drawWarpedTriangle(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: [ReceiptPoint, ReceiptPoint, ReceiptPoint],
  destination: [ReceiptPoint, ReceiptPoint, ReceiptPoint],
) {
  const transform = solveAffineTransform(source, destination);
  if (!transform) return;

  context.save();
  context.beginPath();
  context.moveTo(destination[0].x, destination[0].y);
  context.lineTo(destination[1].x, destination[1].y);
  context.lineTo(destination[2].x, destination[2].y);
  context.closePath();
  context.clip();
  context.setTransform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f,
  );
  context.drawImage(image, 0, 0);
  context.restore();
}

function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = `data:image/jpeg;base64,${base64}`;
  });
}

export async function cropReceiptImage(
  base64Image: string,
  points: ReceiptPoint[],
): Promise<string> {
  const image = await loadImageFromBase64(base64Image);
  const normalizedPoints = [
    clampPoint(points[0], image.width, image.height),
    clampPoint(points[1], image.width, image.height),
    clampPoint(points[2], image.width, image.height),
    clampPoint(points[3], image.width, image.height),
  ] as [ReceiptPoint, ReceiptPoint, ReceiptPoint, ReceiptPoint];

  const outputWidth = Math.max(
    1,
    Math.round(
      Math.max(
        distanceBetweenPoints(normalizedPoints[0], normalizedPoints[1]),
        distanceBetweenPoints(normalizedPoints[3], normalizedPoints[2]),
      ),
    ),
  );
  const outputHeight = Math.max(
    1,
    Math.round(
      Math.max(
        distanceBetweenPoints(normalizedPoints[0], normalizedPoints[3]),
        distanceBetweenPoints(normalizedPoints[1], normalizedPoints[2]),
      ),
    ),
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, outputWidth, outputHeight);

  const destinationTopLeft = { x: 0, y: 0 };
  const destinationTopRight = { x: outputWidth, y: 0 };
  const destinationBottomRight = { x: outputWidth, y: outputHeight };
  const destinationBottomLeft = { x: 0, y: outputHeight };

  drawWarpedTriangle(
    context,
    image,
    [normalizedPoints[0], normalizedPoints[1], normalizedPoints[3]],
    [destinationTopLeft, destinationTopRight, destinationBottomLeft],
  );
  drawWarpedTriangle(
    context,
    image,
    [normalizedPoints[1], normalizedPoints[2], normalizedPoints[3]],
    [destinationTopRight, destinationBottomRight, destinationBottomLeft],
  );

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

export type ImageLayout = {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

export function getContainedImageLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): ImageLayout {
  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;

  if (imageAspect > containerAspect) {
    const drawWidth = containerWidth;
    const drawHeight = containerWidth / imageAspect;
    return {
      drawWidth,
      drawHeight,
      offsetX: 0,
      offsetY: (containerHeight - drawHeight) / 2,
      scale: drawWidth / imageWidth,
    };
  }

  const drawHeight = containerHeight;
  const drawWidth = containerHeight * imageAspect;

  return {
    drawWidth,
    drawHeight,
    offsetX: (containerWidth - drawWidth) / 2,
    offsetY: 0,
    scale: drawWidth / imageWidth,
  };
}

export function getEffectiveImageLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  pan: ReceiptPoint,
): ImageLayout {
  const base = getContainedImageLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );
  const clampedZoom = Math.min(Math.max(zoom, 1), 4);
  const scaledDrawWidth = base.drawWidth * clampedZoom;
  const scaledDrawHeight = base.drawHeight * clampedZoom;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  return {
    drawWidth: scaledDrawWidth,
    drawHeight: scaledDrawHeight,
    offsetX: centerX - scaledDrawWidth / 2 + pan.x,
    offsetY: centerY - scaledDrawHeight / 2 + pan.y,
    scale: base.scale * clampedZoom,
  };
}

export function getPanForZoomAtPoint(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  screenPoint: ReceiptPoint,
  imagePoint: ReceiptPoint,
): ReceiptPoint {
  const base = getContainedImageLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const scaledDrawWidth = base.drawWidth * zoom;
  const scaledDrawHeight = base.drawHeight * zoom;
  const offsetX = screenPoint.x - imagePoint.x * base.scale * zoom;
  const offsetY = screenPoint.y - imagePoint.y * base.scale * zoom;

  return {
    x: offsetX - (centerX - scaledDrawWidth / 2),
    y: offsetY - (centerY - scaledDrawHeight / 2),
  };
}

export function clampPan(
  pan: ReceiptPoint,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): ReceiptPoint {
  if (zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const base = getContainedImageLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );

  const excessWidth = Math.max(0, base.drawWidth * zoom - containerWidth);
  const excessHeight = Math.max(0, base.drawHeight * zoom - containerHeight);
  const maxPanX = excessWidth / 2 + containerWidth * 0.08;
  const maxPanY = excessHeight / 2 + containerHeight * 0.08;

  return {
    x: Math.min(Math.max(pan.x, -maxPanX), maxPanX),
    y: Math.min(Math.max(pan.y, -maxPanY), maxPanY),
  };
}

export function imagePointToScreen(
  point: ReceiptPoint,
  layout: ImageLayout,
): ReceiptPoint {
  return {
    x: layout.offsetX + point.x * layout.scale,
    y: layout.offsetY + point.y * layout.scale,
  };
}

export function screenPointToImage(
  point: ReceiptPoint,
  layout: ImageLayout,
  imageWidth: number,
  imageHeight: number,
): ReceiptPoint {
  return clampPoint(
    {
      x: (point.x - layout.offsetX) / layout.scale,
      y: (point.y - layout.offsetY) / layout.scale,
    },
    imageWidth,
    imageHeight,
  );
}
