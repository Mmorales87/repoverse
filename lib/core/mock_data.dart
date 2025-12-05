import 'package:repoverse/core/models/repository_data.dart';

/// Mock repository data for testing and demo purposes
class MockData {
  static List<RepositoryData> getMockRepositories() {
    return [
      RepositoryData(
        name: 'flutter-app',
        totalCommits: 1247,
        languages: {'Dart': 45000, 'Kotlin': 12000, 'Swift': 8000},
        activityScore: 85.5,
        stars: 342,
        forks: 67,
        source: 'github',
        description: 'A beautiful Flutter mobile application',
        lastUpdated: DateTime.now().subtract(const Duration(days: 2)),
      ),
      RepositoryData(
        name: 'web-dashboard',
        totalCommits: 892,
        languages: {'TypeScript': 35000, 'CSS': 15000, 'HTML': 5000},
        activityScore: 72.3,
        stars: 189,
        forks: 34,
        source: 'github',
        description: 'Modern web dashboard with React',
        lastUpdated: DateTime.now().subtract(const Duration(days: 5)),
      ),
      RepositoryData(
        name: 'api-server',
        totalCommits: 2156,
        languages: {'Python': 60000, 'JavaScript': 20000},
        activityScore: 91.2,
        stars: 567,
        forks: 123,
        source: 'github',
        description: 'RESTful API server built with FastAPI',
        lastUpdated: DateTime.now().subtract(const Duration(hours: 12)),
      ),
      RepositoryData(
        name: 'mobile-game',
        totalCommits: 634,
        languages: {'C#': 40000, 'ShaderLab': 15000},
        activityScore: 58.7,
        stars: 98,
        forks: 21,
        source: 'bitbucket',
        description: 'Unity mobile game project',
        lastUpdated: DateTime.now().subtract(const Duration(days: 7)),
      ),
      RepositoryData(
        name: 'data-analytics',
        totalCommits: 1789,
        languages: {'Python': 80000, 'R': 25000, 'SQL': 15000},
        activityScore: 88.9,
        stars: 445,
        forks: 89,
        source: 'github',
        description: 'Data analytics and visualization tools',
        lastUpdated: DateTime.now().subtract(const Duration(days: 1)),
      ),
      RepositoryData(
        name: 'devops-tools',
        totalCommits: 456,
        languages: {'Go': 30000, 'YAML': 10000, 'Shell': 8000},
        activityScore: 64.1,
        stars: 156,
        forks: 45,
        source: 'bitbucket',
        description: 'DevOps automation scripts and tools',
        lastUpdated: DateTime.now().subtract(const Duration(days: 10)),
      ),
      RepositoryData(
        name: 'ml-models',
        totalCommits: 2103,
        languages: {'Python': 95000, 'Jupyter Notebook': 30000},
        activityScore: 94.5,
        stars: 723,
        forks: 178,
        source: 'github',
        description: 'Machine learning models and training scripts',
        lastUpdated: DateTime.now().subtract(const Duration(hours: 6)),
      ),
      RepositoryData(
        name: 'blockchain-dapp',
        totalCommits: 567,
        languages: {
          'Solidity': 25000,
          'JavaScript': 20000,
          'TypeScript': 15000,
        },
        activityScore: 61.3,
        stars: 112,
        forks: 28,
        source: 'github',
        description: 'Decentralized application on Ethereum',
        lastUpdated: DateTime.now().subtract(const Duration(days: 14)),
      ),
    ];
  }

  /// Get aggregated stats from mock repositories
  static Map<String, dynamic> getMockStats(List<RepositoryData> repos) {
    final totalCommits = repos.fold<int>(
      0,
      (sum, repo) => sum + repo.totalCommits,
    );
    final totalStars = repos.fold<int>(0, (sum, repo) => sum + repo.stars);
    final totalForks = repos.fold<int>(0, (sum, repo) => sum + repo.forks);

    final languageMap = <String, int>{};
    for (final repo in repos) {
      repo.languages.forEach((lang, bytes) {
        languageMap[lang] = (languageMap[lang] ?? 0) + bytes;
      });
    }

    final mostActiveRepo = repos.isNotEmpty
        ? repos.reduce((a, b) => a.activityScore > b.activityScore ? a : b)
        : null;

    return {
      'totalRepos': repos.length,
      'totalCommits': totalCommits,
      'totalStars': totalStars,
      'totalForks': totalForks,
      'languages': languageMap,
      'mostActiveRepo': mostActiveRepo,
    };
  }
}
