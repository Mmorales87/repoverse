/**
 * ErrorHandler - Centralized error handling
 * Single Responsibility: Error management
 */
export class ErrorHandler {
  /**
   * Handle initialization error
   */
  static handleInitError(error, component, fallback = null) {
    console.error(`[${component}] ❌ Initialization failed:`, error);
    console.error(`[${component}] Stack:`, error.stack);
    
    if (fallback) {
      console.warn(`[${component}] Using fallback`);
      return fallback;
    }
    
    return null;
  }

  /**
   * Handle runtime error
   */
  static handleRuntimeError(error, component, context = '') {
    console.error(`[${component}] ❌ Runtime error${context ? ` in ${context}` : ''}:`, error);
    
    // Don't break the app, just log
    return false;
  }

  /**
   * Create user-friendly error message
   */
  static getUserMessage(error) {
    if (error.message.includes('WebGL')) {
      return 'Tu navegador no soporta WebGL. Por favor, actualiza tu navegador.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    return `Error: ${error.message}`;
  }
}

