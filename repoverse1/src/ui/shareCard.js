/**
 * Share Card - Generate shareable images of the universe and year statistics
 */
export class ShareCard {
  constructor(app) {
    this.app = app; // Reference to App instance for accessing data
  }

  /**
   * Export universe PNG (delegates to HUDManager)
   */
  async exportUniversePNG() {
    if (this.app && this.app.hudManager) {
      this.app.hudManager.exportUniversePNG();
    }
  }

  /**
   * Generate and download year statistics card
   */
  async generateYearCard() {
    if (!this.app || !this.app.allRepositories || !this.app.snapshotDate) {
      console.error('[ShareCard] Missing app data');
      return;
    }

    const year = this.app.snapshotDate.getFullYear();
    const username = this.app.currentUsername || 'user';
    
    // Filter repositories using the same filter as visualization (respects year and checkbox mode)
    const filterMode = this.app.filterMode || 'all';
    const visibleRepos = this.app.repositoryFilterManager.filterRepositories(
      this.app.allRepositories,
      year,
      filterMode
    );

    // Calculate statistics for the year
    const stats = this.calculateYearStats(visibleRepos, year);
    
    // Generate card image
    const canvas = this.createYearCardCanvas(stats, year, username, filterMode);
    
    // Download
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `repoverse-${username}-${year}-stats.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calculate statistics for a specific year
   */
  calculateYearStats(repositories, year) {
    const totalRepos = repositories.length;
    const totalCommits = repositories.reduce((sum, repo) => sum + (repo.totalCommits || 0), 0);
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks || 0), 0);
    const totalBranches = repositories.reduce((sum, repo) => sum + (repo.branchesCount || 0), 0);
    
    // Repos created in this year
    const reposCreatedThisYear = repositories.filter(repo => {
      if (!repo.createdAt) return false;
      return new Date(repo.createdAt).getFullYear() === year;
    }).length;

    // Languages distribution
    const languages = {};
    repositories.forEach(repo => {
      const lang = repo.language || 'Other';
      languages[lang] = (languages[lang] || 0) + 1;
    });
    const topLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count }));

    return {
      year,
      totalRepos,
      totalCommits,
      totalStars,
      totalForks,
      totalBranches,
      reposCreatedThisYear,
      topLanguages
    };
  }

  /**
   * Helper function to draw rounded rectangle
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Create canvas with year statistics card - Modern design
   */
  createYearCardCanvas(stats, year, username, filterMode = 'all') {
    const width = 1400;
    const height = 900;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Galactic radial gradient background with depth
    const centerX = width * 0.3;
    const centerY = height * 0.2;
    const maxRadius = Math.sqrt(width * width + height * height);
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    bgGradient.addColorStop(0, '#2a1b63');
    bgGradient.addColorStop(0.7, '#0d0f24');
    bgGradient.addColorStop(1, '#0a0a15');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Enhanced stardust effect with multiple layers
    // Layer 1: Large particles (3-5px) with higher opacity
    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2 + 3;
      const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      particleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      particleGradient.addColorStop(1, 'rgba(100, 181, 246, 0)');
      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Layer 2: Medium particles (1-3px) with medium opacity
    ctx.fillStyle = 'rgba(100, 181, 246, 0.08)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Layer 3: Small particles (0.5-1px) with low opacity for subtle noise
    ctx.fillStyle = 'rgba(150, 200, 255, 0.04)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Header section with accent line (thicker and with gradient)
    const accentGradient = ctx.createLinearGradient(0, 0, width, 0);
    accentGradient.addColorStop(0, '#64b5f6');
    accentGradient.addColorStop(0.5, '#90caf9');
    accentGradient.addColorStop(1, '#64b5f6');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, width, 5);
    
    // Username - Large and bold with text shadow glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`@${username}`, width / 2, 40);
    
    // Year badge with text shadow glow
    const yearText = `${year}`;
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(yearText, width / 2, 110);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Elegant separator with gradient glow
    const separatorWidth = 80;
    const separatorY = 160;
    const separatorGradient = ctx.createLinearGradient(
      width / 2 - separatorWidth / 2, separatorY,
      width / 2 + separatorWidth / 2, separatorY
    );
    separatorGradient.addColorStop(0, 'transparent');
    separatorGradient.addColorStop(0.5, '#9b6dff');
    separatorGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = separatorGradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(155, 109, 255, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.moveTo(width / 2 - separatorWidth / 2, separatorY);
    ctx.lineTo(width / 2 + separatorWidth / 2, separatorY);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Dynamic text based on filter mode
    const filterText = filterMode === 'active' 
      ? `Active repositories year ${year}`
      : `Total repositories from start GitHub to ${year} year`;
    ctx.fillStyle = 'rgba(176, 190, 197, 0.9)';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(filterText, width / 2, 180);

    // Stats grid with modern cards
    const statsY = 240; // Moved down to accommodate filter text
    const cardWidth = 280;
    const cardHeight = 140;
    const cardSpacing = 40;
    const startX = (width - (3 * cardWidth + 2 * cardSpacing)) / 2;
    
    const statsData = [
      { label: 'Public repositories', value: stats.totalRepos, icon: '🪐' },
{ label: 'Commits', value: stats.totalCommits.toLocaleString(), icon: '☄️' },
{ label: 'Stars', value: stats.totalStars.toLocaleString(), icon: '⭐' },
{ label: 'Forks', value: stats.totalForks.toLocaleString(), icon: '🔱' },
{ label: 'Branches', value: stats.totalBranches, icon: '🌙' },
{ label: 'New repositories', value: stats.reposCreatedThisYear, icon: '➕'},

    ];

    // Draw stat cards
    statsData.forEach((stat, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * (cardWidth + cardSpacing);
      const y = statsY + row * (cardHeight + cardSpacing);
      const cardRadius = 16;
      
      // Card background with glow and rounded corners
      const cardGradient = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
      cardGradient.addColorStop(0, 'rgba(100, 181, 246, 0.2)');
      cardGradient.addColorStop(1, 'rgba(100, 181, 246, 0.08)');
      ctx.fillStyle = cardGradient;
      this.drawRoundedRect(ctx, x, y, cardWidth, cardHeight, cardRadius);
      ctx.fill();
      
      // Card border with glow effect (multiple layers for depth)
      // Outer glow shadow
      ctx.shadowColor = 'rgba(150, 100, 255, 0.15)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(150, 100, 255, 0.35)';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, x, y, cardWidth, cardHeight, cardRadius);
      ctx.stroke();
      
      // Inner border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(150, 100, 255, 0.4)';
      ctx.lineWidth = 1.5;
      this.drawRoundedRect(ctx, x, y, cardWidth, cardHeight, cardRadius);
      ctx.stroke();
      
      // Icon with subtle shadow
      ctx.shadowColor = 'rgba(100, 181, 246, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.font = '36px Arial';
      ctx.fillStyle = '#64b5f6';
      ctx.textAlign = 'left';
      ctx.fillText(stat.icon, x + 20, y + 20);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Value - Large and bold with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(stat.value.toString(), x + 20, y + 70);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Label
      ctx.font = '18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#b0bec5';
      ctx.fillText(stat.label, x + 20, y + 110);
    });

    // Top languages section
    if (stats.topLanguages.length > 0) {
      const langY = statsY + 2 * (cardHeight + cardSpacing) + 40;
      
      // Section title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Principal languages', width / 2, langY);
      
      // Language badges
      const langSpacing = 120;
      const langStartX = width / 2 - ((stats.topLanguages.length - 1) * langSpacing) / 2;
      
      stats.topLanguages.forEach((lang, index) => {
        const x = langStartX + index * langSpacing;
        const badgeY = langY + 80;
        const badgeWidth = 100;
        const badgeHeight = 90;
        const badgeRadius = 10;
        const badgeX = x - badgeWidth / 2;
        const badgeTop = badgeY - 20;
        
        // Badge background with more padding
        const badgeGradient = ctx.createLinearGradient(badgeX, badgeTop, badgeX + badgeWidth, badgeTop + badgeHeight);
        badgeGradient.addColorStop(0, 'rgba(100, 181, 246, 0.25)');
        badgeGradient.addColorStop(1, 'rgba(100, 181, 246, 0.12)');
        ctx.fillStyle = badgeGradient;
        this.drawRoundedRect(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, badgeRadius);
        ctx.fill();
        
        // Badge border with glow effect (consistent with main cards)
        // Outer glow shadow
        ctx.shadowColor = 'rgba(150, 100, 255, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.35)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, badgeRadius);
        ctx.stroke();
        
        // Inner border
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.4)';
        ctx.lineWidth = 1.5;
        this.drawRoundedRect(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, badgeRadius);
        ctx.stroke();
        
        // Language name - with more top padding
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#64b5f6';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lang.language, x, badgeTop + 12);
        
        // Count - with more bottom padding (moved up slightly to leave more space at bottom)
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.fillText(lang.count.toString(), x, badgeTop + 45);
      });
    }

    // Footer with subtle branding
    ctx.fillStyle = 'rgba(176, 190, 197, 0.7)';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RepoVerse by stayandcode', width / 2, height - 25);

    return canvas;
  }

  /**
   * Export both: universe PNG and year card
   */
  async exportAll() {
    await this.exportUniversePNG();
    // Wait a bit before generating card
    setTimeout(() => {
      this.generateYearCard();
    }, 1000);
  }
}
