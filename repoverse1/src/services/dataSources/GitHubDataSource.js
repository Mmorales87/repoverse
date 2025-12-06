/**
 * GitHub Service - Fetch public repositories without tokens by default
 * Falls back to mock data on rate-limit
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Estimate commits based on repository activity
 * Since we can't easily get total commits without multiple API calls,
 * we use a reasonable estimation based on stars, forks, and age
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
 * Transform GitHub API response to internal repository format
 */
function transformRepository(githubRepo) {
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(githubRepo.created_at)) / (1000 * 60 * 60 * 24)
  );
  
  return {
    name: githubRepo.name,
    totalCommits: estimateCommits(githubRepo),
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
    branchesCount: Math.max(1, Math.floor((githubRepo.stargazers_count || 0) / 10) + 1), // Estimate branches
    commitsLast30: Math.floor(estimateCommits(githubRepo) * 0.1), // Estimate recent commits
    watchers: githubRepo.watchers_count || 0,
    openIssues: githubRepo.open_issues_count || 0,
    daysSinceCreation: daysSinceCreation
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
    
    return {
      repositories: ownRepos.map(transformRepository),
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

