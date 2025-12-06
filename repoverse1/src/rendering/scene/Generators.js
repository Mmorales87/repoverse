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
  'Default': 0x888888
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
  return 0.0005 + normalizedRecent * 0.003;
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
  const spacing = baseSpacing * 1.5; // Increased multiplier for better spacing
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
        console.log('[GENERATORS] ✅ Sun texture (8K) loaded successfully');
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
            console.log('[GENERATORS] ✅ Sun texture (2K) loaded as fallback');
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
  
  // Create material first with subtle color tint (reduced intensity for better texture visibility)
  // Use white as base color and apply language color as a subtle tint
  const material = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, // White base to show texture clearly
    emissive: color, // Language color as subtle emissive tint
    emissiveIntensity: 0.15 // Reduced from 0.3 - subtle tint that doesn't overpower texture
  });
  
  // Load texture and apply it
  textureLoader.load(
    texturePath,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      material.map = texture;
      // Don't use texture as emissiveMap to keep color tint visible but subtle
      material.needsUpdate = true;
      console.log(`[GENERATORS] ✅ Planet texture ${textureIndex} loaded for ${repo.name}`);
    },
    undefined,
    (error) => {
      console.warn(`[GENERATORS] Could not load planet texture ${textureIndex}:`, error);
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
      console.log('[GENERATORS] ✅ Moon texture loaded for branches');
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
      opacity = 0.6; // More muted/appagada
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
  const prSize = 0.15;
  
  // Load model once and clone for each PR
  let modelCache = null;
  let loadPromise = null;
  
  const loadModel = () => {
    if (loadPromise) return loadPromise;
    
    loadPromise = new Promise((resolve, reject) => {
      loader.load(
        '/models/PR-Spaceship.glb',
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
    let prColor = 0xFFA500; // Orange for open
    if (prState === 'merged') prColor = 0x00FF00; // Green
    if (prState === 'closed') prColor = 0x888888; // Grey
    
    // Create PR object (will be updated when model loads)
    const prGroup = new THREE.Group();
    
    // Fallback geometry if model fails
    const fallbackGeometry = new THREE.SphereGeometry(prSize, 8, 8);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: prColor,
      emissive: prColor,
      emissiveIntensity: 0.3
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
        
        // Apply color to all materials in the model
        prModel.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              // Handle both single material and array of materials
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial) {
                  mat.color.setHex(prColor);
                  mat.emissive.setHex(prColor);
                  mat.emissiveIntensity = 0.3;
                }
              });
            }
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
 * Generate comets for recent commits (24-48h)
 * Comets appear temporarily and orbit with high eccentricity
 */
export function generateComets(repo, planetRadius, orbitalRadius) {
  const comets = [];
  
  // Check if repo has recent commits
  if (!repo.hasRecentCommits) return comets;
  
  // Create a single comet per repo with recent activity
  const cometGroup = new THREE.Group();
  
  // Comet head (sphere)
  const headSize = 0.3;
  const headGeometry = new THREE.SphereGeometry(headSize, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x87CEEB, // Sky blue
    emissive: 0x87CEEB,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.0 // Start invisible, will fade in
  });
  headMaterial.userData.baseOpacity = 0.7; // Store base opacity
  const head = new THREE.Mesh(headGeometry, headMaterial);
  cometGroup.add(head);
  
  // Comet tail (cone pointing away from planet)
  const tailLength = 1.0;
  const tailRadius = 0.15;
  const tailGeometry = new THREE.ConeGeometry(tailRadius, tailLength, 8);
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    emissive: 0x87CEEB,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.0, // Start invisible, will fade in
    side: THREE.DoubleSide
  });
  tailMaterial.userData.baseOpacity = 0.5; // Store base opacity
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.y = -tailLength / 2; // Position tail behind head
  tail.rotation.x = Math.PI; // Point tail away
  cometGroup.add(tail);
  
  // Calculate comet orbit (highly elliptical, outside branches/PRs)
  const cometOrbitRadius = orbitalRadius * 1.5; // Further out
  const cometEccentricity = 0.7; // High eccentricity for pronounced ellipse
  
  cometGroup.userData = {
    type: 'comet',
    orbitRadius: cometOrbitRadius,
    eccentricity: cometEccentricity,
    orbitSpeed: 0.8 / Math.sqrt(cometOrbitRadius),
    fadeInTime: 2.0, // 2 seconds to fade in
    fadeOutTime: 2.0, // 2 seconds to fade out
    isVisible: true,
    opacity: 0.0, // Start invisible, will fade in
    createdAt: Date.now()
  };
  
  // Set initial opacity to 0 (will fade in)
  headMaterial.opacity = 0.0;
  tailMaterial.opacity = 0.0;
  
  comets.push(cometGroup);
  
  return comets;
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
    
    // Calculate position in orbital plane
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    
    // Apply inclination (tilt orbit)
    const y = Math.sin(angle) * inclination * orbitalRadius;
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  // Thin, almost transparent line material
  const material = new THREE.LineBasicMaterial({
    color: 0xFFFFFF,
    opacity: 0.3,
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

