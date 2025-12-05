import 'dart:js_interop';
import 'dart:math' as math;
import '../three_js_bindings.dart';

/// Manages star flickering effect by animating star opacity
class StarFlicker {
  JSObject? _stars;
  bool _isActive = false;

  /// Initialize flicker effect for a starfield
  void initialize(JSObject stars) {
    _stars = stars;

    // Initialize random opacities for each star
    // We'll use a simplified approach - animate overall opacity
    // In a full implementation, you'd animate individual star opacities
    _isActive = true;
  }

  /// Update star flicker animation
  void update(double deltaTime) {
    if (!_isActive || _stars == null) return;

    // Animate overall opacity with slight variation
    final time = DateTime.now().millisecondsSinceEpoch / 1000.0;
    final baseOpacity = 0.7;
    final flickerAmount = 0.1;
    final opacity =
        baseOpacity +
        math.sin(time * 2.0) * flickerAmount +
        math.sin(time * 3.7) * flickerAmount * 0.5;

    // Update material opacity
    final material = PointsExtension(_stars!).material;
    // opacity is a double, not JSObject - set it directly
    MaterialExtension(material).opacity = opacity;
  }

  /// Stop flicker effect
  void stop() {
    _isActive = false;
  }

  /// Dispose of the flicker effect
  void dispose() {
    stop();
    _stars = null;
  }
}
