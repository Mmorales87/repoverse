import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';
import '../../core/models/repository_data.dart';

/// Generates moon objects (small spheres) to represent forks
class MoonGenerator {
  static const double baseRadius = 0.15;
  static const double maxRadius = 0.5;
  static const int segments = 16;
  static const double baseOrbitRadius = 2.0;
  static const double maxOrbitRadius = 5.0;

  /// Generate moons for a repository based on fork count
  /// Returns a list of moon meshes positioned around the planet
  List<JSObject> generateMoons(RepositoryData repository, JSObject planet) {
    final moons = <JSObject>[];
    final forkCount = repository.forks.clamp(0, 10); // Limit to 10 moons max for performance

    if (forkCount == 0) return moons;

    // Get planet color from material (use a lighter version for moons)
    // For now, use a neutral gray color for moons
    final moonColor = 0x888888;

    for (int i = 0; i < forkCount; i++) {
      // Calculate moon size (smaller moons for higher fork counts)
      final moonRadius = baseRadius + (maxRadius - baseRadius) * (1.0 / forkCount);
      
      // Create sphere geometry for moon
      final geometry = SphereGeometry(moonRadius, segments, segments);

      // Create material (lighter version of planet color)
      final material = MeshBasicMaterial(
        ({
          'color': moonColor,
          'emissive': moonColor,
          'emissiveIntensity': 0.5,
        } as Map<String, dynamic>) as JSAny?,
      );

      // Create moon mesh
      final moon = Mesh(geometry, material);

      // Calculate orbit radius (distance from planet)
      final orbitRadius = baseOrbitRadius + (maxOrbitRadius - baseOrbitRadius) * (i / forkCount);
      
      // Calculate angle around planet (distribute evenly)
      final angle = (i / forkCount) * 2 * math.pi;
      
      // Initial position will be set by animation loop
      // For now, position at orbit radius
      final x = orbitRadius * math.cos(angle);
      final y = orbitRadius * math.sin(angle);
      final z = 0.0; // Start in XY plane
      
      setObjectPosition(moon as JSAny, x, y, z);

      moons.add(moon);
    }

    return moons;
  }
}

