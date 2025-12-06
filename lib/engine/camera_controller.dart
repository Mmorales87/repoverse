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

  // Spherical coordinates for camera control
  double _sphericalTheta = 0.0; // Horizontal angle
  double _sphericalPhi = 1.0; // Vertical angle (limited)
  double _sphericalRadius = 50.0;
  JSObject? _target; // Camera target for panning

  // Mouse control state
  bool _isDragging = false;
  bool _isRightClickDragging = false; // For panning
  double _lastMouseX = 0;
  double _lastMouseY = 0;

  /// Initialize the camera
  /// Ensures Three.js is loaded before creating the camera
  /// [systemSize] is the total size of the system (max orbit radius + planet radius + margin)
  /// This ensures the camera is positioned to see the entire system
  Future<void> initialize(html.CanvasElement canvas, {double systemSize = 200.0}) async {
    await ensureThreeLoaded();
    _canvas = canvas;

    // Calculate optimal camera distance based on actual system size
    // Camera should be far enough to see the entire system with good framing
    // Use 2.5x the system size for optimal viewing (increased from 1.8x)
    final calculatedDistance = systemSize * 2.5;
    _initialDistance = calculatedDistance.clamp(150.0, 1500.0); // Clamp between 150 and 1500
    _sphericalRadius = _initialDistance;
    
    print('   [DEBUG] Camera initialization:');
    print('      System size: $systemSize');
    print('      Calculated distance: $calculatedDistance');
    print('      Final distance: $_initialDistance');

    // Create perspective camera - ensure valid aspect ratio
    final canvasWidth = (canvas.width ?? 800).clamp(100, 10000);
    final canvasHeight = (canvas.height ?? 600).clamp(100, 10000);
    final aspect = canvasWidth / canvasHeight;
    _camera = PerspectiveCamera(_fov, aspect, _near, _far);

    // Validate camera was created
    if (_camera == null) {
      throw Exception('Failed to create camera - PerspectiveCamera returned null');
    }

    // Initialize spherical coordinates
    _sphericalTheta = 0.0;
    _sphericalPhi = 1.0;
    _target = Vector3(0, 0, 0);

    // Set initial camera position (orbital style) using safe bridge helper
    // Height scales with distance for better viewing angle
    // Use a higher angle to see more of the scene
    final cameraHeight = _initialDistance * 0.4; // Lower angle to see more planets
    setCameraPosition(_camera! as JSAny, 0.0, cameraHeight, _initialDistance);

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
    if (_canvas == null) {
      print('⚠️ [CAMERA] Cannot setup mouse controls: canvas is null');
      return;
    }
    
    final canvasId = _canvas!.id;
    print('✅ [CAMERA] Setting up mouse controls on canvas: ${canvasId.isNotEmpty ? canvasId : "no-id"}');

    // Reset state
    _isDragging = false;
    _isRightClickDragging = false;
    _lastMouseX = 0;
    _lastMouseY = 0;

    _canvas!.onMouseDown.listen((event) {
      print('🖱️ [CAMERA] Mouse down on canvas: button=${event.button}');
      event.preventDefault(); // Prevent default behavior
      event.stopPropagation(); // Prevent event from bubbling up
      
      if (event.button == 0) {
        // Left click - rotate
        _isDragging = true;
        print('   [CAMERA] Left click - starting drag');
      } else if (event.button == 2) {
        // Right click - pan (or two-finger click on Mac)
        _isRightClickDragging = true;
        print('   [CAMERA] Right click - starting pan');
      }
      _lastMouseX = event.client.x.toDouble();
      _lastMouseY = event.client.y.toDouble();
    });

    html.document.onMouseUp.listen((event) {
      _isDragging = false;
      _isRightClickDragging = false;
    });

    // Prevent context menu on right click - CRITICAL for pan to work
    _canvas!.onContextMenu.listen((event) {
      event.preventDefault();
      event.stopPropagation();
      print('🖱️ [CAMERA] Context menu prevented');
    });

    html.document.onMouseMove.listen((event) {
      if (_camera == null) return;
      
      if (!_isDragging && !_isRightClickDragging) return; // Only process if dragging

      final deltaX = event.client.x.toDouble() - _lastMouseX;
      final deltaY = event.client.y.toDouble() - _lastMouseY;

      if (_isDragging) {
        // Rotate camera around target
        _sphericalTheta -= deltaX * 0.01;
        _sphericalPhi += deltaY * 0.01;

        // Limit vertical angle (2.5D style)
        _sphericalPhi = _sphericalPhi.clamp(_minPolarAngle, _maxPolarAngle);

        // Update camera position (spherical coordinates)
        if (_target == null) {
          _target = Vector3(0, 0, 0);
        }
        final targetX = Vector3Extension(_target!).x;
        final targetY = Vector3Extension(_target!).y;
        final targetZ = Vector3Extension(_target!).z;

        final x = targetX +
            _sphericalRadius *
                math.sin(_sphericalPhi) *
                math.cos(_sphericalTheta);
        final y = targetY + _sphericalRadius * math.cos(_sphericalPhi);
        final z = targetZ +
            _sphericalRadius *
                math.sin(_sphericalPhi) *
                math.sin(_sphericalTheta);

        // Update position using safe bridge helper
        setCameraPosition(_camera! as JSAny, x, y, z);

        // Look at target using safe bridge helper
        cameraLookAt(_camera! as JSAny, targetX, targetY, targetZ);
      } else if (_isRightClickDragging) {
        // Pan camera (move target)
        if (_target == null) {
          _target = Vector3(0, 0, 0);
        }
        final panSpeed = _sphericalRadius * 0.001;
        final rightX = math.cos(_sphericalTheta);
        final rightZ = math.sin(_sphericalTheta);

        // Calculate pan direction
        final panX = -rightX * deltaX * panSpeed;
        final panY = deltaY * panSpeed;
        final panZ = -rightZ * deltaX * panSpeed;

        // Update target using bridge helper
        final currentTargetX = Vector3Extension(_target!).x;
        final currentTargetY = Vector3Extension(_target!).y;
        final currentTargetZ = Vector3Extension(_target!).z;
        _target = Vector3(
          currentTargetX + panX,
          currentTargetY + panY,
          currentTargetZ + panZ,
        );

        // Update camera position relative to new target
        final targetX = Vector3Extension(_target!).x;
        final targetY = Vector3Extension(_target!).y;
        final targetZ = Vector3Extension(_target!).z;

        final x = targetX +
            _sphericalRadius *
                math.sin(_sphericalPhi) *
                math.cos(_sphericalTheta);
        final y = targetY + _sphericalRadius * math.cos(_sphericalPhi);
        final z = targetZ +
            _sphericalRadius *
                math.sin(_sphericalPhi) *
                math.sin(_sphericalTheta);

        setCameraPosition(_camera! as JSAny, x, y, z);
        cameraLookAt(_camera! as JSAny, targetX, targetY, targetZ);
      }

      _lastMouseX = event.client.x.toDouble();
      _lastMouseY = event.client.y.toDouble();
    });

    // Zoom with mouse wheel
    _canvas!.onWheel.listen((event) {
      if (_camera == null) return;
      
      print('🖱️ [CAMERA] Mouse wheel: deltaY=${event.deltaY}');

      final delta = event.deltaY > 0 ? 1.1 : 0.9;
      event.preventDefault(); // Prevent page scroll
      event.stopPropagation(); // Prevent event from bubbling up
      _sphericalRadius *= delta;
      _sphericalRadius = _sphericalRadius.clamp(_minDistance, _maxDistance);

      // Update camera position relative to target
      if (_target == null) {
        _target = Vector3(0, 0, 0);
      }
      final targetX = Vector3Extension(_target!).x;
      final targetY = Vector3Extension(_target!).y;
      final targetZ = Vector3Extension(_target!).z;

      final x = targetX +
          _sphericalRadius *
              math.sin(_sphericalPhi) *
              math.cos(_sphericalTheta);
      final y = targetY + _sphericalRadius * math.cos(_sphericalPhi);
      final z = targetZ +
          _sphericalRadius *
              math.sin(_sphericalPhi) *
              math.sin(_sphericalTheta);

      // Update position using safe bridge helper
      setCameraPosition(_camera! as JSAny, x, y, z);
      cameraLookAt(_camera! as JSAny, targetX, targetY, targetZ);
    });
  }

  /// Reset camera to initial position
  void reset() {
    if (_camera == null) return;

    // Reset spherical coordinates
    _sphericalTheta = 0.0;
    _sphericalPhi = 1.0;
    _sphericalRadius = _initialDistance;
    _target = Vector3(0, 0, 0);

    // Update position using safe bridge helper (use calculated height)
    final cameraHeight = _initialDistance * 0.6;
    setCameraPosition(_camera! as JSAny, 0.0, cameraHeight, _initialDistance);

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
