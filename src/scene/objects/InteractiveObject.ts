import * as THREE from 'three';

export interface InteractiveObjectConfig {
  object: THREE.Object3D;
  label: string;
  content: string;
}

/**
 * Wraps a Three.js Object3D (mesh, group, or GLTF scene) with metadata
 * for click interaction. Traverses all children to tag every mesh
 * so the raycaster can resolve any hit back to this instance.
 */
export class InteractiveObject {
  readonly object: THREE.Object3D;
  readonly label: string;
  readonly content: string;

  constructor({ object, label, content }: InteractiveObjectConfig) {
    this.object = object;
    this.label = label;
    this.content = content;

    // Tag every mesh in the hierarchy for raycaster resolution
    this.object.traverse((child) => {
      child.userData['interactive'] = this;
    });
  }
}
