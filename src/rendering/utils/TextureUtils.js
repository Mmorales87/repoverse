import * as THREE from 'three';

/**
 * Cache for loaded texture sets
 * @type {Map<string, Promise<Object>>}
 */
const textureSetCache = new Map();

/**
 * Cache for individual textures
 * @type {Map<string, THREE.Texture>}
 */
const textureCache = new Map();

/**
 * Pre-loaded fallback textures (most common ones)
 * @type {Map<number, THREE.Texture>}
 */
const preloadedFallbackTextures = new Map();

/**
 * Pre-load common fallback textures for immediate availability
 * @param {THREE.TextureLoader} textureLoader 
 */
export function preloadCommonTextures(textureLoader) {
  // Pre-load first 4 most common textures (they're used most frequently)
  for (let i = 1; i <= 4; i++) {
    const path = `${import.meta.env.BASE_URL}textures/2k_planet${i}.jpg`;
    textureLoader.load(
      path,
      (texture) => {
        configureTexture(texture, 4, false);
        preloadedFallbackTextures.set(i, texture);
      },
      undefined,
      (error) => {
        console.warn(`[TextureUtils] Could not preload texture ${i}:`, error);
      }
    );
  }
}

/**
 * List of available enhanced materials (detected from filesystem)
 * This will be populated when we scan the enhanced folder
 */
let availableMaterials = null;

/**
 * Get list of available enhanced materials
 * For now, we'll use a hardcoded list based on what we know exists
 * In the future, this could scan the filesystem
 * @returns {string[]} Array of material names
 */
export function getAvailableMaterials() {
  if (availableMaterials) return availableMaterials;
  
  // List of materials we know exist in enhanced/ folder
  availableMaterials = [
    'aerial_rocks_01',
    'aerial_rocks_02',
    'coast_sand_rocks_02',
    'rock_04',
    'rock_boulder_cracked',
    'rock_boulder_dry',
    'rock_face_03'
  ];
  
  return availableMaterials;
}

/**
 * Configure texture with standard settings
 * @param {THREE.Texture} texture 
 * @param {number} anisotropy 
 * @param {boolean} isEnhanced - If true, use ClampToEdgeWrapping for better sphere mapping
 */
function configureTexture(texture, anisotropy = 8, isEnhanced = false) {
  // For enhanced textures (from Poly Haven), use ClampToEdge to avoid distortion at poles
  // For regular textures, use RepeatWrapping as before
  if (isEnhanced) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
}

/**
 * Load a single texture with caching
 * @param {THREE.TextureLoader} textureLoader 
 * @param {string} path 
 * @param {number} anisotropy 
 * @param {boolean} isEnhanced - If true, configure for enhanced textures
 * @returns {Promise<THREE.Texture>}
 */
function loadTexture(textureLoader, path, anisotropy = 8, isEnhanced = false) {
  // Check cache first
  if (textureCache.has(path)) {
    return Promise.resolve(textureCache.get(path));
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (texture) => {
        configureTexture(texture, anisotropy, isEnhanced);
        textureCache.set(path, texture);
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Load enhanced texture set from Poly Haven materials
 * @param {string} materialName - Base name of the material (e.g., 'rock_face_03')
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader instance
 * @returns {Promise<Object>} Object with diffuse, normal, roughness, and displacement textures
 */
export async function loadEnhancedTextureSet(materialName, textureLoader) {
  const cacheKey = `enhanced_${materialName}`;
  
  // Check cache
  if (textureSetCache.has(cacheKey)) {
    return textureSetCache.get(cacheKey);
  }

  const basePath = `${import.meta.env.BASE_URL}textures/enhanced/`;
  const baseName = `${materialName}_1k`;
  
  // Create promise for loading all textures
  const loadPromise = (async () => {
    const textures = {
      diffuse: null,
      normal: null,
      roughness: null,
      displacement: null
    };

    try {
      // Load diffuse (required) - pattern: {materialName}_diff_1k.jpg
      const diffusePath = `${basePath}${materialName}_diff_1k.jpg`;
      textures.diffuse = await loadTexture(textureLoader, diffusePath, 8, true); // isEnhanced = true
    } catch (error) {
      console.warn(`[TextureUtils] Could not load diffuse for ${materialName}:`, error);
      throw error; // If diffuse fails, we can't use this material
    }

    // Load normal map (optional but recommended)
    try {
      // Try PNG first, then JPG
      const normalPathPNG = `${basePath}${materialName}_nor_gl_1k.png`;
      textures.normal = await loadTexture(textureLoader, normalPathPNG, 8, true);
    } catch (error) {
      try {
        const normalPathJPG = `${basePath}${materialName}_nor_gl_1k.jpg`;
        textures.normal = await loadTexture(textureLoader, normalPathJPG, 8, true);
      } catch (error2) {
        console.warn(`[TextureUtils] Could not load normal map for ${materialName}:`, error2);
        // Normal map is optional, continue without it
      }
    }

    // Load roughness map (optional)
    try {
      // Try PNG first, then JPG
      const roughPathPNG = `${basePath}${materialName}_rough_1k.png`;
      textures.roughness = await loadTexture(textureLoader, roughPathPNG, 8, true);
    } catch (error) {
      try {
        const roughPathJPG = `${basePath}${materialName}_rough_1k.jpg`;
        textures.roughness = await loadTexture(textureLoader, roughPathJPG, 8, true);
      } catch (error2) {
        console.warn(`[TextureUtils] Could not load roughness map for ${materialName}:`, error2);
        // Roughness is optional, continue without it
      }
    }

    // Load displacement map (optional, requires more geometry)
    try {
      const dispPath = `${basePath}${materialName}_disp_1k.png`;
      textures.displacement = await loadTexture(textureLoader, dispPath, 8, true);
    } catch (error) {
      // Displacement is optional, continue without it
    }

    return textures;
  })();

  // Cache the promise
  textureSetCache.set(cacheKey, loadPromise);
  
  return loadPromise;
}

/**
 * Get a random enhanced material name from available materials
 * @param {number} seed - Optional seed for deterministic selection
 * @returns {string} Material name
 */
export function getRandomEnhancedMaterial(seed = null) {
  const materials = getAvailableMaterials();
  if (materials.length === 0) return null;
  
  if (seed !== null) {
    // Deterministic selection based on seed
    return materials[seed % materials.length];
  }
  
  // Random selection
  return materials[Math.floor(Math.random() * materials.length)];
}

/**
 * Get enhanced material by index (deterministic)
 * @param {number} index 
 * @returns {string} Material name
 */
export function getEnhancedMaterialByIndex(index) {
  const materials = getAvailableMaterials();
  if (materials.length === 0) return null;
  return materials[index % materials.length];
}

/**
 * Check if enhanced materials are available
 * @returns {boolean}
 */
export function hasEnhancedMaterials() {
  return getAvailableMaterials().length > 0;
}

/**
 * Load fallback texture (old 2k_planet*.jpg format)
 * Uses pre-loaded textures if available for instant access
 * @param {THREE.TextureLoader} textureLoader 
 * @param {number} textureIndex 
 * @returns {Promise<THREE.Texture>}
 */
export async function loadFallbackTexture(textureLoader, textureIndex) {
  // Check pre-loaded textures first (instant access)
  if (preloadedFallbackTextures.has(textureIndex)) {
    return Promise.resolve(preloadedFallbackTextures.get(textureIndex));
  }
  
  // Otherwise load normally
  const path = `${import.meta.env.BASE_URL}textures/2k_planet${textureIndex}.jpg`;
  return loadTexture(textureLoader, path, 4, false);
}
