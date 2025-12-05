import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/github/github_service.dart';
import 'core/bitbucket/bitbucket_service.dart';
import 'core/repository_aggregator.dart';
import 'ui/screens/home_screen.dart';
import 'ui/screens/universe_screen.dart';
import 'ui/screens/user_data_screen.dart';
import 'ui/widgets/loading_indicator.dart';

Future<void> main() async {
  print('🚀 [DEBUG] RepoVerse starting...');
  
  // Try to load .env file from assets if it exists (declared in pubspec.yaml)
  // If it doesn't exist, continue without error - tokens will use --dart-define or null
  try {
    await dotenv.load(fileName: "assets/.env");
    print('✅ [DEBUG] .env file loaded successfully from assets/.env');
    print('   [DEBUG] GITHUB_TOKEN present: ${dotenv.env['GITHUB_TOKEN'] != null && dotenv.env['GITHUB_TOKEN']!.isNotEmpty}');
    print('   [DEBUG] BITBUCKET_TOKEN present: ${dotenv.env['BITBUCKET_TOKEN'] != null && dotenv.env['BITBUCKET_TOKEN']!.isNotEmpty}');
  } catch (e) {
    // .env file doesn't exist or couldn't be loaded - that's okay
    // Tokens will be read from --dart-define or will be null (app will use mock data)
    print('⚠️  [DEBUG] .env file not found or couldn\'t load from assets/.env: $e');
    print('   [DEBUG] Will use --dart-define or mock data mode');
  }
  
  print('🎬 [DEBUG] Running RepoVerseApp...');
  runApp(const RepoVerseApp());
}

class RepoVerseApp extends StatelessWidget {
  const RepoVerseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RepoVerse',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Colors.indigo,
        useMaterial3: true,
      ),
      home: const AppNavigator(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AppNavigator extends StatefulWidget {
  const AppNavigator({super.key});

  @override
  State<AppNavigator> createState() => _AppNavigatorState();
}

class _AppNavigatorState extends State<AppNavigator> {
  Widget _currentScreen = const HomeScreen(onGenerate: _handleGenerate);

  static void _handleGenerate(
    String? githubUsername,
    String? bitbucketUsername,
  ) {
    // This will be handled by the state
  }

  void _navigateToUniverse(
    List<dynamic> repositories,
    Map<String, dynamic> stats,
  ) {
    setState(() {
      _currentScreen = UniverseScreen(
        repositories: repositories.cast(),
        stats: stats,
      );
    });
  }

  void _handleGenerateUniverse(
    String? githubUsername,
    String? bitbucketUsername,
  ) async {
    // Show loading screen
    setState(() {
      _currentScreen = const LoadingIndicator(
        message: 'Fetching your repositories...',
      );
    });

    try {
      // Create services - use token from .env, --dart-define, or null for public repos
      final githubToken = dotenv.env['GITHUB_TOKEN'] ?? 
          const String.fromEnvironment('GITHUB_TOKEN', defaultValue: '');
      final bitbucketToken = dotenv.env['BITBUCKET_TOKEN'] ?? 
          const String.fromEnvironment('BITBUCKET_TOKEN', defaultValue: '');
      
      print('🔑 [DEBUG] Token status:');
      print('   [DEBUG] GitHub token: ${githubToken.isNotEmpty ? "✅ Present (${githubToken.length} chars)" : "❌ Not set"}');
      print('   [DEBUG] Bitbucket token: ${bitbucketToken.isNotEmpty ? "✅ Present (${bitbucketToken.length} chars)" : "❌ Not set"}');
      
      final githubService = githubUsername != null
          ? GitHubService(token: githubToken.isEmpty ? null : githubToken)
          : null;
      final bitbucketService = bitbucketUsername != null
          ? BitbucketService(token: bitbucketToken.isEmpty ? null : bitbucketToken)
          : null;
      
      print('📡 [DEBUG] Services created:');
      print('   [DEBUG] GitHub service: ${githubService != null ? "✅ Created" : "❌ Not created"}');
      print('   [DEBUG] Bitbucket service: ${bitbucketService != null ? "✅ Created" : "❌ Not created"}');

      // Create aggregator - use mock data only if BOTH usernames are empty
      final aggregator = RepositoryAggregator(
        githubService: githubService,
        bitbucketService: bitbucketService,
        useMockData: githubUsername == null && bitbucketUsername == null,
      );

      print('📦 [DEBUG] Fetching repositories...');
      print('   [DEBUG] GitHub username: ${githubUsername ?? "none"}');
      print('   [DEBUG] Bitbucket username: ${bitbucketUsername ?? "none"}');
      
      // Fetch repositories
      final repositories = await aggregator.aggregateRepositories(
        githubUsername: githubUsername,
        bitbucketUsername: bitbucketUsername,
      );

      print('✅ [DEBUG] Repositories fetched: ${repositories.length} repos');

      // Get stats
      final stats = aggregator.getAggregatedStats(repositories);
      print('📊 [DEBUG] Stats calculated: ${stats.length} stats');

      // Navigate to user data screen first
      if (mounted) {
        print('📊 [DEBUG] Showing user data screen...');
        setState(() {
          _currentScreen = UserDataScreen(
            repositories: repositories.cast(),
            stats: stats,
            onEnterUniverse: () {
              print('🌌 [DEBUG] Navigating to universe screen...');
              _navigateToUniverse(repositories, stats);
            },
          );
        });
      }
    } catch (e, stackTrace) {
      print('❌ [DEBUG] ERROR fetching repositories:');
      print('   [DEBUG] Error type: ${e.runtimeType}');
      print('   [DEBUG] Error message: $e');
      print('   [DEBUG] Stack trace: $stackTrace');
      
      // Show error and fall back to mock data
      if (mounted) {
        print('🔄 [DEBUG] Falling back to mock data...');
        final aggregator = RepositoryAggregator(useMockData: true);
        final repositories = await aggregator.aggregateRepositories();
        final stats = aggregator.getAggregatedStats(repositories);
        print('✅ [DEBUG] Mock data loaded: ${repositories.length} repos');

        // Show user-friendly error message
        String errorMessage = 'Error fetching repositories. Using demo data.';
        if (e.toString().contains('403')) {
          errorMessage = 'GitHub API rate limit reached. Using demo data. Try again in a few minutes.';
          print('   [DEBUG] Detected: Rate limit (403)');
        } else if (e.toString().contains('404')) {
          errorMessage = 'User not found. Using demo data.';
          print('   [DEBUG] Detected: User not found (404)');
        } else if (e.toString().contains('401')) {
          errorMessage = 'Authentication failed. Using demo data.';
          print('   [DEBUG] Detected: Auth failed (401)');
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 5),
          ),
        );

        _navigateToUniverse(repositories, stats);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Update HomeScreen with proper callback
    if (_currentScreen is HomeScreen) {
      _currentScreen = HomeScreen(onGenerate: _handleGenerateUniverse);
    }

    return _currentScreen;
  }
}
