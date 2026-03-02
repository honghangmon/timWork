import { useCallback, useEffect, useMemo, useState } from "react";
import { isRevisionSelectable, loadAndParseMetadata } from "../../../core";
import type { ExplorerMetadataIndexes, ExplorerMetadataModel, NormalizedRevision } from "../../../core";
import { ComparePage } from "../components/compare/ComparePage";
import { ExplorerTopLeftControls } from "../components/controls/ExplorerTopLeftControls";
import { ExplorerBody } from "../components/layout/ExplorerBody";
import { ExplorerHeader } from "../components/layout/ExplorerHeader";
import { RightPanel } from "../components/right-panel/RightPanel";
import { ViewerStage } from "../components/viewer/ViewerStage";
import {
  getOverlayAnchorReferenceFromNode,
  isOverlayCandidateNode,
  isRenderableImageNode,
} from "../right-panel/guards";
import { buildRightPanelTreeModel } from "../right-panel/tree-builder";
import type { CompareRequest, ImageTreeNode } from "../right-panel/types";
import { buildViewerRenderModel } from "../viewer/render-model";
import { collectImageSources, preloadImageSizes } from "../viewer/image-size";
import type { ImageSizeMap } from "../viewer/image-size";
import { getHomePolygonTargets } from "../viewer/home-polygon";
import "./DrawingExplorerPage.css";

type DrawingExplorerPageProps = {
  project: {
    id: string;
    title: string;
    metadataUrl?: string;
    initialDrawingId?: string;
  };
};

type MetadataStatus = "idle" | "loading" | "ready" | "error";

type SelectionState = {
  drawingId: string | null;
};

type CompareState = {
  trackKey: string;
  leftRevisionKey: string;
  rightRevisionKey: string;
};

type CompareRevisionOption = {
  key: string;
  label: string;
  image: string;
};

type RevisionChangePanelModel = {
  revisionLabel: string | null;
  items: string[];
  emptyMessage: string;
  modeNotice: string | null;
};

const DEFAULT_OVERLAY_OPACITY = 0.6;

export default function DrawingExplorerPage({ project }: DrawingExplorerPageProps) {
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>("idle");
  const [model, setModel] = useState<ExplorerMetadataModel | null>(null);
  const [indexes, setIndexes] = useState<ExplorerMetadataIndexes | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDrawingToggleOpen, setIsDrawingToggleOpen] = useState(false);
  const [selection, setSelection] = useState<SelectionState>({
    drawingId: null,
  });

  const [activeImageNodeKey, setActiveImageNodeKey] = useState<string | null>(null);
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [overlayAnchorNodeKey, setOverlayAnchorNodeKey] = useState<string | null>(null);
  const [overlayAnchorReference, setOverlayAnchorReference] = useState<string | null>(null);
  const [overlayCheckedNodeKeys, setOverlayCheckedNodeKeys] = useState<string[]>([]);
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
  const [compareState, setCompareState] = useState<CompareState | null>(null);
  const [imageSizeBySrc, setImageSizeBySrc] = useState<ImageSizeMap>({});
  const [imageSizeWarning, setImageSizeWarning] = useState<string | null>(null);

  const bootstrapSelection = useCallback(
    (loadedModel: ExplorerMetadataModel) => {
      const initialDrawing = project.initialDrawingId
        ? loadedModel.drawings.find((drawing) => drawing.id === project.initialDrawingId)
        : null;
      const homeDrawing = loadedModel.drawings.find((drawing) => drawing.id === "00");
      const defaultDrawing = initialDrawing ?? homeDrawing ?? loadedModel.drawings[0] ?? null;

      setSelection({
        drawingId: defaultDrawing?.id ?? null,
      });
    },
    [project.initialDrawingId],
  );

  const loadMetadata = useCallback(async () => {
    setMetadataStatus("loading");
    setIndexes(null);
    setErrorMessage(null);
    setImageSizeBySrc({});
    setImageSizeWarning(null);
    setCompareState(null);

    try {
      const parsed = await loadAndParseMetadata(project.metadataUrl ?? "/data/metadata.json");
      setModel(parsed.model);
      setIndexes(parsed.indexes);
      bootstrapSelection(parsed.model);

      if (parsed.model.hasFatalIssues) {
        setMetadataStatus("error");
        const fatalIssue = parsed.model.issues.find((issue) => issue.fatal || issue.level === "error");
        setErrorMessage(fatalIssue?.message ?? "메타데이터를 불러오지 못했습니다.");
        return;
      }

      const imageSources = collectImageSources(parsed.model);
      const imageSizePreload = await preloadImageSizes(imageSources);
      setImageSizeBySrc(imageSizePreload.sizeBySrc);

      if (imageSizePreload.failedSources.length > 0) {
        setImageSizeWarning(
          `${imageSizePreload.failedSources.length}개 이미지의 해상도를 불러오지 못했습니다. 일부 Overlay 정합이 제한될 수 있습니다.`,
        );
      }

      setMetadataStatus("ready");
    } catch (error) {
      setMetadataStatus("error");
      setIndexes(null);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    }
  }, [bootstrapSelection, project.metadataUrl]);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const activeDrawing = useMemo(() => {
    if (!model || !selection.drawingId) {
      return null;
    }

    return model.drawings.find((drawing) => drawing.id === selection.drawingId) ?? null;
  }, [model, selection.drawingId]);

  const treeModel = useMemo(() => {
    if (!activeDrawing) {
      return {
        nodes: [],
        defaultActiveImageNodeKey: null,
      };
    }

    return buildRightPanelTreeModel(activeDrawing);
  }, [activeDrawing]);

  const imageNodesByKey = useMemo(() => {
    return new Map(treeModel.nodes.filter(isRenderableImageNode).map((node) => [node.nodeKey, node]));
  }, [treeModel.nodes]);

  const resolvedActiveNode = useMemo(() => {
    if (!activeImageNodeKey) {
      return null;
    }

    return imageNodesByKey.get(activeImageNodeKey) ?? null;
  }, [activeImageNodeKey, imageNodesByKey]);

  const resolvedOverlayAnchorNode = useMemo(() => {
    if (!overlayAnchorNodeKey) {
      return null;
    }

    return imageNodesByKey.get(overlayAnchorNodeKey) ?? null;
  }, [imageNodesByKey, overlayAnchorNodeKey]);

  useEffect(() => {
    setActiveImageNodeKey(treeModel.defaultActiveImageNodeKey);
    setIsOverlayMode(false);
    setOverlayAnchorNodeKey(null);
    setOverlayAnchorReference(null);
    setOverlayCheckedNodeKeys([]);
    setOverlayOpacity(DEFAULT_OVERLAY_OPACITY);
    setCompareNotice(null);
    setCompareState(null);
  }, [selection.drawingId, treeModel.defaultActiveImageNodeKey]);

  const homeDrawingId = useMemo(() => {
    if (!model) {
      return null;
    }

    return model.drawings.find((drawing) => drawing.id === "00")?.id ?? null;
  }, [model]);

  const toggleDrawingOptions = useMemo(() => {
    if (!model) {
      return [];
    }

    return model.drawings
      .filter((drawing) => drawing.id !== "00")
      .map((drawing) => ({ id: drawing.id, name: drawing.name }));
  }, [model]);

  const homePolygonTargets = useMemo(() => {
    if (!model) {
      return [];
    }

    return getHomePolygonTargets(model.drawings, "00");
  }, [model]);

  const isHomeDrawing = activeDrawing?.id === "00";

  const handleSelectDrawing = useCallback((drawingId: string) => {
    setSelection({
      drawingId,
    });
    setIsDrawingToggleOpen(false);
  }, []);

  const handleGoHomeDrawing = useCallback(() => {
    if (!homeDrawingId) {
      return;
    }

    handleSelectDrawing(homeDrawingId);
  }, [handleSelectDrawing, homeDrawingId]);

  const handleSelectHomePolygon = useCallback(
    (drawingId: string) => {
      if (!model || drawingId === "00") {
        return;
      }

      const target = model.drawings.find((drawing) => drawing.id === drawingId);
      if (!target) {
        return;
      }

      handleSelectDrawing(target.id);
    },
    [handleSelectDrawing, model],
  );

  const handleSelectImageNode = useCallback(
    (nodeKey: string) => {
      if (isOverlayMode) {
        return;
      }

      if (!imageNodesByKey.has(nodeKey)) {
        return;
      }

      setActiveImageNodeKey(nodeKey);
      setCompareNotice(null);
    },
    [imageNodesByKey, isOverlayMode],
  );

  const handleToggleOverlayMode = useCallback(() => {
    if (isOverlayMode) {
      setIsOverlayMode(false);
      if (overlayAnchorNodeKey) {
        setActiveImageNodeKey(overlayAnchorNodeKey);
      }
      setOverlayAnchorNodeKey(null);
      setOverlayAnchorReference(null);
      setOverlayCheckedNodeKeys([]);
      setOverlayOpacity(DEFAULT_OVERLAY_OPACITY);
      return;
    }

    if (!resolvedActiveNode) {
      return;
    }

    setIsOverlayMode(true);
    setOverlayAnchorNodeKey(resolvedActiveNode.nodeKey);
    setOverlayAnchorReference(getOverlayAnchorReferenceFromNode(resolvedActiveNode));
    setOverlayCheckedNodeKeys([]);
    setOverlayOpacity(DEFAULT_OVERLAY_OPACITY);
    setCompareNotice(null);
  }, [isOverlayMode, overlayAnchorNodeKey, resolvedActiveNode]);

  const isOverlayCheckboxVisible = useCallback(
    (node: ImageTreeNode): boolean => {
      if (!isOverlayMode) {
        return false;
      }

      if (node.nodeKey === overlayAnchorNodeKey) {
        return false;
      }

      return isOverlayCandidateNode(node, overlayAnchorReference);
    },
    [isOverlayMode, overlayAnchorNodeKey, overlayAnchorReference],
  );

  const handleToggleOverlayCheck = useCallback(
    (nodeKey: string) => {
      if (!isOverlayMode) {
        return;
      }

      const node = imageNodesByKey.get(nodeKey);
      if (!node || !isOverlayCheckboxVisible(node)) {
        return;
      }

      setOverlayCheckedNodeKeys((previous) => {
        if (previous.includes(nodeKey)) {
          return previous.filter((key) => key !== nodeKey);
        }

        return [...previous, nodeKey];
      });
    },
    [imageNodesByKey, isOverlayCheckboxVisible, isOverlayMode],
  );

  const handleChangeOverlayOpacity = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0.1, value));
    setOverlayOpacity(clamped);
  }, []);

  const handleRequestCompare = useCallback((request: CompareRequest) => {
    if (!indexes) {
      return;
    }

    const selectableRevisions = getSelectableRevisionsForTrack(indexes, request.trackKey);
    const revisionKeys = selectableRevisions.map((revision) => revision.key);
    const resolvedKeys = resolveCompareRevisionKeys(request.leftRevisionKey, request.rightRevisionKey, revisionKeys);

    if (!resolvedKeys) {
      setCompareNotice(
        `비교 가능한 revision이 충분하지 않습니다. (${request.leftLabel} → ${request.rightLabel}, track: ${request.trackKey})`,
      );
      return;
    }

    setCompareNotice(null);
    setCompareState({
      trackKey: request.trackKey,
      leftRevisionKey: resolvedKeys.leftRevisionKey,
      rightRevisionKey: resolvedKeys.rightRevisionKey,
    });
  }, [indexes]);

  const compareRevisionOptions = useMemo<CompareRevisionOption[]>(() => {
    if (!compareState || !indexes) {
      return [];
    }

    return getSelectableRevisionsForTrack(indexes, compareState.trackKey).map((revision) => ({
      key: revision.key,
      label: revision.version.normalized || revision.version.raw || "REV",
      image: revision.image,
    }));
  }, [compareState, indexes]);

  const compareRevisionKeys = useMemo(() => {
    return compareRevisionOptions.map((revision) => revision.key);
  }, [compareRevisionOptions]);

  const compareResolvedKeys = useMemo(() => {
    if (!compareState) {
      return null;
    }

    return resolveCompareRevisionKeys(compareState.leftRevisionKey, compareState.rightRevisionKey, compareRevisionKeys);
  }, [compareRevisionKeys, compareState]);

  const compareTrackLabel = useMemo(() => {
    if (!compareState) {
      return "";
    }

    return buildCompareTrackLabel(compareState.trackKey);
  }, [compareState]);

  const handleCloseCompare = useCallback(() => {
    setCompareState(null);
  }, []);

  const handleChangeCompareLeftRevisionKey = useCallback(
    (revisionKey: string) => {
      setCompareState((previous) => {
        if (!previous) {
          return previous;
        }

        const resolvedKeys = resolveCompareRevisionKeys(revisionKey, previous.rightRevisionKey, compareRevisionKeys);
        if (!resolvedKeys) {
          return previous;
        }

        return {
          ...previous,
          ...resolvedKeys,
        };
      });
    },
    [compareRevisionKeys],
  );

  const handleChangeCompareRightRevisionKey = useCallback(
    (revisionKey: string) => {
      setCompareState((previous) => {
        if (!previous) {
          return previous;
        }

        const resolvedKeys = resolveCompareRevisionKeys(previous.leftRevisionKey, revisionKey, compareRevisionKeys);
        if (!resolvedKeys) {
          return previous;
        }

        return {
          ...previous,
          ...resolvedKeys,
        };
      });
    },
    [compareRevisionKeys],
  );

  const checkedOverlayNodes = useMemo(() => {
    if (!isOverlayMode) {
      return [];
    }

    return overlayCheckedNodeKeys
      .map((nodeKey) => imageNodesByKey.get(nodeKey))
      .filter((node): node is ImageTreeNode => Boolean(node));
  }, [imageNodesByKey, isOverlayMode, overlayCheckedNodeKeys]);

  const viewerRenderModel = useMemo(() => {
    return buildViewerRenderModel({
      activeNode: resolvedActiveNode,
      overlayNodes: checkedOverlayNodes,
      anchorReference: overlayAnchorReference,
      overlayOpacity,
    });
  }, [checkedOverlayNodes, overlayAnchorReference, overlayOpacity, resolvedActiveNode]);

  const breadcrumb = useMemo(() => {
    const projectLabel = project.title || model?.projectName || "프로젝트 도면";
    const segments = [projectLabel, activeDrawing?.name ?? null, viewerRenderModel.baseLabel].filter(Boolean) as string[];
    return segments.join(" > ");
  }, [activeDrawing?.name, model?.projectName, project.title, viewerRenderModel.baseLabel]);

  const revisionChangePanelModel = useMemo<RevisionChangePanelModel>(() => {
    return buildRevisionChangePanelModel({
      activeNode: resolvedActiveNode,
      anchorNode: resolvedOverlayAnchorNode,
      isOverlayMode,
    });
  }, [isOverlayMode, resolvedActiveNode, resolvedOverlayAnchorNode]);

  const compareBreadcrumb = useMemo(() => {
    if (!compareState) {
      return breadcrumb;
    }

    const projectLabel = project.title || model?.projectName || "프로젝트 도면";
    const segments = [projectLabel, activeDrawing?.name ?? null, `${compareTrackLabel} 비교`].filter(Boolean) as string[];
    return segments.join(" > ");
  }, [activeDrawing?.name, breadcrumb, compareState, compareTrackLabel, model?.projectName, project.title]);

  const isCompareMode = compareState !== null && compareResolvedKeys !== null;

  if (metadataStatus === "loading" || metadataStatus === "idle") {
    return (
      <section className="explorer-page explorer-page--loading" aria-label="Drawing Explorer">
        <p>메타데이터를 불러오는 중...</p>
      </section>
    );
  }

  if (metadataStatus === "error" || !model) {
    return (
      <section className="explorer-page explorer-page--error" aria-label="Drawing Explorer error">
        <h1>Explorer 로딩 실패</h1>
        <p>{errorMessage ?? "메타데이터를 확인해주세요."}</p>
        <button type="button" onClick={() => void loadMetadata()}>
          다시 시도
        </button>
      </section>
    );
  }

  return (
    <section className="explorer-page" aria-label="Drawing Explorer">
      <ExplorerHeader breadcrumb={isCompareMode ? compareBreadcrumb : breadcrumb} />
      {isCompareMode && compareResolvedKeys ? (
        <ComparePage
          trackLabel={compareTrackLabel}
          revisionOptions={compareRevisionOptions}
          leftRevisionKey={compareResolvedKeys.leftRevisionKey}
          rightRevisionKey={compareResolvedKeys.rightRevisionKey}
          onChangeLeftRevisionKey={handleChangeCompareLeftRevisionKey}
          onChangeRightRevisionKey={handleChangeCompareRightRevisionKey}
          onBack={handleCloseCompare}
        />
      ) : (
        <ExplorerBody
          topLeftControls={
            <ExplorerTopLeftControls
              activeDrawingId={selection.drawingId}
              homeDrawingId={homeDrawingId}
              isToggleOpen={isDrawingToggleOpen}
              toggleDrawingOptions={toggleDrawingOptions}
              onGoHome={handleGoHomeDrawing}
              onSelectDrawing={handleSelectDrawing}
              onToggleOpen={() => setIsDrawingToggleOpen((previous) => !previous)}
            />
          }
          viewer={
            <ViewerStage
              baseImage={viewerRenderModel.baseImage}
              baseLabel={viewerRenderModel.baseLabel}
              activeOverlayContext={viewerRenderModel.activeOverlayContext}
              overlayLayers={viewerRenderModel.overlayLayers}
              imageSizeBySrc={imageSizeBySrc}
              showHomePolygonLayer={isHomeDrawing}
              homePolygonTargets={homePolygonTargets}
              onSelectHomePolygon={handleSelectHomePolygon}
              issues={
                imageSizeWarning
                  ? [...viewerRenderModel.issues, { nodeKey: "image-size-warning", message: imageSizeWarning }]
                  : viewerRenderModel.issues
              }
            />
          }
          rightPanel={
            <RightPanel
              nodes={treeModel.nodes}
              activeImageNodeKey={activeImageNodeKey}
              isOverlayMode={isOverlayMode}
              overlayOpacity={overlayOpacity}
              overlayCheckedNodeKeys={overlayCheckedNodeKeys}
              compareNotice={compareNotice}
              changeRevisionLabel={revisionChangePanelModel.revisionLabel}
              changeItems={revisionChangePanelModel.items}
              changeEmptyMessage={revisionChangePanelModel.emptyMessage}
              changeModeNotice={revisionChangePanelModel.modeNotice}
              isOverlayCheckboxVisible={isOverlayCheckboxVisible}
              onSelectImageNode={handleSelectImageNode}
              onToggleOverlayMode={handleToggleOverlayMode}
              onToggleOverlayCheck={handleToggleOverlayCheck}
              onChangeOverlayOpacity={handleChangeOverlayOpacity}
              onRequestCompare={handleRequestCompare}
            />
          }
        />
      )}
    </section>
  );
}

function getSelectableRevisionsForTrack(indexes: ExplorerMetadataIndexes, trackKey: string): NormalizedRevision[] {
  const revisions = indexes.revisionsByTrack.get(trackKey) ?? [];
  return revisions.filter(isRevisionSelectable).slice().sort(compareRevisionForTimeline);
}

function compareRevisionForTimeline(left: NormalizedRevision, right: NormalizedRevision): number {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp;
  }

  if (left.version.numberPart !== right.version.numberPart) {
    return left.version.numberPart - right.version.numberPart;
  }

  return left.version.normalized.localeCompare(right.version.normalized, "ko", { numeric: true });
}

function resolveCompareRevisionKeys(
  requestedLeftRevisionKey: string,
  requestedRightRevisionKey: string,
  revisionKeys: string[],
): { leftRevisionKey: string; rightRevisionKey: string } | null {
  if (revisionKeys.length < 2) {
    return null;
  }

  let leftRevisionKey = revisionKeys.includes(requestedLeftRevisionKey) ? requestedLeftRevisionKey : revisionKeys[0];
  let rightRevisionKey = revisionKeys.includes(requestedRightRevisionKey)
    ? requestedRightRevisionKey
    : revisionKeys[revisionKeys.length - 1];

  if (leftRevisionKey === rightRevisionKey) {
    if (leftRevisionKey !== revisionKeys[0]) {
      leftRevisionKey = revisionKeys[0];
    } else {
      rightRevisionKey = revisionKeys[revisionKeys.length - 1];
    }
  }

  if (leftRevisionKey === rightRevisionKey) {
    const alternativeKey = revisionKeys.find((revisionKey) => revisionKey !== leftRevisionKey);
    if (!alternativeKey) {
      return null;
    }
    rightRevisionKey = alternativeKey;
  }

  return {
    leftRevisionKey,
    rightRevisionKey,
  };
}

function buildCompareTrackLabel(trackKey: string): string {
  const [drawingId, disciplineName, regionName] = trackKey.split("::");
  if (!drawingId || !disciplineName) {
    return trackKey;
  }

  if (!regionName || regionName === "__NO_REGION__") {
    return disciplineName;
  }

  return `${disciplineName} / ${regionName}`;
}

function buildRevisionChangePanelModel(options: {
  activeNode: ImageTreeNode | null;
  anchorNode: ImageTreeNode | null;
  isOverlayMode: boolean;
}): RevisionChangePanelModel {
  if (options.isOverlayMode) {
    const anchorRevisionNode = options.anchorNode?.nodeType === "revision" ? options.anchorNode : null;
    if (anchorRevisionNode) {
      return {
        revisionLabel: anchorRevisionNode.label,
        items: anchorRevisionNode.changes,
        emptyMessage: "기준 리비전의 변경 내역이 없습니다.",
        modeNotice: "Overlay 모드에서는 변경 내역 계산을 생략합니다. 기준 리비전 내용만 표시합니다.",
      };
    }

    return {
      revisionLabel: null,
      items: [],
      emptyMessage: "Overlay 모드에서는 변경 내역 계산을 생략합니다.",
      modeNotice: "기준 버튼이 리비전이 아닐 때는 변경 내역을 표시하지 않습니다.",
    };
  }

  const activeRevisionNode = options.activeNode?.nodeType === "revision" ? options.activeNode : null;
  if (!activeRevisionNode) {
    return {
      revisionLabel: null,
      items: [],
      emptyMessage: "리비전을 선택하면 변경 내역이 표시됩니다.",
      modeNotice: null,
    };
  }

  return {
    revisionLabel: activeRevisionNode.label,
    items: activeRevisionNode.changes,
    emptyMessage: "선택한 리비전에 등록된 변경 내역이 없습니다.",
    modeNotice: null,
  };
}
