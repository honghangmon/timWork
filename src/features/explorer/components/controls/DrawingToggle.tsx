import "./DrawingToggle.css";

type DrawingOption = {
  id: string;
  name: string;
};

type DrawingToggleProps = {
  options: DrawingOption[];
  activeDrawingId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelect: (drawingId: string) => void;
};

export function DrawingToggle({
  options,
  activeDrawingId,
  isOpen,
  onToggleOpen,
  onSelect,
}: DrawingToggleProps) {
  const activeOption = options.find((option) => option.id === activeDrawingId) ?? null;
  const buttonLabel = activeOption?.name ?? "도면 선택";

  return (
    <div className="drawing-toggle">
      <button
        type="button"
        className="drawing-toggle__trigger"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`drawing-toggle__caret ${isOpen ? "is-open" : ""}`} aria-hidden="true">
          ▼
        </span>
        <span>{buttonLabel}</span>
      </button>

      {isOpen ? (
        <ul className="drawing-toggle__list" role="listbox" aria-label="도면 목록">
          {options.length === 0 ? <li className="drawing-toggle__empty">선택 가능한 도면 없음</li> : null}
          {options.map((option) => {
            const isActive = option.id === activeDrawingId;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={`drawing-toggle__item ${isActive ? "is-active" : ""}`}
                  onClick={() => onSelect(option.id)}
                >
                  {option.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
