/**
 * IRenderer - Interface for rendering systems
 * Follows Interface Segregation Principle (ISP)
 */
export class IRenderer {
  initialize() {
    throw new Error('initialize() must be implemented');
  }

  render() {
    throw new Error('render() must be implemented');
  }

  update(deltaTime) {
    throw new Error('update() must be implemented');
  }

  dispose() {
    throw new Error('dispose() must be implemented');
  }

  handleResize(width, height) {
    throw new Error('handleResize() must be implemented');
  }
}

