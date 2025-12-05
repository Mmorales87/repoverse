import 'package:flutter/material.dart';
import '../../core/models/repository_data.dart';

/// Share card widget design
class ShareCardWidget extends StatelessWidget {
  final Map<String, dynamic> stats;
  final List<RepositoryData> repositories;
  final VoidCallback onExport;

  const ShareCardWidget({
    super.key,
    required this.stats,
    required this.repositories,
    required this.onExport,
  });

  @override
  Widget build(BuildContext context) {
    final mostActiveRepo = stats['mostActiveRepo'] as RepositoryData?;
    final languages = stats['languages'] as Map<String, int>? ?? {};

    return Container(
      width: 800,
      height: 600,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.indigo.shade900,
            Colors.black,
            Colors.purple.shade900,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            const Text(
              'RepoVerse',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 24),
            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: 'Repositories',
                  value: '${stats['totalRepos'] ?? 0}',
                ),
                _StatItem(
                  label: 'Commits',
                  value: '${stats['totalCommits'] ?? 0}',
                ),
                _StatItem(label: 'Stars', value: '${stats['totalStars'] ?? 0}'),
              ],
            ),
            const SizedBox(height: 32),
            // Most active repo
            if (mostActiveRepo != null) ...[
              const Text(
                'Most Active Repository',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                mostActiveRepo.name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigoAccent,
                ),
              ),
              const SizedBox(height: 32),
            ],
            // Language distribution
            const Text(
              'Language Distribution',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 16),
            Expanded(child: _LanguageBars(languages: languages)),
            // Export button
            Align(
              alignment: Alignment.bottomRight,
              child: ElevatedButton.icon(
                onPressed: onExport,
                icon: const Icon(Icons.download),
                label: const Text('Export PNG'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.white70),
        ),
      ],
    );
  }
}

class _LanguageBars extends StatelessWidget {
  final Map<String, int> languages;

  const _LanguageBars({required this.languages});

  @override
  Widget build(BuildContext context) {
    if (languages.isEmpty) {
      return const Center(
        child: Text(
          'No language data available',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    // Sort by bytes and take top 5
    final sorted = languages.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topLanguages = sorted.take(5).toList();

    final total = languages.values.reduce((a, b) => a + b);

    return ListView.builder(
      itemCount: topLanguages.length,
      itemBuilder: (context, index) {
        final entry = topLanguages[index];
        final percentage = (entry.value / total * 100);

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    entry.key,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: percentage / 100,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getLanguageColor(entry.key),
                  ),
                  minHeight: 8,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _getLanguageColor(String language) {
    // Simple color mapping
    final colors = {
      'Dart': Colors.blue,
      'JavaScript': Colors.yellow,
      'TypeScript': Colors.blueAccent,
      'Python': Colors.blue,
      'Java': Colors.orange,
      'Kotlin': Colors.purple,
      'Swift': Colors.orange,
      'C#': Colors.green,
      'Go': Colors.cyan,
      'Rust': Colors.black,
      'C++': Colors.blue,
      'C': Colors.grey,
    };
    return colors[language] ?? Colors.indigo;
  }
}
