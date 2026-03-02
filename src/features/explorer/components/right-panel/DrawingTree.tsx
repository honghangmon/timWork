import { TreeNodeRow } from "./TreeNodeRow";
import type { CompareRequest, ImageTreeNode, RightPanelTreeNode } from "../../right-panel/types";
import "./DrawingTree.css";

type DrawingTreeProps = {
  nodes: RightPanelTreeNode[];
  activeImageNodeKey: string | null;
  isOverlayMode: boolean;
  overlayCheckedNodeKeys: Set<string>;
  isOverlayCheckboxVisible: (node: ImageTreeNode) => boolean;
  onSelectImageNode: (nodeKey: string) => void;
  onToggleOverlayCheck: (nodeKey: string) => void;
  onRequestCompare: (request: CompareRequest) => void;
};

export function DrawingTree({
  nodes,
  activeImageNodeKey,
  isOverlayMode,
  overlayCheckedNodeKeys,
  isOverlayCheckboxVisible,
  onSelectImageNode,
  onToggleOverlayCheck,
  onRequestCompare,
}: DrawingTreeProps) {
  return (
    <div className="drawing-tree" role="tree" aria-label="도면 트리">
      {nodes.map((node) => {
        const showOverlayCheckbox = node.kind === "image" && isOverlayCheckboxVisible(node);
        return (
          <TreeNodeRow
            key={node.nodeKey}
            node={node}
            isActive={node.kind === "image" && activeImageNodeKey === node.nodeKey}
            isOverlayMode={isOverlayMode}
            showOverlayCheckbox={showOverlayCheckbox}
            isOverlayChecked={overlayCheckedNodeKeys.has(node.nodeKey)}
            onSelectImageNode={onSelectImageNode}
            onToggleOverlayCheck={onToggleOverlayCheck}
            onRequestCompare={onRequestCompare}
          />
        );
      })}
    </div>
  );
}
