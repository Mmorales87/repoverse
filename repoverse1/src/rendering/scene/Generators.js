import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Language color palette
 */
const LANGUAGE_COLORS = {
  'Dart': 0x00D4AA,
  'JavaScript': 0xF7DF1E,
  'TypeScript': 0x3178C6,
  'Python': 0x3776AB,
  'Java': 0xED8B00,
  'Kotlin': 0x7F52FF,
  'Swift': 0xFA7343,
  'C#': 0x239120,
  'Go': 0x00ADD8,
  'Rust': 0x000000,
  'C++': 0x00599C,
  'C': 0xA8B9CC,
  'PHP': 0x777BB4,
  'Ruby': 0xCC342D,
  'HTML': 0xE34F26,
  'CSS': 0x1572B6,
  'SQL': 0x336791,
  'R': 0x276DC3,
  'Shell': 0x89E051,
  'YAML': 0xCB171E,
  'Solidity': 0xAA6746,
  'ShaderLab': 0x222C37,
  'Jupyter Notebook': 0xDA5B0B,
  'PowerShell': 0x012456,
  'Batchfile': 0xC1F12E,
  'Dockerfile': 0x384D54,
  'Svelte': 0xFF3E00,
  'Vue': 0x41B883,
  'Astro': 0xFF5D01,
  'Markdown': 0x083FA1,
  'MATLAB': 0xE16737,
  'Scala': 0xDC322F,
  'HLSL': 0xAACE60,
  'GLSL': 0x5686A5,
  'JSON': 0x292929,
  'TOML': 0x9C6A5E,
  'Default': 0x4a5f35
};

/**
 * Helper functions
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function log10(x) {
  return Math.log10(x + 1);
}

function log2(x) {
  return Math.log2(x + 1);
}

/**
 * Calculate planet radius based on repository size (weight in KB)
 * EXACT FORMULA: radius = clamp( log10(size + 1) * 0.5, 1.6, 18.0 )
 */
export function calculatePlanetRadius(size) {
  // Size is in KB, use logarithmic scale with appropriate factor
  return clamp(log10(size) * 1.5, 1.6, 18.0);
}

/**
 * Calculate halo intensity based on stars
 */
export function calculateHaloIntensity(stars) {
  return clamp(log10(stars) * 0.6, 0.1, 3.0);
}

/**
 * Calculate number of branches based on branchesCount
 * Always show at least 1 (main/master), up to branchesCount (max 8 for performance)
 */
export function calculateNumBranches(branchesCount) {
  // Ensure at least 1 branch (main/master), but don't exceed actual count or 8
  return Math.min(Math.max(1, branchesCount), 8);
}

/**
 * Calculate orbital speed based on recent activity
 */
export function calculateOrbitalSpeed(commitsLast30, maxCommitsLast30) {
  const normalizedRecent = clamp(
    log10(commitsLast30) / log10(maxCommitsLast30 + 1),
    0,
    1
  );
  return 0.005 + normalizedRecent * 0.005;
}

/**
 * Calculate orbital radius based on repository age and snapshot date
 * EXACT FORMULA: baseRadius = 30, ageFactor = 0.5
 * orbitalRadius = baseRadius + ageFactor * sqrt(daysSinceCreationAtSnapshot)
 * 
 * @param {number} daysSinceCreationAtSnapshot - Days between repo.created_at and snapshotDate
 * @param {number} index - Planet index for spacing
 * @param {string} ageMapping - 'older-farther' (default) or 'older-closer'
 * @param {number} sunSize - Size of the sun to avoid collisions (default: 0, will be calculated if needed)
 * @param {number} planetRadius - Radius of the planet for spacing calculation
 * @param {number} maxEccentricity - Maximum eccentricity expected (default: 0.15)
 */
export function calculateOrbitalRadius(daysSinceCreationAtSnapshot, index, ageMapping = 'older-farther', baseRadius = 30, ageFactor = 0.5, sunSize = 0, planetRadius = 0, maxEccentricity = 0.15) {
  // Base radius from age
  let ageBasedRadius = baseRadius + ageFactor * Math.sqrt(daysSinceCreationAtSnapshot);
  
  // Apply age mapping
  if (ageMapping === 'older-closer') {
    // Invert: older repos closer to sun
    const maxDays = 365 * 10; // Assume max 10 years for normalization
    const normalizedAge = Math.min(daysSinceCreationAtSnapshot / maxDays, 1.0);
    ageBasedRadius = baseRadius + ageFactor * Math.sqrt(maxDays) * (1.0 - normalizedAge);
  }
  
  // Ensure minimum distance from sun (sun size + margin)
  const minDistanceFromSun = sunSize + 15; // Sun radius + safe margin
  if (ageBasedRadius < minDistanceFromSun) {
    ageBasedRadius = minDistanceFromSun;
  }
  
  // Add spacing based on index to ensure unique orbits and prevent collisions
  // Consider maximum orbital radius (apoapsis) when eccentricity is applied
  const maxEccentricityFactor = 1 + maxEccentricity; // e.g., 1.05 for 5% max eccentricity
  const baseSpacing = Math.max(15, planetRadius * 2 * maxEccentricityFactor); // Base spacing considering max orbit radius
  // Increase spacing multiplier for better distribution with many planets
  const spacing = baseSpacing * 0.8; // Increased multiplier for better spacing
  const indexOffset = index * spacing;
  
  // Final radius must account for the maximum reach of elliptical orbit
  const finalRadius = Math.max(ageBasedRadius + indexOffset, minDistanceFromSun + indexOffset);
  
  return finalRadius;
}

/**
 * Calculate visual mass for LensPass effect
 */
export function calculateMass(radius, size) {
  return clamp(radius * (1 + log10(size)), 0.5, 100.0);
}

/**
 * Calculate ring dimensions (FIX for bug: rings outside planet)
 */
export function calculateRingDimensions(planetRadius, branchesCount) {
  const ringInnerGap = Math.max(planetRadius * 0.05, 0.5);
  const ringThickness = clamp(branchesCount * 0.2, 0.5, 6.0);
  const ringInnerRadius = planetRadius + ringInnerGap;
  const ringOuterRadius = ringInnerRadius + ringThickness;
  
  return {
    innerRadius: ringInnerRadius,
    outerRadius: ringOuterRadius,
    thickness: ringThickness
  };
}

/**
 * Calculate branch orbit radius
 */
export function calculateBranchOrbitRadius(planetRadius, branchIndex) {
  const branchBaseGap = Math.max(planetRadius * 0.15, 1.0);
  const branchSpacing = Math.max(planetRadius * 0.12, 0.8);
  return planetRadius + branchBaseGap + branchIndex * branchSpacing;
}

/**
 * Calculate branch size
 */
export function calculateBranchSize(branchesCount, planetRadius, isMainBranch = false) {
  const baseSize = clamp(log2(branchesCount) * 0.4, 0.2, planetRadius * 0.4);
  return isMainBranch ? baseSize * 1.5 : baseSize;
}

/**
 * Get color for language
 */
function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS['Default'];
}

/**
 * Calculate sun size based on total stars
 * EXACT FORMULA: sunSize = clamp( log10(sumStars + 1) * 3, 4, 40 )
 */
export function calculateSunSize(sumStars) {
  return clamp(log10(sumStars) * 300, 4, 40);
}

/**
 * Generate Sun at center (user/organization)
 * NO rings, NO satellites - just the sun and subtle particles
 */
export function generateSun(userData = {}, sumStars = 0) {
  const sunGroup = new THREE.Group();
  
  // Calculate sun size based on total stars
  const sunSize = calculateSunSize(sumStars);
  
  // Main sun sphere
  const sunGeometry = new THREE.SphereGeometry(sunSize, 32, 32);
  
  // Load sun texture (8K for best quality on central object)
  const textureLoader = new THREE.TextureLoader();
  let sunTexture = null;
  
  try {
    // Load 8K texture (best quality for central object)
    sunTexture = textureLoader.load('/textures/8k_sun.jpg', 
      (texture) => {
        // Texture loaded successfully
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16; // High quality filtering
      },
      undefined,
      (error) => {
        // If 8K fails, try 2K as fallback
        console.warn('[GENERATORS] 8K sun texture failed, trying 2K:', error);
        textureLoader.load('/textures/2k_sun.jpg',
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 8;
            sunTexture = texture; // Update reference
            sunMaterial.map = texture;
            sunMaterial.emissiveMap = texture;
            sunMaterial.needsUpdate = true;
          },
          undefined,
          (error2) => {
            console.warn('[GENERATORS] Could not load sun texture:', error2);
          }
        );
      }
    );
  } catch (error) {
    console.warn('[GENERATORS] Could not load sun texture:', error);
  }
  
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFD700,
    emissiveIntensity: 0.8,
    map: sunTexture || null, // Apply texture if loaded
    emissiveMap: sunTexture || null // Use same texture for emission
  });
  
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sunGroup.add(sun);
  
  // Subtle particles around sun (NOT satellites, just glow effect)
  const particleCount = 20;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Particles very close to sun surface, not orbiting
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = sunSize * 1.1 + Math.random() * 0.2; // Very close to sun
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xFFD700,
    size: 0.15,
    transparent: true,
    opacity: 0.4
  });
  const particleSystem = new THREE.Points(particles, particleMaterial);
  sunGroup.add(particleSystem);
  
  return sunGroup;
}

/**
 * Simple hash function for deterministic texture selection
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate planet for repository
 */
export function generatePlanet(repo, index) {
  const planetGroup = new THREE.Group();
  
  // Use repository size (weight in KB) instead of totalCommits
  const size = repo.size || 0;
  const radius = calculatePlanetRadius(size);
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  
  const language = repo.language || 'Default';
  const color = getLanguageColor(language);
  
  // Select texture deterministically based on repo name (1-8)
  const textureIndex = (hashString(repo.name) % 8) + 1;
  const texturePath = `/textures/2k_planet${textureIndex}.jpg`;
  
  const textureLoader = new THREE.TextureLoader();
  
  // Create material with language color as base (not white, to avoid transparency)
  // The texture will be applied on top with color multiplication
  const material = new THREE.MeshStandardMaterial({
    color: color, // Language color as base (will be multiplied with texture)
    emissive: color, // Language color as subtle emissive tint
    emissiveIntensity: 1.4, // Subtle emissive glow
    transparent: false, // Not transparent
    opacity: 1.0 // Fully opaque
  });
  
  // Load texture and apply it (texture will tint the base color)
  textureLoader.load(
    texturePath,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4; // Better texture quality
      material.map = texture;
      // Use texture as emissiveMap too for better visibility
      material.emissiveMap = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.warn(`[GENERATORS] Could not load planet texture ${textureIndex}:`, error);
      // If texture fails, ensure material is still visible
      material.color.setHex(color);
      material.emissive.setHex(color);
    }
  );
  
  const planet = new THREE.Mesh(geometry, material);
  planet.userData = {
    repo: repo,
    radius: radius,
    mass: calculateMass(radius, size)
  };
  
  planetGroup.add(planet);
  
  return planetGroup;
}


/**
 * Generate branches for repository (branches)
 * Main/master branch is larger, brighter, and has moon texture
 * All branches use moon texture, but main is brighter
 */
export function generateBranches(repo, planetRadius) {
  const branches = [];
  const branchesCount = repo.branchesCount || 1;
  const numBranches = calculateNumBranches(branchesCount);
  
  if (numBranches === 0) return branches;
  
  const defaultBranch = repo.defaultBranch || 'main';
  const textureLoader = new THREE.TextureLoader();
  
  // Load moon texture - will be used for all branches
  let moonTexture = null;
  textureLoader.load(
    '/textures/2k_moon.jpg',
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      moonTexture = texture;
      // Update all branch materials with texture
      branches.forEach((branch) => {
        if (branch.material) {
          branch.material.map = moonTexture;
          branch.material.emissiveMap = moonTexture;
          branch.material.needsUpdate = true;
        }
      });
    },
    undefined,
    (error) => {
      console.warn('[GENERATORS] Could not load moon texture:', error);
    }
  );
  
  for (let i = 0; i < numBranches; i++) {
    const isMainBranch = i === 0; // First branch is main/master
    const branchOrbitRadius = calculateBranchOrbitRadius(planetRadius, i);
    const branchSize = calculateBranchSize(branchesCount, planetRadius, isMainBranch);
    
    const geometry = new THREE.SphereGeometry(branchSize, 16, 16);
    
    // Main/master branch: white/gold, brighter, with texture
    // Other branches: grey, less bright, same texture but more muted
    let branchColor, emissiveIntensity, opacity;
    if (isMainBranch) {
      branchColor = 0xFFF8DC; // Cornsilk/white-gold
      emissiveIntensity = 0.6;
      opacity = 1.0;
    } else {
      branchColor = 0xAAAAAA; // Grey
      emissiveIntensity = 0.2;
      opacity = 1.0; // More muted/appagada
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: branchColor,
      emissive: branchColor,
      emissiveIntensity: emissiveIntensity,
      map: moonTexture || null, // All branches use moon texture
      emissiveMap: moonTexture || null,
      transparent: !isMainBranch, // Other branches are semi-transparent
      opacity: opacity
    });
    
    const branch = new THREE.Mesh(geometry, material);
    branch.userData = {
      type: 'branch',
      index: i,
      orbitRadius: branchOrbitRadius,
      orbitSpeed: 1.0 / Math.sqrt(branchOrbitRadius),
      isMainBranch: isMainBranch
    };
    
    branches.push(branch);
  }
  
  return branches;
}

/**
 * Generate PRs as GLTF models (spaceships)
 * Colors: open=orange, merged=green, closed=grey
 */
export function generatePRs(repo, planetRadius, numBranches) {
  const prs = [];
  const prCount = Math.min(repo.openPRs || 0, 10); // Cap at 10 for performance
  
  if (prCount === 0) return prs;
  
  // Calculate orbit radius (outside branches)
  const lastBranchOrbitRadius = numBranches > 0 
    ? calculateBranchOrbitRadius(planetRadius, numBranches - 1)
    : planetRadius;
  const prBaseGap = Math.max(planetRadius * 0.1, 0.8);
  const prOrbitRadius = lastBranchOrbitRadius + prBaseGap;
  
  const loader = new GLTFLoader();
  const prSize = 1.5;
  
  // Load model once and clone for each PR
  let modelCache = null;
  let loadPromise = null;
  
  const loadModel = () => {
    if (loadPromise) return loadPromise;
    
    loadPromise = new Promise((resolve, reject) => {
      loader.load(
        '/models/PR-Rocket.glb',
        (gltf) => {
          modelCache = gltf.scene;
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.warn('[GENERATORS] Could not load PR model, using fallback:', error);
          resolve(null);
        }
      );
    });
    
    return loadPromise;
  };
  
  // Create PRs with async model loading
  for (let i = 0; i < prCount; i++) {
    const prState = repo.prStates && repo.prStates[i] ? repo.prStates[i] : 'open';
    /* let prColor = 0xFFA500; // Orange for open */
    
    // Create PR object (will be updated when model loads)
    const prGroup = new THREE.Group();
    
    // Fallback geometry if model fails
    const fallbackGeometry = new THREE.SphereGeometry(prSize, 8, 8);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      /* color: prColor,
      emissive: prColor, */
      emissiveIntensity: 0.8
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    prGroup.add(fallbackMesh);
    
    // Try to load and apply model
    loadModel().then((gltf) => {
      if (gltf && modelCache) {
        // Remove fallback
        prGroup.remove(fallbackMesh);
        fallbackGeometry.dispose();
        fallbackMaterial.dispose();
        
        // Clone model
        const prModel = modelCache.clone();
        
        // Preserve original colors and textures, but add emission for visibility (like decorative rocket)
        prModel.traverse((child) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              // Preserve original color but add emission for visibility
              if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial) {
                const originalColor = mat.color ? mat.color.getHex() : 0xFFFFFF;
                mat.color.setHex(originalColor);
                mat.emissive.setHex(originalColor);
                mat.emissiveIntensity = 0.5; // Make it glow so it's visible
              }
            });
          }
        });
        
        // Scale model to appropriate size
        const box = new THREE.Box3().setFromObject(prModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = prSize / maxDim;
        prModel.scale.set(scale, scale, scale);
        
        prGroup.add(prModel);
      }
    });
    
    prGroup.userData = {
      type: 'pr',
      index: i,
      orbitRadius: prOrbitRadius + i * 0.3, // Slight spacing
      orbitSpeed: 1.5 / Math.sqrt(prOrbitRadius),
      state: prState
    };
    
    prs.push(prGroup);
  }
  
  return prs;
}

/**
 * Generate comets (rockets) for recent commits (24-48h)
 * Rockets appear temporarily, cross the system, and disappear
 * Uses GLB model Rocket-Across.glb
 */
export function generateComets(repo, planetRadius, orbitalRadius) {
  const comets = [];
  
  // Check if repo has recent commits
  if (!repo.hasRecentCommits) return comets;
  
  // Create a single rocket/comet per repo with recent activity
  const cometGroup = new THREE.Group();
  
  const loader = new GLTFLoader();
  const cometSize = 2.9; // Size of the rocket
  
  // Load rocket model
  loader.load(
    '/models/comets.glb',
    (gltf) => {
      const rocketModel = gltf.scene;
      
      // Scale model to appropriate size
      const box = new THREE.Box3().setFromObject(rocketModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = cometSize / maxDim;
      rocketModel.scale.set(scale, scale, scale);
      
      // Make all materials transparent initially (will fade in)
      rocketModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat.transparent !== undefined) {
              mat.transparent = true;
              mat.opacity = 0.0; // Start invisible
              mat.userData.baseOpacity = 1.0; // Store base opacity
            }
          });
        }
      });
      
      cometGroup.add(rocketModel);
    },
    undefined,
    (error) => {
      console.warn('[GENERATORS] Could not load rocket model, using fallback:', error);
      // Fallback: simple sphere if model fails
      const fallbackGeometry = new THREE.SphereGeometry(cometSize * 0.5, 16, 16);
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6B35, // Orange-red like rocket
        emissive: 0xFF6B35,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.0
      });
      fallbackMaterial.userData.baseOpacity = 1.0;
      const fallback = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      cometGroup.add(fallback);
    }
  );
  
  // Calculate comet orbit (highly elliptical, crosses the system)
  // Make it travel across the entire system, not just around one planet
  const cometOrbitRadius = orbitalRadius * 2.0; // Far out to cross system
  const cometEccentricity = 0.9; // Very high eccentricity for crossing trajectory
  
  cometGroup.userData = {
    type: 'comet',
    orbitRadius: cometOrbitRadius,
    eccentricity: cometEccentricity,
    orbitSpeed: 1.2 / Math.sqrt(cometOrbitRadius), // Faster to cross quickly
    fadeInTime: 1.5, // 1.5 seconds to fade in
    fadeOutTime: 1.5, // 1.5 seconds to fade out
    visibleDuration: 18.0, // Visible for 8 seconds total
    isVisible: true,
    shouldRemove: false, // Flag to remove from scene
    opacity: 1, // Start invisible, will fade in
    createdAt: Date.now(),
    repoName: repo.name // Store repo name to check if still recent
  };
  
  comets.push(cometGroup);
  
  return comets;
}

/**
 * Generate decorative rockets that cross the system periodically
 * Independent of repositories - like ships or clouds in GitHub City
 */
export function generateDecorativeRocket() {
  const rocketGroup = new THREE.Group();
  
  const loader = new GLTFLoader();
  const rocketSize = 2.2;
  
  loader.load(
    '/models/Rocket-Across.glb',
    (gltf) => {
      const rocketModel = gltf.scene;
      const box = new THREE.Box3().setFromObject(rocketModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = rocketSize / maxDim;
      rocketModel.scale.set(scale, scale, scale);
      
      rocketModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            // Make material visible with emission (like PRs)
            if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial) {
              // Preserve original color but add emission for visibility
              const originalColor = mat.color ? mat.color.getHex() : 0xFFFFFF;
              mat.color.setHex(originalColor);
              mat.emissive.setHex(originalColor);
              mat.emissiveIntensity = 0.5; // Make it glow so it's visible
            }
            if (mat.transparent !== undefined) {
              mat.transparent = true;
              mat.opacity = 0.0;
              mat.userData.baseOpacity = 1.0;
            }
          });
        }
      });
      
      rocketGroup.add(rocketModel);
    },
    undefined,
    (error) => {
      console.warn('[GENERATORS] Could not load decorative rocket:', error);
      // Fallback
      const fallbackGeometry = new THREE.SphereGeometry(rocketSize * 0.5, 16, 16);
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6B35,
        emissive: 0xFF6B35,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.0
      });
      fallbackMaterial.userData.baseOpacity = 1.0;
      const fallback = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      rocketGroup.add(fallback);
    }
  );
  
  // Random starting position and trajectory - MUY ALEJADO del centro para evitar planetas
  const startAngle = Math.random() * Math.PI * 2;
  const orbitRadius = 150 + Math.random() * 80; // Mucho más lejos del centro (150-230)
  const eccentricity = 0.7 + Math.random() * 0.2; // Menos excéntrico para trayectorias más suaves
  
  // Altura vertical aleatoria para evitar el plano orbital de los planetas
  const verticalOffset = (Math.random() - 0.5) * 60; // -30 a +30 en Y
  
  rocketGroup.userData = {
    type: 'decorativeRocket',
    startAngle: startAngle,
    orbitRadius: orbitRadius,
    eccentricity: eccentricity,
    verticalOffset: verticalOffset, // Altura para evitar planetas
    orbitSpeed: (0.3 + Math.random() * 0.5) / Math.sqrt(orbitRadius), // Más lento
    fadeInTime: 2.0,
    fadeOutTime: 2.0,
    visibleDuration: 20.0 + Math.random() * 15.0, // 20-35 seconds
    createdAt: Date.now(),
    shouldRemove: false
  };
  
  return rocketGroup;
}

/**
 * Calculate orbital position for planet
 */
export function calculateOrbitalPosition(index, angle, orbitalRadius) {
  const x = orbitalRadius * Math.cos(angle);
  const z = orbitalRadius * Math.sin(angle);
  return new THREE.Vector3(x, 0, z);
}

/**
 * Generate orbit line (elliptical path visualization)
 * Creates a thin, almost transparent line showing the planet's orbital path
 */
export function generateOrbitLine(orbitalRadius, eccentricity = 0, inclination = 0, segments = 128) {
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    
    // Apply eccentricity (elliptical orbit)
    const radius = orbitalRadius * (1 + eccentricity * Math.cos(angle));
    
    // Calculate position in horizontal plane (XZ) - NO vertical component
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = 0; // All orbits in horizontal plane
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Thin, almost transparent line material
  const material = new THREE.LineBasicMaterial({
    color: 0xF5F5F5,
    opacity: 0.2,
    transparent: true,
    linewidth: 1,
    depthTest: false,
    depthWrite: false
  });
  
  const orbitLine = new THREE.Line(geometry, material);
  orbitLine.userData = {
    type: 'orbitLine',
    orbitalRadius: orbitalRadius
  };
  
  return orbitLine;
}

