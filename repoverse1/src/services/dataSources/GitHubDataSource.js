/**
 * GitHub Service - Fetch public repositories without tokens by default
 * Falls back to mock data on rate-limit
 */

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
 * Fetch user repositories from GitHub API
 * @param {string} username - GitHub username
 * @param {boolean} useToken - Whether to use token if available
 * @returns {Promise<{repositories: Array, rateLimit: {remaining: number, reset: number}}>}
 */
export async function fetchUserRepositories(username, useToken = false) {
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
    const response = await fetch(url, { headers });
    
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

    const data = await response.json();
    
    // Filter out forks for main visualization (only show own repos)
    const ownRepos = data.filter(repo => !repo.fork);
    
    // Transform repositories first
    let repositories = ownRepos.map(repo => transformRepository(repo, username));
    
    // Only fetch real commit and branch counts if we have enough rate limit remaining
    // Check rate limit before making additional API calls
    if (remaining > 20 && ownRepos.length > 0) {
      // Fetch real commit and branch counts in parallel (with rate limit awareness)
      // Limit concurrent requests to avoid hitting rate limits too fast
      const BATCH_SIZE = 3; // Reduced to 3 repos at a time to be more conservative
      const batches = [];
      for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
        batches.push(repositories.slice(i, i + BATCH_SIZE));
      }
      
      // Process batches sequentially to respect rate limits
      for (const batch of batches) {
        // Check rate limit before each batch
        if (remaining <= 5) {
          console.warn('[GITHUB] Rate limit getting low, skipping remaining batches');
          break;
        }
        
        const promises = batch.map(async (repo) => {
          try {
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
            
            // Pass useToken to both functions so they use the token if available
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
              // PRs have 'pull_request' field, real issues don't
              const prs = issuesData.filter(item => item.pull_request);
              const realIssues = issuesData.filter(item => !item.pull_request);
              repo.openPRs = prs.length;
              repo.openIssues = realIssues.length;
            }
          } catch (error) {
            console.warn(`[GITHUB] Error fetching details for ${repo.name}:`, error);
            // Keep estimated values on error
          }
        });
        
        await Promise.all(promises);
        
        // Longer delay between batches to avoid rate limit issues
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms
        }
      }
    } else {
      console.warn('[GITHUB] Rate limit too low or no repos, using estimated values');
      // Use estimated values if rate limit is too low
    }
    
    return {
      repositories: repositories,
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
 * Check if rate-limit is exceeded
 */
export function isRateLimitExceeded(rateLimit) {
  return rateLimit.remaining === 0;
}

