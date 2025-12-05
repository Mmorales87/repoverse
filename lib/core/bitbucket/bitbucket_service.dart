import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/repository_data.dart';

/// Service for fetching data from Bitbucket API
class BitbucketService {
  final String? token; // Optional OAuth token for private repos
  static const String baseUrl = 'https://api.bitbucket.org/2.0';

  BitbucketService({this.token});

  /// Fetch all repositories for a user/workspace
  /// Returns empty list if no token is provided (caller should use mock data)
  Future<List<RepositoryData>> fetchUserRepositories(String username) async {
    print('🔍 [DEBUG] BitbucketService.fetchUserRepositories("$username")');
    print('   [DEBUG] Token provided: ${token != null && token!.isNotEmpty ? "✅ Yes (${token!.length} chars)" : "❌ No"}');
    
    // If no token, return empty list - caller should use mock data
    if (token == null || token!.isEmpty) {
      print('   [DEBUG] ⚠️  No token provided. Returning empty list. Use mock data instead.');
      return [];
    }
    
    try {
      final headers = <String, String>{
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      };
      
      print('   [DEBUG] Authorization header added (Bearer token)');

      // Fetch repositories
      final reposResponse = await http.get(
        Uri.parse('$baseUrl/repositories/$username?pagelen=100'),
        headers: headers,
      );
      
      print('   [DEBUG] Response status: ${reposResponse.statusCode}');

      // Handle rate limit (403)
      if (reposResponse.statusCode == 403) {
        print('   [DEBUG] ❌ Status 403 - Rate limit or forbidden');
        throw Exception(
          'BITBUCKET_RATE_LIMIT: Bitbucket API rate limit reached or access forbidden. '
          'Please wait a few minutes or check your token permissions.',
        );
      }
      
      // Handle other errors
      if (reposResponse.statusCode == 404) {
        print('   [DEBUG] ❌ Status 404 - User/workspace not found');
        throw Exception(
          'BITBUCKET_NOT_FOUND: Bitbucket user/workspace "$username" not found.',
        );
      }
      
      if (reposResponse.statusCode == 401) {
        print('   [DEBUG] ❌ Status 401 - Authentication failed');
        throw Exception(
          'BITBUCKET_AUTH: Authentication failed. Please check your Bitbucket token.',
        );
      }

      if (reposResponse.statusCode != 200) {
        print('   [DEBUG] ❌ Unexpected status: ${reposResponse.statusCode}');
        throw Exception(
          'BITBUCKET_ERROR: Failed to fetch Bitbucket repos. Status: ${reposResponse.statusCode}',
        );
      }
      
      print('   [DEBUG] ✅ Status 200 - Success!');

      final reposJson = json.decode(reposResponse.body) as Map<String, dynamic>;
      final reposList = reposJson['values'] as List<dynamic>? ?? [];
      final repositories = <RepositoryData>[];

      // Fetch detailed data for each repository
      for (final repoJson in reposList) {
        final repo = repoJson as Map<String, dynamic>;
        final repoName = repo['name'] as String;
        final fullName = repo['full_name'] as String;

        // Fetch commits count
        final commitsCount = await _fetchCommitCount(fullName, headers);

        // Fetch languages (Bitbucket doesn't provide this directly, estimate)
        final languages = await _fetchLanguages(fullName, headers);

        // Calculate activity score
        final stars = 0; // Bitbucket doesn't have stars in the same way
        final forks = 0; // Bitbucket uses forks differently
        final activityScore = _calculateActivityScore(
          commitsCount,
          stars,
          forks,
        );

        repositories.add(
          RepositoryData(
            name: repoName,
            totalCommits: commitsCount,
            languages: languages,
            activityScore: activityScore,
            stars: stars,
            forks: forks,
            source: 'bitbucket',
            description: repo['description'] as String?,
            lastUpdated: repo['updated_on'] != null
                ? DateTime.parse(repo['updated_on'] as String)
                : null,
          ),
        );
      }

      return repositories;
    } catch (e) {
      throw Exception('Error fetching Bitbucket data: $e');
    }
  }

  /// Fetch commit count for a repository
  Future<int> _fetchCommitCount(
    String fullName,
    Map<String, String> headers,
  ) async {
    try {
      // Bitbucket API provides commit count in the repository endpoint
      final response = await http.get(
        Uri.parse('$baseUrl/repositories/$fullName'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        // Try to get from commits endpoint pagination
        final commitsResponse = await http.get(
          Uri.parse('$baseUrl/repositories/$fullName/commits?pagelen=1'),
          headers: headers,
        );

        if (commitsResponse.statusCode == 200) {
          final commitsJson =
              json.decode(commitsResponse.body) as Map<String, dynamic>;
          final size = commitsJson['size'] as int?;
          if (size != null) {
            return size;
          }
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  /// Fetch languages for a repository (Bitbucket doesn't provide this, so we estimate)
  Future<Map<String, int>> _fetchLanguages(
    String fullName,
    Map<String, String> headers,
  ) async {
    try {
      // Bitbucket doesn't have a languages endpoint like GitHub
      // We could try to analyze file extensions from the source endpoint
      // For now, return empty or estimate based on common patterns
      // This is a placeholder - in a real implementation, you might analyze
      // the repository structure or use file extension patterns
      return {'Python': 50000, 'JavaScript': 30000}; // Placeholder
    } catch (e) {
      return {};
    }
  }

  /// Calculate activity score based on commits, stars, and forks
  double _calculateActivityScore(int commits, int stars, int forks) {
    // Similar to GitHub but adjusted for Bitbucket's different metrics
    final commitScore = (commits / 1000).clamp(0.0, 1.0) * 70;
    final starScore = (stars / 500).clamp(0.0, 1.0) * 15;
    final forkScore = (forks / 100).clamp(0.0, 1.0) * 15;
    return (commitScore + starScore + forkScore).clamp(0.0, 100.0);
  }
}
