import "./OverlayOpacityControl.css";

type OverlayOpacityControlProps = {
  value: number;
  isOverlayMode: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
};

export function OverlayOpacityControl({ value, isOverlayMode, disabled, onChange }: OverlayOpacityControlProps) {
  const percent = Math.round(value * 100);
  const sliderDisabled = !isOverlayMode || disabled;

  return (
    <section
      className={`overlay-opacity-control ${isOverlayMode ? "is-active" : "is-inactive"}`}
      aria-label="Overlay opacity"
    >
      <div className="overlay-opacity-control__label-row">
        <strong>투명도 조절</strong>
        <span>{isOverlayMode ? `${percent}%` : "OFF"}</span>
      </div>
      <input
        type="range"
        min={10}
        max={100}
        step={1}
        value={percent}
        disabled={sliderDisabled}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </section>
  );
}
