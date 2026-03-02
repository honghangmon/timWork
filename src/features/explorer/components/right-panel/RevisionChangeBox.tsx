import "./RevisionChangeBox.css";

type RevisionChangeBoxProps = {
  revisionLabel: string | null;
  items: string[];
  emptyMessage: string;
  modeNotice: string | null;
};

export function RevisionChangeBox({ revisionLabel, items, emptyMessage, modeNotice }: RevisionChangeBoxProps) {
  return (
    <section className="revision-change-box" aria-label="변경 내역">
      <header className="revision-change-box__header">
        <h3 className="revision-change-box__title">Change</h3>
        {revisionLabel ? <span className="revision-change-box__revision">{revisionLabel}</span> : null}
      </header>

      {modeNotice ? <p className="revision-change-box__notice">{modeNotice}</p> : null}

      <div className="revision-change-box__content">
        {items.length > 0 ? (
          <ul className="revision-change-box__list">
            {items.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="revision-change-box__empty">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
