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
      padding: 8px 16px;
      background: rgba(100, 100, 255, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    exportBtn.onmouseover = () => exportBtn.style.background = 'rgba(100, 100, 255, 1)';
    exportBtn.onmouseout = () => exportBtn.style.background = 'rgba(100, 100, 255, 0.8)';
    exportBtn.onclick = () => this.exportUniversePNG();
    
    const demoBtn = document.createElement('button');
    demoBtn.id = 'hud-demo-btn';
    demoBtn.textContent = 'Toggle Demo';
    demoBtn.style.cssText = `
      padding: 8px 16px;
      background: rgba(255, 150, 0, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    demoBtn.onmouseover = () => demoBtn.style.background = 'rgba(255, 150, 0, 1)';
    demoBtn.onmouseout = () => demoBtn.style.background = 'rgba(255, 150, 0, 0.8)';
    
    // Legend button
    const legendBtn = document.createElement('button');
    legendBtn.id = 'hud-legend-btn';
    legendBtn.textContent = 'Legend';
    legendBtn.style.cssText = `
      padding: 8px 16px;
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
    
    // Share Card button
    const shareCardBtn = document.createElement('button');
    shareCardBtn.id = 'hud-share-card-btn';
    shareCardBtn.textContent = 'Export Year Card';
    shareCardBtn.style.cssText = `
      padding: 8px 16px;
      background: rgba(100, 181, 246, 0.8);
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    shareCardBtn.onmouseover = () => shareCardBtn.style.background = 'rgba(100, 181, 246, 1)';
    shareCardBtn.onmouseout = () => shareCardBtn.style.background = 'rgba(100, 181, 246, 0.8)';
    shareCardBtn.onclick = () => {
      if (this.app && this.app.shareCard) {
        this.app.shareCard.generateYearCard();
      }
    };
    topRight.appendChild(exportBtn);
    topRight.appendChild(shareCardBtn);
    topRight.appendChild(legendBtn);
    /* topRight.appendChild(demoBtn); */
    
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
        Rate Limit Reached
      </div>
      <div style="font-size: 14px;">
        Using demo mode with mock data
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
      /* demoBtn: demoBtn, */
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
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid rgba(150, 100, 255, 0.5);
      border-radius: 10px;
      padding: 20px;
      padding-bottom: 40px;
      z-index: 2001;
      pointer-events: auto;
      overflow-y: auto;
      display: none;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; color: #9664FF;">Legend</h2>
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
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Element</th>
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Representation</th>
            <th style="text-align: left; padding: 10px; font-size: 14px; color: #9664FF;">Visual function</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">User / organization</td>
            <td style="padding: 10px;">Sun ☀️</td>
            <td style="padding: 10px;">Central point of the system, global influence, brightness/halo; can emit particles or energy pulse</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Repository</td>
            <td style="padding: 10px;">Planet 🌍</td>
            <td style="padding: 10px;">Central unit, interaction point</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Repository weight</td>
            <td style="padding: 10px;">Planet size 📏</td>
            <td style="padding: 10px;">Code size (KB)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Branches</td>
            <td style="padding: 10px;">Moons 🌑</td>
            <td style="padding: 10px;">Branches of the repository (main/master largest and brightest)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">PRs</td>
            <td style="padding: 10px;">Rockets 🚀</td>
            <td style="padding: 10px;">Pull Requests in review</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Commits recientes</td>
            <td style="padding: 10px;">Comets ☄️</td>
            <td style="padding: 10px;">Activity in last 24-48h (appear temporarily)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Main language</td>
            <td style="padding: 10px;">Planet 🌍 with language color 🎨</td>
            <td style="padding: 10px;">Color tint over planet texture</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Recent activity</td>
            <td style="padding: 10px;">Orbital speed ➰</td>
            <td style="padding: 10px;">Repositories with most commits in last 30 days orbit faster around the sun</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px; font-weight: bold;">Forks</td>
            <td style="padding: 10px;">Planets 🌍 with ISS 🛰️</td>
            <td style="padding: 10px;">Forks appear as planets in shared orbit, each with an ISS orbiting around it</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Age</td>
            <td style="padding: 10px;">Orbital radius</td>
            <td style="padding: 10px;">Relative age of the repo</td>
          </tr>
          </tbody>
          </table>
          <p style="font-size: 12px; color:rgb(255, 115, 100); padding-top: 10px;">* If you continue seeing active PRs, rockets etc, do a hard refresh to clear the cache</p>
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
        
        // Draw user information overlay on canvas
        if (this.app) {
          try {
            // Get user data
            const username = this.app.currentUsername || 'user';
            const selectedYear = this.app.snapshotDate 
              ? this.app.snapshotDate.getFullYear() 
              : (this.yearSelector ? this.yearSelector.currentYear : new Date().getFullYear());
            
            // Get filtered repositories for the current year (same filter as visualization)
            let filteredRepos = [];
            if (this.app.allRepositories && this.app.repositoryFilterManager) {
              const filterMode = this.app.filterMode || 'all';
              filteredRepos = this.app.repositoryFilterManager.filterRepositories(
                this.app.allRepositories,
                selectedYear,
                filterMode
              );
            }
            
            // Calculate statistics
            const totalRepos = filteredRepos.length;
            const totalCommits = filteredRepos.reduce((sum, repo) => sum + (repo.totalCommits || 0), 0);
            
            // Draw text overlay at the bottom center
            const padding = 30;
            const textY = height - padding;
            const fontSize = 24;
            const lineHeight = 32;
            
            // Set text style
            ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            // Draw semi-transparent background for better readability
            const textLines = [
              `@${username}`,
              `${totalRepos} repos • ${totalCommits.toLocaleString()} commits • ${selectedYear}`
            ];
            const textWidth = Math.max(
              ...textLines.map(line => ctx.measureText(line).width)
            );
            const bgPadding = 20;
            const bgX = (width - textWidth) / 2 - bgPadding;
            const bgY = textY - (textLines.length * lineHeight) - bgPadding;
            const bgWidth = textWidth + (bgPadding * 2);
            const bgHeight = (textLines.length * lineHeight) + (bgPadding * 2);
            
            // Draw background with rounded corners effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            
            // Draw text with shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            // Draw username (larger, more prominent)
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${fontSize + 4}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.fillText(textLines[0], width / 2, textY - lineHeight);
            
            // Draw stats (slightly smaller)
            ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(textLines[1], width / 2, textY);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          } catch (error) {
            console.warn('[HUD] Error drawing user info overlay:', error);
            // Continue with export even if overlay fails
          }
        }
        
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

