import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  generateSun,
  generatePlanet,
  generateBranches,
  generatePRs,
  generateComets,
  generateDecorativeRocket,
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
    this.branches = [];
    this.prs = [];
    this.comets = [];
    this.orbitLines = [];
    this.planetAnimations = [];
    
    // Decorative rockets (independent of repositories)
    this.decorativeRockets = [];
    this.lastRocketSpawn = 0;
    this.rocketSpawnInterval = 25000; // Spawn cada 25 segundos (menos frecuente)
    
    // Top-K planets by mass for LensPass
    this.topKPlanets = [];
    this.K = 8;
    
    this.initialized = false;
  }

  /**
   * Initialize Three.js scene
   */
  initialize() {
    try {
      // Scene
      this.scene = new THREE.Scene();
      // NO poner background - el skybox será el fondo
      this.scene.background = null;
    
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
      alpha: false // Cambiar a false para que el skybox sea visible
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
    
    // Create skybox (3D sphere)
    this.createSkybox();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    this.initialized = true;
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
    
    // Generate planets, branches, PRs, comets
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
      
      // Generate branches
      const repoBranches = generateBranches(repo, planetRadius);
      this.branches.push(repoBranches);
      repoBranches.forEach(branch => {
        branch.position.copy(position);
        this.addObject(branch);
      });
      
      // Generate PRs (GLTF models)
      const repoPRs = generatePRs(repo, planetRadius, repoBranches.length);
      this.prs.push(repoPRs);
      repoPRs.forEach(pr => {
        pr.position.copy(position);
        this.addObject(pr);
      });
      
      // Generate comets (for recent commits)
      const repoComets = generateComets(repo, planetRadius, orbitalRadius);
      this.comets.push(repoComets);
      repoComets.forEach(comet => {
        comet.position.copy(position);
        this.addObject(comet);
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
      
      // Add eccentricity for variety (reduced eccentricity for better spacing)
      const eccentricity = Math.random() * 0.05; // Reduced from 0.15 to 0.05 for less elliptical orbits
      const inclination = 0; // NO inclination - all planets rotate in horizontal plane (XZ)
      
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
    this.branches = [];
    this.prs = [];
    this.comets = [];
    this.orbitLines = [];
    this.planetAnimations = [];
    this.topKPlanets = [];
    
    // Clear decorative rockets
    this.decorativeRockets = [];
    this.lastRocketSpawn = 0;
    
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
      planet.rotation.y += animData.rotationSpeed.x * deltaTime;
      
      // Update orbital position with eccentricity (horizontal plane only)
      const angle = animData.initialAngle + elapsedTime * animData.orbitalSpeed;
      const baseRadius = animData.orbitalRadius;
      
      // Apply eccentricity (elliptical orbit)
      const radius = baseRadius * (1 + animData.eccentricity * Math.cos(angle));
      
      // Calculate position in horizontal plane (XZ) - NO vertical component
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      const y = 0; // All planets at same height (horizontal plane)
      
      const position = new THREE.Vector3(x, y, z);
      planet.position.copy(position);
      
      // Update branches position (orbit around planet in horizontal plane)
      if (this.branches[index]) {
        this.branches[index].forEach((branch, branchIndex) => {
          const branchOrbitRadius = branch.userData.orbitRadius;
          const branchAngle = elapsedTime * 0.5 + (branchIndex * Math.PI * 2 / this.branches[index].length);
          // Orbit in horizontal plane (XZ) - same as planets
          const branchX = position.x + branchOrbitRadius * Math.cos(branchAngle);
          const branchY = position.y; // Same height as planet (horizontal plane)
          const branchZ = position.z + branchOrbitRadius * Math.sin(branchAngle);
          
          branch.position.set(branchX, branchY, branchZ);
        });
      }
      
      // Update PRs position (stationary near planet with small shake)
      if (this.prs[index]) {
        const planetRadius = planet.children[0]?.userData?.radius || 1;
        this.prs[index].forEach((pr, prIndex) => {
          // Position near planet, not orbiting
          const prDistance = planetRadius * 1.3 + prIndex * 0.5; // Close to planet
          const baseAngle = (prIndex * Math.PI * 2) / this.prs[index].length;
          
          // Small shake movement (agitación)
          const shakeX = Math.sin(elapsedTime * 2 + prIndex) * 0.1;
          const shakeY = Math.cos(elapsedTime * 1.5 + prIndex) * 0.1;
          const shakeZ = Math.sin(elapsedTime * 1.8 + prIndex) * 0.1;
          
          // Position around planet but stationary, elevated above moons
          const prX = position.x + prDistance * Math.cos(baseAngle) + shakeX;
          const prY = position.y + 2.5 + prDistance * Math.sin(baseAngle) + shakeY; // +2.5 para mover arriba
          const prZ = position.z + shakeZ;
          
          pr.position.set(prX, prY, prZ);
          
          // Rotate to face planet - si el modelo está en vertical, rotar 90° en X primero
          pr.lookAt(position);
          // Si el modelo originalmente apunta hacia arriba (vertical), rotar para que apunte hacia el planeta
          pr.rotateX(-Math.PI / -2); // Rotar 90° en X para que el frente apunte hacia el planeta
        });
      }
      
      // Update comets (rockets) position - cross system and fade in/out
      if (this.comets[index]) {
        // Filter out comets that should be removed
        this.comets[index] = this.comets[index].filter((comet) => {
          const cometData = comet.userData;
          
          // Check if should be removed
          if (cometData.shouldRemove) {
            this.removeObject(comet);
            // Dispose resources
            comet.traverse((child) => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
            return false; // Remove from array
          }
          
          const cometAngle = elapsedTime * cometData.orbitSpeed;
          const cometRadius = cometData.orbitRadius * (1 + cometData.eccentricity * Math.cos(cometAngle));
          
          // Position rocket crossing the system (not just orbiting one planet)
          // Make it travel across the entire universe
          const cometX = position.x + cometRadius * Math.cos(cometAngle);
          const cometY = position.y + cometRadius * Math.sin(cometAngle) + Math.sin(elapsedTime * 0.5) * 5; // Add vertical movement
          const cometZ = position.z + cometRadius * 0.5 * Math.sin(cometAngle * 0.5);
          
          comet.position.set(cometX, cometY, cometZ);
          
          // Rotate rocket to face direction of travel
          const nextAngle = cometAngle + 0.1;
          const nextRadius = cometData.orbitRadius * (1 + cometData.eccentricity * Math.cos(nextAngle));
          const nextX = position.x + nextRadius * Math.cos(nextAngle);
          const nextY = position.y + nextRadius * Math.sin(nextAngle);
          const nextZ = position.z + nextRadius * 0.5 * Math.sin(nextAngle * 0.5);
          
          const direction = new THREE.Vector3(nextX - cometX, nextY - cometY, nextZ - cometZ).normalize();
          comet.lookAt(comet.position.clone().add(direction));
          
          // Handle fade in/out animation
          const timeSinceCreation = (Date.now() - cometData.createdAt) / 1000; // seconds
          
          if (timeSinceCreation < cometData.fadeInTime) {
            // Fade in
            const fadeProgress = timeSinceCreation / cometData.fadeInTime;
            cometData.opacity = fadeProgress;
          } else if (timeSinceCreation < cometData.fadeInTime + cometData.visibleDuration) {
            // Fully visible
            cometData.opacity = 1.0;
          } else if (timeSinceCreation < cometData.fadeInTime + cometData.visibleDuration + cometData.fadeOutTime) {
            // Fade out
            const fadeOutProgress = (timeSinceCreation - cometData.fadeInTime - cometData.visibleDuration) / cometData.fadeOutTime;
            cometData.opacity = 1.0 - fadeOutProgress;
          } else {
            // Should be removed
            cometData.shouldRemove = true;
            cometData.opacity = 0.0;
          }
          
          // Apply opacity to materials
          comet.traverse((child) => {
            if (child.isMesh && child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat) => {
                if (mat.transparent !== undefined) {
                  if (mat.userData?.baseOpacity !== undefined) {
                    mat.opacity = cometData.opacity * mat.userData.baseOpacity;
                  } else {
                    mat.opacity = cometData.opacity;
                  }
                }
              });
            }
          });
          
          return true; // Keep in array
        });
      }
    });
    
    // ✅ GENERAR COHETES DECORATIVOS PERIÓDICAMENTE (independientes de repos)
    const now = Date.now();
    if (now - this.lastRocketSpawn > this.rocketSpawnInterval) {
      const newRocket = generateDecorativeRocket();
      const rocketData = newRocket.userData;
      // Posición inicial MUY ALEJADA del centro para evitar planetas
      const startAngle = rocketData.startAngle;
      const startRadius = rocketData.orbitRadius;
      newRocket.position.set(
        startRadius * Math.cos(startAngle),
        rocketData.verticalOffset, // Usar el offset vertical del userData
        startRadius * Math.sin(startAngle)
      );
      this.decorativeRockets.push(newRocket);
      this.addObject(newRocket);
      this.lastRocketSpawn = now;
    }
    
    // ✅ ANIMAR COHETES DECORATIVOS
    this.decorativeRockets = this.decorativeRockets.filter((rocket) => {
      const rocketData = rocket.userData;
      
      if (rocketData.shouldRemove) {
        this.removeObject(rocket);
        rocket.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        return false;
      }
      
      // Mover cohete cruzando el sistema - MUY ALEJADO para evitar planetas
      const angle = elapsedTime * rocketData.orbitSpeed + rocketData.startAngle;
      const radius = rocketData.orbitRadius * (1 + rocketData.eccentricity * Math.cos(angle));
      
      // Mantener altura vertical alejada del plano orbital de los planetas
      const baseY = rocketData.verticalOffset || 0;
      const verticalMovement = Math.sin(elapsedTime * 0.2) * 5; // Movimiento vertical suave
      
      rocket.position.x = radius * Math.cos(angle);
      rocket.position.y = baseY + verticalMovement; // Mantener altura alejada de planetas
      rocket.position.z = radius * Math.sin(angle);
      
      // Rotate rocket to face direction of travel
      const nextAngle = angle + 0.1;
      const nextRadius = rocketData.orbitRadius * (1 + rocketData.eccentricity * Math.cos(nextAngle));
      const nextX = nextRadius * Math.cos(nextAngle);
      const nextY = rocket.position.y;
      const nextZ = nextRadius * Math.sin(nextAngle);
      
      const direction = new THREE.Vector3(nextX - rocket.position.x, nextY - rocket.position.y, nextZ - rocket.position.z).normalize();
      rocket.lookAt(rocket.position.clone().add(direction));
      
      // Fade in/out
      const timeSinceCreation = (Date.now() - rocketData.createdAt) / 1000;
      if (timeSinceCreation < rocketData.fadeInTime) {
        rocketData.opacity = timeSinceCreation / rocketData.fadeInTime;
      } else if (timeSinceCreation < rocketData.fadeInTime + rocketData.visibleDuration) {
        rocketData.opacity = 1.0;
      } else if (timeSinceCreation < rocketData.fadeInTime + rocketData.visibleDuration + rocketData.fadeOutTime) {
        const fadeOutProgress = (timeSinceCreation - rocketData.fadeInTime - rocketData.visibleDuration) / rocketData.fadeOutTime;
        rocketData.opacity = 1.0 - fadeOutProgress;
      } else {
        rocketData.shouldRemove = true;
      }
      
      // Aplicar opacity
      rocket.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat.transparent !== undefined) {
              mat.opacity = rocketData.opacity * (mat.userData?.baseOpacity || 1.0);
            }
          });
        }
      });
      
      return true;
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

  /**
   * Create skybox with milky way texture (3D sphere like Blender environment)
   */
  createSkybox() {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/textures/2k_stars.jpg',
      (texture) => {
        // Hide GalaxyRenderer canvas so skybox is visible
        const galaxyCanvas = document.getElementById('galaxy-canvas');
        if (galaxyCanvas) {
          galaxyCanvas.style.display = 'none';
        }
        
        // Set scene.background so it's always visible
        this.scene.background = texture;
        
        // ALSO create 3D sphere skybox for parallax effect when rotating camera
        // This will overlay the static background with 3D effect
        const skyboxGeometry = new THREE.SphereGeometry(1800, 64, 64);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
          map: texture.clone(),
          side: THREE.BackSide,
          fog: false,
          depthWrite: false,
          transparent: false
        });
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        // Render skybox first (before everything else)
        skybox.renderOrder = -Infinity;
        skybox.receiveShadow = false;
        skybox.castShadow = false;
        
        this.scene.add(skybox);
        this.skybox = skybox;
        
        // Force render
        if (this.renderer && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      },
      undefined,
      (error) => {
        console.error('[SCENE] ❌ Could not load skybox texture:', error);
      }
    );
  }
}

