import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * LensPass - Custom shader for gravitational lensing effect
 */
const LensPassShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    planetCount: { value: 0 },
    planetPositions: { value: null },
    masses: { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform int planetCount;
    uniform float planetPositions[16]; // Max 8 planets * 2 (x, y)
    uniform float masses[8]; // Max 8 masses
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec2 screenPos = uv * resolution;
      
      float eps = 0.01;
      vec2 offset = vec2(0.0);
      
      // Apply lensing effect from each planet
      for (int i = 0; i < 8; i++) {
        if (i >= planetCount) break;
        
        vec2 planetPos = vec2(
          planetPositions[i * 2],
          planetPositions[i * 2 + 1]
        );
        
        // Convert from NDC to screen space
        vec2 planetScreenPos = (planetPos * 0.5 + 0.5) * resolution;
        
        vec2 dir = normalize(screenPos - planetScreenPos);
        float dist = length(screenPos - planetScreenPos);
        
        if (dist > eps) {
          float mass = masses[i];
          float k = 25.0; // Increased constant factor for visibility
          float strength = clamp(mass * k / resolution.x, 0.0, 0.1);
          
          // Use stronger repulsion formula
          float effect = mass * strength / (pow(dist, 1.5) + 0.0001);
          offset += dir * effect;
        }
      }
      
      vec2 newUv = uv + offset;
      vec4 color = texture2D(tDiffuse, newUv);
      
      gl_FragColor = color;
    }
  `
};

/**
 * Effects Manager - Post-processing effects
 */
export class EffectsManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.lensPass = null;
    this.orbitLinesScene = null; // Separate scene for orbit lines
    this.initialized = false;
  }

  /**
   * Initialize effects
   */
  initialize() {
    // Create composer
    this.composer = new EffectComposer(this.renderer);
    
    // Render pass (excludes orbit lines by using a filtered scene)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom pass
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    this.composer.addPass(bloomPass);
    
    // Lens pass
    this.lensPass = new ShaderPass(LensPassShader);
    this.lensPass.uniforms.resolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
   // this.composer.addPass(this.lensPass);
    
    // Create separate scene for orbit lines (will be rendered after effects)
    this.orbitLinesScene = new THREE.Scene();
    
    // Don't add orbit lines pass to composer - we'll render them separately after
    
    this.initialized = true;
  }
  
  /**
   * Set orbit lines to render separately (after LensPass)
   */
  setOrbitLines(orbitLines) {
    if (!this.orbitLinesScene) return;
    
    // Clear previous orbit lines
    while (this.orbitLinesScene.children.length > 0) {
      this.orbitLinesScene.remove(this.orbitLinesScene.children[0]);
    }
    
    // Add orbit lines to separate scene
    if (orbitLines) {
      orbitLines.forEach(line => {
        if (line) {
          this.orbitLinesScene.add(line);
        }
      });
    }
  }

  /**
   * Update lens pass with planet positions
   */
  updateLensPass(planetPositions, masses, count) {
    if (!this.lensPass) return;
    
    this.lensPass.uniforms.planetCount.value = count;
    
    // Update positions array
    if (!this.lensPass.uniforms.planetPositions.value) {
      this.lensPass.uniforms.planetPositions.value = new Float32Array(16);
    }
    if (planetPositions) {
      for (let i = 0; i < Math.min(planetPositions.length, 16); i++) {
        this.lensPass.uniforms.planetPositions.value[i] = planetPositions[i];
      }
    }
    
    // Update masses array
    if (!this.lensPass.uniforms.masses.value) {
      this.lensPass.uniforms.masses.value = new Float32Array(8);
    }
    if (masses) {
      for (let i = 0; i < Math.min(masses.length, 8); i++) {
        this.lensPass.uniforms.masses.value[i] = masses[i];
      }
    }
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    if (!this.composer) return;
    
    this.composer.setSize(width, height);
    
    if (this.lensPass) {
      this.lensPass.uniforms.resolution.value.set(width, height);
    }
  }

  /**
   * Render with effects
   */
  render() {
    if (this.composer) {
      // Render scene with effects (LensPass, Bloom, etc.)
      this.composer.render();
      
      // Render orbit lines directly after composer (they won't be affected by LensPass)
      if (this.orbitLinesScene && this.orbitLinesScene.children.length > 0) {
        // Save renderer state
        const currentRenderTarget = this.renderer.getRenderTarget();
        const autoClear = this.renderer.autoClear;
        const autoClearColor = this.renderer.autoClearColor;
        const autoClearDepth = this.renderer.autoClearDepth;
        
        // Disable clearing to render on top
        this.renderer.autoClear = false;
        this.renderer.autoClearColor = false;
        this.renderer.autoClearDepth = false;
        
        // Render orbit lines directly to screen (on top of composer output)
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.orbitLinesScene, this.camera);
        
        // Restore renderer state
        this.renderer.autoClear = autoClear;
        this.renderer.autoClearColor = autoClearColor;
        this.renderer.autoClearDepth = autoClearDepth;
        this.renderer.setRenderTarget(currentRenderTarget);
      }
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
}

