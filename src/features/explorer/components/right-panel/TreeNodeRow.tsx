import type { CSSProperties } from "react";
import type { CompareRequest, RightPanelTreeNode } from "../../right-panel/types";
import "./TreeNodeRow.css";

type TreeNodeRowProps = {
  node: RightPanelTreeNode;
  isActive: boolean;
  isOverlayMode: boolean;
  showOverlayCheckbox: boolean;
  isOverlayChecked: boolean;
  onSelectImageNode: (nodeKey: string) => void;
  onToggleOverlayCheck: (nodeKey: string) => void;
  onRequestCompare: (request: CompareRequest) => void;
};

export function TreeNodeRow({
  node,
  isActive,
  isOverlayMode,
  showOverlayCheckbox,
  isOverlayChecked,
  onSelectImageNode,
  onToggleOverlayCheck,
  onRequestCompare,
}: TreeNodeRowProps) {
  const isDrawingBaseNode = node.kind === "image" && node.nodeType === "drawing-base";
  const shouldReserveCheckboxColumn = isOverlayMode;
  const style = {
    paddingInlineStart: `${node.depth * 10 + 2}px`,
  } satisfies CSSProperties | undefined;

  if (node.kind === "label") {
    return (
      <div className="tree-node-row tree-node-row--label" style={style}>
        <span className="tree-node-row__label-text">{node.label}</span>
        {node.compare ? (
          <button
            type="button"
            className="tree-node-row__compare-button"
            onClick={() => onRequestCompare(node.compare as CompareRequest)}
          >
            비교
          </button>
        ) : null}
      </div>
    );
  }

  const isSelectionLocked = isOverlayMode && !isActive;

  if (isDrawingBaseNode) {
    return (
      <div className="tree-node-row tree-node-row--image tree-node-row--drawing-base">
        <button
          type="button"
          className={`tree-node-row__image-button ${isActive ? "is-active" : ""}`}
          onClick={() => onSelectImageNode(node.nodeKey)}
          disabled={isSelectionLocked}
        >
          {node.label}
        </button>
      </div>
    );
  }

  return (
    <div className={`tree-node-row tree-node-row--image ${shouldReserveCheckboxColumn ? "is-overlay" : "is-view"}`} style={style}>
      {shouldReserveCheckboxColumn ? (
        showOverlayCheckbox ? (
          <label className="tree-node-row__checkbox-wrap" aria-label={`${node.label} overlay`}>
            <input
              type="checkbox"
              checked={isOverlayChecked}
              onChange={() => onToggleOverlayCheck(node.nodeKey)}
            />
          </label>
        ) : (
          <span className="tree-node-row__checkbox-placeholder" aria-hidden="true" />
        )
      ) : null}

      <button
        type="button"
        className={`tree-node-row__image-button ${isActive ? "is-active" : ""}`}
        onClick={() => onSelectImageNode(node.nodeKey)}
        disabled={isSelectionLocked}
      >
        {node.label}
      </button>
    </div>
  );
}
