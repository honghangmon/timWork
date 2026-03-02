import type {
  ExplorerMetadataIndexes,
  ExplorerMetadataModel,
  ExplorerSelection,
  NormalizedDiscipline,
  NormalizedDrawing,
  NormalizedRegion,
  NormalizedRevision,
} from "../types";
import { buildDisciplineKey, buildRegionKey, buildTrackKey } from "./keys";

export function getDrawingOptions(model: ExplorerMetadataModel): NormalizedDrawing[] {
  return model.drawings;
}

export function getDisciplineOptions(
  indexes: ExplorerMetadataIndexes,
  selection: ExplorerSelection,
): NormalizedDiscipline[] {
  if (!selection.drawingId) {
    return [];
  }

  const drawing = indexes.drawingById.get(selection.drawingId);
  return drawing?.disciplines ?? [];
}

export function getRegionOptions(
  indexes: ExplorerMetadataIndexes,
  selection: ExplorerSelection,
): NormalizedRegion[] {
  if (!selection.drawingId || !selection.disciplineName) {
    return [];
  }

  const disciplineKey = buildDisciplineKey(selection.drawingId, selection.disciplineName);
  const discipline = indexes.disciplineByKey.get(disciplineKey);
  return discipline?.regions ?? [];
}

export function getRevisionsForSelection(
  indexes: ExplorerMetadataIndexes,
  selection: ExplorerSelection,
): NormalizedRevision[] {
  if (!selection.drawingId || !selection.disciplineName) {
    return [];
  }

  const trackKey = buildTrackKey(selection.drawingId, selection.disciplineName, selection.regionName);
  return indexes.revisionsByTrack.get(trackKey) ?? [];
}

export function getLatestRevisionForSelection(
  indexes: ExplorerMetadataIndexes,
  selection: ExplorerSelection,
): NormalizedRevision | null {
  if (!selection.drawingId || !selection.disciplineName) {
    return null;
  }

  const trackKey = buildTrackKey(selection.drawingId, selection.disciplineName, selection.regionName);
  const revisions = indexes.revisionsByTrack.get(trackKey) ?? [];
  return revisions.find(isRevisionSelectable) ?? null;
}

export function getOverlayCandidates(
  indexes: ExplorerMetadataIndexes,
  baseImage: string | null,
): NormalizedRevision[] {
  if (!baseImage) {
    return [];
  }

  const candidates = [...indexes.revisionByKey.values()].filter(
    (revision) => revision.effectiveRelativeTo === baseImage && isRevisionSelectable(revision),
  );
  candidates.sort(compareRevisionForLatest);
  return candidates;
}

export function isRegionEnabled(indexes: ExplorerMetadataIndexes, selection: ExplorerSelection): boolean {
  if (!selection.drawingId || !selection.disciplineName) {
    return false;
  }

  const disciplineKey = buildDisciplineKey(selection.drawingId, selection.disciplineName);
  const discipline = indexes.disciplineByKey.get(disciplineKey);
  return Boolean(discipline && discipline.regions.length > 0);
}

export function getRegionBySelection(
  indexes: ExplorerMetadataIndexes,
  selection: ExplorerSelection,
): NormalizedRegion | null {
  if (!selection.drawingId || !selection.disciplineName || !selection.regionName) {
    return null;
  }

  const key = buildRegionKey(selection.drawingId, selection.disciplineName, selection.regionName);
  return indexes.regionByKey.get(key) ?? null;
}

/**
 * 선택 가능 여부(UI 정책).
 * - 버전 파싱 성공(numberPart >= 0)
 * - 이미지 존재
 * - 날짜 파싱 성공(timestamp 유한값)
 */
export function isRevisionSelectable(revision: NormalizedRevision): boolean {
  return revision.version.numberPart >= 0 && Boolean(revision.image) && Number.isFinite(revision.timestamp);
}

function compareRevisionForLatest(left: NormalizedRevision, right: NormalizedRevision): number {
  if (left.timestamp !== right.timestamp) {
    return right.timestamp - left.timestamp;
  }

  if (left.version.numberPart !== right.version.numberPart) {
    return right.version.numberPart - left.version.numberPart;
  }

  return right.version.normalized.localeCompare(left.version.normalized, "ko", { numeric: true });
}
