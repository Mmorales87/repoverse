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
    final colorHex =
        _languageColors[primaryLanguage] ?? _languageColors['JavaScript']!;

    // Create material with language color - brighter and more visible
    final material = MeshStandardMaterial(
      ({
        'color': colorHex,
        'emissive': colorHex,
        'emissiveIntensity': 0.5, // Increased for better visibility
        'roughness': 0.5,
        'metalness': 0.5,
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
