/**
 * Filter Toggle UI - Checkbox to toggle between "all" and "active" filter modes
 * 
 * All UI logic is contained in initializeFilterToggle() method
 * To disable: simply comment out the call to initializeFilterToggle()
 */
export class FilterToggleUI {
  constructor(container, onFilterModeChange) {
    this.container = container;
    this.onFilterModeChange = onFilterModeChange;
    this.elements = {};
    this.showActiveOnly = true; // Default: show only active repos
  }

  /**
   * Initialize filter toggle UI
   * All checkbox logic is here - easy to disable by commenting this call
   */
  initializeFilterToggle() {
    // Create container for filter toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'filter-toggle-container';
    toggleContainer.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: auto;
    `;

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'filter-toggle-checkbox';
    checkbox.checked = this.showActiveOnly;
    checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      cursor: pointer;
    `;

    // Create label
    const label = document.createElement('label');
    label.htmlFor = 'filter-toggle-checkbox';
    label.textContent = 'Mostrar solo repos activos este año';
    label.style.cssText = `
      color: white;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Handle checkbox change
    checkbox.addEventListener('change', (e) => {
      this.showActiveOnly = e.target.checked;
      const mode = this.showActiveOnly ? 'active' : 'all';
      
      if (this.onFilterModeChange) {
        this.onFilterModeChange(mode);
      }
    });

    // Assemble UI
    toggleContainer.appendChild(checkbox);
    toggleContainer.appendChild(label);
    this.container.appendChild(toggleContainer);

    // Store elements for potential cleanup
    this.elements = {
      container: toggleContainer,
      checkbox: checkbox,
      label: label
    };
  }

  /**
   * Get current filter mode
   * @returns {string} - "active" or "all"
   */
  getFilterMode() {
    return this.showActiveOnly ? 'active' : 'all';
  }

  /**
   * Set filter mode programmatically
   * @param {string} mode - "active" or "all"
   */
  setFilterMode(mode) {
    this.showActiveOnly = mode === 'active';
    if (this.elements.checkbox) {
      this.elements.checkbox.checked = this.showActiveOnly;
    }
  }

  /**
   * Dispose and remove UI
   */
  dispose() {
    if (this.elements.container) {
      this.elements.container.remove();
    }
    this.elements = {};
  }
}
