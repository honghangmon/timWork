import "./HomeDrawingButton.css";

type HomeDrawingButtonProps = {
  homeDrawingId: string | null;
  disabled: boolean;
  onGoHome: () => void;
};

export function HomeDrawingButton({ homeDrawingId, disabled, onGoHome }: HomeDrawingButtonProps) {
  return (
    <button
      type="button"
      className="home-drawing-button"
      onClick={onGoHome}
      disabled={disabled}
      aria-label="전체 도면으로 이동"
      title={homeDrawingId ? "전체 도면으로 이동" : "전체 도면이 없습니다"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.2 3 10.7v1.8h2v8.3h5.8v-5.5h2.4v5.5H19v-8.3h2v-1.8L12 3.2Zm5 16.3h-1.8V14h-6.4v5.5H7v-9l5-4.1 5 4.1v9Z" />
      </svg>
    </button>
  );
}
