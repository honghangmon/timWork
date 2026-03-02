import { useEffect, useState } from "react";
import { Hub } from "./sharedCompents/hub/Hub";
import type { HubCard } from "./sharedCompents/hub/types";
import DrawingExplorerPage from "./features/explorer/pages/DrawingExplorerPage";
import "./App.css";

type Screen = "splash" | "hub" | "explorer";

type ExplorerProjectContext = {
  id: string;
  title: string;
  metadataUrl?: string;
  initialDrawingId?: string;
};

const SPLASH_MS = 1500;

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [selectedProject, setSelectedProject] = useState<ExplorerProjectContext | null>(null);
  const isSplashVisible = screen === "splash";
  const isHubVisible = screen === "hub";
  const isExplorerVisible = screen === "explorer";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setScreen("hub");
    }, SPLASH_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSelectProject = (card: HubCard) => {
    if (!card.enabled) {
      return;
    }

    setSelectedProject({
      id: card.id,
      title: card.title,
      metadataUrl: card.metadataUrl,
      initialDrawingId: card.initialDrawingId,
    });
    setScreen("explorer");
  };

  return (
    <main className={`app-shell ${isExplorerVisible ? "app-shell--explorer" : ""}`}>
      <section
        className={`screen screen--splash ${isSplashVisible ? "" : "screen--splash-exit"}`}
        aria-label="Splash screen"
        aria-hidden={!isSplashVisible}
      >
        <img className="splash-logo" src="/asset/logo.png" alt="timwork" />
      </section>

      <section
        className={`screen screen--hub ${
          isHubVisible ? "screen--hub-enter" : isSplashVisible ? "screen--hub-ready" : "screen--hub-exit"
        }`}
        aria-label="Project hub"
        aria-hidden={!isHubVisible}
      >
        <Hub onSelectProject={handleSelectProject} />
      </section>

      <section
        className={`screen screen--explorer ${isExplorerVisible ? "screen--explorer-enter" : "screen--explorer-ready"}`}
        aria-label="Drawing explorer"
        aria-hidden={!isExplorerVisible}
      >
        {selectedProject ? <DrawingExplorerPage project={selectedProject} /> : null}
      </section>
    </main>
  );
}
