import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';

/// Generates orbit rings (TorusGeometry) for repositories
class OrbitGenerator {
  static const double baseRadius = 15.0; // Increased to prevent collisions
  static const double radiusIncrement = 12.0; // Increased spacing between orbits
  static const double tubeRadius = 0.1;
  static const int radialSegments = 64;
  static const int tubularSegments = 32;

  /// Generate an orbit ring for a repository at a specific index
  JSObject generateOrbit(int index, {double? customRadius}) {
    final radius = customRadius ?? (baseRadius + index * radiusIncrement);

    // Create torus geometry
    final geometry = TorusGeometry(
      radius,
      tubeRadius,
      radialSegments,
      tubularSegments,
    );

    // Create VERY subtle orbit lines (almost invisible)
    final material = MeshBasicMaterial(
      ({
        'color': 0x444466, // Very dark blue/purple - very subtle
        'transparent': true,
        'opacity': 0.08, // VERY subtle - almost invisible
        'side': 2, // DoubleSide
      } as Map<String, dynamic>) as JSAny?,
    );

    // Create mesh
    final orbit = Mesh(geometry, material);

    // Rotate to be horizontal (XY plane) - use bridge helper (rotation is read-only)
    setObjectRotation(orbit as JSAny, math.pi / 2, 0, 0);

    return orbit;
  }

  /// Calculate orbit radius for a repository index
  static double calculateOrbitRadius(int index) {
    return baseRadius + index * radiusIncrement;
  }

  /// Calculate planet position on orbit
  static JSObject calculatePlanetPosition(int index, double angle) {
    final radius = calculateOrbitRadius(index);
    final x = radius * math.cos(angle);
    final z = radius * math.sin(angle);
    return Vector3(x, 0, z);
  }
}
