import "./OverlayToggleButton.css";

type OverlayToggleButtonProps = {
  isOverlayMode: boolean;
  onToggle: () => void;
};

export function OverlayToggleButton({ isOverlayMode, onToggle }: OverlayToggleButtonProps) {
  return (
    <button
      type="button"
      className={`overlay-toggle-button ${isOverlayMode ? "is-active" : ""}`}
      onClick={onToggle}
      aria-pressed={isOverlayMode}
    >
      겹쳐서 보기
    </button>
  );
}
