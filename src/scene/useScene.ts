import { useEffect, useRef } from 'react';
import { SceneManager } from './SceneManager';
import type { InteractiveObject } from './objects/InteractiveObject';

interface UseSceneOptions {
  onObjectClick?: (obj: InteractiveObject) => void;
}

/**
 * Bridges React lifecycle with SceneManager.
 * Returns a canvas ref to attach to a <canvas> element.
 */
export function useScene({ onObjectClick }: UseSceneOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<SceneManager | null>(null);

  // Keep callback ref fresh without re-initializing the scene
  const callbackRef = useRef(onObjectClick);
  callbackRef.current = onObjectClick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const manager = new SceneManager();
    manager.init(canvas);
    manager.onObjectClick((obj) => callbackRef.current?.(obj));
    managerRef.current = manager;

    return () => {
      manager.dispose();
      managerRef.current = null;
    };
  }, []);

  return { canvasRef, managerRef };
}
