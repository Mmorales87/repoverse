/// Unified repository data model for GitHub and Bitbucket
class RepositoryData {
  final String name;
  final int totalCommits;
  final Map<String, int> languages; // language name -> bytes of code
  final double activityScore; // Calculated score based on commits, stars, forks
  final int stars;
  final int forks;
  final String source; // "github" or "bitbucket"
  final String? description;
  final DateTime? lastUpdated;
  final bool isFork; // Whether this repository is a fork of another

  RepositoryData({
    required this.name,
    required this.totalCommits,
    required this.languages,
    required this.activityScore,
    required this.stars,
    required this.forks,
    required this.source,
    this.description,
    this.lastUpdated,
    this.isFork = false, // Default to false
  });

  /// Get the primary language (most bytes)
  String? get primaryLanguage {
    if (languages.isEmpty) return null;
    return languages.entries.reduce((a, b) => a.value > b.value ? a : b).key;
  }

  /// Get language percentage distribution
  Map<String, double> get languagePercentages {
    if (languages.isEmpty) return {};
    final total = languages.values.reduce((a, b) => a + b);
    if (total == 0) return {};
    return languages.map((key, value) => MapEntry(key, value / total * 100));
  }

  @override
  String toString() =>
      'RepositoryData(name: $name, commits: $totalCommits, '
      'stars: $stars, source: $source)';
}
