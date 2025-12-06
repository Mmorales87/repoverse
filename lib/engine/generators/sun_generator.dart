import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';

/// Generates a Sun object at the center of the system
/// Represents the user/organization with visual effects
class SunGenerator {
  static const double baseRadius = 3.0;
  static const int segments = 64;

  /// Generate the Sun mesh with glowing effect
  JSObject generateSun() {
    // Create sphere geometry for the sun
    final geometry = SphereGeometry(baseRadius, segments, segments);

    // Use bright yellow/orange color for the sun
    final sunColor = 0xFFD700; // Gold color

    print('   [DEBUG] Sun - Color: 0x${sunColor.toRadixString(16).toUpperCase()}');

    // Use MeshBasicMaterial for pure color visibility (no lighting calculations)
    // MeshBasicMaterial doesn't support emissive, so we just use the color directly
    final material = MeshBasicMaterial(
      ({
        'color': sunColor, // Gold color - will be visible without lighting
      } as Map<String, dynamic>) as JSAny?,
    );

    // Create sun mesh
    final sun = Mesh(geometry, material);

    // Position at origin (center of system)
    setObjectPosition(sun as JSAny, 0.0, 0.0, 0.0);

    return sun;
  }

  /// Generate halo/glow effect around the sun
  JSObject generateHalo() {
    // Create a larger, transparent sphere for the halo
    final haloRadius = baseRadius * 2.5;
    final geometry = SphereGeometry(haloRadius, segments, segments);

    // Use yellow with transparency for halo
    final haloColor = 0xFFD700;

    final material = MeshBasicMaterial(
      ({
        'color': haloColor,
        'transparent': true,
        'opacity': 0.3, // Semi-transparent
        'side': 2, // DoubleSide
      } as Map<String, dynamic>) as JSAny?,
    );

    final halo = Mesh(geometry, material);
    setObjectPosition(halo as JSAny, 0.0, 0.0, 0.0);

    return halo;
  }

  /// Generate particles that radiate from the sun
  List<JSObject> generateParticles({int count = 20}) {
    final particles = <JSObject>[];
    final particlePositions = <double>[];
    final particleColors = <double>[];

    final sunColor = 0xFFD700;
    final r = ((sunColor >> 16) & 0xFF) / 255.0;
    final g = ((sunColor >> 8) & 0xFF) / 255.0;
    final b = (sunColor & 0xFF) / 255.0;

    for (int i = 0; i < count; i++) {
      // Random position around sun
      final angle = (i / count) * 2 * math.pi;
      final distance = baseRadius * 1.5 + (i % 3) * 0.5;
      final height = (math.Random(i).nextDouble() - 0.5) * 2.0;

      final x = distance * math.cos(angle);
      final y = height;
      final z = distance * math.sin(angle);

      particlePositions.add(x);
      particlePositions.add(y);
      particlePositions.add(z);

      // Color for each particle
      particleColors.add(r);
      particleColors.add(g);
      particleColors.add(b);
    }

    // Create buffer geometry for particles
    final geometry = BufferGeometry();
    geometry.setAttribute(
      'position',
      Float32BufferAttribute(particlePositions as JSAny, 3),
    );
    geometry.setAttribute(
      'color',
      Float32BufferAttribute(particleColors as JSAny, 3),
    );

    // Create points material
    final material = PointsMaterial(
      ({
        'size': 0.3,
        'vertexColors': true,
        'transparent': true,
        'opacity': 0.8,
      } as Map<String, dynamic>) as JSAny?,
    );

    final points = Points(geometry, material);
    setObjectPosition(points as JSAny, 0.0, 0.0, 0.0);

    particles.add(points);
    return particles;
  }
}

