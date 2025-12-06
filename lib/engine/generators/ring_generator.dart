import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';
import '../../core/models/repository_data.dart';
import 'planet_generator.dart';

/// Generates ring objects (TorusGeometry) to represent branches/complexity
/// Uses commit count as a proxy for branches
class RingGenerator {
  static const double baseRadius = 0.8;
  static const double maxRadius = 2.5;
  static const double tubeRadius = 0.05;
  static const int radialSegments = 64;
  static const int tubularSegments = 32;

  /// Generate rings for a repository based on commit count (proxy for branches)
  /// Returns a list of ring meshes positioned around the planet
  List<JSObject> generateRings(RepositoryData repository) {
    final rings = <JSObject>[];
    
    // Use commit count as proxy for branches (more commits = more branches)
    // Calculate number of rings (1-3 rings based on commit count)
    final commitCount = repository.totalCommits;
    int ringCount = 1;
    if (commitCount > 500) ringCount = 2;
    if (commitCount > 2000) ringCount = 3;

    // Get planet color (use same color as planet but more transparent)
    final primaryLanguage = repository.primaryLanguage ?? 'JavaScript';
    final colorHex = PlanetGenerator.getLanguageColor(primaryLanguage);
    
    // Make color lighter/more transparent for rings
    final ringColor = colorHex;

    for (int i = 0; i < ringCount; i++) {
      // Calculate ring radius (increases with each ring)
      final ringRadius = baseRadius + (maxRadius - baseRadius) * (i / ringCount);
      
      // Create torus geometry
      final geometry = TorusGeometry(
        ringRadius,
        tubeRadius,
        radialSegments,
        tubularSegments,
      );

      // Create semi-transparent material with planet color
      final material = MeshBasicMaterial(
        ({
          'color': ringColor,
          'transparent': true,
          'opacity': 0.4, // Semi-transparent
          'side': 2, // DoubleSide
        } as Map<String, dynamic>) as JSAny?,
      );

      // Create mesh
      final ring = Mesh(geometry, material);

      // Rotate to be horizontal (XY plane) - use bridge helper
      // Each ring can have a slight tilt for visual interest
      final tiltAngle = (i * 0.2) * math.pi / 2; // Slight tilt variation
      setObjectRotation(ring as JSAny, math.pi / 2 + tiltAngle, 0, 0);

      rings.add(ring);
    }

    return rings;
  }
}

