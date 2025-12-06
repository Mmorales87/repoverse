/**
 * Starfield Fallback - Simple procedural starfield when Galaxy shader fails
 * Uses Three.js Points for performance
 */
import * as THREE from 'three';

import { IBackground } from '../../core/interfaces/IBackground.js';

export class StarfieldFallback extends IBackground {
  constructor(scene) {
    super();
    this.scene = scene;
    this.starfield = null;
    this.time = 0;
  }

  /**
   * Initialize starfield
   */
  initialize() {
    console.log('[STARFIELD] Creating fallback starfield...');
    
    try {
      // Create starfield with procedural generation
      const starCount = 2000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);
      
      // Simple Perlin-like noise seed
      const seed = 12345;
      
      for (let i = 0; i < starCount; i++) {
        // Use golden angle for distribution
        const angle = i * 137.5;
        const radius = 500 + (i % 3) * 200; // Multiple depth layers
        
        // Spherical distribution
        const theta = (angle * 0.618) % (Math.PI * 2);
        const phi = Math.acos((angle * 0.382) % 2 - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Color variation (blue-white stars)
        const hue = (angle * 0.1) % 1.0;
        const brightness = 0.6 + (i % 3) * 0.2;
        const color = this.hsvToRgb(hue, 0.2, brightness);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Size variation
        sizes[i] = 0.5 + (i % 3) * 0.5;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      // Material with twinkling
      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
      });
      
      this.starfield = new THREE.Points(geometry, material);
      this.scene.add(this.starfield);
      
      console.log('[STARFIELD] ✅ Fallback starfield created');
    } catch (error) {
      console.error('[STARFIELD] ❌ Error creating starfield:', error);
    }
  }

  /**
   * Update starfield (simple rotation)
   */
  update(deltaTime) {
    if (!this.starfield) return;
    
    this.time += deltaTime;
    // Slow rotation for depth effect
    this.starfield.rotation.y += 0.0001 * deltaTime;
  }

  /**
   * Highlight at position (implements IBackground)
   */
  highlightAt(x, y) {
    // Starfield doesn't support highlighting, but implements interface
  }

  /**
   * Resize handler
   */
  resize() {
    // Starfield is in 3D space, no resize needed
  }

  /**
   * HSV to RGB conversion
   */
  hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = v - c;
    
    let r, g, b;
    if (h < 1/6) {
      r = c; g = x; b = 0;
    } else if (h < 2/6) {
      r = x; g = c; b = 0;
    } else if (h < 3/6) {
      r = 0; g = c; b = x;
    } else if (h < 4/6) {
      r = 0; g = x; b = c;
    } else if (h < 5/6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return {
      r: (r + m),
      g: (g + m),
      b: (b + m)
    };
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.starfield) {
      this.scene.remove(this.starfield);
      if (this.starfield.geometry) this.starfield.geometry.dispose();
      if (this.starfield.material) this.starfield.material.dispose();
      this.starfield = null;
    }
  }
}

