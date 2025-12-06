/**
 * Galaxy Background - OGL WebGL shader implementation
 * Based on reactbits.dev / OGL Galaxy with planet gravity effects
 */

export class GalaxyRenderer {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.vertexBuffer = null;
    this.time = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.targetMouseX = 0.5;
    this.targetMouseY = 0.5;
    
    // Galaxy props (defaults from spec)
    this.props = {
      density: 0.4,
      glowIntensity: 0.1,
      saturation: 0.2,
      hueShift: 200,
      twinkleIntensity: 0.7,
      rotationSpeed: 0.1,
      repulsionStrength: 3,
      starSpeed: 0.2,
      speed: 1
    };
    
    // Planet uniforms (for gravity effect)
    this.planetCount = 0;
    this.planetPositions = new Float32Array(16); // 8 planets * 2 (x, y)
    this.planetMasses = new Float32Array(8);
    
    this.animationId = null;
  }

  /**
   * Initialize Galaxy canvas and WebGL context
   * Implements IBackground.initialize()
   */
  async initialize() {
    console.log('[GALAXY] Starting initialization...');
    
    try {
      // Create canvas
      console.log('[GALAXY] Creating canvas element...');
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'galaxy-canvas';
      this.canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
      `;
      
      this.container.appendChild(this.canvas);
      console.log('[GALAXY] ✅ Canvas created and appended');
      
      // Set canvas size
      this._resizeCanvas();
      window.addEventListener('resize', () => this._resizeCanvas());
      console.log(`[GALAXY] Canvas size: ${this.canvas.width}x${this.canvas.height}`);
      
      // Get WebGL context
      console.log('[GALAXY] Getting WebGL context...');
      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      if (!this.gl) {
        console.error('[GALAXY] ❌ WebGL not supported');
        return;
      }
      console.log('[GALAXY] ✅ WebGL context obtained');
      
      // Setup mouse tracking
      this.setupMouseTracking();
      
      // Create shader program
      console.log('[GALAXY] Creating shader program...');
      this.createShaderProgram();
      
      if (!this.program) {
        console.error('[GALAXY] ❌ Shader program creation failed');
        throw new Error('Galaxy shader compilation failed');
      }
      console.log('[GALAXY] ✅ Shader program created');
      
      // Start animation
      console.log('[GALAXY] Starting animation loop...');
      this.animate();
      console.log('[GALAXY] ✅ Initialization complete');
    } catch (error) {
      console.error('[GALAXY] ❌ Error during initialization:', error);
      console.error('[GALAXY] Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Resize canvas (internal method)
   */
  _resizeCanvas() {
    if (!this.canvas) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Setup mouse tracking
   */
  setupMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    });
  }

  /**
   * Create WebGL shader program
   */
  createShaderProgram() {
    const gl = this.gl;
    if (!gl) {
      console.error('[GALAXY] No WebGL context available');
      return;
    }
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    
    // Fragment shader with planet gravity effect
    const fragmentShaderSource = `
      precision mediump float;
      
      #define MAX_PLANETS 8
      #define MAX_STARS 500
      #define MAX_NEBULAS 3
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      // Planet gravity uniforms
      uniform int u_planetCount;
      uniform vec2 u_planetPos[MAX_PLANETS];
      uniform float u_planetMass[MAX_PLANETS];
      
      // Galaxy props
      uniform float u_density;
      uniform float u_glowIntensity;
      uniform float u_saturation;
      uniform float u_hueShift;
      uniform float u_twinkleIntensity;
      uniform float u_rotationSpeed;
      uniform float u_repulsionStrength;
      uniform float u_starSpeed;
      uniform float u_speed;
      
      varying vec2 v_uv;
      
      // Simple noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec2 uv = v_uv;
        vec2 screenPos = uv * u_resolution;
        
        // Apply planet gravity repulsion
        vec2 gravityOffset = vec2(0.0);
        float eps = 0.01;
        
        for (int i = 0; i < MAX_PLANETS; i++) {
          if (i >= u_planetCount) break;
          
          vec2 planetScreenPos = u_planetPos[i] * u_resolution;
          vec2 dir = normalize(screenPos - planetScreenPos);
          float dist = length(screenPos - planetScreenPos);
          
          if (dist > eps) {
            float mass = u_planetMass[i];
            float strength = clamp(mass * u_repulsionStrength / (dist + eps), 0.0, 0.05);
            gravityOffset += strength * dir;
          }
        }
        
        // Apply mouse repulsion
        vec2 mouseScreenPos = u_mouse * u_resolution;
        vec2 mouseDir = normalize(screenPos - mouseScreenPos);
        float mouseDist = length(screenPos - mouseScreenPos);
        if (mouseDist > eps && mouseDist < 300.0) {
          float mouseRepulsion = u_repulsionStrength / (mouseDist + eps) * 0.1;
          gravityOffset += mouseRepulsion * mouseDir * 0.1;
        }
        
        // Apply offsets to UV
        vec2 distortedUV = uv + gravityOffset / u_resolution;
        
        // Generate stars - use constant loop with break
        float targetStarCount = 500.0 * u_density;
        vec3 color = vec3(0.0, 0.0, 0.011); // Dark blue-black background
        
        for (int i = 0; i < MAX_STARS; i++) {
          if (float(i) >= targetStarCount) break;
          
          float seed = float(i) * 137.5; // Golden angle
          vec2 starPos = vec2(
            fract(seed * 0.618),
            fract(seed * 0.382)
          );
          
          // Apply rotation
          float angle = u_time * u_rotationSpeed * u_speed;
          float cosA = cos(angle);
          float sinA = sin(angle);
          vec2 rotatedPos = vec2(
            starPos.x * cosA - starPos.y * sinA,
            starPos.x * sinA + starPos.y * cosA
          );
          
          vec2 starUV = rotatedPos;
          float dist = length(distortedUV - starUV);
          
          // Star size and twinkle
          float depth = fract(seed * 0.5);
          float size = 0.002 + (1.0 - depth) * 0.004;
          float twinkle = sin(u_time * u_starSpeed * u_speed + seed) * 0.5 + 0.5;
          float opacity = (0.5 + depth * 0.3) + (twinkle * u_twinkleIntensity * 0.3);
          
          // Color with hue shift
          float hue = fract((seed * 0.1 + u_time * u_rotationSpeed * u_speed) + u_hueShift / 360.0);
          vec3 starColor = hsv2rgb(vec3(hue, u_saturation, 0.6 + twinkle * 0.3));
          
          // Draw star
          float star = 1.0 - smoothstep(0.0, size, dist);
          color += starColor * star * opacity;
          
          // Glow for larger stars
          if (size > 0.003 && u_glowIntensity > 0.0) {
            float glowSize = size * (2.0 + u_glowIntensity * 3.0);
            float glow = 1.0 - smoothstep(0.0, glowSize, dist);
            color += starColor * glow * u_glowIntensity * opacity * 0.3;
          }
        }
        
        // Subtle nebula clouds - use constant loop
        for (int i = 0; i < MAX_NEBULAS; i++) {
          float seed = float(i) * 1000.0;
          vec2 cloudPos = vec2(
            fract(seed * 0.3),
            fract(seed * 0.7)
          );
          
          float cloudDist = length(distortedUV - cloudPos);
          float cloudRadius = 0.15;
          float cloud = 1.0 - smoothstep(0.0, cloudRadius, cloudDist);
          
          float hue = fract((u_hueShift / 360.0 + float(i) * 0.1 + u_time * 0.05 * u_speed));
          vec3 cloudColor = hsv2rgb(vec3(hue, 0.2, 0.3));
          float cloudOpacity = 0.05 + sin(u_time * 0.1 * u_speed + seed) * 0.02;
          
          color = mix(color, cloudColor, cloud * cloudOpacity);
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Compile shaders
    console.log('[GALAXY] Compiling vertex shader...');
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) {
      console.error('[GALAXY] ❌ Vertex shader compilation failed');
      return;
    }
    console.log('[GALAXY] ✅ Vertex shader compiled');
    
    console.log('[GALAXY] Compiling fragment shader...');
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!fragmentShader) {
      console.error('[GALAXY] ❌ Fragment shader compilation failed');
      gl.deleteShader(vertexShader);
      return;
    }
    console.log('[GALAXY] ✅ Fragment shader compiled');
    
    // Create program
    console.log('[GALAXY] Creating and linking program...');
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('[GALAXY] ❌ Program link error:', gl.getProgramInfoLog(this.program));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(this.program);
      this.program = null;
      return;
    }
    console.log('[GALAXY] ✅ Program linked successfully');
    
    // Create quad for fullscreen
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);
    
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Get attribute and uniform locations
    this.attribLocations = {
      position: gl.getAttribLocation(this.program, 'a_position')
    };
    
    // Get uniform locations - handle arrays properly for WebGL
    console.log('[GALAXY] Getting uniform locations...');
    this.uniformLocations = {
      time: gl.getUniformLocation(this.program, 'u_time'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      mouse: gl.getUniformLocation(this.program, 'u_mouse'),
      planetCount: gl.getUniformLocation(this.program, 'u_planetCount'),
      // For arrays, get location for first element
      planetPos: gl.getUniformLocation(this.program, 'u_planetPos[0]'),
      planetMass: gl.getUniformLocation(this.program, 'u_planetMass[0]'),
      density: gl.getUniformLocation(this.program, 'u_density'),
      glowIntensity: gl.getUniformLocation(this.program, 'u_glowIntensity'),
      saturation: gl.getUniformLocation(this.program, 'u_saturation'),
      hueShift: gl.getUniformLocation(this.program, 'u_hueShift'),
      twinkleIntensity: gl.getUniformLocation(this.program, 'u_twinkleIntensity'),
      rotationSpeed: gl.getUniformLocation(this.program, 'u_rotationSpeed'),
      repulsionStrength: gl.getUniformLocation(this.program, 'u_repulsionStrength'),
      starSpeed: gl.getUniformLocation(this.program, 'u_starSpeed'),
      speed: gl.getUniformLocation(this.program, 'u_speed')
    };
    
    // Validate critical uniforms
    if (!this.uniformLocations.time || !this.uniformLocations.resolution) {
      console.warn('[GALAXY] ⚠️ Some uniform locations are null');
    }
    console.log('[GALAXY] ✅ Uniform locations obtained');
  }

  /**
   * Compile shader
   */
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  /**
   * Update planet positions (screen space, normalized 0-1)
   * Required for IBackground interface
   */
  updatePlanets(positions, masses, count) {
    this.planetCount = Math.min(count, 8);
    
    if (positions) {
      for (let i = 0; i < Math.min(positions.length, 16); i++) {
        this.planetPositions[i] = positions[i];
      }
    }
    
    if (masses) {
      for (let i = 0; i < Math.min(masses.length, 8); i++) {
        this.planetMasses[i] = masses[i];
      }
    }
  }

  /**
   * Update props
   */
  updateProps(props) {
    this.props = { ...this.props, ...props };
  }

  /**
   * Highlight at screen position
   * Implements IBackground.highlightAt()
   */
  highlightAt(screenX, screenY) {
    this.targetMouseX = screenX / window.innerWidth;
    this.targetMouseY = screenY / window.innerHeight;
  }

  /**
   * Resize handler
   */
  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      if (this.gl) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  /**
   * Update method (implements IBackground)
   */
  update(deltaTime) {
    // Galaxy updates in its own animation loop
    // This method is for interface compliance
  }

  /**
   * Render frame
   */
  render() {
    if (!this.gl || !this.program) {
      // Silently fail - Galaxy is optional
      return;
    }
    
    const gl = this.gl;
    
    // Smooth mouse interpolation
    this.targetMouseX += (this.mouseX - this.targetMouseX) * 0.05;
    this.targetMouseY += (this.mouseY - this.targetMouseY) * 0.05;
    
    // Clear
    gl.clearColor(0.0, 0.0, 0.011, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use program
    gl.useProgram(this.program);
    
    // Set uniforms
    gl.uniform1f(this.uniformLocations.time, this.time);
    gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniformLocations.mouse, this.targetMouseX, this.targetMouseY);
    
    gl.uniform1i(this.uniformLocations.planetCount, this.planetCount);
    // Use uniform2fv and uniform1fv for arrays - they handle the array correctly
    if (this.uniformLocations.planetPos) {
      gl.uniform2fv(this.uniformLocations.planetPos, this.planetPositions);
    }
    if (this.uniformLocations.planetMass) {
      gl.uniform1fv(this.uniformLocations.planetMass, this.planetMasses);
    }
    
    gl.uniform1f(this.uniformLocations.density, this.props.density);
    gl.uniform1f(this.uniformLocations.glowIntensity, this.props.glowIntensity);
    gl.uniform1f(this.uniformLocations.saturation, this.props.saturation);
    gl.uniform1f(this.uniformLocations.hueShift, this.props.hueShift);
    gl.uniform1f(this.uniformLocations.twinkleIntensity, this.props.twinkleIntensity);
    gl.uniform1f(this.uniformLocations.rotationSpeed, this.props.rotationSpeed);
    gl.uniform1f(this.uniformLocations.repulsionStrength, this.props.repulsionStrength);
    gl.uniform1f(this.uniformLocations.starSpeed, this.props.starSpeed);
    gl.uniform1f(this.uniformLocations.speed, this.props.speed);
    
    // Draw quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.attribLocations.position);
    gl.vertexAttribPointer(this.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.gl || !this.program) {
      // Stop animation if WebGL context is lost
      return;
    }
    
    try {
      this.time += 0.016; // ~60fps
      this.render();
      this.animationId = requestAnimationFrame(() => this.animate());
    } catch (error) {
      console.error('[GALAXY] Error in animation loop:', error);
      // Stop animation on error
    }
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}

