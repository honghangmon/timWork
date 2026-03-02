import type { MetadataIssue } from "./core.types";
import type {
  ExplorerMetadataModel,
  NormalizedDiscipline,
  NormalizedDrawing,
  NormalizedRegion,
  NormalizedRevision,
} from "./normalized.types";

/**
 * 메타데이터 파이프라인 최종 결과.
 */
export type MetadataParseResult = {
  model: ExplorerMetadataModel;
  indexes: ExplorerMetadataIndexes;
};

/**
 * load 단계(파싱 이전) 결과.
 */
export type MetadataLoadResult =
  | { ok: true; raw: unknown }
  | { ok: false; issue: MetadataIssue };

/**
 * 상호작용 시 빠른 조회를 위한 인덱스 맵 모음.
 */
export type ExplorerMetadataIndexes = {
  drawingById: Map<string, NormalizedDrawing>;
  disciplineByKey: Map<string, NormalizedDiscipline>;
  regionByKey: Map<string, NormalizedRegion>;
  revisionByKey: Map<string, NormalizedRevision>;
  revisionsByTrack: Map<string, NormalizedRevision[]>;
  latestRevisionByTrack: Map<string, NormalizedRevision>;
};

/**
 * Explorer 좌측 필터 선택 상태.
 */
export type ExplorerSelection = {
  drawingId: string | null;
  disciplineName: string | null;
  regionName: string | null;
};
