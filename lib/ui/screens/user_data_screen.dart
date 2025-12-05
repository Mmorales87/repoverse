import 'package:flutter/material.dart';
import '../../core/models/repository_data.dart';

/// Screen that displays user data before loading the 3D universe
class UserDataScreen extends StatelessWidget {
  final List<RepositoryData> repositories;
  final Map<String, dynamic> stats;
  final VoidCallback onEnterUniverse;

  const UserDataScreen({
    super.key,
    required this.repositories,
    required this.stats,
    required this.onEnterUniverse,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Your Git Universe',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Stats Cards
              _buildStatsSection(),
              const SizedBox(height: 32),

              // Repositories List
              _buildRepositoriesSection(),
              const SizedBox(height: 32),

              // Enter Universe Button
              Center(
                child: ElevatedButton.icon(
                  onPressed: onEnterUniverse,
                  icon: const Icon(Icons.rocket_launch),
                  label: const Text(
                    'Enter 3D Universe',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 48,
                      vertical: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Statistics',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _buildStatCard(
              'Total Repos',
              '${repositories.length}',
              Icons.folder,
              Colors.blue,
            ),
            _buildStatCard(
              'Total Commits',
              '${stats['totalCommits'] ?? 0}',
              Icons.commit,
              Colors.green,
            ),
            _buildStatCard(
              'Total Stars',
              '${stats['totalStars'] ?? 0}',
              Icons.star,
              Colors.amber,
            ),
            _buildStatCard(
              'Total Forks',
              '${stats['totalForks'] ?? 0}',
              Icons.call_split,
              Colors.purple,
            ),
            _buildStatCard(
              'Languages',
              '${stats['uniqueLanguages']?.length ?? 0}',
              Icons.code,
              Colors.orange,
            ),
            _buildStatCard(
              'Activity Score',
              '${(stats['averageActivityScore'] ?? 0.0).toStringAsFixed(1)}',
              Icons.trending_up,
              Colors.red,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRepositoriesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Repositories',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        ...repositories.take(20).map((repo) => _buildRepoCard(repo)),
        if (repositories.length > 20)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              '... and ${repositories.length - 20} more repositories',
              style: const TextStyle(color: Colors.grey),
            ),
          ),
      ],
    );
  }

  Widget _buildRepoCard(RepositoryData repo) {
    final primaryLang = repo.primaryLanguage ?? 'Unknown';
    final langPercentages = repo.languagePercentages;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[800]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  repo.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: repo.source == 'github' 
                      ? Colors.purple.withOpacity(0.3)
                      : Colors.blue.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  repo.source.toUpperCase(),
                  style: TextStyle(
                    color: repo.source == 'github' ? Colors.purple : Colors.blue,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (repo.description != null && repo.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              repo.description!,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _buildRepoStat(Icons.commit, '${repo.totalCommits}', Colors.green),
              const SizedBox(width: 16),
              _buildRepoStat(Icons.star, '${repo.stars}', Colors.amber),
              const SizedBox(width: 16),
              _buildRepoStat(Icons.call_split, '${repo.forks}', Colors.purple),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.indigo.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  primaryLang,
                  style: const TextStyle(
                    color: Colors.indigo,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (langPercentages.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: langPercentages.entries.take(3).map((entry) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '${entry.key} ${entry.value.toStringAsFixed(1)}%',
                    style: const TextStyle(color: Colors.grey, fontSize: 10),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRepoStat(IconData icon, String value, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

