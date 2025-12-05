import 'dart:html' as html;
import 'dart:js_interop';
import 'dart:math' as math;
import 'three_js_bindings.dart';

/// Orbital camera controller with inertia and damping
class CameraController {
  JSObject? _camera;
  html.CanvasElement? _canvas;

  // Camera parameters
  double _fov = 75.0;
  double _near = 0.1;
  double _far = 10000.0;
  double _initialDistance = 50.0;

  // Control parameters
  double _minDistance = 10.0;
  double _maxDistance = 500.0;
  double _minPolarAngle = 0.1; // Limit vertical angle (2.5D style)
  double _maxPolarAngle = 1.4; // ~80 degrees

  /// Initialize the camera
  /// Ensures Three.js is loaded before creating the camera
  Future<void> initialize(html.CanvasElement canvas) async {
    await ensureThreeLoaded();
    _canvas = canvas;

    // Create perspective camera
    final aspect = canvas.width! / canvas.height!;
    _camera = PerspectiveCamera(_fov, aspect, _near, _far);

    // Validate camera was created
    if (_camera == null) {
      throw Exception('Failed to create camera - PerspectiveCamera returned null');
    }

    // Set initial camera position (orbital style) using safe bridge helper
    setCameraPosition(_camera! as JSAny, 0.0, 30.0, _initialDistance);

    // Look at origin using safe bridge helper
    cameraLookAt(_camera! as JSAny, 0.0, 0.0, 0.0);

    // Try to initialize OrbitControls if available
    _initializeControls();
  }

  void _initializeControls() {
    if (_camera == null || _canvas == null) return;

    try {
      // Check if OrbitControls is available (from CDN extension)
      // For now, we'll implement basic controls manually
      // In a full implementation, you'd load OrbitControls.js from CDN
      _setupManualControls();
    } catch (e) {
      // Fallback to manual controls
      _setupManualControls();
    }
  }

  void _setupManualControls() {
    // Manual orbital controls implementation
    // This is a simplified version - full implementation would handle
    // mouse/touch events for rotation, zoom, and pan
    _setupMouseControls();
  }

  void _setupMouseControls() {
    if (_canvas == null) return;

    bool _isDragging = false;
    double _lastMouseX = 0;
    double _lastMouseY = 0;
    double _sphericalTheta = 0.0; // Horizontal angle
    double _sphericalPhi = 1.0; // Vertical angle (limited)
    double _sphericalRadius = _initialDistance;

    _canvas!.onMouseDown.listen((event) {
      _isDragging = true;
      _lastMouseX = event.client.x.toDouble();
      _lastMouseY = event.client.y.toDouble();
    });

    html.document.onMouseUp.listen((event) {
      _isDragging = false;
    });

    html.document.onMouseMove.listen((event) {
      if (!_isDragging || _camera == null) return;

      final deltaX = event.client.x.toDouble() - _lastMouseX;
      final deltaY = event.client.y.toDouble() - _lastMouseY;

      _sphericalTheta -= deltaX * 0.01;
      _sphericalPhi += deltaY * 0.01;

      // Limit vertical angle (2.5D style)
      _sphericalPhi = _sphericalPhi.clamp(_minPolarAngle, _maxPolarAngle);

      // Update camera position (spherical coordinates)
      final x =
          _sphericalRadius *
          math.sin(_sphericalPhi) *
          math.cos(_sphericalTheta);
      final y = _sphericalRadius * math.cos(_sphericalPhi);
      final z =
          _sphericalRadius *
          math.sin(_sphericalPhi) *
          math.sin(_sphericalTheta);

      // Update position using safe bridge helper
      setCameraPosition(_camera! as JSAny, x, y, z);

      // Look at origin using safe bridge helper
      cameraLookAt(_camera! as JSAny, 0.0, 0.0, 0.0);

      _lastMouseX = event.client.x.toDouble();
      _lastMouseY = event.client.y.toDouble();
    });

    // Zoom with mouse wheel
    _canvas!.onWheel.listen((event) {
      if (_camera == null) return;

      final delta = event.deltaY > 0 ? 1.1 : 0.9;
      _sphericalRadius *= delta;
      _sphericalRadius = _sphericalRadius.clamp(_minDistance, _maxDistance);

      // Update camera position (spherical coordinates)
      final x =
          _sphericalRadius *
          math.sin(_sphericalPhi) *
          math.cos(_sphericalTheta);
      final y = _sphericalRadius * math.cos(_sphericalPhi);
      final z =
          _sphericalRadius *
          math.sin(_sphericalPhi) *
          math.sin(_sphericalTheta);

      // Update position using safe bridge helper
      setCameraPosition(_camera! as JSAny, x, y, z);
    });
  }

  /// Reset camera to initial position
  void reset() {
    if (_camera == null) return;

    // Update position using safe bridge helper
    setCameraPosition(_camera! as JSAny, 0.0, 30.0, _initialDistance);

    // Look at origin using safe bridge helper
    cameraLookAt(_camera! as JSAny, 0.0, 0.0, 0.0);
  }

  /// Update camera aspect ratio (call on window resize)
  void updateAspect(double aspect) {
    if (_camera == null) return;
    // Use safe bridge helper instead of extension
    setCameraAspect(_camera! as JSAny, aspect);
  }

  /// Get the camera JS object
  JSObject? get camera => _camera;

  /// Dispose of the camera controller
  void dispose() {
    _camera = null;
    _canvas = null;
  }
}
