/**
 * IDataSource - Interface for repository data sources
 * Allows easy extension to GitHub, Bitbucket, GitLab, etc.
 * Follows Dependency Inversion Principle (DIP)
 */
export class IDataSource {
  async fetchRepositories(username) {
    throw new Error('fetchRepositories() must be implemented');
  }

  async fetchRepositoryDetails(repoName) {
    throw new Error('fetchRepositoryDetails() must be implemented');
  }

  getRateLimit() {
    throw new Error('getRateLimit() must be implemented');
  }

  isRateLimitExceeded() {
    throw new Error('isRateLimitExceeded() must be implemented');
  }
}

