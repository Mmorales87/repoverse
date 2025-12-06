import * as THREE from 'three';

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
 * Calculate planet radius based on total commits
 * EXACT FORMULA: radius = clamp( log10(totalCommits + 1) * 8.0, 1.6, 18.0 )
 */
export function calculatePlanetRadius(totalCommits) {
  return clamp(log10(totalCommits) * 8.0, 1.6, 18.0);
}

/**
 * Calculate halo intensity based on stars
 */
export function calculateHaloIntensity(stars) {
  return clamp(log10(stars) * 0.6, 0.1, 3.0);
}

/**
 * Calculate number of moons based on forks
 */
export function calculateNumMoons(forks) {
  return Math.min(Math.round(log2(forks)), 8);
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
export function calculateMass(radius, totalCommits) {
  return clamp(radius * (1 + log10(totalCommits)), 0.5, 100.0);
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
 * Calculate moon orbit radius (FIX for bug: moons outside rings)
 */
export function calculateMoonOrbitRadius(ringOuterRadius, planetRadius, moonIndex) {
  const moonBaseGap = Math.max(planetRadius * 0.15, 1.0);
  const moonSpacing = Math.max(planetRadius * 0.12, 0.8);
  return ringOuterRadius + moonBaseGap + moonIndex * moonSpacing;
}

/**
 * Calculate moon size
 */
export function calculateMoonSize(forks, planetRadius) {
  return clamp(log2(forks) * 0.4, 0.2, planetRadius * 0.4);
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
 * Generate planet for repository
 */
export function generatePlanet(repo, index) {
  const planetGroup = new THREE.Group();
  
  const radius = calculatePlanetRadius(repo.totalCommits || 0);
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  
  const language = repo.language || 'Default';
  const color = getLanguageColor(language);
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3
  });
  
  const planet = new THREE.Mesh(geometry, material);
  planet.userData = {
    repo: repo,
    radius: radius,
    mass: calculateMass(radius, repo.totalCommits || 0)
  };
  
  planetGroup.add(planet);
  
  return planetGroup;
}

/**
 * Generate rings for repository (branches/complexity)
 * Rings have their own color (not planet color)
 * Max 6 rings; if branches > 6, show thicker/dashed ring
 */
export function generateRings(repo, planetRadius) {
  const rings = [];
  const branchesCount = repo.branchesCount || 1;
  
  // Use branches count to determine number of rings (max 6)
  let ringCount = Math.min(Math.ceil(branchesCount / 2), 6);
  if (ringCount === 0) ringCount = 1;
  
  const ringDims = calculateRingDimensions(planetRadius, branchesCount);
  const { innerRadius, outerRadius, thickness } = ringDims;
  
  // Ring color (independent from planet - represents branches/complexity)
  const ringColor = 0x4A90E2; // Blue for complexity
  
  // If branches > 6, make rings thicker
  const isThickRing = branchesCount > 6;
  const actualThickness = isThickRing ? thickness * 1.5 : thickness;
  
  for (let i = 0; i < ringCount; i++) {
    const currentInner = innerRadius + (outerRadius - innerRadius) * (i / ringCount);
    const currentOuter = innerRadius + (outerRadius - innerRadius) * ((i + 1) / ringCount);
    const ringRadius = (currentInner + currentOuter) / 2;
    const tubeRadius = isThickRing ? actualThickness / ringCount : (currentOuter - currentInner) / 2;
    
    const geometry = new THREE.TorusGeometry(ringRadius, tubeRadius, 32, 64);
    const material = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { 
      type: 'ring', 
      index: i,
      branchesCount: branchesCount,
      isThickRing: isThickRing
    };
    
    rings.push(ring);
  }
  
  return rings;
}

/**
 * Generate moons for repository (forks)
 * Moons have their own color (not planet color)
 */
export function generateMoons(repo, planetRadius, ringOuterRadius) {
  const moons = [];
  const numMoons = calculateNumMoons(repo.forks || 0);
  
  if (numMoons === 0) return moons;
  
  // Moon color (independent from planet - represents forks/popularity)
  const moonColor = 0xAAAAAA; // Silver/grey for moons
  
  for (let i = 0; i < numMoons; i++) {
    const moonOrbitRadius = calculateMoonOrbitRadius(ringOuterRadius, planetRadius, i);
    const moonSize = calculateMoonSize(repo.forks || 0, planetRadius);
    
    const geometry = new THREE.SphereGeometry(moonSize, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: moonColor,
      emissive: moonColor,
      emissiveIntensity: 0.2
    });
    
    const moon = new THREE.Mesh(geometry, material);
    moon.userData = {
      type: 'moon',
      index: i,
      orbitRadius: moonOrbitRadius,
      orbitSpeed: 1.0 / Math.sqrt(moonOrbitRadius) // Natural orbital speed
    };
    
    moons.push(moon);
  }
  
  return moons;
}

/**
 * Generate PRs as small satellites
 * Colors: open=orange, merged=green, closed=grey
 */
export function generatePRs(repo, planetRadius, ringOuterRadius, numMoons) {
  const prs = [];
  const prCount = Math.min(repo.openPRs || 0, 10); // Cap at 10 for performance
  
  if (prCount === 0) return prs;
  
  // Calculate orbit radius (outside moons)
  const lastMoonOrbitRadius = numMoons > 0 
    ? calculateMoonOrbitRadius(ringOuterRadius, planetRadius, numMoons - 1)
    : ringOuterRadius;
  const prBaseGap = Math.max(planetRadius * 0.1, 0.8);
  const prOrbitRadius = lastMoonOrbitRadius + prBaseGap;
  
  for (let i = 0; i < prCount; i++) {
    const prSize = 0.15;
    const geometry = new THREE.SphereGeometry(prSize, 8, 8);
    
    // PR color based on state (default to orange for open)
    const prState = repo.prStates && repo.prStates[i] ? repo.prStates[i] : 'open';
    let prColor = 0xFFA500; // Orange for open
    if (prState === 'merged') prColor = 0x00FF00; // Green
    if (prState === 'closed') prColor = 0x888888; // Grey
    
    const material = new THREE.MeshStandardMaterial({
      color: prColor,
      emissive: prColor,
      emissiveIntensity: 0.3
    });
    
    const pr = new THREE.Mesh(geometry, material);
    pr.userData = {
      type: 'pr',
      index: i,
      orbitRadius: prOrbitRadius + i * 0.3, // Slight spacing
      orbitSpeed: 1.5 / Math.sqrt(prOrbitRadius),
      state: prState
    };
    
    prs.push(pr);
  }
  
  return prs;
}

/**
 * Generate Releases as orbiting capsules
 */
export function generateReleases(repo, planetRadius, ringOuterRadius, numMoons, numPRs) {
  const releases = [];
  const releaseCount = Math.min(repo.releasesCount || 0, 5); // Cap at 5
  
  if (releaseCount === 0) return releases;
  
  // Calculate orbit radius (outside PRs)
  const lastPROrbitRadius = numPRs > 0
    ? (ringOuterRadius + Math.max(planetRadius * 0.1, 0.8) + (numPRs - 1) * 0.3)
    : (numMoons > 0 
      ? calculateMoonOrbitRadius(ringOuterRadius, planetRadius, numMoons - 1)
      : ringOuterRadius);
  const releaseBaseGap = Math.max(planetRadius * 0.1, 0.8);
  const releaseOrbitRadius = lastPROrbitRadius + releaseBaseGap;
  
  // Release color (independent - represents milestones)
  const releaseColor = 0xFFD700; // Gold for releases
  
  for (let i = 0; i < releaseCount; i++) {
    // Capsule shape - using CylinderGeometry as more compatible alternative
    const capsuleRadius = 0.2;
    const capsuleHeight = 0.4;
    // Use CylinderGeometry instead of CapsuleGeometry for better compatibility
    const geometry = new THREE.CylinderGeometry(capsuleRadius, capsuleRadius, capsuleHeight, 8);
    
    const material = new THREE.MeshStandardMaterial({
      color: releaseColor,
      emissive: releaseColor,
      emissiveIntensity: 0.4
    });
    
    const release = new THREE.Mesh(geometry, material);
    release.userData = {
      type: 'release',
      index: i,
      orbitRadius: releaseOrbitRadius + i * 0.5,
      orbitSpeed: 1.2 / Math.sqrt(releaseOrbitRadius)
    };
    
    releases.push(release);
  }
  
  return releases;
}

/**
 * Generate Issues as particle storms on planet surface
 */
export function generateIssues(repo, planetRadius) {
  const issues = [];
  const openIssues = repo.openIssues || 0;
  const totalCommits = repo.totalCommits || 1;
  
  // Calculate issue density
  const issueDensity = openIssues / (totalCommits + 1);
  const particleCount = Math.min(Math.floor(issueDensity * 50), 30); // Max 30 particles
  
  if (particleCount === 0) return issues;
  
  // Issue color (red for problems)
  const issueColor = 0xFF4444;
  
  // Create particle system on planet surface
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    // Random position on sphere surface
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = planetRadius * 1.01; // Slightly above surface
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Red color with variation
    colors[i * 3] = 1.0; // R
    colors[i * 3 + 1] = 0.2 + Math.random() * 0.3; // G
    colors[i * 3 + 2] = 0.2 + Math.random() * 0.3; // B
    
    sizes[i] = 0.1 + Math.random() * 0.1;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    color: issueColor,
    vertexColors: true,
    size: 0.2,
    transparent: true,
    opacity: 0.7
  });
  
  const issueParticles = new THREE.Points(geometry, material);
  issueParticles.userData = {
    type: 'issues',
    particleCount: particleCount
  };
  
  issues.push(issueParticles);
  
  return issues;
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

