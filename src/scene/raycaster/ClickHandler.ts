import * as THREE from 'three';
import type { InteractiveObject } from '../objects/InteractiveObject';

export type ObjectClickCallback = (obj: InteractiveObject) => void;

/**
 * Clicks threshold in CSS pixels.
 * If the pointer travels more than this between down→up, it's a drag, not a click.
 * A boolean flag is NOT used because any external event (tab switch, window blur)
 * can fire pointermove without a matching pointerdown, leaving the flag stuck.
 */
const DRAG_THRESHOLD_PX = 6;

/**
 * Handles pointer events on the canvas and resolves which
 * InteractiveObject (if any) was clicked via raycasting.
 */
export class ClickHandler {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly camera: THREE.Camera;
  private readonly scene: THREE.Scene;
  private readonly canvas: HTMLCanvasElement;
  private onClickCallback: ObjectClickCallback | null = null;

  // Coordinates recorded at pointerdown — null means no active gesture
  private downX: number | null = null;
  private downY: number | null = null;

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera, scene: THREE.Scene) {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = scene;

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
  }

  setCallback(cb: ObjectClickCallback): void {
    this.onClickCallback = cb;
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private handlePointerDown = (event: PointerEvent): void => {
    this.downX = event.clientX;
    this.downY = event.clientY;
  };

  private handlePointerUp = (event: PointerEvent): void => {
    // Guard: no active gesture (e.g. pointerdown fired outside the canvas)
    if (this.downX === null || this.downY === null) return;
    if (!this.onClickCallback) return;

    const dx = event.clientX - this.downX;
    const dy = event.clientY - this.downY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Reset gesture state before any early return
    this.downX = null;
    this.downY = null;

    // Treat as drag — ignore
    if (distance > DRAG_THRESHOLD_PX) return;

    const rect = this.canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = ((event.clientY - rect.top) / rect.height) * -2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      const interactive: InteractiveObject | undefined = hit.object.userData['interactive'];
      if (interactive) {
        this.onClickCallback(interactive);
        break;
      }
    }
  };
}
