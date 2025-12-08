/**
 * Repository Cache - Caching system for GitHub repository data
 * Uses localStorage for persistence
 * Single Responsibility: Cache management
 */

const CACHE_PREFIX = 'repoverse_cache_';
const BASIC_TTL = 3600000; // 1 hour for basic repo list
const DETAILED_TTL = 86400000; // 24 hours for detailed data

export class RepositoryCache {
  /**
   * Get cache key for username
   */
  static getCacheKey(username) {
    return `${CACHE_PREFIX}${username}`;
  }

  /**
   * Check if data is expired
   */
  static isExpired(timestamp, ttl) {
    return Date.now() - timestamp > ttl;
  }

  /**
   * Get cached basic repository list
   * @param {string} username - GitHub username
   * @returns {Object|null} - Cached data or null if expired/missing
   */
  static getBasicRepos(username) {
    try {
      const key = this.getCacheKey(username);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      if (!data.basic || !data.basic.repos) return null;
      
      if (this.isExpired(data.basic.timestamp, BASIC_TTL)) {
        this.clearBasicRepos(username);
        return null;
      }
      
      return data.basic.repos;
    } catch (error) {
      console.warn('[Cache] Error reading basic repos:', error);
      return null;
    }
  }

  /**
   * Cache basic repository list
   * @param {string} username - GitHub username
   * @param {Array} repos - Repository array
   */
  static setBasicRepos(username, repos) {
    try {
      const key = this.getCacheKey(username);
      let data = {};
      
      const existing = localStorage.getItem(key);
      if (existing) {
        data = JSON.parse(existing);
      }
      
      data.basic = {
        repos: repos,
        timestamp: Date.now(),
        ttl: BASIC_TTL
      };
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('[Cache] Error caching basic repos:', error);
      this.clearOldCaches();
    }
  }

  /**
   * Get cached detailed data for a repository
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @returns {Object|null} - Cached detailed data or null
   */
  static getDetailedData(username, repoName) {
    try {
      const key = this.getCacheKey(username);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      if (!data.detailed || !data.detailed[repoName]) return null;
      
      const repoData = data.detailed[repoName];
      
      if (this.isExpired(repoData.timestamp, DETAILED_TTL)) {
        delete data.detailed[repoName];
        localStorage.setItem(key, JSON.stringify(data));
        return null;
      }
      
      return {
        totalCommits: repoData.totalCommits,
        branchesCount: repoData.branchesCount,
        openPRs: repoData.openPRs,
        openIssues: repoData.openIssues
      };
    } catch (error) {
      console.warn(`[Cache] Error reading detailed data for ${repoName}:`, error);
      return null;
    }
  }

  /**
   * Cache detailed data for a repository
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @param {Object} detailedData - Detailed repository data
   */
  static setDetailedData(username, repoName, detailedData) {
    try {
      const key = this.getCacheKey(username);
      let data = {};
      
      const existing = localStorage.getItem(key);
      if (existing) {
        data = JSON.parse(existing);
      }
      
      if (!data.detailed) {
        data.detailed = {};
      }
      
      data.detailed[repoName] = {
        ...detailedData,
        timestamp: Date.now(),
        ttl: DETAILED_TTL
      };
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`[Cache] Error caching detailed data for ${repoName}:`, error);
      this.clearOldCaches();
    }
  }

  /**
   * Get all cached detailed data for a username
   * @param {string} username - GitHub username
   * @returns {Object} - Map of repoName -> detailed data
   */
  static getAllDetailedData(username) {
    try {
      const key = this.getCacheKey(username);
      const cached = localStorage.getItem(key);
      
      if (!cached) return {};
      
      const data = JSON.parse(cached);
      
      if (!data.detailed) return {};
      
      const result = {};
      
      for (const [repoName, repoData] of Object.entries(data.detailed)) {
        if (!this.isExpired(repoData.timestamp, DETAILED_TTL)) {
          result[repoName] = {
            totalCommits: repoData.totalCommits,
            branchesCount: repoData.branchesCount,
            openPRs: repoData.openPRs,
            openIssues: repoData.openIssues
          };
        }
      }
      
      if (Object.keys(result).length !== Object.keys(data.detailed).length) {
        data.detailed = result;
        localStorage.setItem(key, JSON.stringify(data));
      }
      
      return result;
    } catch (error) {
      console.warn('[Cache] Error reading all detailed data:', error);
      return {};
    }
  }

  /**
   * Clear basic repos cache for a username
   * @param {string} username - GitHub username
   */
  static clearBasicRepos(username) {
    try {
      const key = this.getCacheKey(username);
      const cached = localStorage.getItem(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        delete data.basic;
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('[Cache] Error clearing basic repos:', error);
    }
  }

  /**
   * Clear all cache for a username
   * @param {string} username - GitHub username
   */
  static clear(username) {
    try {
      const key = this.getCacheKey(username);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Clear old caches to free up space
   * Removes caches older than 7 days
   */
  static clearOldCaches() {
    try {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const basicExpired = !data.basic || this.isExpired(data.basic.timestamp, BASIC_TTL);
            const detailedExpired = !data.detailed || Object.keys(data.detailed).length === 0 ||
              Object.values(data.detailed).every(d => this.isExpired(d.timestamp, DETAILED_TTL));
            
            if (basicExpired && detailedExpired) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[Cache] Error clearing old caches:', error);
    }
  }

  /**
   * Get cache statistics
   * @param {string} username - GitHub username
   * @returns {Object} - Cache stats
   */
  static getStats(username) {
    try {
      const key = this.getCacheKey(username);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return { hasBasic: false, detailedCount: 0 };
      }
      
      const data = JSON.parse(cached);
      const hasBasic = data.basic && !this.isExpired(data.basic.timestamp, BASIC_TTL);
      const detailedCount = data.detailed ? Object.keys(data.detailed).length : 0;
      
      return {
        hasBasic,
        detailedCount,
        basicAge: data.basic ? Date.now() - data.basic.timestamp : null
      };
    } catch (error) {
      return { hasBasic: false, detailedCount: 0 };
    }
  }
}
