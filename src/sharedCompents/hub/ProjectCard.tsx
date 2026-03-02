import "./ProjectCard.css";
import { LockedCardContent } from "./LockedCardContent";
import type { HubCard } from "./types";
import { SharedButton } from "../button/SharedButton";

type ProjectCardProps = {
  card: HubCard;
  onSelectProject: (card: HubCard) => void;
};

export function ProjectCard({ card, onSelectProject }: ProjectCardProps) {
  if (card.enabled) {
    return (
      <SharedButton className="project-card project-card--active" onClick={() => onSelectProject(card)}>
        <span className="project-chip">활성</span>
        <h2>{card.title}</h2>
        <p>{card.subtitle}</p>
      </SharedButton>
    );
  }

  return (
    <div className="project-card project-card--disabled" aria-disabled="true">
      <LockedCardContent />
    </div>
  );
}
