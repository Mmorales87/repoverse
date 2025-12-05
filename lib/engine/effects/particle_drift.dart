import 'dart:js_interop';
import '../three_js_bindings.dart';

/// Manages slow particle drift for starfield
class ParticleDrift {
  JSObject? _starfield;
  double _driftX = 0.0;
  double _driftY = 0.0;
  double _driftZ = 0.0;
  bool _isActive = false;

  /// Initialize drift effect for starfield
  void initialize(JSObject starfield) {
    _starfield = starfield;
    _isActive = true;
  }

  /// Update particle drift animation
  void update(double deltaTime) {
    if (!_isActive || _starfield == null) return;

    // Slow drift movement
    _driftX += 0.0001 * deltaTime;
    _driftY += 0.00005 * deltaTime;
    _driftZ += 0.00008 * deltaTime;

    // Update starfield position - use bridge helper (position is read-only)
    setObjectPosition(_starfield! as JSAny, _driftX, _driftY, _driftZ);
  }

  /// Stop drift effect
  void stop() {
    _isActive = false;
  }

  /// Reset drift position
  void reset() {
    _driftX = 0.0;
    _driftY = 0.0;
    _driftZ = 0.0;
  }

  /// Dispose of the drift effect
  void dispose() {
    stop();
    reset();
    _starfield = null;
  }
}
