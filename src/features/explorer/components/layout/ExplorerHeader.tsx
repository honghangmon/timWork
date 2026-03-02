import "./ExplorerHeader.css";

type ExplorerHeaderProps = {
  breadcrumb: string;
};

export function ExplorerHeader({ breadcrumb }: ExplorerHeaderProps) {
  return (
    <header className="explorer-header">
      <p className="explorer-header__breadcrumb">{breadcrumb}</p>
    </header>
  );
}
