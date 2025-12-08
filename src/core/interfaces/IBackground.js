/**
 * IBackground - Interface for background rendering systems
 * Segregated interface following ISP
 */
export class IBackground {
  initialize() {
    throw new Error('initialize() must be implemented');
  }

  update(deltaTime) {
    throw new Error('update() must be implemented');
  }

  highlightAt(x, y) {
    throw new Error('highlightAt() must be implemented');
  }

  dispose() {
    throw new Error('dispose() must be implemented');
  }
}

