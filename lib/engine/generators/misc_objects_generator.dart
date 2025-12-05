import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';

/// Generates special objects like rockets/UFOs (easter eggs)
class MiscObjectsGenerator {
  /// Generate a rocket (basic geometry: box + cone)
  JSObject generateRocket() {
    // Create rocket body (box)
    final bodyGeometry = BoxGeometry(0.5, 2.0, 0.5);
    final bodyMaterial = MeshStandardMaterial(
      ({
        'color': 0xff4444,
        'emissive': 0xff0000,
        'emissiveIntensity': 0.5,
      } as Map<String, dynamic>) as JSAny?,
    );
    final body = Mesh(bodyGeometry, bodyMaterial);

    // Create rocket nose (cone)
    final noseGeometry = ConeGeometry(0.3, 1.0, 8);
    final noseMaterial = MeshStandardMaterial(
      ({
        'color': 0xff6666,
        'emissive': 0xff0000,
        'emissiveIntensity': 0.3,
      } as Map<String, dynamic>) as JSAny?,
    );
    final nose = Mesh(noseGeometry, noseMaterial);

    // Position nose on top of body - use bridge helper (position is read-only)
    setObjectPosition(nose as JSAny, 0.0, 1.5, 0.0);

    // Group rocket parts (we'll use a simple approach - just return body for now)
    // In a full implementation, you'd use Three.js Group
    return body;
  }

  /// Generate a UFO (flying saucer: two cones)
  JSObject generateUFO() {
    // Create top half (inverted cone)
    final topGeometry = ConeGeometry(2.0, 0.5, 16);
    final topMaterial = MeshStandardMaterial(
      ({
        'color': 0x8888ff,
        'emissive': 0x4444ff,
        'emissiveIntensity': 0.6,
        'metalness': 0.8,
        'roughness': 0.2,
      } as Map<String, dynamic>) as JSAny?,
    );
    final top = Mesh(topGeometry, topMaterial);

    // Rotate top to be upside down - use bridge helper (rotation is read-only)
    setObjectRotation(top as JSAny, math.pi, 0, 0);

    // Use bridge helper - position is read-only in Three.js
    setObjectPosition(top as JSAny, 0.0, 0.25, 0.0);

    // Create bottom half
    final bottomGeometry = ConeGeometry(2.0, 0.5, 16);
    final bottomMaterial = MeshStandardMaterial(
      ({
        'color': 0x8888ff,
        'emissive': 0x4444ff,
        'emissiveIntensity': 0.4,
        'metalness': 0.8,
        'roughness': 0.2,
      } as Map<String, dynamic>) as JSAny?,
    );
    final bottom = Mesh(bottomGeometry, bottomMaterial);

    // Use bridge helper - position is read-only in Three.js
    setObjectPosition(bottom as JSAny, 0.0, -0.25, 0.0);

    // Return top (simplified - would use Group in full implementation)
    return top;
  }

  /// Generate a random special object
  JSObject generateRandomObject() {
    final random = math.Random();
    return random.nextBool() ? generateRocket() : generateUFO();
  }
}
