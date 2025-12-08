/**
 * RendererFactory - Factory for creating renderers
 * Follows Open/Closed Principle - can extend without modifying
 */
import { SceneManager } from '../../rendering/scene/SceneManager.js';
import { GalaxyRenderer } from '../../rendering/background/GalaxyRenderer.js';
import { StarfieldFallback } from '../../rendering/background/StarfieldFallback.js';

export class RendererFactory {
  /**
   * Create scene renderer
   */
  static async createSceneRenderer(canvas) {
    const { SceneManager } = await import('../../rendering/scene/SceneManager.js');
    const renderer = new SceneManager(canvas);
    renderer.initialize();
    return renderer;
  }

  /**
   * Create background renderer (Galaxy or fallback)
   */
  static async createBackgroundRenderer(container, scene) {
    try {
      const { GalaxyRenderer } = await import('../../rendering/background/GalaxyRenderer.js');
      const galaxy = new GalaxyRenderer(container);
      await galaxy.initialize();
      return galaxy;
    } catch (error) {
      console.warn('[RendererFactory] Galaxy failed, using starfield fallback:', error.message);
      const { StarfieldFallback } = await import('../../rendering/background/StarfieldFallback.js');
      const fallback = new StarfieldFallback(scene);
      fallback.initialize();
      return fallback;
    }
  }
}

