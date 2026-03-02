import { DrawingToggle } from "./DrawingToggle";
import { HomeDrawingButton } from "./HomeDrawingButton";
import "./ExplorerTopLeftControls.css";

type DrawingOption = {
  id: string;
  name: string;
};

type ExplorerTopLeftControlsProps = {
  toggleDrawingOptions: DrawingOption[];
  activeDrawingId: string | null;
  homeDrawingId: string | null;
  isToggleOpen: boolean;
  onToggleOpen: () => void;
  onSelectDrawing: (drawingId: string) => void;
  onGoHome: () => void;
};

export function ExplorerTopLeftControls({
  toggleDrawingOptions,
  activeDrawingId,
  homeDrawingId,
  isToggleOpen,
  onToggleOpen,
  onSelectDrawing,
  onGoHome,
}: ExplorerTopLeftControlsProps) {
  return (
    <div className="explorer-top-left-controls">
      <DrawingToggle
        options={toggleDrawingOptions}
        activeDrawingId={activeDrawingId}
        isOpen={isToggleOpen}
        onToggleOpen={onToggleOpen}
        onSelect={onSelectDrawing}
      />
      <HomeDrawingButton
        homeDrawingId={homeDrawingId}
        disabled={!homeDrawingId || activeDrawingId === homeDrawingId}
        onGoHome={onGoHome}
      />
    </div>
  );
}
