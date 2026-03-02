import type { ImageTransform } from "../../../core";

export type CompareRequest = {
  trackKey: string;
  leftRevisionKey: string;
  rightRevisionKey: string;
  leftLabel: string;
  rightLabel: string;
};

type BaseNode = {
  nodeKey: string;
  label: string;
  depth: number;
};

export type LabelTreeNode = BaseNode & {
  kind: "label";
  nodeType: "discipline-label" | "region-label";
  compare: CompareRequest | null;
};

export type ImageTreeNode = BaseNode & {
  kind: "image";
  nodeType: "drawing-base" | "discipline-source" | "revision";
  image: string;
  reference: string | null;
  transform: ImageTransform | null;
  rawTransform: ImageTransform | null;
  fallbackTransform: ImageTransform | null;
  trackKey: string | null;
  revisionKey: string | null;
  changes: string[];
};

export type RightPanelTreeNode = LabelTreeNode | ImageTreeNode;

export type RightPanelTreeModel = {
  nodes: RightPanelTreeNode[];
  defaultActiveImageNodeKey: string | null;
};
