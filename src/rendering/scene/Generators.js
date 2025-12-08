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
  let ageBasedRadius = baseRadius + ageFactor * Math.sqrt(daysSinceCreationAtSnapshot);
  
  if (ageMapping === 'older-closer') {
    const maxDays = 365 * 10;
    const normalizedAge = Math.min(daysSinceCreationAtSnapshot / maxDays, 1.0);
    ageBasedRadius = baseRadius + ageFactor * Math.sqrt(maxDays) * (1.0 - normalizedAge);
  }
  
  const minDistanceFromSun = sunSize + 15;
  if (ageBasedRadius < minDistanceFromSun) {
    ageBasedRadius = minDistanceFromSun;
  }
  
  const maxEccentricityFactor = 1 + maxEccentricity;
  const baseSpacing = Math.max(15, planetRadius * 2 * maxEccentricityFactor);
  const spacing = baseSpacing * 0.8;
  const indexOffset = index * spacing;
  
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
 * Calculate branch orbit dimensions
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
  
  const sunSize = calculateSunSize(sumStars);
  const sunGeometry = new THREE.SphereGeometry(sunSize, 32, 32);
  
  const textureLoader = new THREE.TextureLoader();
  let sunTexture = null;
  
  try {
    sunTexture = textureLoader.load(`${import.meta.env.BASE_URL}textures/8k_sun.jpg`, 
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
      },
      undefined,
      (error) => {
        console.warn('[GENERATORS] 8K sun texture failed, trying 2K:', error);
        textureLoader.load(`${import.meta.env.BASE_URL}textures/2k_sun.jpg`,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 8;
            sunTexture = texture;
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
    map: sunTexture || null,
    emissiveMap: sunTexture || null
  });
  
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sunGroup.add(sun);
  
  const particleCount = 20;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = sunSize * 1.1 + Math.random() * 0.2;
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
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate planet for repository
 */
export function generatePlanet(repo, index) {
  const planetGroup = new THREE.Group();
  
  const size = repo.size || 0;
  const radius = calculatePlanetRadius(size);
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  
  const language = repo.language || 'Default';
  const color = getLanguageColor(language);
  
  const textureIndex = (hashString(repo.name) % 8) + 1;
  const texturePath = `${import.meta.env.BASE_URL}textures/2k_planet${textureIndex}.jpg`;
  
  const textureLoader = new THREE.TextureLoader();
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 1.4,
    transparent: false,
    opacity: 1.0
  });
  
  textureLoader.load(
    texturePath,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      material.map = texture;
      material.emissiveMap = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.warn(`[GENERATORS] Could not load planet texture ${textureIndex}:`, error);
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
  
  let moonTexture = null;
  textureLoader.load(
    `${import.meta.env.BASE_URL}textures/2k_moon.jpg`,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      moonTexture = texture;
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
    const isMainBranch = i === 0;
    const branchOrbitRadius = calculateBranchOrbitRadius(planetRadius, i);
    const branchSize = calculateBranchSize(branchesCount, planetRadius, isMainBranch);
    
    const geometry = new THREE.SphereGeometry(branchSize, 16, 16);
    
    let branchColor, emissiveIntensity, opacity;
    if (isMainBranch) {
      branchColor = 0xFFF8DC;
      emissiveIntensity = 0.6;
      opacity = 1.0;
    } else {
      branchColor = 0xAAAAAA;
      emissiveIntensity = 0.2;
      opacity = 1.0;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: branchColor,
      emissive: branchColor,
      emissiveIntensity: emissiveIntensity,
      map: moonTexture || null,
      emissiveMap: moonTexture || null,
      transparent: !isMainBranch,
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
  const prCount = Math.min(repo.openPRs || 0, 10);
  
  if (prCount === 0) return prs;
  
  const lastBranchOrbitRadius = numBranches > 0 
    ? calculateBranchOrbitRadius(planetRadius, numBranches - 1)
    : planetRadius;
  const prBaseGap = Math.max(planetRadius * 0.1, 0.8);
  const prOrbitRadius = lastBranchOrbitRadius + prBaseGap;
  
  const loader = new GLTFLoader();
  const prSize = 1.5;
  
  let modelCache = null;
  let loadPromise = null;
  
  const loadModel = () => {
    if (loadPromise) return loadPromise;
    
    loadPromise = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}models/PR-Rocket.glb`,
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
  
  for (let i = 0; i < prCount; i++) {
    const prState = repo.prStates && repo.prStates[i] ? repo.prStates[i] : 'open';
    
    const prGroup = new THREE.Group();
    
    const fallbackGeometry = new THREE.SphereGeometry(prSize, 8, 8);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      emissiveIntensity: 0.8
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    prGroup.add(fallbackMesh);
    
    loadModel().then((gltf) => {
      if (gltf && modelCache) {
        prGroup.remove(fallbackMesh);
        fallbackGeometry.dispose();
        fallbackMaterial.dispose();
        
        const prModel = modelCache.clone();
        
        prModel.traverse((child) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial) {
                const originalColor = mat.color ? mat.color.getHex() : 0xFFFFFF;
                mat.color.setHex(originalColor);
                mat.emissive.setHex(originalColor);
                mat.emissiveIntensity = 0.5;
              }
            });
          }
        });
        
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
      orbitRadius: prOrbitRadius + i * 0.3,
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
  
  if (!repo.hasRecentCommits) return comets;
  
  const cometGroup = new THREE.Group();
  
  const loader = new GLTFLoader();
  const cometSize = 2.9;
  
  loader.load(
    `${import.meta.env.BASE_URL}models/comets.glb`,
    (gltf) => {
      const rocketModel = gltf.scene;
      
      const box = new THREE.Box3().setFromObject(rocketModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = cometSize / maxDim;
      rocketModel.scale.set(scale, scale, scale);
      
      rocketModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat.transparent !== undefined) {
              mat.transparent = true;
              mat.opacity = 0.0;
              mat.userData.baseOpacity = 1.0;
            }
          });
        }
      });
      
      cometGroup.add(rocketModel);
    },
    undefined,
    (error) => {
      console.warn('[GENERATORS] Could not load rocket model, using fallback:', error);
      const fallbackGeometry = new THREE.SphereGeometry(cometSize * 0.5, 16, 16);
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6B35,
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
  
  const cometOrbitRadius = orbitalRadius * 2.0;
  const cometEccentricity = 0.9;
  
  cometGroup.userData = {
    type: 'comet',
    orbitRadius: cometOrbitRadius,
    eccentricity: cometEccentricity,
    orbitSpeed: 1.2 / Math.sqrt(cometOrbitRadius),
    fadeInTime: 1.5,
    fadeOutTime: 1.5,
    visibleDuration: 18.0,
    isVisible: true,
    shouldRemove: false,
    opacity: 1,
    createdAt: Date.now(),
    repoName: repo.name
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
    `${import.meta.env.BASE_URL}models/Rocket-Across.glb`,
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
            if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial) {
              const originalColor = mat.color ? mat.color.getHex() : 0xFFFFFF;
              mat.color.setHex(originalColor);
              mat.emissive.setHex(originalColor);
              mat.emissiveIntensity = 0.5;
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
  
  const startAngle = Math.random() * Math.PI * 2;
  const orbitRadius = 150 + Math.random() * 80;
  const eccentricity = 0.7 + Math.random() * 0.2;
  
  const verticalOffset = (Math.random() - 0.5) * 60;
  
  rocketGroup.userData = {
    type: 'decorativeRocket',
    startAngle: startAngle,
    orbitRadius: orbitRadius,
    eccentricity: eccentricity,
    verticalOffset: verticalOffset,
    orbitSpeed: (0.3 + Math.random() * 0.5) / Math.sqrt(orbitRadius),
    fadeInTime: 2.0,
    fadeOutTime: 2.0,
    visibleDuration: 20.0 + Math.random() * 15.0,
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
    
    const radius = orbitalRadius * (1 + eccentricity * Math.cos(angle));
    
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = 0;
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
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

