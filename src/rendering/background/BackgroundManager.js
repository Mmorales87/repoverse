import * as THREE from 'three';

/**
 * Background Manager - Dynamic starfield with parallax and nebulae
 */
export class BackgroundManager {
  constructor(scene) {
    this.scene = scene;
    this.starfield = null;
    this.nebulaMesh = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  /**
   * Initialize background
   */
  initialize() {
    this.createStarfield();
    this.createNebula();
    this.setupMouseTracking();
  }

  /**
   * Create starfield using instanced points
   */
  createStarfield() {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      // Random position in sphere
      const radius = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random color (white to blue-white)
      const color = new THREE.Color();
      color.setHSL(0.6, 0.1, 0.5 + Math.random() * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random size
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('instanceColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        uniform float time;
        
        void main() {
          vInstanceColor = instanceColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vInstanceColor;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          gl_FragColor = vec4(vInstanceColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: false
    });
    
    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  /**
   * Create procedural nebula
   */
  createNebula() {
    const geometry = new THREE.PlaneGeometry(500, 500, 50, 50);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouseX: { value: 0 },
        mouseY: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float mouseX;
        uniform float mouseY;
        varying vec2 vUv;
        
        // Simple noise function
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          vec2 uv = vUv;
          uv += vec2(mouseX * 0.1, mouseY * 0.1);
          
          float n = fbm(uv * 2.0 + time * 0.1);
          vec3 color1 = vec3(0.1, 0.05, 0.2);
          vec3 color2 = vec3(0.2, 0.1, 0.3);
          vec3 color = mix(color1, color2, n);
          
          gl_FragColor = vec4(color, 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.nebulaMesh = new THREE.Mesh(geometry, material);
    this.nebulaMesh.rotation.x = -Math.PI / 2;
    this.nebulaMesh.position.z = -200;
    this.scene.add(this.nebulaMesh);
  }

  /**
   * Setup mouse tracking
   */
  setupMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  /**
   * Update background (call in animation loop)
   */
  update() {
    // Smooth mouse tracking
    this.targetX += (this.mouseX - this.targetX) * 0.05;
    this.targetY += (this.mouseY - this.targetY) * 0.05;
    
    // Update starfield parallax
    if (this.starfield) {
      this.starfield.rotation.y += this.targetX * 0.0001;
      this.starfield.rotation.x += this.targetY * 0.0001;
      
      if (this.starfield.material.uniforms) {
        this.starfield.material.uniforms.time.value += 0.01;
      }
    }
    
    // Update nebula
    if (this.nebulaMesh && this.nebulaMesh.material.uniforms) {
      this.nebulaMesh.material.uniforms.time.value += 0.01;
      this.nebulaMesh.material.uniforms.mouseX.value = this.targetX;
      this.nebulaMesh.material.uniforms.mouseY.value = this.targetY;
    }
  }

  /**
   * Highlight at screen position (for hover cards)
   */
  highlightAt(screenX, screenY) {
    // Convert screen coords to normalized device coords
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;
    
    // Update target for smooth highlight effect
    this.targetX = ndcX * 0.5;
    this.targetY = ndcY * 0.5;
    
    // Could also add glow effect to nearby stars
    // For now, just update parallax target
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.starfield) {
      this.scene.remove(this.starfield);
      this.starfield.geometry.dispose();
      this.starfield.material.dispose();
    }
    
    if (this.nebulaMesh) {
      this.scene.remove(this.nebulaMesh);
      this.nebulaMesh.geometry.dispose();
      this.nebulaMesh.material.dispose();
    }
  }
}

