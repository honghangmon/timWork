import type { ImageTransform } from "../../../core";
import type { ImageTreeNode } from "../right-panel/types";

const IDENTITY_TRANSFORM = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

export type ImageSize = {
  width: number;
  height: number;
};

export type OverlayLayer = {
  nodeKey: string;
  label: string;
  image: string;
  opacity: number;
  transform: ImageTransform | null;
  rawTransform: ImageTransform | null;
  fallbackTransform: ImageTransform | null;
  reference: string | null;
  trackKey: string | null;
};

export type ActiveOverlayContext = {
  image: string;
  reference: string | null;
  transform: ImageTransform | null;
  anchorReference: string | null;
};

export type ViewerIssue = {
  nodeKey: string;
  message: string;
};

export type ViewerRenderModel = {
  baseImage: string | null;
  baseLabel: string | null;
  activeOverlayContext: ActiveOverlayContext | null;
  overlayLayers: OverlayLayer[];
  issues: ViewerIssue[];
};

export type Matrix2D = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

export type ContainRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
};

export type ResolveOverlayPlacementResult = {
  canRender: boolean;
  style: {
    containRect: ContainRect;
    overlayWidth: number;
    overlayHeight: number;
    matrix: Matrix2D;
  } | null;
  issue: string | null;
};

type BuildViewerRenderModelParams = {
  activeNode: ImageTreeNode | null;
  overlayNodes: ImageTreeNode[];
  anchorReference: string | null;
  overlayOpacity: number;
};

type NormalizedTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export function buildViewerRenderModel({
  activeNode,
  overlayNodes,
  anchorReference,
  overlayOpacity,
}: BuildViewerRenderModelParams): ViewerRenderModel {
  if (!activeNode) {
    return {
      baseImage: null,
      baseLabel: null,
      activeOverlayContext: null,
      overlayLayers: [],
      issues: [],
    };
  }

  const issues: ViewerIssue[] = [];
  const overlayLayers: OverlayLayer[] = [];

  for (const overlayNode of overlayNodes) {
    if (!anchorReference) {
      issues.push({
        nodeKey: overlayNode.nodeKey,
        message: "Overlay 기준 reference를 계산할 수 없습니다.",
      });
      continue;
    }

    if (!overlayNode.reference || overlayNode.reference !== anchorReference) {
      issues.push({
        nodeKey: overlayNode.nodeKey,
        message: `${overlayNode.label}: relativeTo가 기준 이미지와 일치하지 않아 제외되었습니다.`,
      });
      continue;
    }

    overlayLayers.push({
      nodeKey: overlayNode.nodeKey,
      label: overlayNode.label,
      image: overlayNode.image,
      opacity: overlayOpacity,
      transform: overlayNode.transform,
      rawTransform: overlayNode.rawTransform,
      fallbackTransform: overlayNode.fallbackTransform,
      reference: overlayNode.reference,
      trackKey: overlayNode.trackKey,
    });
  }

  return {
    baseImage: activeNode.image,
    baseLabel: activeNode.label,
    activeOverlayContext: {
      image: activeNode.image,
      reference: activeNode.reference,
      transform: activeNode.transform,
      anchorReference,
    },
    overlayLayers,
    issues,
  };
}

export function resolveOverlayPlacement(params: {
  canvasSize: ImageSize;
  activeImageSize: ImageSize;
  overlayImageSize: ImageSize;
  activeContext: ActiveOverlayContext;
  overlayLayer: OverlayLayer;
}): ResolveOverlayPlacementResult {
  const { canvasSize, activeImageSize, overlayImageSize, activeContext, overlayLayer } = params;

  const anchorReference = activeContext.anchorReference;
  if (!anchorReference) {
    return {
      canRender: false,
      style: null,
      issue: "Overlay 기준 reference를 계산할 수 없습니다.",
    };
  }

  if (!overlayLayer.reference || overlayLayer.reference !== anchorReference) {
    return {
      canRender: false,
      style: null,
      issue: `${overlayLayer.label}: relativeTo가 기준 이미지와 일치하지 않아 제외되었습니다.`,
    };
  }

  const activeToAnchor = resolveActiveToAnchorMatrix(activeContext, activeImageSize);
  if (!activeToAnchor) {
    return {
      canRender: false,
      style: null,
      issue: "활성 이미지의 anchor 기준 transform을 계산할 수 없습니다.",
    };
  }

  const resolvedOverlayTransform = resolveOverlayTransformForPlacement(overlayLayer, activeContext, activeImageSize, overlayImageSize);
  const overlayToAnchor = buildImageToReferenceMatrix(overlayImageSize, resolvedOverlayTransform);
  const inverseActive = invertMatrix(activeToAnchor);
  if (!inverseActive) {
    return {
      canRender: false,
      style: null,
      issue: "활성 이미지 matrix를 역변환할 수 없습니다.",
    };
  }

  const overlayInActive = multiplyMatrices(inverseActive, overlayToAnchor);
  const containRect = resolveContainRect(canvasSize, activeImageSize);

  return {
    canRender: true,
    style: {
      containRect,
      overlayWidth: overlayImageSize.width,
      overlayHeight: overlayImageSize.height,
      matrix: overlayInActive,
    },
    issue: null,
  };
}

export function resolveContainRect(canvasSize: ImageSize, imageSize: ImageSize): ContainRect {
  if (canvasSize.width <= 0 || canvasSize.height <= 0 || imageSize.width <= 0 || imageSize.height <= 0) {
    return { left: 0, top: 0, width: 0, height: 0, scale: 1 };
  }

  const scale = Math.min(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  const left = (canvasSize.width - width) / 2;
  const top = (canvasSize.height - height) / 2;

  return {
    left,
    top,
    width,
    height,
    scale,
  };
}

function resolveActiveToAnchorMatrix(activeContext: ActiveOverlayContext, activeImageSize: ImageSize): Matrix2D | null {
  if (!activeContext.anchorReference) {
    return null;
  }

  if (activeContext.image === activeContext.anchorReference) {
    return createIdentityMatrix();
  }

  if (activeContext.reference !== activeContext.anchorReference) {
    return null;
  }

  return buildImageToReferenceMatrix(activeImageSize, activeContext.transform);
}

function resolveOverlayTransformForPlacement(
  overlayLayer: OverlayLayer,
  activeContext: ActiveOverlayContext,
  activeImageSize: ImageSize,
  overlayImageSize: ImageSize,
): ImageTransform | null {
  const primaryTransform = overlayLayer.rawTransform ?? overlayLayer.transform;
  const normalized = normalizeTransform(primaryTransform, overlayImageSize);
  const fallbackNormalized = overlayLayer.fallbackTransform
    ? normalizeTransform(overlayLayer.fallbackTransform, activeImageSize)
    : null;

  const anchorReference = activeContext.anchorReference;
  if (!anchorReference) {
    return primaryTransform;
  }

  // Defensive normalization:
  // Some region revisions are exported at quarter resolution but keep scale=1.
  // If the overlay looks like a centered full-sheet candidate, up-scale by
  // active/overlay resolution ratio so it aligns with sibling revisions.
  if (activeContext.image !== anchorReference) {
    return primaryTransform;
  }

  const hasNearIdentityScale = normalized.scale >= 0.85 && normalized.scale <= 1.15;
  if (normalized.scale < 0.85 || normalized.scale > 1.15) {
    return primaryTransform;
  }

  const widthRatio = safeRatio(activeImageSize.width, overlayImageSize.width);
  const heightRatio = safeRatio(activeImageSize.height, overlayImageSize.height);
  const isLowResOverlay = widthRatio > 2.5 && heightRatio > 2.5;
  if (!isLowResOverlay) {
    return primaryTransform;
  }

  const isNearCenter =
    Math.abs(normalized.x - activeImageSize.width / 2) <= activeImageSize.width * 0.12 &&
    Math.abs(normalized.y - activeImageSize.height / 2) <= activeImageSize.height * 0.12;
  if (!isNearCenter) {
    return primaryTransform;
  }

  const isNearZeroRotation = Math.abs(normalized.rotation) <= 0.05;
  const autoScale = isNearZeroRotation && hasNearIdentityScale ? (widthRatio + heightRatio) / 2 : 1;

  let resolvedX = normalized.x;
  let resolvedY = normalized.y;
  let resolvedRotation = normalized.rotation;

  const useFallbackGeometry =
    Boolean(overlayLayer.rawTransform) &&
    Boolean(fallbackNormalized) &&
    isNearCenter &&
    isNearZeroRotation &&
    isFallbackGeometryMeaningful(normalized, fallbackNormalized as NormalizedTransform, activeImageSize);

  if (useFallbackGeometry && fallbackNormalized) {
    resolvedX = fallbackNormalized.x;
    resolvedY = fallbackNormalized.y;
    resolvedRotation = fallbackNormalized.rotation;
  }

  return {
    x: resolvedX,
    y: resolvedY,
    scale: normalized.scale * autoScale,
    rotation: resolvedRotation,
    relativeTo: overlayLayer.transform?.relativeTo ?? overlayLayer.rawTransform?.relativeTo ?? overlayLayer.fallbackTransform?.relativeTo,
  };
}

function isFallbackGeometryMeaningful(
  primary: NormalizedTransform,
  fallback: NormalizedTransform,
  activeImageSize: ImageSize,
): boolean {
  const rotationDiff = Math.abs(primary.rotation - fallback.rotation);
  const centerDeltaX = Math.abs(primary.x - fallback.x);
  const centerDeltaY = Math.abs(primary.y - fallback.y);
  const distanceThreshold = Math.min(activeImageSize.width, activeImageSize.height) * 0.08;

  return rotationDiff > 0.2 || centerDeltaX > distanceThreshold || centerDeltaY > distanceThreshold;
}

function buildImageToReferenceMatrix(imageSize: ImageSize, transform: ImageTransform | null): Matrix2D {
  const normalized = normalizeTransform(transform, imageSize);

  const toCenter = createTranslationMatrix(normalized.x, normalized.y);
  const rotation = createRotationMatrix(normalized.rotation);
  const scaling = createScaleMatrix(normalized.scale);
  const fromImageCenter = createTranslationMatrix(-imageSize.width / 2, -imageSize.height / 2);

  return multiplyMatrices(multiplyMatrices(multiplyMatrices(toCenter, rotation), scaling), fromImageCenter);
}

function normalizeTransform(transform: ImageTransform | null | undefined, imageSize: ImageSize): NormalizedTransform {
  const x = toFiniteNumber(transform?.x, imageSize.width / 2);
  const y = toFiniteNumber(transform?.y, imageSize.height / 2);
  const scale = toFiniteNumber(transform?.scale, IDENTITY_TRANSFORM.scale);
  const rotation = toFiniteNumber(transform?.rotation, IDENTITY_TRANSFORM.rotation);

  return {
    x,
    y,
    scale: scale === 0 ? 1 : scale,
    rotation,
  };
}

function toFiniteNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeRatio(numerator: number, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator === 0) {
    return numerator;
  }

  return numerator / denominator;
}

function createIdentityMatrix(): Matrix2D {
  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
  };
}

function createTranslationMatrix(tx: number, ty: number): Matrix2D {
  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: tx,
    f: ty,
  };
}

function createScaleMatrix(scale: number): Matrix2D {
  return {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: 0,
    f: 0,
  };
}

function createRotationMatrix(rotationRad: number): Matrix2D {
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  return {
    a: cos,
    b: sin,
    c: -sin,
    d: cos,
    e: 0,
    f: 0,
  };
}

function multiplyMatrices(left: Matrix2D, right: Matrix2D): Matrix2D {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function invertMatrix(matrix: Matrix2D): Matrix2D | null {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) {
    return null;
  }

  const invDet = 1 / determinant;

  return {
    a: matrix.d * invDet,
    b: -matrix.b * invDet,
    c: -matrix.c * invDet,
    d: matrix.a * invDet,
    e: (matrix.c * matrix.f - matrix.d * matrix.e) * invDet,
    f: (matrix.b * matrix.e - matrix.a * matrix.f) * invDet,
  };
}
