import type { ParsedRevisionVersion } from "../types";

const REVISION_REGEX = /^(?:REV[\s_-]?)?(\d+)([A-Z])?$/i;

type RecordValue = Record<string, unknown>;

/**
 * unknown 값을 객체 레코드로 안전 변환한다.
 */
export function asRecord(value: unknown): RecordValue | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as RecordValue;
}

/**
 * 문자열 값을 trim 후 반환한다. 비어 있으면 null.
 */
export function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * 유한 숫자만 허용한다.
 */
export function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

/**
 * 날짜 문자열을 timestamp(ms)로 변환한다.
 */
export function parseDateToTimestamp(raw: string): number | null {
  if (!raw.trim()) {
    return null;
  }

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * REV 버전 문자열을 정규화한다.
 * 예: `REV-1A` -> `REV1A`
 */
export function parseRevisionVersion(raw: string): ParsedRevisionVersion | null {
  const trimmed = raw.trim();
  const matched = trimmed.match(REVISION_REGEX);
  if (!matched) {
    return null;
  }

  const numberPart = Number(matched[1]);
  const suffix = matched[2] ? matched[2].toUpperCase() : null;

  return {
    raw,
    numberPart,
    suffix,
    normalized: `REV${numberPart}${suffix ?? ""}`,
  };
}

/**
 * drawing 파일명을 정적 경로로 변환한다.
 */
export function toDrawingImageSrc(imageFile: string): string {
  return `/drawings/${encodeURIComponent(imageFile)}`;
}

/**
 * drawing 이미지 참조값을 canonical 경로(`/drawings/<encoded-file>`)로 정규화한다.
 * - 파일명만 들어와도 정규화
 * - `/drawings/...`, `drawings/...`, `./drawings/...` 형태도 동일 포맷으로 정리
 * - 외부 URL(http/https/data/blob)은 그대로 반환
 * - 유니코드 정규화는 NFC 기준으로 통일한다.
 */
export function normalizeDrawingImageRef(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  const withoutQuery = trimmed.split(/[?#]/)[0] ?? trimmed;
  const normalizedSlashes = withoutQuery.replace(/\\/g, "/");

  let fileName = normalizedSlashes;
  if (normalizedSlashes.startsWith("/drawings/")) {
    fileName = normalizedSlashes.slice("/drawings/".length);
  } else if (normalizedSlashes.startsWith("drawings/")) {
    fileName = normalizedSlashes.slice("drawings/".length);
  } else if (normalizedSlashes.startsWith("./drawings/")) {
    fileName = normalizedSlashes.slice("./drawings/".length);
  }

  // 이미 인코딩된 값/미인코딩 값을 동일 규칙으로 통일.
  try {
    const decoded = decodeURIComponent(fileName);
    return toDrawingImageSrc(decoded.normalize("NFC"));
  } catch {
    return toDrawingImageSrc(fileName.normalize("NFC"));
  }
}

/**
 * 사용자 요청에 맞춘 별칭(오탈자 포함) 유지.
 * normalizeDrawingImageRef와 동일한 함수다.
 */
export const nomarlizerDrawingImagRef = normalizeDrawingImageRef;

/**
 * 이미지 경로 후보 목록을 생성한다.
 * - 1순위: NFC
 * - 2순위: NFD
 * - 3순위: 원본
 * 유니코드 정규화 차이로 인한 파일 매칭 실패를 완화한다.
 */
export function getDrawingImageSrcCandidates(raw: string | null | undefined): string[] {
  const normalized = normalizeDrawingImageRef(raw);
  if (!normalized) {
    return [];
  }

  if (!normalized.startsWith("/drawings/")) {
    return [normalized];
  }

  const encodedFile = normalized.slice("/drawings/".length);
  let decodedFile = encodedFile;
  try {
    decodedFile = decodeURIComponent(encodedFile);
  } catch {
    decodedFile = encodedFile;
  }

  const candidates = [
    toDrawingImageSrc(decodedFile.normalize("NFC")),
    toDrawingImageSrc(decodedFile.normalize("NFD")),
    toDrawingImageSrc(decodedFile),
  ];

  return Array.from(new Set(candidates));
}
