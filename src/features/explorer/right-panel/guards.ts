import { isRevisionSelectable } from "../../../core";
import type { NormalizedDiscipline, NormalizedRegion, NormalizedRevision } from "../../../core";
import type { ImageTreeNode, RightPanelTreeNode } from "./types";

export const STRUCTURAL_DISCIPLINE_NAME = "구조";

export function isRenderableImageNode(node: RightPanelTreeNode): node is ImageTreeNode {
  return node.kind === "image" && Boolean(node.image.trim());
}

export function getOverlayAnchorReferenceFromNode(node: ImageTreeNode): string | null {
  if (node.nodeType === "drawing-base") {
    return node.image || null;
  }

  if (node.nodeType === "discipline-source") {
    return node.image || null;
  }

  return node.reference;
}

export function isOverlayCandidateNode(node: ImageTreeNode, anchorReference: string | null): boolean {
  if (!anchorReference || node.nodeType === "drawing-base") {
    return false;
  }

  return node.reference === anchorReference;
}

export function canCompareDiscipline(discipline: NormalizedDiscipline): boolean {
  if (discipline.name === STRUCTURAL_DISCIPLINE_NAME) {
    return false;
  }

  return discipline.revisions.filter(isRevisionSelectable).length >= 2;
}

export function canCompareRegion(region: NormalizedRegion): boolean {
  return region.revisions.filter(isRevisionSelectable).length >= 2;
}

export function getDefaultComparePair(
  revisions: NormalizedRevision[],
): { left: NormalizedRevision; right: NormalizedRevision } | null {
  const selectable = revisions.filter(isRevisionSelectable);
  if (selectable.length < 2) {
    return null;
  }

  const sorted = [...selectable].sort(compareRevisionForTimeline);
  const oldest = sorted[0];
  const latest = sorted[sorted.length - 1];

  if (!oldest || !latest || oldest.key === latest.key) {
    return null;
  }

  return { left: oldest, right: latest };
}

function compareRevisionForTimeline(left: NormalizedRevision, right: NormalizedRevision): number {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp;
  }

  if (left.version.numberPart !== right.version.numberPart) {
    return left.version.numberPart - right.version.numberPart;
  }

  return left.version.normalized.localeCompare(right.version.normalized, "ko", { numeric: true });
}
