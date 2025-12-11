import * as THREE from 'three';

/**
 * PlanetMaterial - Extended MeshStandardMaterial with dynamic language-based tinting
 * Uses onBeforeCompile to modify the shader and apply tinting while preserving
 * normal maps, roughness, and other PBR properties
 */
export class PlanetMaterial extends THREE.MeshStandardMaterial {
  constructor(options = {}) {
    // Ensure we have a visible color
    const defaultColor = options.color || 0xffffff;
    super({
      ...options,
      color: defaultColor
    });
    
    // Language tint color (RGB vector)
    this.languageTint = options.languageTint ? new THREE.Color(options.languageTint) : new THREE.Color(defaultColor);
    
    // Tint strength (0.0 = no tint, 1.0 = full tint)
    this.tintStrength = options.tintStrength !== undefined ? options.tintStrength : 0.4;
    
    // Store original onBeforeCompile if it exists
    this._originalOnBeforeCompile = this.onBeforeCompile;
    
    // Modify shader to apply tinting
    this.onBeforeCompile = (shader) => {
      // Call original onBeforeCompile if it exists
      if (this._originalOnBeforeCompile) {
        this._originalOnBeforeCompile(shader);
      }
      
      // Add uniform for language tint
      shader.uniforms.uLanguageTint = { value: new THREE.Vector3() };
      shader.uniforms.uTintStrength = { value: this.tintStrength };
      
      // Inject tinting code after map_fragment but before lighting
      // This ensures the tint is applied to the final diffuse color
      const mapFragmentIndex = shader.fragmentShader.indexOf('#include <map_fragment>');
      
      if (mapFragmentIndex !== -1) {
        // Find the end of map_fragment include
        const afterMapIndex = shader.fragmentShader.indexOf('\n', mapFragmentIndex);
        if (afterMapIndex !== -1) {
          const beforeMap = shader.fragmentShader.substring(0, afterMapIndex + 1);
          const afterMap = shader.fragmentShader.substring(afterMapIndex + 1);
          
          // Inject tinting code right after map_fragment
          const tintingCode = `
            // Apply language-based tinting while preserving detail
            vec3 languageTint = uLanguageTint;
            diffuseColor.rgb = mix(diffuseColor.rgb, languageTint, uTintStrength);
          `;
          
          shader.fragmentShader = beforeMap + tintingCode + afterMap;
        }
      } else {
        // Fallback: inject before lighting calculations
        const lightingIndex = shader.fragmentShader.indexOf('#include <lights_physical_fragment>');
        
        if (lightingIndex !== -1) {
          const beforeLighting = shader.fragmentShader.substring(0, lightingIndex);
          const afterLighting = shader.fragmentShader.substring(lightingIndex);
          
          // Inject tinting code before lighting
          const tintingCode = `
            // Apply language-based tinting
            vec3 languageTint = uLanguageTint;
            diffuseColor.rgb = mix(diffuseColor.rgb, languageTint, uTintStrength);
          `;
          
          shader.fragmentShader = beforeLighting + tintingCode + '\n' + afterLighting;
        }
      }
      
      // Store reference to this material for uniform updates
      const materialRef = this;
      
      // Update uniforms when shader is compiled
      const originalOnInit = shader.onInit;
      shader.onInit = (material) => {
        if (originalOnInit) originalOnInit(material);
        
        // Update tint uniform from the material instance
        const tintColor = materialRef.languageTint || materialRef.languageTint;
        if (shader.uniforms.uLanguageTint) {
          shader.uniforms.uLanguageTint.value.set(
            tintColor.r,
            tintColor.g,
            tintColor.b
          );
        }
        if (shader.uniforms.uTintStrength) {
          shader.uniforms.uTintStrength.value = materialRef.tintStrength;
        }
      };
      
      // Store uniforms reference for later updates
      this._shaderUniforms = shader.uniforms;
    };
  }
  
  /**
   * Set language tint color
   * @param {THREE.Color|number|string} color 
   */
  setLanguageTint(color) {
    if (color instanceof THREE.Color) {
      this.languageTint.copy(color);
    } else {
      this.languageTint.set(color);
    }
    
    // Update uniform if shader is already compiled
    if (this._shaderUniforms && this._shaderUniforms.uLanguageTint) {
      const tint = this.languageTint;
      this._shaderUniforms.uLanguageTint.value.set(tint.r, tint.g, tint.b);
    }
    
    this.needsUpdate = true;
  }
  
  /**
   * Set tint strength
   * @param {number} strength 
   */
  setTintStrength(strength) {
    this.tintStrength = THREE.MathUtils.clamp(strength, 0, 1);
    
    // Update uniform if shader is already compiled
    if (this._shaderUniforms && this._shaderUniforms.uTintStrength) {
      this._shaderUniforms.uTintStrength.value = this.tintStrength;
    }
    
    this.needsUpdate = true;
  }
  
  /**
   * Clone this material
   * @returns {PlanetMaterial}
   */
  clone() {
    const cloned = new PlanetMaterial({
      languageTint: this.languageTint.clone(),
      tintStrength: this.tintStrength
    });
    cloned.copy(this);
    cloned.languageTint = this.languageTint.clone();
    cloned.tintStrength = this.tintStrength;
    return cloned;
  }
  
  /**
   * Copy properties from another material
   * @param {PlanetMaterial} source 
   */
  copy(source) {
    super.copy(source);
    
    if (source instanceof PlanetMaterial) {
      this.languageTint = source.languageTint.clone();
      this.tintStrength = source.tintStrength;
    }
    
    return this;
  }
}
