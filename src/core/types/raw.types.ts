/**
 * `metadata.json` 원본 구조와 1:1로 맞춘 타입.
 * 파서 이전 단계에서 "입력 계약"을 설명하기 위한 용도다.
 */
export type RawMetadata = {
  project?: RawProject;
  disciplines?: RawDisciplineCatalogItem[];
  drawings?: Record<string, RawDrawing>;
};

export type RawProject = {
  name?: string;
  unit?: string;
};

export type RawDisciplineCatalogItem = {
  name?: string;
};

export type RawDrawing = {
  id?: string;
  name?: string;
  image?: string;
  parent?: string | null;
  position?: RawDrawingPosition | null;
  disciplines?: Record<string, RawDiscipline>;
};

export type RawDrawingPosition = {
  vertices?: RawVertex[];
  imageTransform?: RawImageTransform;
};

export type RawDiscipline = {
  image?: string;
  imageTransform?: RawImageTransform;
  polygon?: RawPolygon;
  revisions?: RawRevision[];
  regions?: Record<string, RawRegion>;
};

export type RawRegion = {
  polygon?: RawPolygon;
  revisions?: RawRevision[];
};

export type RawRevision = {
  version?: string;
  image?: string;
  date?: string;
  description?: string;
  changes?: string[];
  imageTransform?: RawImageTransform;
  polygon?: RawPolygon;
};

export type RawPolygon = {
  vertices?: RawVertex[];
  polygonTransform?: RawImageTransform;
};

export type RawImageTransform = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  relativeTo?: string;
};

export type RawVertex = [number, number] | number[];
