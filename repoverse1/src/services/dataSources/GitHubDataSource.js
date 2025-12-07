/**
 * GitHub Service - Fetch public repositories without tokens by default
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
  
  // Estimate: base commits + activity factor
  // More stars/forks = more activity = more commits
  const baseCommits = Math.max(10, daysSinceCreation * 0.5); // At least some commits per day
  const activityCommits = (stars * 5) + (forks * 10);
  
  return Math.floor(baseCommits + activityCommits);
}

/**
 * Fetch real commit count for a repository
 * Uses /repos/{owner}/{repo}/commits with pagination to count total
 */
async function fetchRealCommitCount(owner, repo, useToken = false) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (useToken) {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (token && token.trim()) {
      headers['Authorization'] = `token ${token}`;
    }
  }
  
  try {
    // Use commits API with per_page=1 to get total count from Link header
    // GitHub doesn't provide total in response, so we'll use a different approach
    // Fetch first page to check if repo has commits
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // If 409 (empty repo) or other error, return 0
      if (response.status === 409 || response.status === 404) {
        return 0;
      }
      throw new Error(`Failed to fetch commits: ${response.status}`);
    }
    
    // Get Link header to find last page
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) {
      // No pagination, count commits from this page
      const data = await response.json();
      return data.length;
    }
    
    // Parse Link header to find last page
    const links = linkHeader.split(',');
    const lastLink = links.find(link => link.includes('rel="last"'));
    
    if (lastLink) {
      const match = lastLink.match(/[?&]page=(\d+)/);
      if (match) {
        const lastPage = parseInt(match[1], 10);
        // With per_page=1, the last page number IS the total commit count
        return lastPage;
      }
    }
    
    // Fallback: if we can't parse Link header, count from first page
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
async function fetchRealBranchCount(owner, repo, useToken = false) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (useToken) {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (token && token.trim()) {
      headers['Authorization'] = `token ${token}`;
    }
  }
  
  try {
    // Use per_page=1 to get total from Link header (same approach as commits)
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=1`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return 1; // Default to 1 branch if repo not found
      }
      throw new Error(`Failed to fetch branches: ${response.status}`);
    }
    
    // Get Link header to find last page
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) {
      // No pagination means only 1 page, count branches from response
      const data = await response.json();
      return Math.max(1, data.length);
    }
    
    // Parse Link header to find last page
    // Format: <url>; rel="last"
    const links = linkHeader.split(',');
    const lastLink = links.find(link => link.includes('rel="last"'));
    
    if (lastLink) {
      // Extract page number from URL: ?page=2 or &page=2
      const match = lastLink.match(/[?&]page=(\d+)/);
      if (match) {
        const lastPage = parseInt(match[1], 10);
        // With per_page=1, lastPage number IS the total branch count
        return Math.max(1, lastPage);
      }
    }
    
    // Fallback: count from first page
    const data = await response.json();
    return Math.max(1, data.length);
  } catch (error) {
    console.warn(`[GITHUB] Could not fetch branch count for ${owner}/${repo}:`, error);
    return 1; // Default to 1 branch on error
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
    totalCommits: estimateCommits(githubRepo), // Will be updated with real count
    size: githubRepo.size || 0, // Size in KB from GitHub API
    stars: githubRepo.stargazers_count || 0,
    forks: githubRepo.forks_count || 0,
    languages: {}, // Will be fetched separately if needed
    description: githubRepo.description || '',
    source: 'github',
    isFork: githubRepo.fork || false,
    createdAt: githubRepo.created_at,
    updatedAt: githubRepo.updated_at,
    pushedAt: githubRepo.pushed_at,
    language: githubRepo.language || null,
    defaultBranch: githubRepo.default_branch || 'main',
    branchesCount: 1, // Will be updated with real count
    commitsLast30: Math.floor(estimateCommits(githubRepo) * 0.1), // Estimate recent commits
    watchers: githubRepo.watchers_count || 0,
    openPRs: 0, // Will be updated with real count
    openIssues: githubRepo.open_issues_count || 0,
    daysSinceCreation: daysSinceCreation,
    hasRecentCommits: hasRecentCommits,
    owner: owner || githubRepo.owner?.login || null // Store owner for API calls
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
    // All mode: show all repos created up to the selected year
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
    // Active mode: only repos with commits in the selected year
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
 * @param {string} username - GitHub username
 * @param {boolean} useToken - Whether to use token if available
 * @param {Object} options - Optional filter options
 * @param {string} options.filterMode - 'active' or 'all'
 * @param {number} options.year - Selected year for filtering
 * @returns {Promise<{repositories: Array, allRepositories: Array, rateLimit: {remaining: number, reset: number}}>}
 */
export async function fetchUserRepositories(username, useToken = false, options = {}) {
  const { filterMode = 'all', year = new Date().getFullYear() } = options;
  const url = `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated&type=public`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };

  // Only add token if explicitly enabled and available
  if (useToken) {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (token && token.trim()) {
      headers['Authorization'] = `token ${token}`;
    }
  }

  try {
    // Check cache for basic repo list first
    let cachedBasicRepos = RepositoryCache.getBasicRepos(username);
    let data;
    let response;
    
    if (cachedBasicRepos) {
      // Use cached data
      data = cachedBasicRepos;
      // We don't have rate limit info from cache, so we'll need to make a minimal request
      // or estimate. For now, we'll assume we have enough rate limit.
      const remaining = 60; // Conservative estimate
      const reset = Date.now() + 3600000; // 1 hour from now
      
      // Transform cached repos
      const ownRepos = data.filter(repo => !repo.fork);
      let repositories = ownRepos.map(repo => {
        // If cached data is already transformed, use it; otherwise transform
        if (repo.name && repo.stars !== undefined) {
          return repo; // Already transformed
        }
        return transformRepository(repo, username);
      });
      
      // Apply filter BEFORE fetching detailed data
      repositories = filterRepositories(repositories, filterMode, year);
      
      // Get cached detailed data
      const cachedDetailed = RepositoryCache.getAllDetailedData(username);
      
      // Apply cached detailed data where available
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
      
      // Only fetch detailed data for repos that don't have cached data
      const reposNeedingDetails = repositories.filter(repo => !cachedDetailed[repo.name]);
      
      if (reposNeedingDetails.length > 0 && remaining > 20) {
        // Fetch details only for repos that need it
        await fetchDetailedDataForRepos(reposNeedingDetails, username, useToken, remaining);
        
        // Update cache with newly fetched data
        reposNeedingDetails.forEach(repo => {
          RepositoryCache.setDetailedData(username, repo.name, {
            totalCommits: repo.totalCommits,
            branchesCount: repo.branchesCount,
            openPRs: repo.openPRs,
            openIssues: repo.openIssues
          });
        });
      }
      
      // Update repositories with fresh data
      repositories = repositories.map(repo => {
        const updated = reposNeedingDetails.find(r => r.name === repo.name);
        return updated || repo;
      });
      
      // Also return all repos (unfiltered) for filter switching
      const allRepos = ownRepos.map(repo => {
        if (repo.name && repo.stars !== undefined) {
          return repo;
        }
        return transformRepository(repo, username);
      });
      
      // Apply cached detailed data to all repos too
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
        repositories: repositories, // Filtered repos with details
        allRepositories: allReposWithCache, // All repos (for filter switching)
        rateLimit: {
          remaining,
          reset,
          limit: 60
        }
      };
    }
    
    // No cache, fetch from API
    response = await fetch(url, { headers });
    
    // Read rate-limit headers
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
    
    // Cache basic repo list
    RepositoryCache.setBasicRepos(username, data);
    
    // Filter out forks for main visualization (only show own repos)
    const ownRepos = data.filter(repo => !repo.fork);
    
    // Transform repositories first
    let repositories = ownRepos.map(repo => transformRepository(repo, username));
    
    // Apply filter BEFORE fetching detailed data
    repositories = filterRepositories(repositories, filterMode, year);
    
    // Check cache for detailed data first
    const cachedDetailed = RepositoryCache.getAllDetailedData(username);
    
    // Apply cached detailed data where available
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
    
    // Only fetch detailed data for repos that don't have cached data
    const reposNeedingDetails = repositories.filter(repo => !cachedDetailed[repo.name]);
    
    // Fetch detailed data only for repos that need it
    if (reposNeedingDetails.length > 0 && remaining > 20) {
      await fetchDetailedDataForRepos(reposNeedingDetails, username, useToken, remaining);
      
      // Update cache with newly fetched data
      reposNeedingDetails.forEach(repo => {
        RepositoryCache.setDetailedData(username, repo.name, {
          totalCommits: repo.totalCommits,
          branchesCount: repo.branchesCount,
          openPRs: repo.openPRs,
          openIssues: repo.openIssues
        });
      });
    }
    
    // Update repositories with fresh data
    repositories = repositories.map(repo => {
      const updated = reposNeedingDetails.find(r => r.name === repo.name);
      return updated || repo;
    });
    
    // Also return all repos (unfiltered) for filter switching
    // Get all repos from cache or transform all ownRepos
    let allRepositories = ownRepos.map(repo => transformRepository(repo, username));
    
    // Apply cached detailed data to all repos
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
      // If this repo was in the filtered list and got details, use those
      const updated = repositories.find(r => r.name === repo.name);
      return updated || repo;
    });
    
    return {
      repositories: repositories, // Filtered repos with details
      allRepositories: allRepositories, // All repos (for filter switching)
      rateLimit: {
        remaining,
        reset,
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '60', 10)
      }
    };
  } catch (error) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      throw error; // Re-throw to be handled by caller
    }
    throw error;
  }
}

/**
 * Fetch detailed data for a list of repositories
 * Optimized batching with Promise.allSettled
 */
async function fetchDetailedDataForRepos(repos, username, useToken, initialRemaining) {
  if (repos.length === 0) return;
  
  // Optimized batch size: 6 repos at a time (was 3)
  const BATCH_SIZE = 6;
  const batches = [];
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    batches.push(repos.slice(i, i + BATCH_SIZE));
  }
  
  let currentRemaining = initialRemaining;
  
  // Process batches sequentially to respect rate limits
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Check rate limit before each batch
    if (currentRemaining <= 5) {
      console.warn('[GITHUB] Rate limit getting low, skipping remaining batches');
      break;
    }
    
    // Prepare headers for API calls
    const apiHeaders = {
      'Accept': 'application/vnd.github.v3+json'
    };
    if (useToken) {
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      if (token && token.trim()) {
        apiHeaders['Authorization'] = `token ${token}`;
      }
    }
    
    // Use Promise.allSettled to continue even if some requests fail
    const promises = batch.map(async (repo) => {
      try {
        const [commitCount, branchCount, issuesResponse] = await Promise.all([
          fetchRealCommitCount(repo.owner || username, repo.name, useToken),
          fetchRealBranchCount(repo.owner || username, repo.name, useToken),
          fetch(`${GITHUB_API_BASE}/repos/${repo.owner || username}/${repo.name}/issues?state=open&per_page=100`, { headers: apiHeaders })
        ]);
        
        repo.totalCommits = commitCount;
        repo.branchesCount = branchCount;
        
        // Separate PRs from Issues
        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          const prs = issuesData.filter(item => item.pull_request);
          const realIssues = issuesData.filter(item => !item.pull_request);
          repo.openPRs = prs.length;
          repo.openIssues = realIssues.length;
        }
        
        return { status: 'fulfilled', repo };
      } catch (error) {
        console.warn(`[GITHUB] Error fetching details for ${repo.name}:`, error);
        // Keep estimated values on error
        return { status: 'rejected', repo, error };
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Update currentRemaining estimate (each repo uses ~3 requests)
    currentRemaining -= batch.length * 3;
    
    // Reduced delay between batches: 200ms (was 500ms)
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

