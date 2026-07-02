"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReceiptPoint } from "@/util/receipt-frame-detection";
import {
  clampPan,
  getEffectiveImageLayout,
  getPanForZoomAtPoint,
  imagePointToScreen,
  screenPointToImage,
} from "@/util/receipt-image-crop";

type DragTarget =
  | { type: "corner"; index: number }
  | { type: "edge"; edge: "top" | "right" | "bottom" | "left" };

type GestureMode = "none" | "drag" | "pan" | "pinch";

type ReceiptCropEditorProps = {
  imageBase64: string;
  imageWidth: number;
  imageHeight: number;
  points: ReceiptPoint[];
  primaryColor: string;
  onPointsChange: (points: ReceiptPoint[]) => void;
};

const HANDLE_RADIUS = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clampPoints(
  points: ReceiptPoint[],
  imageWidth: number,
  imageHeight: number,
): ReceiptPoint[] {
  return points.map((point) => ({
    x: Math.min(Math.max(point.x, 0), imageWidth),
    y: Math.min(Math.max(point.y, 0), imageHeight),
  }));
}

function moveEdge(
  points: ReceiptPoint[],
  edge: "top" | "right" | "bottom" | "left",
  delta: ReceiptPoint,
): ReceiptPoint[] {
  const next = points.map((point) => ({ ...point }));

  switch (edge) {
    case "top":
      next[0].y += delta.y;
      next[1].y += delta.y;
      break;
    case "right":
      next[1].x += delta.x;
      next[2].x += delta.x;
      break;
    case "bottom":
      next[2].y += delta.y;
      next[3].y += delta.y;
      break;
    case "left":
      next[0].x += delta.x;
      next[3].x += delta.x;
      break;
    default:
      break;
  }

  return next;
}

function getPointerDistance(a: ReceiptPoint, b: ReceiptPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPointerMidpoint(a: ReceiptPoint, b: ReceiptPoint): ReceiptPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function ReceiptCropEditor({
  imageBase64,
  imageWidth,
  imageHeight,
  points,
  primaryColor,
  onPointsChange,
}: ReceiptCropEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragTargetRef = useRef<DragTarget | null>(null);
  const dragStartRef = useRef<ReceiptPoint | null>(null);
  const pointsAtDragStartRef = useRef<ReceiptPoint[]>(points);
  const pointersRef = useRef<Map<number, ReceiptPoint>>(new Map());
  const gestureRef = useRef<GestureMode>("none");
  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
    pan: ReceiptPoint;
    midpoint: ReceiptPoint;
    imagePoint: ReceiptPoint;
  } | null>(null);
  const panStartRef = useRef<{
    pointer: ReceiptPoint;
    pan: ReceiptPoint;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<ReceiptPoint>({ x: 0, y: 0 });

  const updateContainerSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, [updateContainerSize]);

  const layout = getEffectiveImageLayout(
    containerSize.width,
    containerSize.height,
    imageWidth,
    imageHeight,
    zoom,
    pan,
  );

  const screenPoints = points.map((point) => imagePointToScreen(point, layout));

  const applyPan = useCallback(
    (nextPan: ReceiptPoint) => {
      setPan(
        clampPan(
          nextPan,
          zoom,
          containerSize.width,
          containerSize.height,
          imageWidth,
          imageHeight,
        ),
      );
    },
    [containerSize.height, containerSize.width, imageHeight, imageWidth, zoom],
  );

  const applyZoomAtPoint = useCallback(
    (nextZoom: number, screenPoint: ReceiptPoint) => {
      const clampedZoom = Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM);
      const imagePoint = screenPointToImage(
        screenPoint,
        layout,
        imageWidth,
        imageHeight,
      );

      if (clampedZoom === MIN_ZOOM) {
        setZoom(MIN_ZOOM);
        setPan({ x: 0, y: 0 });
        return;
      }

      setZoom(clampedZoom);
      setPan(
        clampPan(
          getPanForZoomAtPoint(
            containerSize.width,
            containerSize.height,
            imageWidth,
            imageHeight,
            clampedZoom,
            screenPoint,
            imagePoint,
          ),
          clampedZoom,
          containerSize.width,
          containerSize.height,
          imageWidth,
          imageHeight,
        ),
      );
    },
    [containerSize.height, containerSize.width, imageHeight, imageWidth, layout],
  );

  const getDragTarget = useCallback(
    (clientX: number, clientY: number): DragTarget | null => {
      const container = containerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const pointer = { x: clientX - rect.left, y: clientY - rect.top };

      for (let index = 0; index < screenPoints.length; index += 1) {
        const point = screenPoints[index];
        if (Math.hypot(pointer.x - point.x, pointer.y - point.y) <= HANDLE_RADIUS) {
          return { type: "corner", index };
        }
      }

      const edgeChecks: Array<{
        edge: "top" | "right" | "bottom" | "left";
        start: ReceiptPoint;
        end: ReceiptPoint;
      }> = [
        { edge: "top", start: screenPoints[0], end: screenPoints[1] },
        { edge: "right", start: screenPoints[1], end: screenPoints[2] },
        { edge: "bottom", start: screenPoints[3], end: screenPoints[2] },
        { edge: "left", start: screenPoints[0], end: screenPoints[3] },
      ];

      for (const edgeCheck of edgeChecks) {
        const distance = distanceToSegment(
          pointer,
          edgeCheck.start,
          edgeCheck.end,
        );
        if (distance <= HANDLE_RADIUS) {
          return { type: "edge", edge: edgeCheck.edge };
        }
      }

      return null;
    },
    [screenPoints],
  );

  const getContainerPoint = (clientX: number, clientY: number): ReceiptPoint => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = getContainerPoint(event.clientX, event.clientY);
    pointersRef.current.set(event.pointerId, pointer);

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const midpoint = getPointerMidpoint(first, second);
      const currentLayout = getEffectiveImageLayout(
        containerSize.width,
        containerSize.height,
        imageWidth,
        imageHeight,
        zoom,
        pan,
      );

      pinchStartRef.current = {
        distance: getPointerDistance(first, second),
        zoom,
        pan,
        midpoint,
        imagePoint: screenPointToImage(
          midpoint,
          currentLayout,
          imageWidth,
          imageHeight,
        ),
      };
      gestureRef.current = "pinch";
      dragTargetRef.current = null;
      panStartRef.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const target = getDragTarget(event.clientX, event.clientY);
    if (target) {
      gestureRef.current = "drag";
      dragTargetRef.current = target;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      pointsAtDragStartRef.current = points.map((point) => ({ ...point }));
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (zoom > MIN_ZOOM) {
      gestureRef.current = "pan";
      panStartRef.current = {
        pointer,
        pan: { ...pan },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(
      event.pointerId,
      getContainerPoint(event.clientX, event.clientY),
    );

    if (gestureRef.current === "pinch" && pointersRef.current.size >= 2) {
      const pinchStart = pinchStartRef.current;
      if (!pinchStart) return;

      const [first, second] = Array.from(pointersRef.current.values());
      const distance = Math.max(getPointerDistance(first, second), 1);
      const scaleFactor = distance / Math.max(pinchStart.distance, 1);
      const nextZoom = Math.min(
        Math.max(pinchStart.zoom * scaleFactor, MIN_ZOOM),
        MAX_ZOOM,
      );

      setZoom(nextZoom);
      setPan(
        clampPan(
          nextZoom === MIN_ZOOM
            ? { x: 0, y: 0 }
            : getPanForZoomAtPoint(
                containerSize.width,
                containerSize.height,
                imageWidth,
                imageHeight,
                nextZoom,
                pinchStart.midpoint,
                pinchStart.imagePoint,
              ),
          nextZoom,
          containerSize.width,
          containerSize.height,
          imageWidth,
          imageHeight,
        ),
      );
      return;
    }

    if (gestureRef.current === "pan") {
      const panStart = panStartRef.current;
      if (!panStart) return;

      const pointer = getContainerPoint(event.clientX, event.clientY);
      applyPan({
        x: panStart.pan.x + (pointer.x - panStart.pointer.x),
        y: panStart.pan.y + (pointer.y - panStart.pointer.y),
      });
      return;
    }

    const dragTarget = dragTargetRef.current;
    const dragStart = dragStartRef.current;
    const container = containerRef.current;

    if (!dragTarget || !dragStart || !container || gestureRef.current !== "drag") {
      return;
    }

    const rect = container.getBoundingClientRect();
    const currentLayout = getEffectiveImageLayout(
      rect.width,
      rect.height,
      imageWidth,
      imageHeight,
      zoom,
      pan,
    );
    const currentImagePoint = screenPointToImage(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      currentLayout,
      imageWidth,
      imageHeight,
    );
    const startImagePoint = screenPointToImage(
      { x: dragStart.x - rect.left, y: dragStart.y - rect.top },
      currentLayout,
      imageWidth,
      imageHeight,
    );
    const delta = {
      x: currentImagePoint.x - startImagePoint.x,
      y: currentImagePoint.y - startImagePoint.y,
    };

    const basePoints = pointsAtDragStartRef.current;

    if (dragTarget.type === "corner") {
      const next = basePoints.map((point) => ({ ...point }));
      next[dragTarget.index] = currentImagePoint;
      onPointsChange(clampPoints(next, imageWidth, imageHeight));
      return;
    }

    onPointsChange(
      clampPoints(moveEdge(basePoints, dragTarget.edge, delta), imageWidth, imageHeight),
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
      if (gestureRef.current === "pinch") {
        gestureRef.current = "none";
      }
    }

    if (pointersRef.current.size === 0) {
      gestureRef.current = "none";
      dragTargetRef.current = null;
      dragStartRef.current = null;
      panStartRef.current = null;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative isolate h-full w-full touch-none overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="absolute z-0"
        style={{
          transform: `translate(${layout.offsetX}px, ${layout.offsetY}px)`,
          width: layout.drawWidth,
          height: layout.drawHeight,
        }}
      >
        <img
          src={`data:image/jpeg;base64,${imageBase64}`}
          alt="receipt-crop"
          className="pointer-events-none h-full w-full select-none"
          draggable={false}
        />
      </div>

      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
        <defs>
          <mask id="receipt-crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <polygon
              points={screenPoints.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.45)"
          mask="url(#receipt-crop-mask)"
        />
        <polygon
          points={screenPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill={`color-mix(in srgb, ${primaryColor} 18%, transparent)`}
          stroke={primaryColor}
          strokeWidth="3"
        />
        {screenPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={HANDLE_RADIUS - 4}
            fill={primaryColor}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

function distanceToSegment(
  point: ReceiptPoint,
  start: ReceiptPoint,
  end: ReceiptPoint,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    ),
  );

  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}
