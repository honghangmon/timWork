import { BaseCanvas } from "./BaseCanvas";
import { OverlayLayerStack } from "./OverlayLayerStack";
import { PolygonLayer } from "./PolygonLayer";
import type { ActiveOverlayContext, ImageSize, OverlayLayer, ViewerIssue } from "../../viewer/render-model";
import type { HomePolygonTarget } from "../../viewer/home-polygon";
import "./ViewerStage.css";

type ViewerStageProps = {
  baseImage: string | null;
  baseLabel: string | null;
  activeOverlayContext: ActiveOverlayContext | null;
  overlayLayers: OverlayLayer[];
  imageSizeBySrc: Record<string, ImageSize>;
  showHomePolygonLayer: boolean;
  homePolygonTargets: HomePolygonTarget[];
  onSelectHomePolygon: (drawingId: string) => void;
  issues: ViewerIssue[];
};

export function ViewerStage({
  baseImage,
  baseLabel,
  activeOverlayContext,
  overlayLayers,
  imageSizeBySrc,
  showHomePolygonLayer,
  homePolygonTargets,
  onSelectHomePolygon,
  issues,
}: ViewerStageProps) {
  const baseImageSize = baseImage ? imageSizeBySrc[baseImage] ?? null : null;

  return (
    <section className="viewer-stage" aria-label="도면 뷰어">
      <div className="viewer-stage__canvas">
        <BaseCanvas image={baseImage} label={baseLabel} />
        <OverlayLayerStack layers={overlayLayers} activeContext={activeOverlayContext} imageSizeBySrc={imageSizeBySrc} />
        <PolygonLayer
          visible={showHomePolygonLayer}
          baseImage={baseImage}
          baseImageSize={baseImageSize}
          targets={homePolygonTargets}
          onSelectTarget={onSelectHomePolygon}
        />
      </div>

      {issues.length > 0 ? (
        <ul className="viewer-stage__issues" aria-label="overlay issue list">
          {issues.map((issue) => (
            <li key={issue.nodeKey}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
