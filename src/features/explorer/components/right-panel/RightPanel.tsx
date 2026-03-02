import { useMemo } from "react";
import { DrawingTree } from "./DrawingTree";
import { OverlayOpacityControl } from "./OverlayOpacityControl";
import { OverlayToggleButton } from "./OverlayToggleButton";
import { RevisionChangeBox } from "./RevisionChangeBox";
import type { CompareRequest, ImageTreeNode, RightPanelTreeNode } from "../../right-panel/types";
import "./RightPanel.css";

type RightPanelProps = {
  nodes: RightPanelTreeNode[];
  activeImageNodeKey: string | null;
  isOverlayMode: boolean;
  overlayOpacity: number;
  overlayCheckedNodeKeys: string[];
  compareNotice: string | null;
  changeRevisionLabel: string | null;
  changeItems: string[];
  changeEmptyMessage: string;
  changeModeNotice: string | null;
  isOverlayCheckboxVisible: (node: ImageTreeNode) => boolean;
  onSelectImageNode: (nodeKey: string) => void;
  onToggleOverlayMode: () => void;
  onToggleOverlayCheck: (nodeKey: string) => void;
  onChangeOverlayOpacity: (value: number) => void;
  onRequestCompare: (request: CompareRequest) => void;
};

export function RightPanel({
  nodes,
  activeImageNodeKey,
  isOverlayMode,
  overlayOpacity,
  overlayCheckedNodeKeys,
  compareNotice,
  changeRevisionLabel,
  changeItems,
  changeEmptyMessage,
  changeModeNotice,
  isOverlayCheckboxVisible,
  onSelectImageNode,
  onToggleOverlayMode,
  onToggleOverlayCheck,
  onChangeOverlayOpacity,
  onRequestCompare,
}: RightPanelProps) {
  const overlayCheckedNodeKeySet = useMemo(() => new Set(overlayCheckedNodeKeys), [overlayCheckedNodeKeys]);

  return (
    <section className="right-panel" aria-label="오른쪽 패널">
      <OverlayToggleButton isOverlayMode={isOverlayMode} onToggle={onToggleOverlayMode} />

      <OverlayOpacityControl
        value={overlayOpacity}
        isOverlayMode={isOverlayMode}
        disabled={overlayCheckedNodeKeys.length === 0}
        onChange={onChangeOverlayOpacity}
      />

      <div className="right-panel__tree-scroll">
        <DrawingTree
          nodes={nodes}
          activeImageNodeKey={activeImageNodeKey}
          isOverlayMode={isOverlayMode}
          overlayCheckedNodeKeys={overlayCheckedNodeKeySet}
          isOverlayCheckboxVisible={isOverlayCheckboxVisible}
          onSelectImageNode={onSelectImageNode}
          onToggleOverlayCheck={onToggleOverlayCheck}
          onRequestCompare={onRequestCompare}
        />
      </div>

      <p className={`right-panel__compare-notice ${compareNotice ? "" : "is-empty"}`}>{compareNotice ?? " "}</p>

      <RevisionChangeBox
        revisionLabel={changeRevisionLabel}
        items={changeItems}
        emptyMessage={changeEmptyMessage}
        modeNotice={changeModeNotice}
      />
    </section>
  );
}
