import type {
  DrawingPosition,
  ExplorerMetadataModel,
  ImageTransform,
  MetadataIssue,
  NormalizedDiscipline,
  NormalizedDrawing,
  NormalizedRegion,
  NormalizedRevision,
  ParsedRevisionVersion,
  Polygon,
  PolygonSource,
} from "../types";
import { buildDisciplineKey, buildRegionKey, buildRevisionKey, buildTrackKey } from "./keys";
import {
  asRecord,
  normalizeDrawingImageRef,
  parseDateToTimestamp,
  parseRevisionVersion,
  readNumber,
  readString,
} from "./validators";

const ROOT_PATH = "$";

type RevisionContext = {
  path: string;
  drawingId: string;
  drawingBaseImage: string;
  disciplineName: string;
  disciplineImageTransform?: ImageTransform;
  disciplinePolygon: Polygon | null;
  regionName: string | null;
  regionPolygon: Polygon | null;
  trackKey: string;
};

/**
 * raw 메타데이터를 Explorer 정규화 모델로 변환한다.
 */
export function parseExplorerMetadataModel(raw: unknown): ExplorerMetadataModel {
  const issues: MetadataIssue[] = [];
  const root = asRecord(raw);

  if (!root) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "error",
      path: ROOT_PATH,
      fatal: true,
      message: "루트 객체가 아닙니다.",
    });
    return createEmptyExplorerModel(issues);
  }

  const project = parseProject(root.project, issues);
  const disciplineCatalog = parseDisciplineCatalog(root.disciplines, issues);
  const drawings = parseDrawings(root.drawings, issues);

  return {
    projectName: project.name,
    unit: project.unit,
    disciplineCatalog,
    drawings,
    issues,
    hasFatalIssues: issues.some((issue) => issue.fatal),
  };
}

/**
 * 파싱 실패 시 반환하는 기본 모델.
 */
export function createEmptyExplorerModel(issues: MetadataIssue[] = []): ExplorerMetadataModel {
  return {
    projectName: "Unknown Project",
    unit: "px",
    disciplineCatalog: [],
    drawings: [],
    issues,
    hasFatalIssues: issues.some((issue) => issue.fatal),
  };
}

function parseProject(raw: unknown, issues: MetadataIssue[]): { name: string; unit: string } {
  const project = asRecord(raw);
  if (!project) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: `${ROOT_PATH}.project`,
      message: "project 객체가 없어 기본값을 사용합니다.",
    });
    return { name: "Unknown Project", unit: "px" };
  }

  return {
    name: readString(project.name) ?? "Unknown Project",
    unit: readString(project.unit) ?? "px",
  };
}

function parseDisciplineCatalog(raw: unknown, issues: MetadataIssue[]): string[] {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw)) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: `${ROOT_PATH}.disciplines`,
      message: "disciplines가 배열이 아닙니다.",
    });
    return [];
  }

  const names = raw
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        pushIssue(issues, {
          code: "SCHEMA_ERROR",
          level: "warning",
          path: `${ROOT_PATH}.disciplines[${index}]`,
          message: "discipline 항목이 객체가 아닙니다.",
        });
        return null;
      }
      return readString(record.name);
    })
    .filter((name): name is string => Boolean(name));

  return Array.from(new Set(names));
}

function parseDrawings(raw: unknown, issues: MetadataIssue[]): NormalizedDrawing[] {
  const drawingsRecord = asRecord(raw);
  if (!drawingsRecord) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "error",
      path: `${ROOT_PATH}.drawings`,
      fatal: true,
      message: "drawings 객체가 없습니다.",
    });
    return [];
  }

  const drawingEntries = Object.entries(drawingsRecord).sort(([left], [right]) =>
    left.localeCompare(right, "ko", { numeric: true }),
  );

  return drawingEntries.flatMap(([drawingKey, drawingValue]) => {
    const path = `${ROOT_PATH}.drawings["${drawingKey}"]`;
    const drawingRecord = asRecord(drawingValue);

    if (!drawingRecord) {
      pushIssue(issues, {
        code: "SCHEMA_ERROR",
        level: "warning",
        path,
        message: "drawing 항목이 객체가 아닙니다.",
      });
      return [];
    }

    const id = readString(drawingRecord.id) ?? drawingKey;
    const name = readString(drawingRecord.name) ?? id;
    const baseImage = normalizeDrawingImageRef(readString(drawingRecord.image));
    const parent = readString(drawingRecord.parent);
    const position = parseDrawingPosition(drawingRecord.position, `${path}.position`, issues);

    if (!baseImage) {
      pushIssue(issues, {
        code: "MISSING_IMAGE",
        level: "error",
        path: `${path}.image`,
        message: "기준 도면 이미지가 없습니다.",
      });
      return [];
    }

    const disciplines = parseDisciplines(
      drawingRecord.disciplines,
      {
        drawingId: id,
        drawingBaseImage: baseImage,
        path: `${path}.disciplines`,
      },
      issues,
    );

    return [
      {
        id,
        name,
        baseImage,
        parent,
        position,
        disciplines,
      },
    ];
  });
}

function parseDisciplines(
  raw: unknown,
  options: { drawingId: string; drawingBaseImage: string; path: string },
  issues: MetadataIssue[],
): NormalizedDiscipline[] {
  if (raw === undefined) {
    return [];
  }

  const disciplineRecord = asRecord(raw);
  if (!disciplineRecord) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: options.path,
      message: "disciplines가 객체가 아닙니다.",
    });
    return [];
  }

  return Object.entries(disciplineRecord).flatMap(([disciplineName, disciplineValue]) => {
    const path = `${options.path}["${disciplineName}"]`;
    const record = asRecord(disciplineValue);
    if (!record) {
      pushIssue(issues, {
        code: "SCHEMA_ERROR",
        level: "warning",
        path,
        message: "discipline 값이 객체가 아닙니다.",
      });
      return [];
    }

    const sourceImage = normalizeDrawingImageRef(readString(record.image));
    const imageTransform = parseImageTransform(record.imageTransform, `${path}.imageTransform`, issues);
    const disciplinePolygon = parsePolygon(record.polygon, `${path}.polygon`, issues);
    const trackKey = buildTrackKey(options.drawingId, disciplineName, null);

    const revisions = parseRevisions(
      record.revisions,
      {
        path: `${path}.revisions`,
        drawingId: options.drawingId,
        drawingBaseImage: options.drawingBaseImage,
        disciplineName,
        disciplineImageTransform: imageTransform ?? undefined,
        disciplinePolygon,
        regionName: null,
        regionPolygon: null,
        trackKey,
      },
      issues,
    );

    const regions = parseRegions(
      record.regions,
      {
        drawingId: options.drawingId,
        drawingBaseImage: options.drawingBaseImage,
        disciplineName,
        disciplineImageTransform: imageTransform ?? undefined,
        disciplinePolygon,
        path: `${path}.regions`,
      },
      issues,
    );

    return [
      {
        name: disciplineName,
        sourceImage: sourceImage ?? null,
        imageTransform: imageTransform ?? undefined,
        polygon: disciplinePolygon,
        revisions,
        regions,
        key: buildDisciplineKey(options.drawingId, disciplineName),
      },
    ];
  });
}

function parseRegions(
  raw: unknown,
  options: {
    drawingId: string;
    drawingBaseImage: string;
    disciplineName: string;
    disciplineImageTransform?: ImageTransform;
    disciplinePolygon: Polygon | null;
    path: string;
  },
  issues: MetadataIssue[],
): NormalizedRegion[] {
  if (raw === undefined) {
    return [];
  }

  const regionsRecord = asRecord(raw);
  if (!regionsRecord) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: options.path,
      message: "regions가 객체가 아닙니다.",
    });
    return [];
  }

  return Object.entries(regionsRecord).flatMap(([regionName, regionValue]) => {
    const path = `${options.path}["${regionName}"]`;
    const record = asRecord(regionValue);
    if (!record) {
      pushIssue(issues, {
        code: "SCHEMA_ERROR",
        level: "warning",
        path,
        message: "region 값이 객체가 아닙니다.",
      });
      return [];
    }

    const regionPolygon = parsePolygon(record.polygon, `${path}.polygon`, issues);
    const trackKey = buildTrackKey(options.drawingId, options.disciplineName, regionName);
    const revisions = parseRevisions(
      record.revisions,
      {
        path: `${path}.revisions`,
        drawingId: options.drawingId,
        drawingBaseImage: options.drawingBaseImage,
        disciplineName: options.disciplineName,
        disciplineImageTransform: options.disciplineImageTransform,
        disciplinePolygon: options.disciplinePolygon,
        regionName,
        regionPolygon,
        trackKey,
      },
      issues,
    );

    return [
      {
        name: regionName,
        polygon: regionPolygon,
        revisions,
        key: buildRegionKey(options.drawingId, options.disciplineName, regionName),
      },
    ];
  });
}

function parseRevisions(raw: unknown, context: RevisionContext, issues: MetadataIssue[]): NormalizedRevision[] {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw)) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: context.path,
      message: "revisions가 배열이 아닙니다.",
    });
    return [];
  }

  const seen = new Set<string>();
  return raw.flatMap((revisionValue, index) => {
    const parsed = parseRevision(revisionValue, index, context, issues);
    if (!parsed) {
      return [];
    }

    if (seen.has(parsed.version.normalized)) {
      pushIssue(issues, {
        code: "REVISION_PARSE_ERROR",
        level: "warning",
        path: `${context.path}[${index}].version`,
        message: `동일 트랙 내 중복 버전: ${parsed.version.normalized}`,
      });
    }
    seen.add(parsed.version.normalized);

    return [parsed];
  });
}

function parseRevision(
  raw: unknown,
  index: number,
  context: RevisionContext,
  issues: MetadataIssue[],
): NormalizedRevision | null {
  const path = `${context.path}[${index}]`;
  const record = asRecord(raw);
  if (!record) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "revision 항목이 객체가 아닙니다.",
    });
    return null;
  }

  const versionRaw = readString(record.version) ?? `INVALID-${index + 1}`;
  const parsedVersion = parseRevisionVersion(versionRaw);
  if (!parsedVersion) {
    pushIssue(issues, {
      code: "REVISION_PARSE_ERROR",
      level: "error",
      path: `${path}.version`,
      message: `버전 파싱 실패: ${versionRaw}`,
    });
  }

  const version =
    parsedVersion ??
    ({
      raw: versionRaw,
      normalized: versionRaw.trim().toUpperCase(),
      numberPart: -1,
      suffix: null,
    } satisfies ParsedRevisionVersion);

  const image = normalizeDrawingImageRef(readString(record.image)) ?? "";
  if (!image) {
    pushIssue(issues, {
      code: "MISSING_IMAGE",
      level: "error",
      path: `${path}.image`,
      message: "revision 이미지가 없습니다.",
    });
  }

  const dateRaw = readString(record.date) ?? "";
  const timestamp = parseDateToTimestamp(dateRaw);
  if (timestamp === null) {
    pushIssue(issues, {
      code: "REVISION_PARSE_ERROR",
      level: "error",
      path: `${path}.date`,
      message: `날짜 파싱 실패: ${dateRaw || "(empty)"}`,
    });
  }

  const description = readString(record.description) ?? "";
  const changes = parseChanges(record.changes, `${path}.changes`, issues);
  const imageTransform = parseImageTransform(record.imageTransform, `${path}.imageTransform`, issues);
  const revisionPolygon = parsePolygon(record.polygon, `${path}.polygon`, issues);
  const polygonResolution = resolvePolygonSource(revisionPolygon, context.regionPolygon, context.disciplinePolygon);

  const effectiveRelativeTo =
    imageTransform?.relativeTo ?? context.disciplineImageTransform?.relativeTo ?? context.drawingBaseImage ?? null;

  if (!effectiveRelativeTo) {
    pushIssue(issues, {
      code: "RELATIVE_TO_MISMATCH",
      level: "warning",
      path,
      message: "relativeTo 기준을 계산할 수 없습니다.",
    });
  }

  return {
    version,
    image,
    dateRaw,
    timestamp: timestamp ?? Number.NEGATIVE_INFINITY,
    description,
    changes,
    imageTransform: imageTransform ?? undefined,
    effectiveRelativeTo,
    polygon: polygonResolution.polygon,
    polygonSource: polygonResolution.source,
    drawingId: context.drawingId,
    disciplineName: context.disciplineName,
    regionName: context.regionName,
    trackKey: context.trackKey,
    key: buildRevisionKey(context.trackKey, version.normalized || "INVALID", index),
  };
}

function parseDrawingPosition(raw: unknown, path: string, issues: MetadataIssue[]): DrawingPosition | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  const record = asRecord(raw);
  if (!record) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "position이 객체가 아닙니다.",
    });
    return null;
  }

  const verticesRaw = record.vertices;
  if (!Array.isArray(verticesRaw)) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: `${path}.vertices`,
      message: "position.vertices가 배열이 아닙니다.",
    });
    return null;
  }

  const vertices = verticesRaw
    .map((vertex, index) => parseVertex(vertex, `${path}.vertices[${index}]`, issues))
    .filter((vertex): vertex is [number, number] => Boolean(vertex));

  if (vertices.length === 0) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "유효한 position.vertices가 없습니다.",
    });
    return null;
  }

  const imageTransform = parseImageTransform(record.imageTransform, `${path}.imageTransform`, issues);

  return {
    vertices,
    imageTransform: imageTransform ?? undefined,
  };
}

function resolvePolygonSource(
  revisionPolygon: Polygon | null,
  regionPolygon: Polygon | null,
  disciplinePolygon: Polygon | null,
): { source: PolygonSource; polygon: Polygon | null } {
  if (revisionPolygon) {
    return { source: "revision", polygon: revisionPolygon };
  }
  if (regionPolygon) {
    return { source: "region", polygon: regionPolygon };
  }
  if (disciplinePolygon) {
    return { source: "discipline", polygon: disciplinePolygon };
  }
  return { source: "none", polygon: null };
}

function parseChanges(raw: unknown, path: string, issues: MetadataIssue[]): string[] {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw)) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "changes가 배열이 아닙니다.",
    });
    return [];
  }

  return raw
    .map((item, index) => {
      const change = readString(item);
      if (!change) {
        pushIssue(issues, {
          code: "SCHEMA_ERROR",
          level: "warning",
          path: `${path}[${index}]`,
          message: "변경 내역 항목이 문자열이 아닙니다.",
        });
        return null;
      }
      return change;
    })
    .filter((item): item is string => Boolean(item));
}

function parseImageTransform(raw: unknown, path: string, issues: MetadataIssue[]): ImageTransform | null {
  if (raw === undefined) {
    return null;
  }

  const record = asRecord(raw);
  if (!record) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "imageTransform이 객체가 아닙니다.",
    });
    return null;
  }

  const x = readNumber(record.x);
  const y = readNumber(record.y);
  const scale = readNumber(record.scale);
  const rotation = readNumber(record.rotation);

  if (x === null || y === null || scale === null || rotation === null) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "imageTransform 필드(x, y, scale, rotation)가 유효한 숫자가 아닙니다.",
    });
    return null;
  }

  const relativeTo = normalizeDrawingImageRef(readString(record.relativeTo)) ?? undefined;
  return { x, y, scale, rotation, relativeTo };
}

function parsePolygon(raw: unknown, path: string, issues: MetadataIssue[]): Polygon | null {
  if (raw === undefined) {
    return null;
  }

  const record = asRecord(raw);
  if (!record) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "polygon이 객체가 아닙니다.",
    });
    return null;
  }

  const verticesRaw = record.vertices;
  if (!Array.isArray(verticesRaw)) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path: `${path}.vertices`,
      message: "vertices가 배열이 아닙니다.",
    });
    return null;
  }

  const vertices = verticesRaw
    .map((vertex, index) => parseVertex(vertex, `${path}.vertices[${index}]`, issues))
    .filter((vertex): vertex is [number, number] => Boolean(vertex));

  if (vertices.length === 0) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "유효한 polygon vertices가 없습니다.",
    });
    return null;
  }

  const polygonTransform = parseImageTransform(record.polygonTransform, `${path}.polygonTransform`, issues);
  return {
    vertices,
    polygonTransform: polygonTransform ?? undefined,
  };
}

function parseVertex(raw: unknown, path: string, issues: MetadataIssue[]): [number, number] | null {
  if (!Array.isArray(raw) || raw.length !== 2) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "vertex는 [x, y] 배열이어야 합니다.",
    });
    return null;
  }

  const x = readNumber(raw[0]);
  const y = readNumber(raw[1]);
  if (x === null || y === null) {
    pushIssue(issues, {
      code: "SCHEMA_ERROR",
      level: "warning",
      path,
      message: "vertex 좌표가 숫자가 아닙니다.",
    });
    return null;
  }

  return [x, y];
}

function pushIssue(issues: MetadataIssue[], issue: MetadataIssue): void {
  issues.push(issue);
}
