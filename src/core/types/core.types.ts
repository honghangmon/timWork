/**
 * 메타데이터 로드/파싱 과정에서 수집되는 이슈 코드.
 */
export type MetadataIssueCode =
  | "LOAD_ERROR"
  | "SCHEMA_ERROR"
  | "REVISION_PARSE_ERROR"
  | "RELATIVE_TO_MISMATCH"
  | "MISSING_IMAGE";

/**
 * 이슈 심각도.
 * `error`는 선택/렌더 차단 근거, `warning`은 폴백 렌더 허용.
 */
export type MetadataIssueLevel = "error" | "warning";

/**
 * 파이프라인에서 수집한 정규화 이슈 객체.
 */
export type MetadataIssue = {
  code: MetadataIssueCode;
  level: MetadataIssueLevel;
  path: string;
  message: string;
  fatal?: boolean;
};

/**
 * 이미지/폴리곤 위치 변환 정보.
 */
export type ImageTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  relativeTo?: string;
};

/**
 * 폴리곤 기하 정보.
 */
export type Polygon = {
  vertices: Array<[number, number]>;
  polygonTransform?: ImageTransform;
};

/**
 * 최종 채택된 polygon의 출처 레벨.
 */
export type PolygonSource = "revision" | "region" | "discipline" | "none";
