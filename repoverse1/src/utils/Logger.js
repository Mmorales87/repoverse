/**
 * Logger - Centralized logging utility
 * Single Responsibility: Logging
 */
export class Logger {
  static PREFIXES = {
    APP: '[APP]',
    SCENE: '[SCENE]',
    GALAXY: '[GALAXY]',
    RENDERING: '[RENDERING]',
    DATA: '[DATA]',
    UI: '[UI]',
  };

  static log(prefix, message, ...args) {
    console.log(`${prefix} ${message}`, ...args);
  }

  static warn(prefix, message, ...args) {
    console.warn(`${prefix} ⚠️ ${message}`, ...args);
  }

  static error(prefix, message, ...args) {
    console.error(`${prefix} ❌ ${message}`, ...args);
  }

  static success(prefix, message, ...args) {
    console.log(`${prefix} ✅ ${message}`, ...args);
  }
}

