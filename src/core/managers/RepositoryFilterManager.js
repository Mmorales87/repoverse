/**
 * Repository Filter Manager - Filters repositories by year and activity mode
 * 
 * Follows Single Responsibility Principle: Only handles repository filtering logic
 * Separated from rendering and UI concerns
 */
export class RepositoryFilterManager {
  constructor() {
    // Cache for lastCommitYear to avoid recalculating
    this.lastCommitYearCache = new Map();
  }

  /**
   * Calculate last commit year from pushedAt date
   * @param {Object} repo - Repository object
   * @returns {number|null} - Year of last commit, or null if no pushedAt
   */
  _calculateLastCommitYear(repo) {
    if (!repo.pushedAt) {
      return null;
    }
    
    try {
      const pushedAtDate = new Date(repo.pushedAt);
      if (isNaN(pushedAtDate.getTime())) {
        return null;
      }
      return pushedAtDate.getFullYear();
    } catch (error) {
      console.warn('[RepositoryFilterManager] Error calculating lastCommitYear:', error);
      return null;
    }
  }

  /**
   * Enrich repositories with lastCommitYear (cached)
   * This should be called once when repositories are loaded
   * @param {Array} repos - Array of repository objects
   * @returns {Array} - Repositories with lastCommitYear property added
   */
  enrichReposWithLastCommitYear(repos) {
    if (!Array.isArray(repos)) {
      return [];
    }

    return repos.map(repo => {
      // Use cache if available
      const cacheKey = repo.name || repo.id || JSON.stringify(repo);
      
      if (this.lastCommitYearCache.has(cacheKey)) {
        return {
          ...repo,
          lastCommitYear: this.lastCommitYearCache.get(cacheKey)
        };
      }

      // Calculate and cache
      const lastCommitYear = this._calculateLastCommitYear(repo);
      this.lastCommitYearCache.set(cacheKey, lastCommitYear);
      
      return {
        ...repo,
        lastCommitYear: lastCommitYear
      };
    });
  }

  /**
   * Filter repositories based on year and mode
   * @param {Array} repos - Array of repository objects (should have lastCommitYear)
   * @param {number} year - Selected year
   * @param {string} mode - Filter mode: "active" | "all"
   * @returns {Array} - Filtered repositories
   */
  filterRepositories(repos, year, mode) {
    if (!Array.isArray(repos)) {
      return [];
    }

    if (mode === 'active') {
      // MODE "active": Only repos with commits in the selected year
      return repos.filter(repo => {
        if (!repo.lastCommitYear) {
          return false; // No commit data, exclude
        }
        return repo.lastCommitYear === year;
      });
    } else if (mode === 'all') {
      // MODE "all": All repos created up to the selected year
      return repos.filter(repo => {
        if (!repo.createdAt) {
          return false; // No creation date, exclude
        }
        try {
          const createdYear = new Date(repo.createdAt).getFullYear();
          return createdYear <= year;
        } catch (error) {
          console.warn('[RepositoryFilterManager] Error parsing createdAt:', error);
          return false;
        }
      });
    } else {
      console.warn('[RepositoryFilterManager] Unknown filter mode:', mode);
      return repos; // Fallback: return all repos
    }
  }

  /**
   * Clear cache (useful for testing or when reloading data)
   */
  clearCache() {
    this.lastCommitYearCache.clear();
  }
}
