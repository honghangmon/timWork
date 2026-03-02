import type { ImageTransform, MetadataIssue, Polygon, PolygonSource } from "./core.types";

/**
 * parse/normalize 이후 생성되는 최상위 메타데이터 모델.
 */
export type ExplorerMetadataModel = {
  projectName: string;
  unit: string;
  disciplineCatalog: string[];
  drawings: NormalizedDrawing[];
  issues: MetadataIssue[];
  hasFatalIssues: boolean;
};

/**
 * drawing 정규화 노드.
 */
export type NormalizedDrawing = {
  id: string;
  name: string;
  baseImage: string;
  parent: string | null;
  position: DrawingPosition | null;
  disciplines: NormalizedDiscipline[];
};

/**
 * discipline 정규화 노드.
 */
export type NormalizedDiscipline = {
  name: string;
  sourceImage: string | null;
  imageTransform?: ImageTransform;
  polygon: Polygon | null;
  revisions: NormalizedRevision[];
  regions: NormalizedRegion[];
  key: string;
};

/**
 * region 정규화 노드.
 */
export type NormalizedRegion = {
  name: string;
  polygon: Polygon | null;
  revisions: NormalizedRevision[];
  key: string;
};

/**
 * `revision.version` 파싱/정규화 결과.
 */
export type ParsedRevisionVersion = {
  raw: string;
  normalized: string;
  numberPart: number;
  suffix: string | null;
};

/**
 * revision 정규화 노드.
 * 원본 필드 + 뷰어 계산 필드 + 조회/선택 키를 함께 보관한다.
 */
export type NormalizedRevision = {
  version: ParsedRevisionVersion;
  image: string;
  dateRaw: string;
  timestamp: number;
  description: string;
  changes: string[];
  imageTransform?: ImageTransform;
  effectiveRelativeTo: string | null;
  polygon: Polygon | null;
  polygonSource: PolygonSource;
  drawingId: string;
  disciplineName: string;
  regionName: string | null;
  trackKey: string;
  key: string;
};

/**
 * drawing.position 정규화 노드.
 * 지도(map) 화면에서 핫스팟 폴리곤과 기준 변환 정보로 사용한다.
 */
export type DrawingPosition = {
  vertices: Array<[number, number]>;
  imageTransform?: ImageTransform;
};
