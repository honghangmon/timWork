import type { ExplorerMetadataModel } from "../../../core";
import type { ImageSize } from "./render-model";

export type ImageSizeMap = Record<string, ImageSize>;

export type ImageSizePreloadResult = {
  sizeBySrc: ImageSizeMap;
  failedSources: string[];
};

export function collectImageSources(model: ExplorerMetadataModel): string[] {
  const sources = new Set<string>();

  for (const drawing of model.drawings) {
    if (drawing.baseImage) {
      sources.add(drawing.baseImage);
    }

    for (const discipline of drawing.disciplines) {
      if (discipline.sourceImage) {
        sources.add(discipline.sourceImage);
      }

      for (const revision of discipline.revisions) {
        if (revision.image) {
          sources.add(revision.image);
        }
      }

      for (const region of discipline.regions) {
        for (const revision of region.revisions) {
          if (revision.image) {
            sources.add(revision.image);
          }
        }
      }
    }
  }

  return [...sources];
}

export async function preloadImageSizes(sources: string[]): Promise<ImageSizePreloadResult> {
  const uniqueSources = [...new Set(sources)];
  const settled = await Promise.allSettled(
    uniqueSources.map(async (source) => {
      const size = await loadImageSize(source);
      return [source, size] as const;
    }),
  );

  const sizeBySrc: ImageSizeMap = {};
  const failedSources: string[] = [];

  for (const row of settled) {
    if (row.status === "fulfilled") {
      const [source, size] = row.value;
      sizeBySrc[source] = size;
      continue;
    }

    const source = getSourceFromErrorMessage(row.reason);
    failedSources.push(source ?? "unknown");
  }

  return {
    sizeBySrc,
    failedSources,
  };
}

function loadImageSize(source: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error(`image-size-load-failed:${source}`));
    };

    image.src = source;
  });
}

function getSourceFromErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const prefix = "image-size-load-failed:";
  if (!error.message.startsWith(prefix)) {
    return null;
  }

  return error.message.slice(prefix.length) || null;
}
