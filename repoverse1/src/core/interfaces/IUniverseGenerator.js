/**
 * IUniverseGenerator - Interface for universe generation
 * Allows different generation strategies
 */
export class IUniverseGenerator {
  generate(repositories, config) {
    throw new Error('generate() must be implemented');
  }

  clear() {
    throw new Error('clear() must be implemented');
  }

  update(deltaTime) {
    throw new Error('update() must be implemented');
  }
}

