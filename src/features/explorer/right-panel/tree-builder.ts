import { buildTrackKey } from "../../../core";
import type { ImageTransform, NormalizedDiscipline, NormalizedDrawing, NormalizedRegion, NormalizedRevision } from "../../../core";
import {
  canCompareDiscipline,
  canCompareRegion,
  getDefaultComparePair,
  isRenderableImageNode,
} from "./guards";
import type { CompareRequest, ImageTreeNode, LabelTreeNode, RightPanelTreeModel, RightPanelTreeNode } from "./types";

export function buildRightPanelTreeModel(drawing: NormalizedDrawing): RightPanelTreeModel {
  const nodes: RightPanelTreeNode[] = [];

  if (drawing.baseImage) {
    nodes.push({
      kind: "image",
      nodeType: "drawing-base",
      nodeKey: createDrawingBaseNodeKey(drawing.id),
      label: `${drawing.name} 기준 도면`,
      depth: 0,
      image: drawing.baseImage,
      reference: drawing.baseImage,
      transform: null,
      rawTransform: null,
      fallbackTransform: null,
      trackKey: null,
      revisionKey: null,
      changes: [],
    });
  }

  for (const discipline of drawing.disciplines) {
    nodes.push(createDisciplineLabelNode(drawing, discipline));

    if (discipline.sourceImage) {
      nodes.push({
        kind: "image",
        nodeType: "discipline-source",
        nodeKey: createDisciplineSourceNodeKey(drawing.id, discipline.name),
        label: `${discipline.name} 기본 도면`,
        depth: 1,
        image: discipline.sourceImage,
        reference: discipline.imageTransform?.relativeTo ?? null,
        transform: discipline.imageTransform ?? null,
        rawTransform: discipline.imageTransform ?? null,
        fallbackTransform: null,
        trackKey: buildTrackKey(drawing.id, discipline.name, null),
        revisionKey: null,
        changes: [],
      });
    }

    for (const revision of discipline.revisions) {
      if (!revision.image) {
        continue;
      }

      nodes.push(createRevisionNode(revision, 1, discipline.imageTransform ?? null));
    }

    for (const region of discipline.regions) {
      nodes.push(createRegionLabelNode(drawing, discipline, region));
      const regionTransformFallback = region.revisions.find((revision) => revision.imageTransform)?.imageTransform ?? null;

      for (const revision of region.revisions) {
        if (!revision.image) {
          continue;
        }

        nodes.push(createRevisionNode(revision, 2, regionTransformFallback));
      }
    }
  }

  const defaultActiveImageNodeKey = nodes.find(isRenderableImageNode)?.nodeKey ?? null;

  return {
    nodes,
    defaultActiveImageNodeKey,
  };
}

export function createDrawingBaseNodeKey(drawingId: string): string {
  return `drawing:${encodeNodePart(drawingId)}:base`;
}

export function createDisciplineSourceNodeKey(drawingId: string, disciplineName: string): string {
  return `drawing:${encodeNodePart(drawingId)}:discipline:${encodeNodePart(disciplineName)}:source`;
}

function createDisciplineLabelNode(drawing: NormalizedDrawing, discipline: NormalizedDiscipline): LabelTreeNode {
  return {
    kind: "label",
    nodeType: "discipline-label",
    nodeKey: `drawing:${encodeNodePart(drawing.id)}:discipline:${encodeNodePart(discipline.name)}:label`,
    label: discipline.name,
    depth: 0,
    compare: createDisciplineCompareRequest(drawing, discipline),
  };
}

function createRegionLabelNode(
  drawing: NormalizedDrawing,
  discipline: NormalizedDiscipline,
  region: NormalizedRegion,
): LabelTreeNode {
  return {
    kind: "label",
    nodeType: "region-label",
    nodeKey: `drawing:${encodeNodePart(drawing.id)}:discipline:${encodeNodePart(discipline.name)}:region:${encodeNodePart(region.name)}:label`,
    label: region.name,
    depth: 1,
    compare: createRegionCompareRequest(drawing, discipline, region),
  };
}

function createRevisionNode(
  revision: NormalizedRevision,
  depth: number,
  fallbackTransform: ImageTransform | null,
): ImageTreeNode {
  return {
    kind: "image",
    nodeType: "revision",
    nodeKey: `revision:${encodeNodePart(revision.key)}`,
    label: revision.version.normalized || revision.version.raw || "REV",
    depth,
    image: revision.image,
    reference: revision.effectiveRelativeTo,
    transform: revision.imageTransform ?? fallbackTransform,
    rawTransform: revision.imageTransform ?? null,
    fallbackTransform,
    trackKey: revision.trackKey,
    revisionKey: revision.key,
    changes: revision.changes.filter((change) => change.trim().length > 0),
  };
}

function createDisciplineCompareRequest(
  drawing: NormalizedDrawing,
  discipline: NormalizedDiscipline,
): CompareRequest | null {
  if (!canCompareDiscipline(discipline)) {
    return null;
  }

  const pair = getDefaultComparePair(discipline.revisions);
  if (!pair) {
    return null;
  }

  return {
    trackKey: pair.left.trackKey || buildTrackKey(drawing.id, discipline.name, null),
    leftRevisionKey: pair.left.key,
    rightRevisionKey: pair.right.key,
    leftLabel: pair.left.version.normalized,
    rightLabel: pair.right.version.normalized,
  };
}

function createRegionCompareRequest(
  drawing: NormalizedDrawing,
  discipline: NormalizedDiscipline,
  region: NormalizedRegion,
): CompareRequest | null {
  if (!canCompareRegion(region)) {
    return null;
  }

  const pair = getDefaultComparePair(region.revisions);
  if (!pair) {
    return null;
  }

  return {
    trackKey: pair.left.trackKey || buildTrackKey(drawing.id, discipline.name, region.name),
    leftRevisionKey: pair.left.key,
    rightRevisionKey: pair.right.key,
    leftLabel: pair.left.version.normalized,
    rightLabel: pair.right.version.normalized,
  };
}

function encodeNodePart(value: string): string {
  return encodeURIComponent(value);
}
