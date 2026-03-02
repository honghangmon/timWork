import "./Hub.css";
import { ProjectCard } from "./ProjectCard";
import type { HubCard } from "./types";

const HUB_CARDS: HubCard[] = [
  {
    id: "project-00",
    title: "00 아파트 설계도",
    subtitle: "도면이 준비된 공사",
    enabled: true,
    metadataUrl: "/data/metadata.json",
    initialDrawingId: "00",
  },
  { id: "unassigned-1", title: "미할당 구역", enabled: false },
  { id: "unassigned-2", title: "미할당 구역", enabled: false },
  { id: "unassigned-3", title: "미할당 구역", enabled: false },
  { id: "unassigned-4", title: "미할당 구역", enabled: false },
  { id: "unassigned-5", title: "미할당 구역", enabled: false },
];

type HubProps = {
  onSelectProject: (card: HubCard) => void;
};

export function Hub({ onSelectProject }: HubProps) {
  return (
    <div className="hub-container">
      <header className="hub-header">
        <p className="hub-label">PROJECT</p>
        <h1>프로젝트</h1>
      </header>

      <div className="hub-grid">
        {HUB_CARDS.map((card) => (
          <ProjectCard key={card.id} card={card} onSelectProject={onSelectProject} />
        ))}
      </div>
    </div>
  );
}
