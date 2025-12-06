/**
 * Home Screen - Initial input screen
 */
export class HomeScreen {
  constructor(container, onGenerate) {
    this.container = container;
    this.onGenerate = onGenerate;
    this.elements = {};
  }

  /**
   * Initialize home screen
   */
  initialize() {
    this.createHomeScreen();
  }

  /**
   * Create home screen UI
   */
  createHomeScreen() {
    const home = document.createElement('div');
    home.id = 'home-screen';
    home.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e1e2e 0%, #000000 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'RepoVerse';
    title.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #64b5f6, #42a5f5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Visualiza tus repositorios de GitHub como un universo 3D';
    subtitle.style.cssText = `
      font-size: 18px;
      opacity: 0.7;
      margin-bottom: 40px;
    `;
    
    const form = document.createElement('div');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 400px;
    `;
    
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    const label = document.createElement('label');
    label.textContent = 'Usuario de GitHub';
    label.style.cssText = `
      font-size: 14px;
      opacity: 0.8;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'home-username-input';
    input.placeholder = 'mmorales87';
    input.value = 'mmorales87';
    input.style.cssText = `
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    `;
    input.onfocus = () => input.style.borderColor = 'rgba(100, 181, 246, 0.8)';
    input.onblur = () => input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    
    const generateBtn = document.createElement('button');
    generateBtn.id = 'home-generate-btn';
    generateBtn.textContent = 'Generar Universo';
    generateBtn.style.cssText = `
      padding: 14px 24px;
      background: linear-gradient(90deg, #64b5f6, #42a5f5);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    generateBtn.onmouseover = () => {
      generateBtn.style.transform = 'translateY(-2px)';
      generateBtn.style.boxShadow = '0 4px 12px rgba(100, 181, 246, 0.4)';
    };
    generateBtn.onmouseout = () => {
      generateBtn.style.transform = 'translateY(0)';
      generateBtn.style.boxShadow = 'none';
    };
    generateBtn.onclick = () => {
      const username = input.value.trim() || 'mmorales87';
      this.showLoading();
      if (this.onGenerate) {
        this.onGenerate(username);
      }
    };
    
    const info = document.createElement('p');
    info.textContent = 'Usa la API pública de GitHub. Sin tokens requeridos.';
    info.style.cssText = `
      font-size: 12px;
      opacity: 0.5;
      margin-top: 20px;
      text-align: center;
    `;
    
    form.appendChild(inputGroup);
    form.appendChild(generateBtn);
    form.appendChild(info);
    
    home.appendChild(title);
    home.appendChild(subtitle);
    home.appendChild(form);
    
    // Loading overlay
    const loading = document.createElement('div');
    loading.id = 'home-loading';
    loading.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 2001;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #64b5f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Cargando repositorios...';
    loadingText.style.cssText = `
      margin-top: 20px;
      font-size: 16px;
      opacity: 0.8;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    loading.appendChild(spinner);
    loading.appendChild(loadingText);
    home.appendChild(loading);
    
    this.container.appendChild(home);
    
    this.elements = {
      home,
      input,
      generateBtn,
      loading
    };
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.elements.loading) {
      this.elements.loading.style.display = 'flex';
    }
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = true;
      this.elements.generateBtn.textContent = 'Cargando...';
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.elements.loading) {
      this.elements.loading.style.display = 'none';
    }
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = false;
      this.elements.generateBtn.textContent = 'Generar Universo';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    this.hideLoading();
    
    const error = document.createElement('div');
    error.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 100, 0, 0.9);
      padding: 15px 30px;
      border-radius: 8px;
      z-index: 2002;
      font-size: 14px;
    `;
    error.textContent = message;
    
    this.elements.home.appendChild(error);
    
    setTimeout(() => {
      error.remove();
    }, 5000);
  }

  /**
   * Hide home screen
   */
  hide() {
    if (this.elements.home) {
      this.elements.home.style.display = 'none';
    }
  }

  /**
   * Show home screen
   */
  show() {
    if (this.elements.home) {
      this.elements.home.style.display = 'flex';
    }
  }

  /**
   * Dispose home screen
   */
  dispose() {
    if (this.elements.home) {
      this.elements.home.remove();
    }
  }
}

