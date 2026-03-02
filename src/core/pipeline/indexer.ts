import type { ExplorerMetadataIndexes, ExplorerMetadataModel, NormalizedRevision } from "../types";

/**
 * 정규화 모델을 고속 조회 인덱스로 변환한다.
 */
export function buildExplorerIndexes(model: ExplorerMetadataModel): ExplorerMetadataIndexes {
  const indexes = createEmptyExplorerIndexes();

  for (const drawing of model.drawings) {
    indexes.drawingById.set(drawing.id, drawing);

    for (const discipline of drawing.disciplines) {
      indexes.disciplineByKey.set(discipline.key, discipline);
      indexRevisions(indexes, discipline.revisions);

      for (const region of discipline.regions) {
        indexes.regionByKey.set(region.key, region);
        indexRevisions(indexes, region.revisions);
      }
    }
  }

  for (const [trackKey, revisions] of indexes.revisionsByTrack.entries()) {
    revisions.sort(compareRevisionForLatest);
    const latest = revisions[0];
    if (latest) {
      indexes.latestRevisionByTrack.set(trackKey, latest);
    }
  }

  return indexes;
}

export function createEmptyExplorerIndexes(): ExplorerMetadataIndexes {
  return {
    drawingById: new Map(),
    disciplineByKey: new Map(),
    regionByKey: new Map(),
    revisionByKey: new Map(),
    revisionsByTrack: new Map(),
    latestRevisionByTrack: new Map(),
  };
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

function indexRevisions(indexes: ExplorerMetadataIndexes, revisions: NormalizedRevision[]): void {
  for (const revision of revisions) {
    indexes.revisionByKey.set(revision.key, revision);
    const byTrack = indexes.revisionsByTrack.get(revision.trackKey) ?? [];
    byTrack.push(revision);
    indexes.revisionsByTrack.set(revision.trackKey, byTrack);
  }
}
