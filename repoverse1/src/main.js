import { App } from './app.js';

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('[MAIN] Starting RepoVerse.js initialization...');
    
    // Remove loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();
    
    console.log('[MAIN] Creating App.js instance...');
    const app = new App();
    
    console.log('[MAIN] Calling app.initialize()...');
    await app.initialize();
    
    // Store app instance globally for debugging
    window.repoverseApp = app;
    
    console.log('[MAIN] ✅ RepoVerse.js initialized successfully');
  } catch (error) {
    // Remove loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();
    console.error('Failed to initialize RepoVerse.js:', error);
    console.error('Stack:', error.stack);
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      z-index: 10000;
      font-family: monospace;
      max-width: 80%;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Error</div>
      <div>${error.message}</div>
      <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">Check the console for more details</div>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

