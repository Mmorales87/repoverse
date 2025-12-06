import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';
import '../../core/models/repository_data.dart';

/// Generates procedural planet spheres for repositories
class PlanetGenerator {
  static const double baseRadius = 0.5;
  static const double scaleFactor = 2.0;
  static const int segments = 32;

  /// Language color palette
  static final Map<String, int> _languageColors = {
    'Dart': 0x00D4AA,
    'JavaScript': 0xF7DF1E,
    'TypeScript': 0x3178C6,
    'Python': 0x3776AB,
    'Java': 0xED8B00,
    'Kotlin': 0x7F52FF,
    'Swift': 0xFA7343,
    'C#': 0x239120,
    'Go': 0x00ADD8,
    'Rust': 0x000000,
    'C++': 0x00599C,
    'C': 0xA8B9CC,
    'PHP': 0x777BB4,
    'Ruby': 0xCC342D,
    'HTML': 0xE34F26,
    'CSS': 0x1572B6,
    'SQL': 0x336791,
    'R': 0x276DC3,
    'Shell': 0x89E051,
    'YAML': 0xCB171E,
    'Solidity': 0xAA6746,
    'ShaderLab': 0x222C37,
    'Jupyter Notebook': 0xDA5B0B,
  };

  /// Generate a planet mesh for a repository
  JSObject generatePlanet(RepositoryData repository) {
    // Calculate radius based on commit count (logarithmic scale)
    final radius =
        baseRadius + math.log(repository.totalCommits + 1) * scaleFactor;
    final clampedRadius = radius.clamp(0.5, 15.0);

    // Create sphere geometry
    final geometry = SphereGeometry(clampedRadius, segments, segments);

    // Get color for primary language
    final primaryLanguage = repository.primaryLanguage ?? 'JavaScript';
    var colorHex =
        _languageColors[primaryLanguage] ?? _languageColors['JavaScript']!;
    
    // Ensure color is a proper 24-bit color (0xRRGGBB format)
    // Some colors might be shorter, so we ensure they're full 24-bit
    colorHex = colorHex & 0xFFFFFF; // Mask to ensure 24-bit

    // If this is a fork, make it more transparent and greyed out
    if (repository.isFork) {
      // Make forks grey and semi-transparent
      colorHex = 0x666666; // Grey color for forks
    }

    // Debug: Log the color being used
    final colorHexString = colorHex.toRadixString(16).toUpperCase().padLeft(6, '0');
    print('   [DEBUG] Planet "${repository.name}" - Language: $primaryLanguage, Color: 0x$colorHexString ($colorHex)${repository.isFork ? " [FORK]" : ""}');

    // Use MeshBasicMaterial for pure color visibility (no lighting calculations)
    // This ensures colors are always visible regardless of lighting
    final material = MeshBasicMaterial(
      ({
        'color': colorHex, // Three.js accepts hex numbers directly (0xRRGGBB format)
        if (repository.isFork) 'transparent': true,
        if (repository.isFork) 'opacity': 0.5, // Semi-transparent for forks
      } as Map<String, dynamic>) as JSAny?,
    );

    // Create mesh
    final planet = Mesh(geometry, material);

    // Set initial position (will be set by orbit generator)
    // Use bridge helper - position is read-only in Three.js
    setObjectPosition(planet as JSAny, 0.0, 0.0, 0.0);

    return planet;
  }

  /// Get color for a language
  static int getLanguageColor(String language) {
    return _languageColors[language] ?? _languageColors['JavaScript']!;
  }
}
