// Core utilities
import { ErrorHandler } from './utils/ErrorHandler.js';
import { Logger } from './utils/Logger.js';
import { RendererFactory } from './core/factories/RendererFactory.js';
import { RepositoryFilterManager } from './core/managers/RepositoryFilterManager.js';

// Dynamic imports to avoid circular dependencies and improve code splitting

// Services
import { fetchUserRepositories, isRateLimitExceeded } from './services/dataSources/GitHubDataSource.js';
import mockData from './mock/mockData.json';
import * as THREE from 'three';

/**
 * Main App - Coordinates all components
 */
export class App {
  constructor() {
    // Core components
    this.canvas = null;
    
    // Rendering components (depend on interfaces, not implementations - DIP)
    this.sceneRenderer = null;
    this.backgroundRenderer = null;
    this.effectsManager = null;
    this.backgroundManager = null;
    
    // UI components
    this.hudManager = null;
    this.homeScreen = null;
    this.yearSelector = null;
    this.planetDetailsPanel = null;
    this.shareCard = null;
    this.filterToggleUI = null;
    
    // State
    this.currentUsername = null;
    this.useMockData = false;
    this.snapshotDate = new Date();
    this.ageMapping = 'older-farther';
    this.allRepositories = [];
    this.filterMode = 'active'; // Default: show only active repos
    this.totalSumStars = 0; // Total stars from all repos (for consistent sun size)
    
    // Managers
    this.repositoryFilterManager = new RepositoryFilterManager();
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  /**
   * Initialize app
   */
  async initialize() {
    try {
      Logger.log(Logger.PREFIXES.APP, 'Starting initialization...');
      
      // Initialize home screen FIRST (so it shows even if Three.js fails)
      await this._initializeHomeScreen();

      // Initialize canvas and rendering
      this._initializeCanvas();
      await this._initializeRendering();
      await this._initializeUI();
      this._setupInteractions();
      this._checkUrlParams();
      this._startAnimationLoop();
      this._setupResizeHandler();
      
      Logger.success(Logger.PREFIXES.APP, 'Initialization complete');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.APP);
      if (this.homeScreen) {
        this.homeScreen.showError(ErrorHandler.getUserMessage(error));
      }
    }
  }

  /**
   * Initialize home screen
   * Single Responsibility: Home screen setup
   */
  async _initializeHomeScreen() {
    Logger.log(Logger.PREFIXES.APP, 'Initializing HomeScreen...');
    const { HomeScreen } = await import('./ui/home/HomeScreen.js');
    this.homeScreen = new HomeScreen(document.body, (username) => {
      this.generateUniverse(username);
    });
    this.homeScreen.initialize();
    Logger.success(Logger.PREFIXES.APP, 'HomeScreen initialized');
  }

  /**
   * Initialize canvas
   * Single Responsibility: Canvas setup
   */
  _initializeCanvas() {
    Logger.log(Logger.PREFIXES.APP, 'Getting canvas element...');
    this.canvas = document.getElementById('repoverse-canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    Logger.success(Logger.PREFIXES.APP, `Canvas initialized: ${this.canvas.width}x${this.canvas.height}`);
  }

  /**
   * Initialize rendering components
   * Uses Factory pattern - Open/Closed Principle
   */
  async _initializeRendering() {
    Logger.log(Logger.PREFIXES.APP, 'Initializing rendering components...');
    
    // Scene renderer (required)
    this.sceneRenderer = await RendererFactory.createSceneRenderer(this.canvas);
    Logger.success(Logger.PREFIXES.APP, 'SceneRenderer initialized');
    
    // Background renderer (optional - factory handles fallback)
    this.backgroundRenderer = await RendererFactory.createBackgroundRenderer(
      document.body,
      this.sceneRenderer.scene
    );
    Logger.success(Logger.PREFIXES.APP, 'BackgroundRenderer initialized');
    
    // Background manager
    const { BackgroundManager } = await import('./rendering/background/BackgroundManager.js');
    this.backgroundManager = new BackgroundManager(this.sceneRenderer.scene);
    this.backgroundManager.initialize();
    Logger.success(Logger.PREFIXES.APP, 'BackgroundManager initialized');
    
    // Effects manager
    const { EffectsManager } = await import('./rendering/effects/EffectsManager.js');
    this.effectsManager = new EffectsManager(
      this.sceneRenderer.renderer,
      this.sceneRenderer.scene,
      this.sceneRenderer.camera
    );
    this.effectsManager.initialize();
    Logger.success(Logger.PREFIXES.APP, 'EffectsManager initialized');
  }

  /**
   * Initialize UI components
   * Single Responsibility: UI setup
   */
  async _initializeUI() {
    Logger.log(Logger.PREFIXES.APP, 'Initializing UI components...');
    
    // Year Selector
    try {
      const { YearSelector } = await import('./ui/controls/YearSelector.js');
      this.yearSelector = new YearSelector(document.body, 
        (year, snapshotDate) => {
          this.snapshotDate = snapshotDate;
          this.updateUniverseSnapshot();
        },
        (ageMapping) => {
          this.ageMapping = ageMapping;
          this.updateUniverseSnapshot();
        }
      );
      this.yearSelector.initialize();
      Logger.success(Logger.PREFIXES.APP, 'YearSelector initialized');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.UI, null);
      this.yearSelector = null;
    }

    // Planet Details Panel
    try {
      const { PlanetDetailsPanel } = await import('./ui/panels/PlanetDetailsPanel.js');
      this.planetDetailsPanel = new PlanetDetailsPanel(document.body);
      this.planetDetailsPanel.initialize();
      Logger.success(Logger.PREFIXES.APP, 'PlanetDetailsPanel initialized');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.UI, null);
      this.planetDetailsPanel = null;
    }

    // HUD Manager
    try {
      const { HUDManager } = await import('./ui/hud/HUDManager.js');
      this.hudManager = new HUDManager(document.body);
      this.hudManager.initialize(
        this.backgroundManager,
        this.sceneRenderer,
        this.effectsManager,
        this.backgroundRenderer,
        this.yearSelector,
        this // Pass app reference
      );
      Logger.success(Logger.PREFIXES.APP, 'HUDManager initialized');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.UI, null);
      this.hudManager = null;
    }

    // ShareCard
    try {
      const { ShareCard } = await import('./ui/shareCard.js');
      this.shareCard = new ShareCard(this);
      Logger.success(Logger.PREFIXES.APP, 'ShareCard initialized');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.APP, 'ShareCard');
    }

    // Filter Toggle UI
    try {
      const { FilterToggleUI } = await import('./ui/controls/FilterToggleUI.js');
      this.filterToggleUI = new FilterToggleUI(document.body, (mode) => {
        this.filterMode = mode;
        this.updateUniverseSnapshot();
      });
      // Initialize filter toggle - can be easily disabled by commenting this line
      this.filterToggleUI.initializeFilterToggle();
      Logger.success(Logger.PREFIXES.APP, 'FilterToggleUI initialized');
    } catch (error) {
      ErrorHandler.handleInitError(error, Logger.PREFIXES.UI, null);
      this.filterToggleUI = null;
    }
  }

  /**
   * Setup interactions
   */
  _setupInteractions() {
    try {
      this.setupPlanetClickInteraction();
    } catch (error) {
      ErrorHandler.handleRuntimeError(error, Logger.PREFIXES.APP, 'setupInteractions');
    }
  }

  /**
   * Check URL parameters
   */
  _checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    if (userParam && this.sceneRenderer) {
      this.generateUniverse(userParam);
    }
  }

  /**
   * Start animation loop
   */
  _startAnimationLoop() {
    if (!this.sceneRenderer?.initialized || !this.sceneRenderer?.renderer) {
      Logger.warn(Logger.PREFIXES.APP, 'SceneRenderer not ready, animation loop not started');
      return;
    }
    
    Logger.log(Logger.PREFIXES.APP, 'Starting animation loop...');
    this.startAnimationLoop();
    Logger.success(Logger.PREFIXES.APP, 'Animation loop started');
  }

  /**
   * Setup resize handler
   */
  _setupResizeHandler() {
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Setup planet click interaction
   */
  setupPlanetClickInteraction() {
    if (!this.sceneRenderer?.canvas) return;
    
    this.sceneRenderer.canvas.addEventListener('click', (event) => {
      if (!this.sceneRenderer?.camera) return;
      
      const rect = this.sceneRenderer.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.sceneRenderer.camera);
      
      const planets = this.sceneRenderer.planets;
      const intersects = this.raycaster.intersectObjects(planets, true);
      
      if (intersects.length > 0) {
        let planetGroup = intersects[0].object;
        while (planetGroup.parent && planetGroup.parent !== this.sceneRenderer.scene) {
          planetGroup = planetGroup.parent;
        }
        
        const planetIndex = planets.indexOf(planetGroup);
        if (planetIndex >= 0) {
          const repo = planetGroup.children[0]?.userData?.repo;
          if (repo && this.planetDetailsPanel) {
            this.planetDetailsPanel.show(repo, this.currentUsername || 'user');
          }
        }
      }
    });
  }

  /**
   * Generate universe for user
   */
  async generateUniverse(username) {
    if (!this.sceneRenderer) {
      this.homeScreen?.showError('3D is not initialized. Please reload the page.');
      return;
    }

    this.currentUsername = username;
    this.homeScreen?.showLoading();

    try {
      let repositories;
      let rateLimit = null;

      // Fetch repositories from GitHub
      if (this.useMockData) {
        repositories = mockData.repositories;
        Logger.log(Logger.PREFIXES.DATA, 'Using mock data');
      } else {
        try {
          // Use token if available (for development only)
          // In production, this will be false or token won't be set
          const useToken = !!import.meta.env.VITE_GITHUB_TOKEN;
          const result = await fetchUserRepositories(username, useToken);
          repositories = result.repositories;
          rateLimit = result.rateLimit;

          if (isRateLimitExceeded(rateLimit)) {
            this.hudManager?.showRateLimitBanner();
            repositories = mockData.repositories;
            this.useMockData = true;
            Logger.warn(Logger.PREFIXES.DATA, 'Rate limit exceeded, using mock data');
          }
        } catch (error) {
          ErrorHandler.handleRuntimeError(error, Logger.PREFIXES.DATA, 'fetchRepositories');
          
          if (error.message === 'RATE_LIMIT_EXCEEDED') {
            this.hudManager?.showRateLimitBanner();
            repositories = mockData.repositories;
            this.useMockData = true;
          } else if (error.message === 'USER_NOT_FOUND') {
            this.homeScreen?.showError('User not found');
            this.homeScreen?.hideLoading();
            return;
          } else {
            repositories = mockData.repositories;
            this.useMockData = true;
            Logger.warn(Logger.PREFIXES.DATA, 'Error fetching, using mock data');
          }
        }
      }

      // Enrich repositories with lastCommitYear (cache once on load)
      const enrichedRepositories = this.repositoryFilterManager.enrichReposWithLastCommitYear(repositories);
      
      // Calculate stats
      const stats = this.calculateStats(enrichedRepositories);
      
      // Store enriched repositories for snapshot filtering
      this.allRepositories = enrichedRepositories;
      
      // Calculate total stars from ALL repos (for consistent sun size across years/filters)
      this.totalSumStars = enrichedRepositories.reduce((sum, repo) => sum + (repo.stars || 0), 0);
      
      // Calculate account creation year for year selector
      const accountCreationYear = this.calculateAccountCreationYear(repositories);
      if (this.yearSelector) {
        this.yearSelector.setYearRange(accountCreationYear, new Date().getFullYear());
        this.yearSelector.setCurrentYear(new Date().getFullYear());
      }

      // Generate universe with current snapshot
      this.updateUniverseSnapshot();

      // HUD is already updated in updateUniverseSnapshot() with filtered stats
      // No need to update again with all repos stats

      // Hide home screen
      this.homeScreen?.hide();
      this.homeScreen?.hideLoading();

      Logger.success(Logger.PREFIXES.APP, `Universe generated for ${username}: ${repositories.length} repositories`);
    } catch (error) {
      ErrorHandler.handleRuntimeError(error, Logger.PREFIXES.APP, 'generateUniverse');
      this.homeScreen?.showError('Error al generar el universo');
      this.homeScreen?.hideLoading();
    }
  }

  /**
   * Calculate statistics from repositories
   */
  calculateStats(repositories) {
    const totalRepos = repositories.length;
    // Sum commits correctly (not size!)
    const totalCommits = repositories.reduce((sum, repo) => {
      return sum + (repo.totalCommits || 0);
    }, 0);
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks || 0), 0);

    return {
      totalRepos,
      totalCommits,
      totalStars,
      totalForks
    };
  }

  /**
   * Calculate account creation year from repositories
   */
  calculateAccountCreationYear(repositories) {
    if (!repositories || repositories.length === 0) {
      return new Date().getFullYear() - 5; // Default to 5 years ago
    }
    
    let earliestYear = new Date().getFullYear();
    repositories.forEach(repo => {
      if (repo.createdAt) {
        const year = new Date(repo.createdAt).getFullYear();
        if (year < earliestYear) {
          earliestYear = year;
        }
      }
    });
    
    return earliestYear;
  }

  /**
   * Update universe based on current snapshot date and filter mode
   */
  updateUniverseSnapshot() {
    if (!this.allRepositories || !this.sceneRenderer) return;
    
    // Get selected year from snapshot date
    const selectedYear = this.snapshotDate.getFullYear();
    
    // Apply filter based on mode (active or all)
    const filteredRepos = this.repositoryFilterManager.filterRepositories(
      this.allRepositories,
      selectedYear,
      this.filterMode
    );
    
    // Calculate daysSinceCreationAtSnapshot for each repo
    const reposWithSnapshotAge = filteredRepos.map(repo => {
      const repoDate = new Date(repo.createdAt);
      const daysSinceCreationAtSnapshot = Math.floor(
        (this.snapshotDate - repoDate) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...repo,
        daysSinceCreationAtSnapshot: Math.max(0, daysSinceCreationAtSnapshot)
      };
    });
    
    // Calculate stats from FILTERED repos (what's actually visible on screen)
    const filteredStats = this.calculateStats(reposWithSnapshotAge);
    
    // Update HUD with filtered stats (reactive to year and filter mode)
    if (this.hudManager && this.currentUsername) {
      this.hudManager.updateUserData(this.currentUsername, filteredStats);
    }
    
    // Use total stars from ALL repos (not filtered) for consistent sun size
    // This ensures the sun size remains constant regardless of year or filter mode
    const sumStars = this.totalSumStars;
    
    // Generate universe with filtered snapshot data
    this.sceneRenderer.generateUniverse(reposWithSnapshotAge, {
      username: this.currentUsername,
      snapshotDate: this.snapshotDate,
      ageMapping: this.ageMapping,
      sumStars: sumStars
    });
  }

  /**
   * Start animation loop
   */
  startAnimationLoop() {
    if (!this.sceneRenderer?.initialized) {
      Logger.warn(Logger.PREFIXES.APP, 'Cannot start animation loop: sceneRenderer not initialized');
      return;
    }
    
    if (!this.sceneRenderer.renderer || !this.sceneRenderer.scene || !this.sceneRenderer.camera) {
      Logger.warn(Logger.PREFIXES.APP, 'Cannot start animation loop: renderer, scene, or camera not available');
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    
    const animate = () => {
      requestAnimationFrame(animate);
      frameCount++;

      // Log first frame
      if (frameCount === 1) {
        console.log('[ANIMATION] ✅ Frame 1 rendered - animation loop is working!');
      }

      try {
        // Calculate delta time manually (don't interfere with SceneManager's clock)
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
        lastTime = currentTime;
        
        // Update background
        if (this.backgroundManager) {
          this.backgroundManager.update();
        }

        // Update background renderer
        if (this.backgroundRenderer) {
          this.backgroundRenderer.update(deltaTime);
        }

        // Update scene (this includes planet rotations, orbits, etc.)
        // SceneManager.update() uses its own clock.getDelta() internally
        if (this.sceneRenderer) {
          this.sceneRenderer.update();

          // Get planet positions once for both Galaxy and LensPass
          const { positions, masses, count } = this.sceneRenderer.getTopKPlanetPositions();

          // Update Galaxy with planet positions (only if Galaxy is working)
          if (this.backgroundRenderer && typeof this.backgroundRenderer.updatePlanets === 'function') {
            try {
              this.backgroundRenderer.updatePlanets(positions, masses, count);
            } catch (galaxyError) {
              // Silently fail - Galaxy is optional
            }
          }

          // Update lens pass with planet positions
          if (this.effectsManager) {
            this.effectsManager.updateLensPass(positions, masses, count);
          }
        }

        // Update orbit lines in effects manager (so they render after LensPass)
        if (this.effectsManager && this.sceneRenderer) {
          const orbitLines = this.sceneRenderer.orbitLines || [];
          this.effectsManager.setOrbitLines(orbitLines);
        }
        
        // Render with effects
        if (this.effectsManager && this.effectsManager.composer) {
          this.effectsManager.render();
        } else if (this.sceneRenderer && this.sceneRenderer.renderer) {
          this.sceneRenderer.render();
        }
      } catch (error) {
        console.error('[ANIMATION] ❌ Error in animation loop:', error);
        console.error('[ANIMATION] Stack:', error.stack);
      }
    };

    animate();
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.sceneRenderer?.handleResize();
    this.effectsManager?.handleResize(width, height);
    this.backgroundRenderer?.resize();
  }

  /**
   * Dispose app
   */
  dispose() {
    this.sceneRenderer?.dispose();
    this.backgroundRenderer?.dispose();
    this.backgroundManager?.dispose();
    this.effectsManager?.dispose();
    this.hudManager?.dispose();
    this.homeScreen?.dispose();
    this.yearSelector?.dispose();
    this.planetDetailsPanel?.hide();
    this.filterToggleUI?.dispose();
  }
}

