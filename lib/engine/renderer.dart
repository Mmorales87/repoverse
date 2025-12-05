import 'dart:html' as html;
import 'dart:js_interop';
import 'three_js_bindings.dart';

/// Main WebGL renderer for Three.js scene
class ThreeJSRenderer {
  JSAny? _renderer;
  JSAny? _scene;
  JSAny? _camera;
  html.CanvasElement? _canvas;
  int? _animationFrameId;
  bool _isRendering = false;

  /// Initialize the renderer with a canvas element
  /// Ensures Three.js is loaded before creating the renderer
  Future<void> initialize(html.CanvasElement canvas) async {
    await ensureThreeLoaded();
    _canvas = canvas;

    // Create WebGL renderer with canvas element
    // Use dynamic to avoid type checking issues during assignment
    final rendererValue = WebGLRendererWithCanvas(canvas) as dynamic;
    _renderer = rendererValue as JSAny?;

    // Set pixel ratio for high DPI displays
    final pixelRatio = html.window.devicePixelRatio.toDouble();
    // Pass JSAny directly to helper function
    rendererSetPixelRatio(rendererValue as JSAny, pixelRatio);

    // Set initial size
    _updateSize();

    // Listen for window resize
    html.window.onResize.listen((_) {
      _updateSize();
    });
  }

  void _updateSize() {
    if (_canvas == null || _renderer == null) return;

    final width = _canvas!.width!.toDouble();
    final height = _canvas!.height!.toDouble();

    rendererSetSize(_renderer!, width, height);

    // Update camera aspect ratio if camera exists
    if (_camera != null) {
      (_camera! as JSObject).aspect = width / height;
    }
  }

  /// Set the scene to render
  void setScene(JSObject scene) {
    _scene = scene as JSAny;
  }

  /// Set the camera to use
  void setCamera(JSObject camera) {
    _camera = camera as JSAny;
    _updateSize(); // Update aspect ratio
  }

  /// Start the render loop
  void startRendering() {
    if (_isRendering ||
        _renderer == null ||
        _scene == null ||
        _camera == null) {
      return;
    }

    _isRendering = true;
    _renderLoop();
  }

  /// Stop the render loop
  void stopRendering() {
    _isRendering = false;
    if (_animationFrameId != null) {
      html.window.cancelAnimationFrame(_animationFrameId!);
      _animationFrameId = null;
    }
  }

  void _renderLoop() {
    if (!_isRendering ||
        _renderer == null ||
        _scene == null ||
        _camera == null) {
      return;
    }

    // Render the scene
    rendererRender(_renderer!, _scene!, _camera!);

    // Request next frame
    _animationFrameId = html.window.requestAnimationFrame((_) {
      _renderLoop();
    });
  }

  /// Render a single frame (for manual control)
  void renderFrame() {
    if (_renderer == null || _scene == null || _camera == null) return;
    rendererRender(_renderer!, _scene!, _camera!);
  }

  /// Get the renderer JS object
  JSAny? get renderer => _renderer;

  /// Dispose of the renderer
  void dispose() {
    stopRendering();
    _renderer = null;
    _scene = null;
    _camera = null;
    _canvas = null;
  }
}
