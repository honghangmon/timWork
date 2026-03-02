/**
 * drawing + discipline 조합 키.
 */
export function buildDisciplineKey(drawingId: string, disciplineName: string): string {
  return `${drawingId}::${disciplineName}`;
}

/**
 * drawing + discipline + region 조합 키.
 */
export function buildRegionKey(drawingId: string, disciplineName: string, regionName: string): string {
  return `${buildDisciplineKey(drawingId, disciplineName)}::${regionName}`;
}

/**
 * revision 트랙 식별 키.
 * region이 없으면 `__NO_REGION__` 세그먼트를 사용한다.
 */
export function buildTrackKey(drawingId: string, disciplineName: string, regionName: string | null): string {
  const regionSegment = regionName ?? "__NO_REGION__";
  return `${drawingId}::${disciplineName}::${regionSegment}`;
}

/**
 * revision 고유 키.
 */
export function buildRevisionKey(trackKey: string, version: string, index: number): string {
  return `${trackKey}::${version}::${index}`;
}
