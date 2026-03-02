import "./LockedCardContent.css";

export function LockedCardContent() {
  return (
    <div className="locked-content">
      <span className="lock-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7 10V8a5 5 0 0 1 10 0v2h1.25A1.75 1.75 0 0 1 20 11.75v8.5A1.75 1.75 0 0 1 18.25 22h-12.5A1.75 1.75 0 0 1 4 20.25v-8.5A1.75 1.75 0 0 1 5.75 10H7Zm2 0h6V8a3 3 0 1 0-6 0v2Z" />
        </svg>
      </span>
      <p>미할당 구역</p>
    </div>
  );
}
