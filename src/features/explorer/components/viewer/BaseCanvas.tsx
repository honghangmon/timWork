import "./BaseCanvas.css";

type BaseCanvasProps = {
  image: string | null;
  label: string | null;
};

export function BaseCanvas({ image, label }: BaseCanvasProps) {
  if (!image) {
    return (
      <div className="base-canvas base-canvas--empty">
        <p>선택된 도면이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="base-canvas">
      <img src={image} alt={label ?? "drawing"} />
    </div>
  );
}
