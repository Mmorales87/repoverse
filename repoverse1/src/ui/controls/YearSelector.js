/**
 * Year Selector - Timeline slider for historical snapshots
 */
export class YearSelector {
  constructor(container, onYearChange, onAgeMappingChange) {
    this.container = container;
    this.onYearChange = onYearChange;
    this.onAgeMappingChange = onAgeMappingChange;
    this.elements = {};
    this.minYear = 2020;
    this.maxYear = new Date().getFullYear();
    this.currentYear = this.maxYear;
    this.ageMapping = 'older-farther';
    this.isPlaying = false;
    this.playInterval = null;
  }

  /**
   * Initialize year selector
   */
  initialize() {
    this.createYearSelector();
  }

  /**
   * Create year selector UI
   */
  createYearSelector() {
    const selector = document.createElement('div');
    selector.id = 'year-selector';
    selector.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 15px 25px;
      border-radius: 10px;
      z-index: 1001;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 400px;
      pointer-events: auto;
    `;
    
    // Year label
    const yearLabel = document.createElement('div');
    yearLabel.id = 'year-selector-label';
    yearLabel.style.cssText = `
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: white;
    `;
    yearLabel.textContent = `Año: ${this.currentYear}`;
    
    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'year-selector-slider';
    slider.min = this.minYear;
    slider.max = this.maxYear;
    slider.value = this.currentYear;
    slider.step = 1;
    slider.style.cssText = `
      width: 100%;
      cursor: pointer;
    `;
    
    slider.addEventListener('input', (e) => {
      const year = parseInt(e.target.value);
      this.currentYear = year;
      yearLabel.textContent = `Año: ${year}`;
      
      // Calculate snapshot date (end of selected year)
      const snapshotDate = new Date(year, 11, 31, 23, 59, 59);
      if (this.onYearChange) {
        this.onYearChange(year, snapshotDate);
      }
    });
    
    // Controls row
    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: center;
    `;
    
    // Play/Pause button
    const playBtn = document.createElement('button');
    playBtn.id = 'year-selector-play';
    playBtn.textContent = '▶ Play';
    playBtn.style.cssText = `
      padding: 5px 15px;
      background: rgba(100, 181, 246, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 12px;
    `;
    playBtn.onclick = () => this.togglePlay();
    
    // Age mapping toggle
    const mappingLabel = document.createElement('label');
    mappingLabel.style.cssText = `
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
    `;
    
    const mappingCheckbox = document.createElement('input');
    mappingCheckbox.type = 'checkbox';
    mappingCheckbox.id = 'age-mapping-toggle';
    mappingCheckbox.checked = false; // older-farther is default
    mappingCheckbox.style.cssText = `cursor: pointer;`;
    
    mappingCheckbox.addEventListener('change', (e) => {
      this.ageMapping = e.target.checked ? 'older-closer' : 'older-farther';
      if (this.onAgeMappingChange) {
        this.onAgeMappingChange(this.ageMapping);
      }
    });
    
    const mappingText = document.createElement('span');
    mappingText.textContent = 'Invertir mapping (antiguos más cerca)';
    
/*     mappingLabel.appendChild(mappingCheckbox);
    mappingLabel.appendChild(mappingText);
    
    controlsRow.appendChild(playBtn);
    controlsRow.appendChild(mappingLabel); */
    
    selector.appendChild(yearLabel);
    selector.appendChild(slider);
    selector.appendChild(controlsRow);
    
    this.container.appendChild(selector);
    
    this.elements = {
      selector,
      label: yearLabel,
      slider,
      playBtn,
      mappingCheckbox
    };
  }

  /**
   * Set year range
   */
  setYearRange(minYear, maxYear) {
    this.minYear = minYear;
    this.maxYear = maxYear;
    
    if (this.elements.slider) {
      this.elements.slider.min = minYear;
      this.elements.slider.max = maxYear;
    }
  }

  /**
   * Set current year
   */
  setCurrentYear(year) {
    this.currentYear = year;
    if (this.elements.slider) {
      this.elements.slider.value = year;
    }
    if (this.elements.label) {
      this.elements.label.textContent = `Año: ${year}`;
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    this.isPlaying = !this.isPlaying;
    
    if (this.isPlaying) {
      this.elements.playBtn.textContent = '⏸ Pause';
      this.startAutoPlay();
    } else {
      this.elements.playBtn.textContent = '▶ Play';
      this.stopAutoPlay();
    }
  }

  /**
   * Start auto-play
   */
  startAutoPlay() {
    this.stopAutoPlay(); // Clear any existing interval
    
    this.playInterval = setInterval(() => {
      if (this.currentYear < this.maxYear) {
        this.currentYear++;
        this.setCurrentYear(this.currentYear);
        
        const snapshotDate = new Date(this.currentYear, 11, 31, 23, 59, 59);
        if (this.onYearChange) {
          this.onYearChange(this.currentYear, snapshotDate);
        }
      } else {
        // Reached end, stop
        this.togglePlay();
      }
    }, 500); // 500ms per year
  }

  /**
   * Stop auto-play
   */
  stopAutoPlay() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  /**
   * Dispose
   */
  dispose() {
    this.stopAutoPlay();
    if (this.elements.selector) {
      this.elements.selector.remove();
    }
  }
}

