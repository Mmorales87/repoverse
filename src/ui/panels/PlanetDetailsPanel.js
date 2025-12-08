/**
 * Planet Details Panel - Shows repository details when clicking a planet
 */
export class PlanetDetailsPanel {
  constructor(container) {
    this.container = container;
    this.panel = null;
    this.isVisible = false;
  }

  /**
   * Initialize panel
   */
  initialize() {
    this.createPanel();
  }

  /**
   * Create panel UI
   */
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'planet-details-panel';
    panel.style.cssText = `
      position: fixed;
      right: -400px;
      top: 50%;
      transform: translateY(-50%);
      width: 380px;
      max-height: 80vh;
      background: rgba(20, 20, 30, 0.95);
      border: 2px solid rgba(100, 181, 246, 0.5);
      border-radius: 10px;
      padding: 20px;
      z-index: 2000;
      pointer-events: auto;
      overflow-y: auto;
      transition: right 0.3s ease;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
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
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
    closeBtn.onclick = () => this.hide();
    
    // Content container
    const content = document.createElement('div');
    content.id = 'planet-details-content';
    
    panel.appendChild(closeBtn);
    panel.appendChild(content);
    
    this.container.appendChild(panel);
    this.panel = panel;
    this.content = content;
  }

  /**
   * Show panel with repository data
   */
  show(repo, username) {
    if (!this.panel || !this.content) return;
    
    const createdAt = new Date(repo.createdAt);
    const updatedAt = new Date(repo.updatedAt);
    const pushedAt = repo.pushedAt ? new Date(repo.pushedAt) : null;
    
    this.content.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #64B5F6;">
        ${repo.name}
      </h2>
      
      ${repo.description ? `
        <p style="margin: 0 0 20px 0; opacity: 0.8; font-size: 14px; line-height: 1.5;">
          ${repo.description}
        </p>
      ` : ''}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="background: rgba(100, 181, 246, 0.1); padding: 10px; border-radius: 5px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Stars</div>
          <div style="font-size: 20px; font-weight: bold; color: #64B5F6;">${repo.stars || 0}</div>
        </div>
        
        <div style="background: rgba(100, 181, 246, 0.1); padding: 10px; border-radius: 5px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Forks</div>
          <div style="font-size: 20px; font-weight: bold; color: #64B5F6;">${repo.forks || 0}</div>
        </div>
        
        <div style="background: rgba(100, 181, 246, 0.1); padding: 10px; border-radius: 5px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Branches</div>
          <div style="font-size: 20px; font-weight: bold; color: #64B5F6;">${repo.branchesCount || 0}</div>
        </div>
        
        <div style="background: rgba(100, 181, 246, 0.1); padding: 10px; border-radius: 5px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Commits</div>
          <div style="font-size: 20px; font-weight: bold; color: #64B5F6;">${repo.totalCommits || 0}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Principal language</div>
        <div style="font-size: 16px; font-weight: bold;">
          ${repo.language || 'Other'}
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Creation date</div>
        <div style="font-size: 14px;">${createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      ${pushedAt ? `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Last activity</div>
          <div style="font-size: 14px;">${pushedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      ` : ''}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div style="background: rgba(255, 165, 0, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
          <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px;">PRs</div>
          <div style="font-size: 16px; font-weight: bold; color: #FFA500;">${repo.openPRs || 0}</div>
        </div>
        
        <div style="background: rgba(255, 215, 0, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
          <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px;">Releases</div>
          <div style="font-size: 16px; font-weight: bold; color: #FFD700;">${repo.releasesCount || 0}</div>
        </div>
        
        <div style="background: rgba(255, 68, 68, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
          <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px;">Issues</div>
          <div style="font-size: 16px; font-weight: bold; color: #FF4444;">${repo.openIssues || 0}</div>
        </div>
      </div>
      
      <a 
        href="https://github.com/${username}/${repo.name}" 
        target="_blank" 
        rel="noopener noreferrer"
        style="
          display: block;
          text-align: center;
          padding: 12px;
          background: rgba(100, 181, 246, 0.8);
          border-radius: 5px;
          color: white;
          text-decoration: none;
          font-weight: bold;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='rgba(100, 181, 246, 1)'"
        onmouseout="this.style.background='rgba(100, 181, 246, 0.8)'"
      >
        Open in GitHub
      </a>
    `;
    
    this.panel.style.right = '20px';
    this.isVisible = true;
  }

  /**
   * Hide panel
   */
  hide() {
    if (!this.panel) return;
    this.panel.style.right = '-400px';
    this.isVisible = false;
  }

  /**
   * Toggle panel
   */
  toggle(repo, username) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(repo, username);
    }
  }
}

