import 'package:flutter/material.dart';
import '../../core/models/repository_data.dart';
import 'share_card_widget.dart';
import '../services/share_card_service.dart';

/// HUD overlay with stats, share button, and camera reset
class HUDOverlay extends StatelessWidget {
  final Map<String, dynamic> stats;
  final List<RepositoryData> repositories;
  final VoidCallback onResetCamera;

  const HUDOverlay({
    super.key,
    required this.stats,
    required this.repositories,
    required this.onResetCamera,
  });

  @override
  Widget build(BuildContext context) {
    // Flutter widgets are automatically rendered above HTML canvas
    // Use Material with high elevation to ensure HUD is above canvas
    // Stack only contains positioned elements, so empty areas allow events through
    return Material(
      type: MaterialType.transparency,
      elevation: 1000, // Very high elevation to ensure it's above canvas
      child: Stack(
        clipBehavior: Clip.none, // Allow widgets to overflow if needed
        children: [
        // Top-left: User info and stats
        Positioned(
          top: 16,
          left: 16,
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    '📊 Statistics',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildStatRow('Total Repos ', '${stats['totalRepos'] ?? 0}'),
                  _buildStatRow('Commits ', '${stats['totalCommits'] ?? 0}'),
                  _buildStatRow('Stars ', '${stats['totalStars'] ?? 0}'),
                  _buildStatRow('Forks ', '${stats['totalForks'] ?? 0}'),
                  if (stats['mostActiveRepo'] != null) ...[
                    const SizedBox(height: 8),
                    const Divider(color: Colors.white24),
                    const SizedBox(height: 8),
                    Text(
                      '⭐ Most Active: ${(stats['mostActiveRepo'] as RepositoryData).name}',
                      style: const TextStyle(
                        color: Colors.indigoAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        // Bottom-left: Legend - Always visible
        Positioned(
          bottom: 0,
          left: 0,
          child: SafeArea(
            child: Container(
              margin: const EdgeInsets.all(16),
              constraints: const BoxConstraints(maxWidth: 300),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    '🗺️ Legend',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildLegendItem(
                    '☀️ Golden Sphere',
                    'User/Organization (center)',
                  ),
                  _buildLegendItem(
                    '🟣 Colored Spheres',
                    'Repositories (color = language)',
                  ),
                  _buildLegendItem(
                    '🌙 Small Gray Spheres',
                    'Forks (moons orbiting planets)',
                  ),
                  _buildLegendItem(
                    '💍 Colored Rings',
                    'Branches (complexity, based on commits)',
                  ),
                  _buildLegendItem('✨ White Dots', 'Stars in the background'),
                  const SizedBox(height: 8),
                  const Text(
                    '💡 Tip: Left-click drag to rotate, scroll to zoom, right-click drag to pan',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        // Top-right: Share card button
        Positioned(
          top: 16,
          right: 16,
          child: SafeArea(
            child: ElevatedButton.icon(
              onPressed: () => _showShareCard(context),
              icon: const Icon(Icons.share),
              label: const Text('Share Card'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
        ),
        // Bottom-right: Camera reset button
        Positioned(
          bottom: 16,
          right: 16,
          child: SafeArea(
            child: FloatingActionButton(
              onPressed: onResetCamera,
              backgroundColor: Colors.indigo,
              child: const Icon(Icons.refresh),
            ),
          ),
        ),
      ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String icon, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Flexible(
            child: Tooltip(
              message: description,
              waitDuration: const Duration(milliseconds: 250),
              child: Text(
                description,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showShareCard(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: ShareCardWidget(
          stats: stats,
          repositories: repositories,
          onExport: () async {
            // Export share card
            final service = ShareCardService();
            await service.exportShareCard(context, stats, repositories);
            if (context.mounted) {
              Navigator.of(context).pop();
            }
          },
        ),
      ),
    );
  }
}
