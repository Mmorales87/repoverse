/**
 * AppConfig - Centralized configuration
 * Single Responsibility: Configuration management
 */
export class AppConfig {
  static RENDERING = {
    MAX_PLANETS: 120,
    TOP_K_PLANETS: 8,
    ENABLE_LENS_PASS: true,
    ENABLE_BLOOM: true,
  };

  static GALAXY = {
    DENSITY: 0.4,
    GLOW_INTENSITY: 0.1,
    SATURATION: 0.2,
    HUE_SHIFT: 200,
    TWINKLE_INTENSITY: 0.7,
    ROTATION_SPEED: 0.1,
    REPULSION_STRENGTH: 3,
    STAR_SPEED: 0.2,
    SPEED: 1,
  };

  static PERFORMANCE = {
    DISABLE_LENS_ON_LOW_END: true,
    DISABLE_GALAXY_ON_LOW_END: true,
    LOW_END_CORES_THRESHOLD: 2,
  };

  static EXPORT = {
    FILENAME_PREFIX: 'repoverse',
    QUALITY: 1.0,
  };

  /**
   * Check if device is low-end
   */
  static isLowEndDevice() {
    if (typeof navigator === 'undefined') return false;
    return navigator.hardwareConcurrency <= AppConfig.PERFORMANCE.LOW_END_CORES_THRESHOLD;
  }
}

