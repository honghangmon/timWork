import type { MetadataLoadResult } from "../types";

/**
 * 메타데이터 원본 JSON 로더(fetch).
 */
export async function loadRawMetadata(url = "/data/metadata.json"): Promise<MetadataLoadResult> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        issue: {
          code: "LOAD_ERROR",
          level: "error",
          path: url,
          fatal: true,
          message: `메타데이터 로드 실패: HTTP ${response.status}`,
        },
      };
    }

    const raw: unknown = await response.json();
    return { ok: true, raw };
  } catch (error) {
    return {
      ok: false,
      issue: {
        code: "LOAD_ERROR",
        level: "error",
        path: url,
        fatal: true,
        message: `메타데이터 로드 실패: ${error instanceof Error ? error.message : "unknown error"}`,
      },
    };
  }
}
