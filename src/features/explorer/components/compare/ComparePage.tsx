import "./ComparePage.css";

type RevisionOption = {
  key: string;
  label: string;
  image: string;
};

type ComparePageProps = {
  trackLabel: string;
  revisionOptions: RevisionOption[];
  leftRevisionKey: string;
  rightRevisionKey: string;
  onChangeLeftRevisionKey: (revisionKey: string) => void;
  onChangeRightRevisionKey: (revisionKey: string) => void;
  onBack: () => void;
};

export function ComparePage({
  trackLabel,
  revisionOptions,
  leftRevisionKey,
  rightRevisionKey,
  onChangeLeftRevisionKey,
  onChangeRightRevisionKey,
  onBack,
}: ComparePageProps) {
  const leftRevision = revisionOptions.find((revision) => revision.key === leftRevisionKey) ?? null;
  const rightRevision = revisionOptions.find((revision) => revision.key === rightRevisionKey) ?? null;

  return (
    <section className="compare-page" aria-label="Compare Page">
      <header className="compare-page__toolbar">
        <button type="button" className="compare-page__back" onClick={onBack} aria-label="비교 페이지 닫기">
          ←
        </button>

        <span className="compare-page__track-label">{trackLabel}</span>

        <label className="compare-page__select-wrap" aria-label="left revision">
          <select value={leftRevisionKey} onChange={(event) => onChangeLeftRevisionKey(event.target.value)}>
            {revisionOptions.map((revision) => (
              <option key={revision.key} value={revision.key}>
                {revision.label}
              </option>
            ))}
          </select>
        </label>

        <span className="compare-page__vs">vs</span>

        <label className="compare-page__select-wrap" aria-label="right revision">
          <select value={rightRevisionKey} onChange={(event) => onChangeRightRevisionKey(event.target.value)}>
            {revisionOptions.map((revision) => (
              <option key={revision.key} value={revision.key}>
                {revision.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="compare-page__canvas-grid">
        <article className="compare-page__canvas" aria-label="left drawing">
          {leftRevision?.image ? <img src={leftRevision.image} alt={leftRevision.label} /> : <p>도면</p>}
        </article>

        <article className="compare-page__canvas" aria-label="right drawing">
          {rightRevision?.image ? <img src={rightRevision.image} alt={rightRevision.label} /> : <p>도면</p>}
        </article>
      </div>
    </section>
  );
}
