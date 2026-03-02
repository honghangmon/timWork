import type { ReactNode } from "react";
import "./ExplorerBody.css";

type ExplorerBodyProps = {
  topLeftControls: ReactNode;
  viewer: ReactNode;
  rightPanel: ReactNode;
};

export function ExplorerBody({ topLeftControls, viewer, rightPanel }: ExplorerBodyProps) {
  return (
    <section className="explorer-body">
      <div className="explorer-body__viewer-column">
        <div className="explorer-body__top-controls">{topLeftControls}</div>
        <div className="explorer-body__viewer">{viewer}</div>
      </div>
      <aside className="explorer-body__right-panel">{rightPanel}</aside>
    </section>
  );
}
