import type { MetadataParseResult } from "../types";
import { buildExplorerIndexes } from "./indexer";
import { loadRawMetadata } from "./loader";
import { createEmptyExplorerModel, parseExplorerMetadataModel } from "./parser";

/**
 * 파이프라인 진입점.
 * load -> parse(normalize) -> index 순으로 실행한다.
 */
export async function loadAndParseMetadata(url = "/data/metadata.json"): Promise<MetadataParseResult> {
  const loaded = await loadRawMetadata(url);
  if (!loaded.ok) {
    const model = createEmptyExplorerModel([loaded.issue]);
    return { model, indexes: buildExplorerIndexes(model) };
  }

  return parseExplorerMetadata(loaded.raw);
}

/**
 * 이미 메모리에 올라온 raw 데이터를 파싱/정규화하고 인덱스를 만든다.
 */
export function parseExplorerMetadata(raw: unknown): MetadataParseResult {
  const model = parseExplorerMetadataModel(raw);
  const indexes = buildExplorerIndexes(model);
  return { model, indexes };
}

export * from "./indexer";
export * from "./keys";
export * from "./loader";
export * from "./parser";
export * from "./selectors";
export * from "./validators";
