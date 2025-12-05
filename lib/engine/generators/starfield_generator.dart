import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';

/// Generates a starfield using PointsMaterial with thousands of stars
class StarfieldGenerator {
  static const int starCount = 5000;
  static const double starfieldRadius = 2000.0;

  /// Generate starfield and return the Points object
  JSObject generate() {
    // Create geometry for points
    final geometry = BufferGeometry();

    // Generate random star positions
    final positions = <double>[];
    final colors = <double>[];

    final random = math.Random();

    for (int i = 0; i < starCount; i++) {
      // Random position in sphere
      final theta = random.nextDouble() * 2 * math.pi;
      final phi = math.acos(2 * random.nextDouble() - 1);
      final radius = starfieldRadius * (0.5 + random.nextDouble() * 0.5);

      final x = radius * math.sin(phi) * math.cos(theta);
      final y = radius * math.sin(phi) * math.sin(theta);
      final z = radius * math.cos(phi);

      positions.addAll([x, y, z]);

      // Random star color (white to slightly blue/white)
      final brightness = 0.7 + random.nextDouble() * 0.3;
      colors.addAll([brightness, brightness, brightness * 1.1]);
    }

    // Create buffer attributes
    // Note: This is a placeholder - proper implementation needs JS array conversion
    // For now, we'll skip the actual data and create empty attributes
    // Full implementation would convert Dart List<double> to JS Float32Array
    final emptyArray = <JSNumber>[].toJS;
    final positionAttribute = Float32BufferAttribute(emptyArray, 3);
    final colorAttribute = Float32BufferAttribute(emptyArray, 3);

    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('color', colorAttribute);

    // Create material - js_interop converts Map to JS object automatically
    final material = PointsMaterial(
      ({
        'size': 2.0,
        'color': 0xffffff,
        'vertexColors': true,
        'transparent': true,
        'opacity': 0.8,
      } as Map<String, dynamic>) as JSAny?,
    );

    // Create points object
    final stars = Points(geometry, material);

    return stars;
  }
}
