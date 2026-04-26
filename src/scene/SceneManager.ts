import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InteractiveObject } from './objects/InteractiveObject';
import { ClickHandler, type ObjectClickCallback } from './raycaster/ClickHandler';

/**
 * SceneManager — pure TypeScript class, zero React dependencies.
 *
 * Owns: WebGLRenderer, PerspectiveCamera, Scene, animation loop,
 *       ResizeObserver, and ClickHandler.
 *
 * Usage:
 *   const manager = new SceneManager();
 *   manager.init(canvasElement);
 *   manager.onObjectClick(callback);
 *   // later:
 *   manager.dispose();
 */
export class SceneManager {
  // ─── Renderer & core ──────────────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private canvas!: HTMLCanvasElement;

  // ─── Systems ──────────────────────────────────────────────────────────────
  private clickHandler!: ClickHandler;
  private resizeObserver!: ResizeObserver;
  private timer = new THREE.Timer();
  private animationId = 0;

  // ─── Scene objects ────────────────────────────────────────────────────────
  private particles: THREE.Points | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private backgroundTexture: THREE.Texture | null = null;
  private backgroundUpdater: (() => void) | null = null;

  // ─── Public API ───────────────────────────────────────────────────────────

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupLights();
    this.setupObjects();

    this.clickHandler = new ClickHandler(canvas, this.camera, this.scene);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.handleResize();

    this.startLoop();
  }

  public onObjectClick(cb: ObjectClickCallback): void {
    this.clickHandler.setCallback(cb);
  }

  public addObject(obj: InteractiveObject): void {
    this.scene.add(obj.object);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver.disconnect();
    this.clickHandler.dispose();
    this.backgroundTexture?.dispose();
    this.renderer.dispose();
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(50, this.getAspect(), 0.1, 100);
    this.camera.position.set(3, 10, 15);
    this.camera.lookAt(0, 2, 0);
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6fbce1);
    this.scene.fog = new THREE.FogExp2(0x89cde8, 0.008);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/sky-day-ghilbi.png', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      this.backgroundTexture = texture;

      const updateCover = (): void => {
        if (!this.backgroundTexture?.image) return;
        const canvasAspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const image = this.backgroundTexture.image as HTMLImageElement;
        const imageAspect = image.width / image.height;

        if (canvasAspect > imageAspect) {
          texture.repeat.set(1, imageAspect / canvasAspect);
          texture.offset.set(0, (1 - imageAspect / canvasAspect) / 2);
        } else {
          texture.repeat.set(canvasAspect / imageAspect, 1);
          texture.offset.set((1 - canvasAspect / imageAspect) / 2, 0);
        }
      };

      this.backgroundUpdater = updateCover;
      updateCover();
      this.scene.background = texture;
    });
  }

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xe4faff, 0x6eac5e, 1.4);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffae6, 2.5);
    sun.position.set(-8, 15, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x9bd8ff, 0.7);
    fill.position.set(5, 5, -5);
    this.scene.add(fill);
  }

  private setupObjects(): void {
    const particleCount = 350;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        color: 0xffffe6,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
      }),
    );
    this.scene.add(this.particles);

    this.loadModel();
  }

  private loadModel(): void {
    const loader = new GLTFLoader();

    loader.load(
      '/models/jijicat.glb',
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.rotation.y = Math.PI;

        const letterMeshes: THREE.Object3D[] = [];

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.name.toLowerCase().includes('letter')) {
              letterMeshes.push(child);
            }
          }
        });

        this.scene.add(model);

        if (letterMeshes.length > 0) {
          const letterInteractive = new InteractiveObject({
            object: letterMeshes[0],
            label: 'Letter',
            content: '',
          });

          for (let i = 1; i < letterMeshes.length; i++) {
            letterMeshes[i].userData['interactive'] = letterInteractive;
          }
        } else {
          console.warn(
            '[SceneManager] No se encontró ningún mesh con nombre "letter*" en jijicat.glb.\n' +
            'Verifica el nombre de los objetos en Blender.',
          );
        }

        this.setupAnimation(gltf.animations, model);
      },
      undefined,
      (error) => {
        console.error('Error loading jijicat.glb:', error);
      },
    );
  }

  private setupAnimation(animations: THREE.AnimationClip[], model: THREE.Object3D): void {
    if (animations.length === 0) return;

    this.mixer = new THREE.AnimationMixer(model);
    const clip = animations[0];

    clip.tracks.forEach((track) => {
      track.setInterpolation(THREE.InterpolateLinear);
    });

    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.timeScale = 0.5; // Slow down the animation
    action.play();
  }

  // ─── Loop ─────────────────────────────────────────────────────────────────

  private startLoop(): void {
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      this.tick();
    };
    loop();
  }

  private tick(): void {
    this.timer.update();
    const delta = this.timer.getDelta();

    if (this.mixer !== null) {
      this.mixer.update(delta);
    }

    if (this.particles !== null) {
      this.particles.rotation.y += delta * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getAspect(): number {
    return this.canvas.clientWidth / this.canvas.clientHeight || 1;
  }

  private handleResize(): void {
    const parent = this.canvas.parentElement ?? this.canvas;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    this.backgroundUpdater?.();
  }
}