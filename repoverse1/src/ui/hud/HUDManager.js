/**
 * HUD Manager - User interface overlay
 */
import * as THREE from 'three';

export class HUDManager {
  constructor(container) {
    this.container = container;
    this.elements = {};
    this.backgroundManager = null;
    this.sceneManager = null;
    this.effectsManager = null;
    this.initialized = false;
  }

  /**
   * Initialize HUD
   */
  initialize(backgroundManager, sceneManager, effectsManager, galaxy, yearSelector, app) {
    this.backgroundManager = backgroundManager;
    this.sceneManager = sceneManager;
    this.effectsManager = effectsManager;
    this.galaxy = galaxy;
    this.yearSelector = yearSelector;
    this.app = app; // Store app reference for ShareCard
    this.currentStats = null; // Store current stats for export
    
    this.createHUD();
    this.initialized = true;
  }

  /**
   * Create HUD elements
   */
  createHUD() {
    // Container
    const hud = document.createElement('div');
    hud.id = 'hud-overlay';
    hud.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;
    
    // Top-left stats
    const topLeft = document.createElement('div');
    topLeft.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      pointer-events: auto;
    `;
    
    const usernameEl = document.createElement('div');
    usernameEl.id = 'hud-username';
    usernameEl.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
    
    const statsEl = document.createElement('div');
    statsEl.id = 'hud-stats';
    statsEl.style.cssText = `
      font-size: 14px;
      opacity: 0.8;
    `;
    
    topLeft.appendChild(usernameEl);
    topLeft.appendChild(statsEl);
    
    // Top-right controls
    const topRight = document.createElement('div');
    topRight.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
    `;
    
    const exportBtn = document.createElement('button');
    exportBtn.id = 'hud-export-btn';
    exportBtn.textContent = 'Export PNG';
    exportBtn.style.cssText = `
      padding: 10px 20px;
      background: rgba(100, 100, 255, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;
    exportBtn.onmouseover = () => exportBtn.style.background = 'rgba(100, 100, 255, 1)';
    exportBtn.onmouseout = () => exportBtn.style.background = 'rgba(100, 100, 255, 0.8)';
    exportBtn.onclick = () => this.exportUniversePNG();
    
    const demoBtn = document.createElement('button');
    demoBtn.id = 'hud-demo-btn';
    demoBtn.textContent = 'Toggle Demo';
    demoBtn.style.cssText = `
      padding: 10px 20px;
      background: rgba(255, 150, 0, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;
    demoBtn.onmouseover = () => demoBtn.style.background = 'rgba(255, 150, 0, 1)';
    demoBtn.onmouseout = () => demoBtn.style.background = 'rgba(255, 150, 0, 0.8)';
    
    // Legend button
    const legendBtn = document.createElement('button');
    legendBtn.id = 'hud-legend-btn';
    legendBtn.textContent = 'Leyenda';
    legendBtn.style.cssText = `
      padding: 10px 20px;
      background: rgba(150, 100, 255, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;
    legendBtn.onmouseover = () => legendBtn.style.background = 'rgba(150, 100, 255, 1)';
    legendBtn.onmouseout = () => legendBtn.style.background = 'rgba(150, 100, 255, 0.8)';
    legendBtn.onclick = () => this.toggleLegend();
    
    topRight.appendChild(exportBtn);
    topRight.appendChild(legendBtn);
    topRight.appendChild(demoBtn);
    
    // Share Card button
    const shareCardBtn = document.createElement('button');
    shareCardBtn.id = 'hud-share-card-btn';
    shareCardBtn.textContent = 'Export Year Card';
    shareCardBtn.style.cssText = `
      padding: 10px 20px;
      background: rgba(100, 181, 246, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
      margin-left: 10px;
    `;
    shareCardBtn.onmouseover = () => shareCardBtn.style.background = 'rgba(100, 181, 246, 1)';
    shareCardBtn.onmouseout = () => shareCardBtn.style.background = 'rgba(100, 181, 246, 0.8)';
    shareCardBtn.onclick = () => {
      if (this.app && this.app.shareCard) {
        this.app.shareCard.generateYearCard();
      }
    };
    topRight.appendChild(shareCardBtn);
    
    // Rate-limit banner
    const rateLimitBanner = document.createElement('div');
    rateLimitBanner.id = 'hud-rate-limit';
    rateLimitBanner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 100, 0, 0.9);
      padding: 20px 40px;
      border-radius: 10px;
      text-align: center;
      display: none;
      pointer-events: auto;
      z-index: 1001;
    `;
    rateLimitBanner.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        Rate Limit Alcanzado
      </div>
      <div style="font-size: 14px;">
        Usando modo demo con datos mock
      </div>
    `;
    
    hud.appendChild(topLeft);
    hud.appendChild(topRight);
    hud.appendChild(rateLimitBanner);
    
    this.container.appendChild(hud);
    
    // Legend panel (initially hidden)
    const legendPanel = this.createLegendPanel();
    hud.appendChild(legendPanel);
    
    this.elements = {
      username: usernameEl,
      stats: statsEl,
      exportBtn: exportBtn,
      demoBtn: demoBtn,
      legendBtn: legendBtn,
      shareCardBtn: shareCardBtn,
      rateLimitBanner: rateLimitBanner,
      legendPanel: legendPanel,
      hud: hud
    };
  }

  /**
   * Create legend panel
   */
  createLegendPanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-legend-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid rgba(150, 100, 255, 0.5);
      border-radius: 10px;
      padding: 20px;
      z-index: 2001;
      pointer-events: auto;
      overflow-y: auto;
      display: none;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; color: #9664FF;">Leyenda</h2>
        <button id="legend-close-btn" style="
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
        ">×</button>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid rgba(150, 100, 255, 0.5);">
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Elemento</th>
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Representa</th>
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Función visual</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">SOL</td>
            <td style="padding: 10px;">Usuario / organización</td>
            <td style="padding: 10px;">Punto central del sistema, influencia global, brillo/halo; puede irradiar partículas o pulso de energía</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Repo</td>
            <td style="padding: 10px;">Planeta</td>
            <td style="padding: 10px;">Unidad central, punto de interacción</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Peso del repositorio</td>
            <td style="padding: 10px;">Tamaño / masa</td>
            <td style="padding: 10px;">Tamaño del código (KB)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Branches</td>
            <td style="padding: 10px;">Lunas / Ramas</td>
            <td style="padding: 10px;">Ramas del repositorio (main/master más grande y brillante)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">PRs</td>
            <td style="padding: 10px;">Cohetes / Naves espaciales</td>
            <td style="padding: 10px;">Pull Requests en revisión (modelo GLTF 3D)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Commits recientes</td>
            <td style="padding: 10px;">Cometas</td>
            <td style="padding: 10px;">Actividad en últimas 24-48h (aparecen temporalmente)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Watchers</td>
            <td style="padding: 10px;">Halo / brillo</td>
            <td style="padding: 10px;">Atención / popularidad</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Contributors</td>
            <td style="padding: 10px;">Partículas / lunas</td>
            <td style="padding: 10px;">Comunidad y colaboración</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Lenguaje principal</td>
            <td style="padding: 10px;">Color / Matiz del planeta</td>
            <td style="padding: 10px;">Matiz de color sobre textura del planeta</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Actividad reciente</td>
            <td style="padding: 10px;">Velocidad / pulso</td>
            <td style="padding: 10px;">Dinamismo</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Edad</td>
            <td style="padding: 10px;">Radio orbital</td>
            <td style="padding: 10px;">Antigüedad relativa del repo</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Close button handler
    const closeBtn = panel.querySelector('#legend-close-btn');
    if (closeBtn) {
      closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
      closeBtn.onclick = () => this.toggleLegend();
    }
    
    return panel;
  }

  /**
   * Toggle legend panel
   */
  toggleLegend() {
    if (!this.elements.legendPanel) return;
    const isVisible = this.elements.legendPanel.style.display !== 'none';
    this.elements.legendPanel.style.display = isVisible ? 'none' : 'block';
  }

  /**
   * Update HUD with user data
   */
  updateUserData(username, stats) {
    if (this.elements.username) {
      this.elements.username.textContent = `@${username}`;
    }
    
    if (this.elements.stats) {
      const totalRepos = stats.totalRepos || 0;
      const totalCommits = stats.totalCommits || 0;
      this.elements.stats.textContent = `${totalRepos} repos • ${totalCommits.toLocaleString()} commits`;
    }
    
    // Store stats for export
    this.currentStats = stats;
    this.currentUsername = username;
  }

  /**
   * Show rate-limit banner
   */
  showRateLimitBanner() {
    if (this.elements.rateLimitBanner) {
      this.elements.rateLimitBanner.style.display = 'block';
      setTimeout(() => {
        if (this.elements.rateLimitBanner) {
          this.elements.rateLimitBanner.style.display = 'none';
        }
      }, 5000);
    }
  }

  /**
   * Export universe as PNG (composite Galaxy + Three.js)
   */
  exportUniversePNG() {
    if (!this.sceneManager || !this.sceneManager.renderer) {
      console.error('[HUD] Cannot export: sceneManager or renderer not available');
      return;
    }
    
    // Hide HUD and year selector
    const hudVisible = this.elements.hud ? this.elements.hud.style.display !== 'none' : false;
    if (this.elements.hud) {
      this.elements.hud.style.display = 'none';
    }
    
    const yearSelector = document.getElementById('year-selector');
    const yearSelectorVisible = yearSelector && yearSelector.style.display !== 'none';
    if (yearSelector) {
      yearSelector.style.display = 'none';
    }
    
    // Force render immediately
    if (this.effectsManager && this.effectsManager.composer) {
      this.effectsManager.render();
    } else if (this.sceneManager.renderer && this.sceneManager.scene && this.sceneManager.camera) {
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    }
    
    // Wait for render to complete - use double RAF to ensure GPU has finished
    requestAnimationFrame(() => {
      // Force another render
      if (this.effectsManager && this.effectsManager.composer) {
        this.effectsManager.render();
      } else if (this.sceneManager.renderer && this.sceneManager.scene && this.sceneManager.camera) {
        this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
      }
      
      requestAnimationFrame(() => {
        // Create composite canvas using current viewport size
    const width = window.innerWidth;
    const height = window.innerHeight;
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const ctx = compositeCanvas.getContext('2d');
        
        // Fill with black background first
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
    
    // Draw Galaxy background first
        if (this.galaxy && this.galaxy.canvas && this.galaxy.canvas.width > 0) {
          try {
            ctx.drawImage(this.galaxy.canvas, 0, 0, width, height);
          } catch (e) {
            console.warn('[HUD] Could not draw galaxy canvas:', e);
          }
        }
        
        // Draw Three.js canvas on top - use renderer.domElement which is the actual canvas
        const threeCanvas = this.sceneManager.renderer.domElement;
        if (threeCanvas && threeCanvas.width > 0 && threeCanvas.height > 0) {
          try {
            // Ensure canvas is fully rendered
            ctx.drawImage(threeCanvas, 0, 0, width, height);
          } catch (e) {
            console.error('[HUD] Error drawing Three.js canvas:', e);
            // Fallback: try the canvas property directly
            if (this.sceneManager.canvas && this.sceneManager.canvas.width > 0) {
              try {
                ctx.drawImage(this.sceneManager.canvas, 0, 0, width, height);
              } catch (e2) {
                console.error('[HUD] Fallback canvas also failed:', e2);
              }
            }
          }
        } else {
          console.warn('[HUD] Three.js canvas is empty or invalid', {
            hasCanvas: !!threeCanvas,
            width: threeCanvas?.width,
            height: threeCanvas?.height
          });
        }
        
        // Add overlay with user info and stats
        this.addExportOverlay(ctx, width, height);
    
    // Get composite data
    const dataURL = compositeCanvas.toDataURL('image/png');
    
        // Verify we have actual data
        if (dataURL && dataURL.length > 100) { // PNG data URLs are much longer than "data:,"
    // Create download link
    const link = document.createElement('a');
    const username = this.elements.username ? this.elements.username.textContent.replace('@', '') : 'user';
    const date = new Date().toISOString().split('T')[0];
    link.download = `repoverse-${username}-${date}.png`;
    link.href = dataURL;
          document.body.appendChild(link);
    link.click();
          setTimeout(() => document.body.removeChild(link), 100);
        } else {
          console.error('[HUD] Failed to generate PNG data - dataURL too short:', dataURL?.substring(0, 50));
          alert('Error al generar la imagen. El canvas puede estar vacío. Por favor, inténtalo de nuevo.');
        }
    
        // Restore HUD and year selector immediately
    if (this.elements.hud && hudVisible) {
      this.elements.hud.style.display = 'block';
    }
    if (yearSelector && yearSelectorVisible) {
      yearSelector.style.display = 'block';
    }
      });
    });
  }

  /**
   * Add overlay with user info and stats to export image
   */
  addExportOverlay(ctx, width, height) {
    const username = this.currentUsername || (this.elements.username ? this.elements.username.textContent.replace('@', '') : 'user');
    const stats = this.currentStats || { totalRepos: 0, totalCommits: 0, totalStars: 0 };
    const year = this.app?.snapshotDate ? this.app.snapshotDate.getFullYear() : new Date().getFullYear();
    
    // Bottom overlay with gradient
    const overlayHeight = 140;
    const overlayY = height - overlayHeight;
    const gradient = ctx.createLinearGradient(0, overlayY, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, overlayY, width, overlayHeight);
    
    // Top overlay for username
    const topOverlayHeight = 100;
    const topGradient = ctx.createLinearGradient(0, 0, 0, topOverlayHeight);
    topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    topGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
    topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, topOverlayHeight);
    
    // Username at top
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`@${username}`, width / 2, 25);
    
    // Year badge
    ctx.fillStyle = '#64b5f6';
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${year}`, width / 2, 60);
    
    // Stats at bottom - left side
    const leftX = 40;
    const bottomY = height - 30;
    const statSpacing = 120;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    // Repos
    ctx.fillText('Repositorios', leftX, bottomY - 60);
    ctx.fillStyle = '#64b5f6';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText((stats.totalRepos || 0).toString(), leftX, bottomY - 30);
    
    // Commits
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Commits', leftX + statSpacing, bottomY - 60);
    ctx.fillStyle = '#64b5f6';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText((stats.totalCommits || 0).toLocaleString(), leftX + statSpacing, bottomY - 30);
    
    // Stars
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Stars', leftX + statSpacing * 2, bottomY - 60);
    ctx.fillStyle = '#64b5f6';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText((stats.totalStars || 0).toLocaleString(), leftX + statSpacing * 2, bottomY - 30);
    
    // Right side - RepoVerse branding
    ctx.fillStyle = 'rgba(176, 190, 197, 0.6)';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('RepoVerse', width - 40, bottomY - 30);
    
    // Decorative accent line at bottom
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, bottomY - 5);
    ctx.lineTo(leftX + statSpacing * 2.5, bottomY - 5);
    ctx.stroke();
  }

  /**
   * Create stats card for hover effect
   */
  createStatsCard(repo, x, y) {
    // Remove existing card
    const existing = document.getElementById('hud-stats-card');
    if (existing) existing.remove();
    
    const card = document.createElement('div');
    card.id = 'hud-stats-card';
    card.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      border-radius: 8px;
      pointer-events: none;
      z-index: 1002;
      max-width: 300px;
    `;
    
    card.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">${repo.name}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        ${repo.description || 'No description'}
      </div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
        ⭐ ${repo.stars} • 🍴 ${repo.forks} • 📝 ${repo.totalCommits} commits
      </div>
    `;
    
    this.container.appendChild(card);
    
    // Highlight in background
    if (this.backgroundManager) {
      this.backgroundManager.highlightAt(x, y);
    }
    
    return card;
  }

  /**
   * Remove stats card
   */
  removeStatsCard() {
    const card = document.getElementById('hud-stats-card');
    if (card) card.remove();
  }

  /**
   * Dispose HUD
   */
  dispose() {
    if (this.elements.hud) {
      this.elements.hud.remove();
    }
  }
}

