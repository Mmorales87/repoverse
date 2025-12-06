/**
 * DataSourceFactory - Factory for creating data sources
 * Follows Open/Closed Principle - easy to add new sources
 */
import { GitHubDataSource } from '../../services/dataSources/GitHubDataSource.js';
// Future: import { BitbucketDataSource } from '../../services/dataSources/BitbucketDataSource.js';
// Future: import { GitLabDataSource } from '../../services/dataSources/GitLabDataSource.js';

export class DataSourceFactory {
  static SOURCES = {
    GITHUB: 'github',
    // BITBUCKET: 'bitbucket',
    // GITLAB: 'gitlab'
  };

  /**
   * Create data source by type
   */
  static create(sourceType = DataSourceFactory.SOURCES.GITHUB) {
    switch (sourceType) {
      case DataSourceFactory.SOURCES.GITHUB:
        return new GitHubDataSource();
      // case DataSourceFactory.SOURCES.BITBUCKET:
      //   return new BitbucketDataSource();
      // case DataSourceFactory.SOURCES.GITLAB:
      //   return new GitLabDataSource();
      default:
        throw new Error(`Unknown data source type: ${sourceType}`);
    }
  }
}

