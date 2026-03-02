import { useEffect, useMemo, useRef, useState } from "react";
import type { ImageSize } from "../../viewer/render-model";
import { resolveContainRect } from "../../viewer/render-model";
import type { HomePolygonTarget } from "../../viewer/home-polygon";
import "./PolygonLayer.css";

type PolygonLayerProps = {
  visible: boolean;
  baseImage: string | null;
  baseImageSize: ImageSize | null;
  targets: HomePolygonTarget[];
  onSelectTarget: (drawingId: string) => void;
};

type ProjectedTarget = {
  drawingId: string;
  drawingName: string;
  points: string;
  centerX: number;
  centerY: number;
};

export function PolygonLayer({ visible, baseImage, baseImageSize, targets, onSelectTarget }: PolygonLayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<ImageSize>({ width: 0, height: 0 });
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !baseImage || !baseImageSize) {
      setCanvasSize({ width: 0, height: 0 });
      setHoveredTargetId(null);
      return;
    }

    const element = rootRef.current;
    if (!element) {
      return;
    }

    const updateCanvasSize = () => {
      const rect = element.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [baseImage, baseImageSize, visible]);

  const projectedTargets = useMemo<ProjectedTarget[]>(() => {
    if (!visible || !baseImage || !baseImageSize || canvasSize.width <= 0 || canvasSize.height <= 0) {
      return [];
    }

    const containRect = resolveContainRect(canvasSize, baseImageSize);

    return targets
      .map((target) => {
        const projectedPoints = target.vertices.map(([x, y]) => ({
          x: containRect.left + x * containRect.scale,
          y: containRect.top + y * containRect.scale,
        }));
        const points = projectedPoints.map((point) => `${point.x},${point.y}`).join(" ");
        const center = getPolygonCenter(projectedPoints);

        return {
          drawingId: target.drawingId,
          drawingName: target.drawingName,
          points,
          centerX: center.x,
          centerY: center.y,
        } satisfies ProjectedTarget;
      })
      .filter((target) => target.points.length > 0);
  }, [baseImage, baseImageSize, canvasSize, targets, visible]);

  const hoveredTarget = useMemo(
    () => projectedTargets.find((target) => target.drawingId === hoveredTargetId) ?? null,
    [hoveredTargetId, projectedTargets],
  );

  if (!visible || !baseImage || !baseImageSize) {
    return null;
  }

  return (
    <div ref={rootRef} className="polygon-layer" aria-label="home drawing hotspots">
      <svg className="polygon-layer__svg" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}>
        {projectedTargets.map((target) => (
          <polygon
            key={target.drawingId}
            className="polygon-layer__target"
            points={target.points}
            role="button"
            tabIndex={0}
            aria-label={`${target.drawingName} 도면으로 이동`}
            onClick={() => onSelectTarget(target.drawingId)}
            onMouseEnter={() => setHoveredTargetId(target.drawingId)}
            onMouseLeave={() => setHoveredTargetId((previous) => (previous === target.drawingId ? null : previous))}
            onFocus={() => setHoveredTargetId(target.drawingId)}
            onBlur={() => setHoveredTargetId((previous) => (previous === target.drawingId ? null : previous))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectTarget(target.drawingId);
              }
            }}
          >
            <title>{target.drawingName}</title>
          </polygon>
        ))}
      </svg>
      {hoveredTarget ? (
        <div
          className="polygon-layer__hover-label"
          style={{
            left: `${hoveredTarget.centerX}px`,
            top: `${hoveredTarget.centerY}px`,
          }}
        >
          {hoveredTarget.drawingName}
        </div>
      ) : null}
    </div>
  );
}

function getPolygonCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}
