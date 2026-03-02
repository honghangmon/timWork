import type { NormalizedDrawing } from "../../../core";
import type { ImageTransform } from "../../../core";

export type HomePolygonTarget = {
  drawingId: string;
  drawingName: string;
  vertices: Array<[number, number]>;
  transform: ImageTransform | null;
};

export function getHomePolygonTargets(drawings: NormalizedDrawing[], homeDrawingId = "00"): HomePolygonTarget[] {
  const seen = new Set<string>();
  const targets: HomePolygonTarget[] = [];

  for (const drawing of drawings) {
    if (drawing.id === homeDrawingId || seen.has(drawing.id)) {
      continue;
    }

    const vertices = sanitizeVertices(drawing.position?.vertices ?? []);
    if (vertices.length < 3) {
      continue;
    }

    seen.add(drawing.id);
    targets.push({
      drawingId: drawing.id,
      drawingName: drawing.name,
      vertices,
      transform: drawing.position?.imageTransform ?? null,
    });
  }

  return targets;
}

function sanitizeVertices(vertices: Array<[number, number]>): Array<[number, number]> {
  return vertices.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}
