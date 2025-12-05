import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';
import '../../core/models/repository_data.dart';
import 'planet_generator.dart';

/// Generates nebula effects (transparent planes/sprites) per language
class NebulaGenerator {
  static const double nebulaSize = 100.0;
  static const int segments = 32;

  /// Generate a nebula for a language group
  JSObject generateNebula(String language, int count) {
    // Create large plane geometry
    final geometry = PlaneGeometry(nebulaSize, nebulaSize);

    // Get language color with low opacity
    final colorHex = PlanetGenerator.getLanguageColor(language);

    // Create very transparent material with better visibility
    final material = MeshBasicMaterial(
      ({
        'color': colorHex,
        'transparent': true,
        'opacity': 0.15 + (count * 0.02).clamp(0.0, 0.3), // More visible
        'side': 2, // DoubleSide
      } as Map<String, dynamic>) as JSAny?,
    );

    // Create mesh
    final nebula = Mesh(geometry, material);

    // Random position in space
    final random = math.Random();
    final angle = random.nextDouble() * 2 * math.pi;
    final distance = 50.0 + random.nextDouble() * 100.0;
    final height = -20.0 + random.nextDouble() * 40.0;

    final x = distance * math.cos(angle);
    final z = distance * math.sin(angle);

    // Use bridge helper - position is read-only in Three.js
    setObjectPosition(nebula as JSAny, x, height, z);

    // Random rotation - use bridge helper (rotation is read-only)
    setObjectRotation(
      nebula as JSAny,
      random.nextDouble() * math.pi,
      random.nextDouble() * math.pi,
      random.nextDouble() * math.pi,
    );

    return nebula;
  }

  /// Generate nebulas for all languages in repositories
  List<JSObject> generateNebulasForLanguages(
    List<RepositoryData> repositories,
  ) {
    // Group repositories by primary language
    final languageGroups = <String, int>{};
    for (final repo in repositories) {
      final lang = repo.primaryLanguage;
      if (lang != null) {
        languageGroups[lang] = (languageGroups[lang] ?? 0) + 1;
      }
    }

    // Generate one nebula per language
    final nebulas = <JSObject>[];
    for (final entry in languageGroups.entries) {
      nebulas.add(generateNebula(entry.key, entry.value));
    }

    return nebulas;
  }
}
