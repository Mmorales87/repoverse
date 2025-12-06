import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  generateSun,
  generatePlanet,
  generateRings,
  generateMoons,
  generatePRs,
  generateReleases,
  generateIssues,
  calculateOrbitalRadius,
  calculateOrbitalPosition,
  calculateOrbitalSpeed,
  calculateRingDimensions,
  generateOrbitLine,
  calculateSunSize
} from './Generators.js';

// Helper functions
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function log10(x) {
  return Math.log10(x + 1);
}

/**
 * Scene Manager - Manages Three.js scene, camera, renderer and animation loop
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    // Objects
    this.sun = null;
    this.planets = [];
    this.rings = [];
    this.moons = [];
    this.prs = [];
    this.releases = [];
    this.issues = [];
    this.orbitLines = [];
    this.planetAnimations = [];
    
    // Top-K planets by mass for LensPass
    this.topKPlanets = [];
    this.K = 8;
    
    // Debug mode
    this.debugMode = false;
    this.debugLines = [];
    
    this.initialized = false;
  }

  /**
   * Initialize Three.js scene
   */
  initialize() {
    console.log('[SCENE] Starting Three.js initialization...');
    
    try {
      // Scene
      console.log('[SCENE] Creating scene...');
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      console.log('[SCENE] ✅ Scene created');
    
    // Camera
    const aspect = this.canvas.width / this.canvas.height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
    // Position camera to see the system better
    this.camera.position.set(0, 80, 150);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // OrbitControls for camera movement
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 500;
    this.controls.enablePan = true;
    this.controls.autoRotate = false;
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    this.initialized = true;
    console.log('[SCENE] ✅ Three.js initialization complete');
    } catch (error) {
      console.error('[SCENE] ❌ Error during initialization:', error);
      console.error('[SCENE] Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * Add object to scene
   */
  addObject(object) {
    if (this.scene) {
      this.scene.add(object);
    }
  }

  /**
   * Remove object from scene
   */
  removeObject(object) {
    if (this.scene) {
      this.scene.remove(object);
    }
  }

  /**
   * Toggle debug mode (show radii lines)
   */
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode) {
      this.createDebugLines();
    } else {
      this.removeDebugLines();
    }
  }

  /**
   * Create debug lines for all planets
   */
  createDebugLines() {
    this.removeDebugLines(); // Clear existing
    
    this.planets.forEach((planet, index) => {
      const planetRadius = planet.children[0].userData.radius;
      const repo = planet.children[0].userData.repo;
      const { innerRadius, outerRadius } = calculateRingDimensions(
        planetRadius,
        repo?.branchesCount || 1
      );
      
      // Get current planet position
      const position = planet.position;
      
      // Create lines for planet radius, ring inner/outer, moon orbits
      const lines = this.createPlanetDebugLines(position, planetRadius, innerRadius, outerRadius, index);
      lines.forEach(line => {
        this.scene.add(line);
        this.debugLines.push(line);
      });
    });
  }

  /**
   * Create debug lines for a single planet
   */
  createPlanetDebugLines(position, planetRadius, ringInnerRadius, ringOuterRadius, planetIndex) {
    const lines = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    
    // Planet radius circle
    const planetCircle = this.createCircleLine(position, planetRadius, lineMaterial);
    lines.push(planetCircle);
    
    // Ring inner radius circle
    const ringInnerCircle = this.createCircleLine(position, ringInnerRadius, new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 }));
    lines.push(ringInnerCircle);
    
    // Ring outer radius circle
    const ringOuterCircle = this.createCircleLine(position, ringOuterRadius, new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }));
    lines.push(ringOuterCircle);
    
    // Moon orbit circles
    if (this.moons[planetIndex]) {
      this.moons[planetIndex].forEach((moon, moonIndex) => {
        const moonOrbitRadius = moon.userData.orbitRadius;
        const moonCircle = this.createCircleLine(position, moonOrbitRadius, new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3 }));
        lines.push(moonCircle);
      });
    }
    
    return lines;
  }

  /**
   * Create circle line for debug
   */
  createCircleLine(center, radius, material) {
    const segments = 32;
    const points = [];
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        center.x + radius * Math.cos(angle),
        center.y,
        center.z + radius * Math.sin(angle)
      ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }

  /**
   * Update debug lines positions
   */
  updateDebugLines(planetIndex, position, planetRadius, ringOuterRadius) {
    // Remove old lines for this planet
    const linesToRemove = this.debugLines.filter((line, idx) => {
      return line.userData.planetIndex === planetIndex;
    });
    
    linesToRemove.forEach(line => {
      this.scene.remove(line);
      const index = this.debugLines.indexOf(line);
      if (index > -1) {
        this.debugLines.splice(index, 1);
      }
    });
    
    // Create new lines
    const repo = this.planets[planetIndex].children[0].userData.repo;
    const { innerRadius, outerRadius } = calculateRingDimensions(
      planetRadius,
      repo?.branchesCount || 1
    );
    
    const newLines = this.createPlanetDebugLines(position, planetRadius, innerRadius, outerRadius, planetIndex);
    newLines.forEach(line => {
      line.userData.planetIndex = planetIndex;
      this.scene.add(line);
      this.debugLines.push(line);
    });
  }

  /**
   * Remove all debug lines
   */
  removeDebugLines() {
    this.debugLines.forEach(line => {
      if (this.scene) {
        this.scene.remove(line);
      }
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    });
    this.debugLines = [];
  }

  /**
   * Generate universe from repositories
   */
  generateUniverse(repositories, userData = {}) {
    // Clear existing
    this.clear();
    
    // Get snapshot date and age mapping from userData
    const snapshotDate = userData.snapshotDate || new Date();
    const ageMapping = userData.ageMapping || 'older-farther';
    const sumStars = userData.sumStars || 0;
    
    // Generate sun with correct size
    this.sun = generateSun(userData, sumStars);
    this.addObject(this.sun);
    
    // Get sun size for collision avoidance
    const sunSize = this.sun.children[0]?.geometry?.parameters?.radius || calculateSunSize(sumStars);
    
    // Calculate max commits for normalization
    const maxCommitsLast30 = Math.max(...repositories.map(r => r.commitsLast30 || 0), 1);
    
    // Generate planets, rings, moons, PRs, releases, issues
    repositories.forEach((repo, index) => {
      // Get daysSinceCreationAtSnapshot (calculated in app.js)
      const daysSinceCreationAtSnapshot = repo.daysSinceCreationAtSnapshot || repo.daysSinceCreation || 0;
      
      // Generate planet
      const planet = generatePlanet(repo, index);
      const planetRadius = planet.children[0].userData.radius;
      
      // Calculate orbital position using snapshot age and mapping
      // Pass sunSize to avoid collisions with the sun
      // Pass planetRadius and maxEccentricity to consider elliptical orbit in spacing
      const maxEccentricity = 0.05; // Maximum eccentricity used in planet animations (reduced for better spacing)
      const orbitalRadius = calculateOrbitalRadius(
        daysSinceCreationAtSnapshot, 
        index, 
        ageMapping,
        30, // baseRadius
        0.5, // ageFactor
        sunSize, // sunSize for collision avoidance
        planetRadius, // planetRadius for spacing calculation
        maxEccentricity // maxEccentricity to consider apoapsis
      );
      
      // Distribute planets evenly around the sun, but with unique orbital radii
      const angle = Math.random() * Math.PI * 2;
      const position = calculateOrbitalPosition(index, angle, orbitalRadius);
      
      planet.position.copy(position);
      this.planets.push(planet);
      this.addObject(planet);
      
      // Generate rings
      const repoRings = generateRings(repo, planetRadius);
      this.rings.push(repoRings);
      repoRings.forEach(ring => {
        ring.position.copy(position);
        this.addObject(ring);
      });
      
      // Calculate ring outer radius for moon positioning
      const { outerRadius: ringOuterRadius } = calculateRingDimensions(
        planetRadius,
        repo.branchesCount || 1
      );
      
      // Generate moons
      const repoMoons = generateMoons(repo, planetRadius, ringOuterRadius);
      this.moons.push(repoMoons);
      repoMoons.forEach(moon => {
        moon.position.copy(position);
        this.addObject(moon);
      });
      
      // Generate PRs (satellites)
      const repoPRs = generatePRs(repo, planetRadius, ringOuterRadius, repoMoons.length);
      this.prs.push(repoPRs);
      repoPRs.forEach(pr => {
        pr.position.copy(position);
        this.addObject(pr);
      });
      
      // Generate Releases (capsules)
      const repoReleases = generateReleases(repo, planetRadius, ringOuterRadius, repoMoons.length, repoPRs.length);
      this.releases.push(repoReleases);
      repoReleases.forEach(release => {
        release.position.copy(position);
        this.addObject(release);
      });
      
      // Generate Issues (particle storms on surface)
      const repoIssues = generateIssues(repo, planetRadius);
      this.issues.push(repoIssues);
      repoIssues.forEach(issue => {
        issue.position.copy(position);
        this.addObject(issue);
      });
      
      // Store animation data
      const commitsLast30 = repo.commitsLast30 || 0;
      const orbitalSpeed = calculateOrbitalSpeed(commitsLast30, maxCommitsLast30);
      const normalizedRecent = clamp(
        log10(commitsLast30) / log10(maxCommitsLast30 + 1),
        0,
        1
      );
      const spinSpeed = 0.001 + normalizedRecent * 0.02;
      
      // Add eccentricity and inclination for variety (reduced eccentricity for better spacing)
      const eccentricity = Math.random() * 0.05; // Reduced from 0.15 to 0.05 for less elliptical orbits
      const inclination = (Math.random() - 0.5) * 0.2; // Reduced inclination
      
      this.planetAnimations.push({
        initialAngle: angle,
        orbitalRadius: orbitalRadius,
        orbitalSpeed: orbitalSpeed,
        spinSpeed: spinSpeed,
        eccentricity: eccentricity,
        inclination: inclination,
        rotationSpeed: {
          x: 0.2 + Math.random() * 0.3,
          y: 0.1 + Math.random() * 0.2,
          z: 0.15 + Math.random() * 0.25
        }
      });
      
      // Generate orbit line (thin, almost transparent)
      // Note: Orbit lines are NOT added to the main scene - they'll be rendered separately
      // to avoid being affected by LensPass distortion
      const orbitLine = generateOrbitLine(orbitalRadius, eccentricity, inclination);
      this.orbitLines.push(orbitLine);
      console.log(`[SCENE] Orbit line ${index} created, radius: ${orbitalRadius}, total lines: ${this.orbitLines.length}`);
      // Don't add to scene - EffectsManager will handle rendering them separately
    });
    
    // Update top-K planets
    this.updateTopKPlanets();
  }

  /**
   * Update top-K planets by mass for LensPass
   */
  updateTopKPlanets() {
    const planetsWithMass = this.planets.map((planet, index) => ({
      planet,
      mass: planet.children[0].userData.mass,
      index
    }));
    
    planetsWithMass.sort((a, b) => b.mass - a.mass);
    this.topKPlanets = planetsWithMass.slice(0, this.K);
  }

  /**
   * Get top-K planet positions in screen space (normalized 0-1)
   */
  getTopKPlanetPositions() {
    if (!this.camera || !this.renderer) return { positions: new Float32Array(16), masses: new Float32Array(8), count: 0 };
    
    const positions = new Float32Array(16); // 8 planets * 2 (x, y)
    const masses = new Float32Array(8);
    let count = 0;
    
    this.topKPlanets.forEach(({ planet, mass }, index) => {
      if (index >= 8) return; // Max 8 planets
      
      const worldPosition = new THREE.Vector3();
      planet.getWorldPosition(worldPosition);
      
      // Project to NDC
      const ndc = worldPosition.clone().project(this.camera);
      
      // Convert NDC (-1 to 1) to normalized (0 to 1)
      const normalizedX = (ndc.x + 1) / 2;
      const normalizedY = (ndc.y + 1) / 2;
      
      positions[index * 2] = normalizedX;
      positions[index * 2 + 1] = normalizedY;
      masses[index] = mass;
      count++;
    });
    
    return {
      positions,
      masses,
      count
    };
  }

  /**
   * Clear all objects
   */
  clear() {
    // Remove all objects
    if (this.scene) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }
    
    this.sun = null;
    this.planets = [];
    this.rings = [];
    this.moons = [];
    this.prs = [];
    this.releases = [];
    this.issues = [];
    this.orbitLines = [];
    this.planetAnimations = [];
    this.topKPlanets = [];
    
    // Clear debug lines
    this.debugLines.forEach(line => {
      if (this.scene) {
        this.scene.remove(line);
      }
    });
    this.debugLines = [];
    
    // Clear orbit lines
    this.orbitLines.forEach(line => {
      if (this.scene) {
        this.scene.remove(line);
      }
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    });
    this.orbitLines = [];
  }

  /**
   * Start animation loop (called by app, not directly)
   */
  start() {
    // Animation loop is managed by app.js
    // This method is kept for compatibility but doesn't start its own loop
    console.log('SceneManager ready for animation');
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update animation
   */
  update() {
    if (!this.initialized) return;
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Animate sun rotation (only the main sphere, not particles)
    if (this.sun) {
      // Rotate only the sun sphere, not the entire group
      // Particles stay fixed relative to sun (no orbital motion)
      this.sun.rotation.y += 0.05 * deltaTime;
    }
    
    // Animate planets
    this.planets.forEach((planet, index) => {
      const animData = this.planetAnimations[index];
      if (!animData) return;
      
      // Rotate planet (spin)
      planet.rotation.x += animData.rotationSpeed.x * deltaTime;
      planet.rotation.y += animData.rotationSpeed.y * deltaTime + animData.spinSpeed * deltaTime;
      planet.rotation.z += animData.rotationSpeed.z * deltaTime;
      
      // Update orbital position with eccentricity and inclination
      const angle = animData.initialAngle + elapsedTime * animData.orbitalSpeed;
      const baseRadius = animData.orbitalRadius;
      
      // Apply eccentricity (elliptical orbit)
      const radius = baseRadius * (1 + animData.eccentricity * Math.cos(angle));
      
      // Calculate position in orbital plane
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      // Apply inclination (tilt orbit)
      const y = Math.sin(angle) * animData.inclination * baseRadius;
      
      const position = new THREE.Vector3(x, y, z);
      planet.position.copy(position);
      
      // Update rings position (follow planet)
      if (this.rings[index]) {
        this.rings[index].forEach(ring => {
          ring.position.copy(position);
        });
      }
      
      // Update moons position (orbit around planet)
      if (this.moons[index]) {
        const planetRadius = planet.children[0].userData.radius;
        const repo = this.planets[index].children[0].userData.repo;
        const { outerRadius: ringOuterRadius } = calculateRingDimensions(
          planetRadius,
          repo?.branchesCount || 1
        );
        
        this.moons[index].forEach((moon, moonIndex) => {
          const moonOrbitRadius = moon.userData.orbitRadius;
          const moonAngle = elapsedTime * 0.5 + (moonIndex * Math.PI * 2 / this.moons[index].length);
          const moonX = position.x + moonOrbitRadius * Math.cos(moonAngle);
          const moonY = position.y + moonOrbitRadius * Math.sin(moonAngle);
          const moonZ = position.z + moonOrbitRadius * 0.3 * Math.sin(moonAngle * 0.7);
          
          moon.position.set(moonX, moonY, moonZ);
        });
      }
    });
  }

  /**
   * Render scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stop();
    this.clear();
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    window.removeEventListener('resize', () => this.handleResize());
  }
}

