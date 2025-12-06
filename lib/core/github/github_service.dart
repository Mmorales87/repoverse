import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/repository_data.dart';

/// Service for fetching data from GitHub API
class GitHubService {
  final String? token; // Optional OAuth token for private repos
  static const String baseUrl = 'https://api.github.com';

  GitHubService({this.token});

  /// Fetch all repositories for a user
  /// Returns empty list if no token is provided (caller should use mock data)
  Future<List<RepositoryData>> fetchUserRepositories(String username) async {
    print('🔍 [DEBUG] GitHubService.fetchUserRepositories("$username")');
    print('   [DEBUG] Token provided: ${token != null && token!.isNotEmpty ? "✅ Yes (${token!.length} chars)" : "❌ No"}');
    
    // If no token, return empty list - caller should use mock data
    if (token == null || token!.isEmpty) {
      print('   [DEBUG] ⚠️  No token provided. Returning empty list. Use mock data instead.');
      return [];
    }
    
    try {
      // Use modern GitHub API headers
      final headers = <String, String>{
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': 'Bearer $token',
      };
      
      print('   [DEBUG] Authorization header added (Bearer token)');

      final url = '$baseUrl/users/$username/repos?per_page=100&sort=updated&type=public';
      print('   [DEBUG] Fetching: $url');
      
      // Fetch ONLY public repositories - no auth needed
      final reposResponse = await http.get(
        Uri.parse(url),
        headers: headers,
      );
      
      print('   [DEBUG] Response status: ${reposResponse.statusCode}');

      // Handle different error cases
      if (reposResponse.statusCode == 403) {
        print('   [DEBUG] ❌ Status 403 - Rate limit or forbidden');
        
        // Check rate limit headers
        final rateLimitRemaining = reposResponse.headers['x-ratelimit-remaining'];
        final rateLimitReset = reposResponse.headers['x-ratelimit-reset'];
        
        print('   [DEBUG] Rate limit remaining: $rateLimitRemaining');
        print('   [DEBUG] Rate limit reset: $rateLimitReset');
        
        // Check if it's a rate limit issue
        final remaining = rateLimitRemaining != null ? int.tryParse(rateLimitRemaining) : null;
        if (remaining != null && remaining == 0) {
          // Calculate reset time
          String resetMessage = 'Unknown';
          if (rateLimitReset != null) {
            final resetTimestamp = int.tryParse(rateLimitReset);
            if (resetTimestamp != null) {
              final resetDate = DateTime.fromMillisecondsSinceEpoch(resetTimestamp * 1000);
              final now = DateTime.now();
              final difference = resetDate.difference(now);
              
              if (difference.inMinutes > 0) {
                resetMessage = '${difference.inMinutes} minutes';
              } else if (difference.inSeconds > 0) {
                resetMessage = '${difference.inSeconds} seconds';
              } else {
                resetMessage = 'soon';
              }
            }
          }
          
          print('   [DEBUG] Detected: Rate limit reached. Reset in: $resetMessage');
          throw Exception(
            'GITHUB_RATE_LIMIT: GitHub API rate limit reached. '
            'Reset in: $resetMessage. '
            'Please wait or use a personal access token with higher limits. '
            'See: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting',
          );
        }
        
        // If not rate limit, might be forbidden access
        print('   [DEBUG] 403 error - might be forbidden access');
        throw Exception(
          'GITHUB_FORBIDDEN: Access forbidden. Check your token permissions or repository access.',
        );
      }

      if (reposResponse.statusCode == 404) {
        print('   [DEBUG] ❌ Status 404 - User not found');
        throw Exception('GITHUB_NOT_FOUND: GitHub user "$username" not found. Please check the username.');
      }

      if (reposResponse.statusCode == 401) {
        print('   [DEBUG] ❌ Status 401 - Authentication failed');
        throw Exception(
          'GITHUB_AUTH: Authentication failed. Please check your GitHub token if using one.',
        );
      }

      if (reposResponse.statusCode != 200) {
        print('   [DEBUG] ❌ Unexpected status: ${reposResponse.statusCode}');
        final bodyPreview = reposResponse.body.length > 500 
            ? reposResponse.body.substring(0, 500) 
            : reposResponse.body;
        print('   [DEBUG] Response body: $bodyPreview');
        throw Exception(
          'GITHUB_ERROR: Failed to fetch GitHub repos. Status: ${reposResponse.statusCode}',
        );
      }
      
      print('   [DEBUG] ✅ Status 200 - Success!');

      final reposJson = json.decode(reposResponse.body) as List<dynamic>;
      if (reposJson.isEmpty) {
        throw Exception('User "$username" has no public repositories.');
      }
      
      return _processRepositories(reposJson, headers);
    } catch (e) {
      throw Exception('Error fetching GitHub data: $e');
    }
  }

  /// Process repositories list into RepositoryData objects
  Future<List<RepositoryData>> _processRepositories(
    List<dynamic> reposJson,
    Map<String, String> headers,
  ) async {
    final repositories = <RepositoryData>[];

    // Fetch detailed data for each repository
    for (final repoJson in reposJson) {
      final repo = repoJson as Map<String, dynamic>;
      final repoName = repo['name'] as String;
      final fullName = repo['full_name'] as String;

      // Fetch commits count (simplified - use a reasonable estimate)
      int commitsCount = 0;
      try {
        commitsCount = await _fetchCommitCount(fullName, headers);
      } catch (e) {
        // If commit count fails, estimate from other data
        commitsCount = ((repo['stargazers_count'] as int? ?? 0) * 10 +
            (repo['forks_count'] as int? ?? 0) * 5).clamp(0, 10000);
      }

      // Fetch languages
      Map<String, int> languages = {};
      try {
        languages = await _fetchLanguages(fullName, headers);
      } catch (e) {
        // If languages fail, use empty map
        languages = {};
      }

      // Check if this is a fork
      final isFork = repo['fork'] as bool? ?? false;
      
      // Calculate activity score (only for non-forks)
      final stars = repo['stargazers_count'] as int? ?? 0;
      final forks = repo['forks_count'] as int? ?? 0;
      final activityScore = isFork ? 0.0 : _calculateActivityScore(commitsCount, stars, forks);

      repositories.add(RepositoryData(
        name: repoName,
        totalCommits: commitsCount,
        languages: languages,
        activityScore: activityScore,
        stars: stars,
        forks: forks,
        source: 'github',
        description: repo['description'] as String?,
        lastUpdated: repo['updated_at'] != null
            ? DateTime.parse(repo['updated_at'] as String)
            : null,
        isFork: isFork,
      ));
    }

    return repositories;
  }

  /// Fetch commit count for a repository
  Future<int> _fetchCommitCount(
    String fullName,
    Map<String, String> headers,
  ) async {
    try {
      // Use the commits API with pagination to count
      // Note: GitHub API doesn't provide direct commit count, so we estimate
      // by checking the first page and using the Link header if available
      final response = await http.get(
        Uri.parse('$baseUrl/repos/$fullName/commits?per_page=1'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        // Try to get total from Link header
        final linkHeader = response.headers['link'];
        if (linkHeader != null && linkHeader.contains('rel="last"')) {
          final match = RegExp(
            r'page=(\d+)>; rel="last"',
          ).firstMatch(linkHeader);
          if (match != null) {
            return int.parse(match.group(1)!);
          }
        }
        // Fallback: estimate based on recent activity
        // For demo purposes, return a reasonable estimate
        return 100; // This is a simplified approach
      }
      return 0;
    } catch (e) {
      return 0; // Return 0 on error
    }
  }

  /// Fetch languages for a repository
  Future<Map<String, int>> _fetchLanguages(
    String fullName,
    Map<String, String> headers,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/repos/$fullName/languages'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final languagesJson =
            json.decode(response.body) as Map<String, dynamic>;
        return languagesJson.map((key, value) => MapEntry(key, value as int));
      }
      return {};
    } catch (e) {
      return {};
    }
  }

  /// Calculate activity score based on commits, stars, and forks
  double _calculateActivityScore(int commits, int stars, int forks) {
    // Normalize and weight: commits (60%), stars (25%), forks (15%)
    final commitScore = (commits / 1000).clamp(0.0, 1.0) * 60;
    final starScore = (stars / 500).clamp(0.0, 1.0) * 25;
    final forkScore = (forks / 100).clamp(0.0, 1.0) * 15;
    return (commitScore + starScore + forkScore).clamp(0.0, 100.0);
  }
}
