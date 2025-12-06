import 'package:repoverse/core/github/github_service.dart';
import 'package:repoverse/core/bitbucket/bitbucket_service.dart';
import 'package:repoverse/core/models/repository_data.dart';
import 'package:repoverse/core/mock_data.dart';

/// Aggregates repositories from GitHub and Bitbucket into a unified list
class RepositoryAggregator {
  final GitHubService? githubService;
  final BitbucketService? bitbucketService;
  final bool useMockData;

  RepositoryAggregator({
    this.githubService,
    this.bitbucketService,
    this.useMockData = false,
  });

  /// Fetch and aggregate repositories from all sources
  Future<List<RepositoryData>> aggregateRepositories({
    String? githubUsername,
    String? bitbucketUsername,
  }) async {
    if (useMockData) {
      return MockData.getMockRepositories();
    }

    final repositories = <RepositoryData>[];

    // Fetch from GitHub
    if (githubUsername != null &&
        githubUsername.isNotEmpty &&
        githubService != null) {
      try {
        final githubRepos = await githubService!.fetchUserRepositories(
          githubUsername,
        );
        repositories.addAll(githubRepos);
      } catch (e) {
        // Log error but continue with other sources
        print('Error fetching GitHub repos: $e');
      }
    }

    // Fetch from Bitbucket
    if (bitbucketUsername != null &&
        bitbucketUsername.isNotEmpty &&
        bitbucketService != null) {
      try {
        final bitbucketRepos = await bitbucketService!.fetchUserRepositories(
          bitbucketUsername,
        );
        repositories.addAll(bitbucketRepos);
      } catch (e) {
        // Log error but continue
        print('Error fetching Bitbucket repos: $e');
      }
    }

    // If no repositories were fetched, fall back to mock data
    if (repositories.isEmpty) {
      return MockData.getMockRepositories();
    }

    return repositories;
  }

  /// Get aggregated statistics from repositories
  /// Excludes forks from commits and languages calculations
  Map<String, dynamic> getAggregatedStats(List<RepositoryData> repositories) {
    // Separate forks from own repositories
    final ownRepos = repositories.where((repo) => !repo.isFork).toList();
    final forkRepos = repositories.where((repo) => repo.isFork).toList();
    
    // Calculate stats only from own repositories (exclude forks)
    final totalCommits = ownRepos.fold<int>(
      0,
      (sum, repo) => sum + repo.totalCommits,
    );
    final totalStars = ownRepos.fold<int>(
      0,
      (sum, repo) => sum + repo.stars,
    );
    final totalForks = ownRepos.fold<int>(
      0,
      (sum, repo) => sum + repo.forks,
    );

    // Aggregate languages only from own repositories
    final languageMap = <String, int>{};
    for (final repo in ownRepos) {
      repo.languages.forEach((lang, bytes) {
        languageMap[lang] = (languageMap[lang] ?? 0) + bytes;
      });
    }

    // Find most active repository (only from own repos)
    final mostActiveRepo = ownRepos.isNotEmpty
        ? ownRepos.reduce(
            (a, b) => a.activityScore > b.activityScore ? a : b,
          )
        : null;

    // Count by source (separate own repos and forks)
    final githubCount = ownRepos.where((r) => r.source == 'github').length;
    final bitbucketCount = ownRepos.where((r) => r.source == 'bitbucket').length;
    final forkCount = forkRepos.length;

    return {
      'totalRepos': ownRepos.length, // Only count own repos
      'totalCommits': totalCommits, // Only commits from own repos
      'totalStars': totalStars,
      'totalForks': totalForks,
      'languages': languageMap, // Only languages from own repos
      'mostActiveRepo': mostActiveRepo,
      'githubCount': githubCount,
      'bitbucketCount': bitbucketCount,
      'forkCount': forkCount, // Number of forks
      'allRepos': repositories, // Include all repos (for 3D visualization)
      'ownRepos': ownRepos, // Only own repos
    };
  }
}
