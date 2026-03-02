import { useEffect, useMemo, useRef, useState } from "react";
import {
  resolveOverlayPlacement,
  type ActiveOverlayContext,
  type ImageSize,
  type OverlayLayer,
} from "../../viewer/render-model";
import "./OverlayLayerStack.css";

type OverlayLayerStackProps = {
  layers: OverlayLayer[];
  activeContext: ActiveOverlayContext | null;
  imageSizeBySrc: Record<string, ImageSize>;
};

type ResolvedLayerItem = {
  nodeKey: string;
  image: string;
  opacity: number;
  width: number;
  height: number;
  matrix: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  };
};

export function OverlayLayerStack({ layers, activeContext, imageSizeBySrc }: OverlayLayerStackProps) {
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<ImageSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = stackRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    update();

    const resizeObserver = new ResizeObserver(() => {
      update();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const resolved = useMemo(() => {
    if (!activeContext) {
      return {
        world: null,
        layers: [] as ResolvedLayerItem[],
      };
    }

    const activeImageSize = imageSizeBySrc[activeContext.image];
    if (!activeImageSize) {
      return {
        world: null,
        layers: [] as ResolvedLayerItem[],
      };
    }

    const rows: ResolvedLayerItem[] = [];
    let world: { left: number; top: number; scale: number; width: number; height: number } | null = null;

    for (const layer of layers) {
      const overlayImageSize = imageSizeBySrc[layer.image];
      if (!overlayImageSize) {
        continue;
      }

      const placement = resolveOverlayPlacement({
        canvasSize,
        activeImageSize,
        overlayImageSize,
        activeContext,
        overlayLayer: layer,
      });

      if (!placement.canRender || !placement.style) {
        continue;
      }

      world = {
        left: placement.style.containRect.left,
        top: placement.style.containRect.top,
        scale: placement.style.containRect.scale,
        width: activeImageSize.width,
        height: activeImageSize.height,
      };

      rows.push({
        nodeKey: layer.nodeKey,
        image: layer.image,
        opacity: layer.opacity,
        width: placement.style.overlayWidth,
        height: placement.style.overlayHeight,
        matrix: placement.style.matrix,
      });
    }

    return {
      world,
      layers: rows,
    };
  }, [activeContext, canvasSize, imageSizeBySrc, layers]);

    return (
      <div ref={stackRef} className="overlay-layer-stack" aria-label="overlay-layers">
      {resolved.world ? (
        <div
          className="overlay-layer-stack__world"
          style={{
            left: `${resolved.world.left}px`,
            top: `${resolved.world.top}px`,
            width: `${resolved.world.width}px`,
            height: `${resolved.world.height}px`,
            transform: `scale(${resolved.world.scale})`,
          }}
        >
          {resolved.layers.map((layer) => (
            <img
              key={layer.nodeKey}
              className="overlay-layer-stack__layer-image"
              src={layer.image}
              alt="overlay"
              style={{
                opacity: layer.opacity,
                width: `${layer.width}px`,
                height: `${layer.height}px`,
                transform: `matrix(${layer.matrix.a}, ${layer.matrix.b}, ${layer.matrix.c}, ${layer.matrix.d}, ${layer.matrix.e}, ${layer.matrix.f})`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
