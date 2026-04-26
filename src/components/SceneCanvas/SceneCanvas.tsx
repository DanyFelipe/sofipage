import { useScene } from '../../scene/useScene';
import type { InteractiveObject } from '../../scene/objects/InteractiveObject';
import './SceneCanvas.css';

interface SceneCanvasProps {
  onObjectClick: (obj: InteractiveObject) => void;
}

/**
 * Renders the fullscreen <canvas> and initializes the Three.js scene.
 */
export function SceneCanvas({ onObjectClick }: SceneCanvasProps) {
  const { canvasRef } = useScene({ onObjectClick });

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
