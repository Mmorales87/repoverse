/**
 * GitHub Service - Fetch public repositories using GitHub Public API
 * No authentication required - uses 60 requests/hour per IP (same as GithubCity)
 * Falls back to mock data on rate-limit
 */

import { RepositoryCache } from '../cache/RepositoryCache.js';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Estimate commits based on repository activity
 * 
 * NOTE: GitHub API doesn't provide total commits directly in /users/{username}/repos endpoint.
 * To get real commit counts, we would need to make additional API calls per repo
 * (e.g., /repos/{owner}/{repo}/stats/contributors), which would quickly exhaust rate limits.
 * 
 * This function provides an ESTIMATION based on:
 * - Base commits: days since creation * 0.5
 * - Activity commits: stars * 5 + forks * 10
 * 
 * The displayed commit count is an ESTIMATE, not the actual number.
 */
function estimateCommits(githubRepo) {
  const stars = githubRepo.stargazers_count || 0;
  const forks = githubRepo.forks_count || 0;
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(githubRepo.created_at)) / (1000 * 60 * 60 * 24)
  );
  
  const baseCommits = Math.max(10, daysSinceCreation * 0.5);
  const activityCommits = (stars * 5) + (forks * 10);
  
  return Math.floor(baseCommits + activityCommits);
}

/**
 * Fetch real commit count for a repository
 * Uses /repos/{owner}/{repo}/commits with pagination to count total
 */
async function fetchRealCommitCount(owner, repo) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 409 || response.status === 404) {
        return 0;
      }
      throw new Error(`Failed to fetch commits: ${response.status}`);
    }
    
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) {
      const data = await response.json();
      return data.length;
    }
    
    const links = linkHeader.split(',');
    const lastLink = links.find(link => link.includes('rel="last"'));
    
    if (lastLink) {
      const match = lastLink.match(/[?&]page=(\d+)/);
      if (match) {
        const lastPage = parseInt(match[1], 10);
        return lastPage;
      }
    }
    
    const data = await response.json();
    return data.length;
  } catch (error) {
    console.warn(`[GITHUB] Could not fetch commit count for ${owner}/${repo}:`, error);
    return 0;
  }
}

/**
 * Fetch real branch count for a repository
 */
async function fetchRealBranchCount(owner, repo) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=1`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return 1;
      }
      throw new Error(`Failed to fetch branches: ${response.status}`);
    }
    
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) {
      const data = await response.json();
      return Math.max(1, data.length);
    }
    
    const links = linkHeader.split(',');
    const lastLink = links.find(link => link.includes('rel="last"'));
    
    if (lastLink) {
      const match = lastLink.match(/[?&]page=(\d+)/);
      if (match) {
        const lastPage = parseInt(match[1], 10);
        return Math.max(1, lastPage);
      }
    }
    
    const data = await response.json();
    return Math.max(1, data.length);
  } catch (error) {
    console.warn(`[GITHUB] Could not fetch branch count for ${owner}/${repo}:`, error);
    return 1;
  }
}

/**
 * Transform GitHub API response to internal repository format
 */
function transformRepository(githubRepo, owner = null) {
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(githubRepo.created_at)) / (1000 * 60 * 60 * 24)
  );
  
  // Check if repo has recent commits (24-48h)
  let hasRecentCommits = false;
  if (githubRepo.pushed_at) {
    const pushedAt = new Date(githubRepo.pushed_at);
    const now = new Date();
    const hoursSincePush = (now - pushedAt) / (1000 * 60 * 60);
    // Consider commits recent if pushed within last 48 hours
    hasRecentCommits = hoursSincePush <= 48;
  } else if (githubRepo.commitsLast30) {
    // Fallback: if commitsLast30 > 0, consider it recent activity
    hasRecentCommits = githubRepo.commitsLast30 > 0;
  }
  
  return {
    name: githubRepo.name,
    totalCommits: estimateCommits(githubRepo),
    size: githubRepo.size || 0,
    stars: githubRepo.stargazers_count || 0,
    forks: githubRepo.forks_count || 0,
    languages: {},
    description: githubRepo.description || '',
    source: 'github',
    isFork: githubRepo.fork || false,
    parent: githubRepo.parent ? {
      full_name: githubRepo.parent.full_name,
      owner: githubRepo.parent.owner?.login,
      name: githubRepo.parent.name
    } : null,
    createdAt: githubRepo.created_at,
    updatedAt: githubRepo.updated_at,
    pushedAt: githubRepo.pushed_at,
    language: githubRepo.language || null,
    defaultBranch: githubRepo.default_branch || 'main',
    branchesCount: 1,
    commitsLast30: Math.floor(estimateCommits(githubRepo) * 0.1),
    watchers: githubRepo.watchers_count || 0,
    openPRs: 0,
    openIssues: githubRepo.open_issues_count || 0,
    daysSinceCreation: daysSinceCreation,
    hasRecentCommits: hasRecentCommits,
    owner: owner || githubRepo.owner?.login || null,
    prsToOriginal: 0
  };
}

/**
 * Filter repositories based on filter mode and year
 * @param {Array} repos - Repository array
 * @param {string} filterMode - 'active' or 'all'
 * @param {number} year - Selected year
 * @returns {Array} - Filtered repositories
 */
function filterRepositories(repos, filterMode, year) {
  if (!filterMode || filterMode === 'all') {
    return repos.filter(repo => {
      if (!repo.createdAt) return false;
      try {
        const createdYear = new Date(repo.createdAt).getFullYear();
        return createdYear <= year;
      } catch (error) {
        return false;
      }
    });
  } else if (filterMode === 'active') {
    return repos.filter(repo => {
      if (!repo.pushedAt) return false;
      try {
        const pushedYear = new Date(repo.pushedAt).getFullYear();
        return pushedYear === year;
      } catch (error) {
        return false;
      }
    });
  }
  return repos;
}

/**
 * Fetch user repositories from GitHub API
 * Uses public API without authentication (60 requests/hour per IP)
 * @param {string} username - GitHub username
 * @param {Object} options - Optional filter options
 * @param {string} options.filterMode - 'active' or 'all'
 * @param {number} options.year - Selected year for filtering
 * @returns {Promise<{repositories: Array, allRepositories: Array, rateLimit: {remaining: number, reset: number}}>}
 */
export async function fetchUserRepositories(username, options = {}) {
  const { filterMode = 'all', year = new Date().getFullYear() } = options;
  const url = `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated&type=public`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    // Check cache for basic repo list first
    let cachedBasicRepos = RepositoryCache.getBasicRepos(username);
    let data;
    let response;
    
    if (cachedBasicRepos) {
      data = cachedBasicRepos;
      const remaining = 60;
      const reset = Date.now() + 3600000;
      
      // Include all repos (both own and forks)
      let repositories = data.map(repo => {
        if (repo.name && repo.stars !== undefined) {
          return repo;
        }
        return transformRepository(repo, username);
      });
      
      repositories = filterRepositories(repositories, filterMode, year);
      
      const cachedDetailed = RepositoryCache.getAllDetailedData(username);
      
      repositories = repositories.map(repo => {
        const cached = cachedDetailed[repo.name];
        if (cached) {
          return {
            ...repo,
            totalCommits: cached.totalCommits,
            branchesCount: cached.branchesCount,
            openPRs: cached.openPRs,
            openIssues: cached.openIssues
          };
        }
        return repo;
      });
      
      // Force refresh PRs data even if cached (to fix incorrect PR counts from old cache)
      // Filter repos that need PR data refresh (either no cache or need PR update)
      const reposNeedingDetails = repositories.filter(repo => {
        const cached = cachedDetailed[repo.name];
        // If no cache, needs details. If cached but has openPRs > 0, refresh to verify
        return !cached || (cached.openPRs > 0);
      });
      
      if (reposNeedingDetails.length > 0 && remaining > 20) {
        await fetchDetailedDataForRepos(reposNeedingDetails, username, remaining);
        
        reposNeedingDetails.forEach(repo => {
          RepositoryCache.setDetailedData(username, repo.name, {
            totalCommits: repo.totalCommits,
            branchesCount: repo.branchesCount,
            openPRs: repo.openPRs,
            openIssues: repo.openIssues
          });
        });
      }
      
      repositories = repositories.map(repo => {
        const updated = reposNeedingDetails.find(r => r.name === repo.name);
        return updated || repo;
      });
      
      const allRepos = data.map(repo => {
        if (repo.name && repo.stars !== undefined) {
          return repo;
        }
        return transformRepository(repo, username);
      });
      
      const allReposWithCache = allRepos.map(repo => {
        const cached = cachedDetailed[repo.name];
        if (cached) {
          return {
            ...repo,
            totalCommits: cached.totalCommits,
            branchesCount: cached.branchesCount,
            openPRs: cached.openPRs,
            openIssues: cached.openIssues
          };
        }
        return repo;
      });
      
      return {
        repositories: repositories,
        allRepositories: allReposWithCache,
        rateLimit: {
          remaining,
          reset,
          limit: 60
        }
      };
    }
    
    response = await fetch(url, { headers });
    
    const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0', 10);
    const reset = parseInt(response.headers.get('x-ratelimit-reset') || '0', 10);
    
    if (!response.ok) {
      if (response.status === 403 && remaining === 0) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    data = await response.json();
    
    RepositoryCache.setBasicRepos(username, data);
    
    // Include all repos (both own and forks)
    let repositories = data.map(repo => transformRepository(repo, username));
    
    repositories = filterRepositories(repositories, filterMode, year);
    
    const cachedDetailed = RepositoryCache.getAllDetailedData(username);
    
    repositories = repositories.map(repo => {
      const cached = cachedDetailed[repo.name];
      if (cached) {
        return {
          ...repo,
          totalCommits: cached.totalCommits,
          branchesCount: cached.branchesCount,
          openPRs: cached.openPRs,
          openIssues: cached.openIssues
        };
      }
      return repo;
    });
    
    // Force refresh PRs data even if cached (to fix incorrect PR counts from old cache)
    // Filter repos that need PR data refresh (either no cache or need PR update)
    const reposNeedingDetails = repositories.filter(repo => {
      const cached = cachedDetailed[repo.name];
      // If no cache, needs details. If cached but has openPRs > 0, refresh to verify
      return !cached || (cached.openPRs > 0);
    });
    
    if (reposNeedingDetails.length > 0 && remaining > 20) {
      await fetchDetailedDataForRepos(reposNeedingDetails, username, remaining);
      
      reposNeedingDetails.forEach(repo => {
        RepositoryCache.setDetailedData(username, repo.name, {
          totalCommits: repo.totalCommits,
          branchesCount: repo.branchesCount,
          openPRs: repo.openPRs,
          openIssues: repo.openIssues
        });
      });
    }
    
    repositories = repositories.map(repo => {
      const updated = reposNeedingDetails.find(r => r.name === repo.name);
      return updated || repo;
    });
    
    let allRepositories = data.map(repo => transformRepository(repo, username));
    
    allRepositories = allRepositories.map(repo => {
      const cached = cachedDetailed[repo.name];
      if (cached) {
        return {
          ...repo,
          totalCommits: cached.totalCommits,
          branchesCount: cached.branchesCount,
          openPRs: cached.openPRs,
          openIssues: cached.openIssues
        };
      }
      const updated = repositories.find(r => r.name === repo.name);
      return updated || repo;
    });
    
    return {
      repositories: repositories,
      allRepositories: allRepositories,
      rateLimit: {
        remaining,
        reset,
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '60', 10)
      }
    };
  } catch (error) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error;
    }
    throw error;
  }
}

/**
 * Fetch PRs from fork to original repository
 * @param {string} forkOwner - Owner of the fork
 * @param {string} forkName - Name of the fork
 * @param {string} originalOwner - Owner of the original repository
 * @param {string} originalName - Name of the original repository
 * @param {string} defaultBranch - Default branch of the fork
 * @returns {Promise<number>} - Count of open PRs from fork to original
 */
async function fetchPRsFromForkToOriginal(forkOwner, forkName, originalOwner, originalName, defaultBranch = 'main') {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  try {
    // Search for PRs from fork to original
    // Format: head={forkOwner}:{branch} base={defaultBranch}
    const url = `${GITHUB_API_BASE}/repos/${originalOwner}/${originalName}/pulls?head=${forkOwner}:${defaultBranch}&state=open&per_page=100`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return 0;
      }
      console.warn(`[GITHUB] Could not fetch PRs from fork ${forkOwner}/${forkName} to ${originalOwner}/${originalName}: ${response.status}`);
      return 0;
    }
    
    const prs = await response.json();
    return Array.isArray(prs) ? prs.length : 0;
  } catch (error) {
    console.warn(`[GITHUB] Error fetching PRs from fork ${forkOwner}/${forkName} to ${originalOwner}/${originalName}:`, error);
    return 0;
  }
}

/**
 * Fetch detailed data for a list of repositories
 * Optimized batching with Promise.allSettled
 */
async function fetchDetailedDataForRepos(repos, username, initialRemaining) {
  if (repos.length === 0) return;
  
  const BATCH_SIZE = 6;
  const batches = [];
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    batches.push(repos.slice(i, i + BATCH_SIZE));
  }
  
  let currentRemaining = initialRemaining;
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    if (currentRemaining <= 5) {
      console.warn('[GITHUB] Rate limit getting low, skipping remaining batches');
      break;
    }
    
    const apiHeaders = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    const promises = batch.map(async (repo) => {
      try {
        const fetchPromises = [
          fetchRealCommitCount(repo.owner || username, repo.name),
          fetchRealBranchCount(repo.owner || username, repo.name),
          fetch(`${GITHUB_API_BASE}/repos/${repo.owner || username}/${repo.name}/issues?state=open&per_page=100`, { headers: apiHeaders })
        ];
        
        // If repo is a fork with parent, also fetch PRs to original
        if (repo.isFork && repo.parent) {
          fetchPromises.push(
            fetchPRsFromForkToOriginal(
              repo.owner || username,
              repo.name,
              repo.parent.owner,
              repo.parent.name,
              repo.defaultBranch || 'main'
            )
          );
        }
        
        const results = await Promise.all(fetchPromises);
        
        repo.totalCommits = results[0];
        repo.branchesCount = results[1];
        
        if (results[2].ok) {
          const issuesData = await results[2].json();
          // Only count PRs that are actually open (exclude closed/merged)
          const prs = issuesData.filter(item => item.pull_request && item.state === 'open');
          const realIssues = issuesData.filter(item => !item.pull_request);
          repo.openPRs = prs.length;
          repo.openIssues = realIssues.length;
        }
        
        // Set PRs to original if fork
        if (repo.isFork && repo.parent && results.length > 3) {
          repo.prsToOriginal = results[3] || 0;
        }
        
        return { status: 'fulfilled', repo };
      } catch (error) {
        console.warn(`[GITHUB] Error fetching details for ${repo.name}:`, error);
        return { status: 'rejected', repo, error };
      }
    });
    
    await Promise.allSettled(promises);
    
    // Calculate rate limit usage: 3 requests per repo (commits, branches, issues)
    // + 1 additional request per fork (PRs to original)
    const forkCount = batch.filter(r => r.isFork && r.parent).length;
    currentRemaining -= (batch.length * 3) + forkCount;
    
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

/**
 * Check if rate-limit is exceeded
 */
export function isRateLimitExceeded(rateLimit) {
  return rateLimit.remaining === 0;
}
