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
    
    // Filter repositories visible at snapshot date
    const visibleRepos = this.app.allRepositories.filter(repo => {
      if (!repo.createdAt) return false;
      const repoDate = new Date(repo.createdAt);
      return repoDate <= this.app.snapshotDate;
    });

    // Calculate statistics for the year
    const stats = this.calculateYearStats(visibleRepos, year);
    
    // Generate card image
    const canvas = this.createYearCardCanvas(stats, year, username);
    
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
   * Create canvas with year statistics card - Modern design
   */
  createYearCardCanvas(stats, year, username) {
    const width = 1400;
    const height = 900;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Modern dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0c29');
    bgGradient.addColorStop(0.5, '#302b63');
    bgGradient.addColorStop(1, '#24243e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(100, 181, 246, 0.03)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Header section with accent line
    ctx.fillStyle = '#64b5f6';
    ctx.fillRect(0, 0, width, 4);
    
    // Username - Large and bold
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`@${username}`, width / 2, 40);
    
    // Year badge
    const yearText = `${year}`;
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64b5f6';
    ctx.fillText(yearText, width / 2, 110);
    
    // Decorative line under year
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, 160);
    ctx.lineTo(width / 2 + 60, 160);
    ctx.stroke();

    // Stats grid with modern cards
    const statsY = 220;
    const cardWidth = 280;
    const cardHeight = 140;
    const cardSpacing = 40;
    const startX = (width - (3 * cardWidth + 2 * cardSpacing)) / 2;
    
    const statsData = [
      { label: 'Repositorios', value: stats.totalRepos, icon: '🪐' },
{ label: 'Commits', value: stats.totalCommits.toLocaleString(), icon: '☄️' },
{ label: 'Stars', value: stats.totalStars.toLocaleString(), icon: '⭐' },
{ label: 'Forks', value: stats.totalForks.toLocaleString(), icon: '🛠️' },
{ label: 'Branches', value: stats.totalBranches, icon: '🌙' },
{ label: 'Nuevos', value: stats.reposCreatedThisYear, icon: '➕'},

    ];

    // Draw stat cards
    statsData.forEach((stat, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * (cardWidth + cardSpacing);
      const y = statsY + row * (cardHeight + cardSpacing);
      
      // Card background with glow
      const cardGradient = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
      cardGradient.addColorStop(0, 'rgba(100, 181, 246, 0.15)');
      cardGradient.addColorStop(1, 'rgba(100, 181, 246, 0.05)');
      ctx.fillStyle = cardGradient;
      ctx.fillRect(x, y, cardWidth, cardHeight);
      
      // Card border
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cardWidth, cardHeight);
      
      // Icon
      ctx.font = '36px Arial';
      ctx.fillStyle = '#64b5f6';
      ctx.textAlign = 'left';
      ctx.fillText(stat.icon, x + 20, y + 20);
      
      // Value - Large and bold
      ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(stat.value.toString(), x + 20, y + 70);
      
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
        const badgeY = langY + 50;
        
        // Badge background
        const badgeGradient = ctx.createLinearGradient(x - 50, badgeY - 20, x + 50, badgeY + 60);
        badgeGradient.addColorStop(0, 'rgba(100, 181, 246, 0.2)');
        badgeGradient.addColorStop(1, 'rgba(100, 181, 246, 0.1)');
        ctx.fillStyle = badgeGradient;
        // Draw rounded rectangle manually
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x - 50 + radius, badgeY - 20);
        ctx.lineTo(x + 50 - radius, badgeY - 20);
        ctx.quadraticCurveTo(x + 50, badgeY - 20, x + 50, badgeY - 20 + radius);
        ctx.lineTo(x + 50, badgeY + 60 - radius);
        ctx.quadraticCurveTo(x + 50, badgeY + 60, x + 50 - radius, badgeY + 60);
        ctx.lineTo(x - 50 + radius, badgeY + 60);
        ctx.quadraticCurveTo(x - 50, badgeY + 60, x - 50, badgeY + 60 - radius);
        ctx.lineTo(x - 50, badgeY - 20 + radius);
        ctx.quadraticCurveTo(x - 50, badgeY - 20, x - 50 + radius, badgeY - 20);
        ctx.closePath();
        ctx.fill();
        
        // Language name
        ctx.fillStyle = '#64b5f6';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lang.language, x, badgeY + 5);
        
        // Count
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.fillText(lang.count.toString(), x, badgeY + 35);
      });
    }

    // Footer with subtle branding
    ctx.fillStyle = 'rgba(176, 190, 197, 0.5)';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RepoVerse', width / 2, height - 25);

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
