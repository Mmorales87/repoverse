import 'dart:js_interop';
import 'dart:html' as html;

/// JS interop bindings for Three.js
/// These bindings use the three_bridge.js wrapper functions to properly
/// instantiate Three.js ES6 classes using the 'new' keyword.

// External functions for bridge JS functions (available on window object)
@JS('ensureThree')
external bool _ensureThree();

@JS('createScene')
external JSObject _createScene();

@JS('createPerspectiveCamera')
external JSObject _createPerspectiveCamera(double fov, double aspect, double near, double far);

@JS('createWebGLRenderer')
external JSObject _createWebGLRenderer(JSObject? opts);

@JS('createWebGLRendererWithCanvas')
external JSAny _createWebGLRendererWithCanvas(JSAny? canvas);

@JS('createVector3')
external JSObject _createVector3(double x, double y, double z);

@JS('createColor')
external JSObject _createColor(JSAny? color);

@JS('createSphereGeometry')
external JSObject _createSphereGeometry(double radius, int widthSegments, int heightSegments);

@JS('createTorusGeometry')
external JSObject _createTorusGeometry(double radius, double tube, int radialSegments, int tubularSegments);

@JS('createPlaneGeometry')
external JSObject _createPlaneGeometry(double width, double height);

@JS('createBoxGeometry')
external JSObject _createBoxGeometry(double width, double height, double depth);

@JS('createConeGeometry')
external JSObject _createConeGeometry(double radius, double height, int radialSegments);

@JS('createBufferGeometry')
external JSObject _createBufferGeometry();

@JS('createMeshStandardMaterial')
external JSObject _createMeshStandardMaterial(JSAny? parameters);

@JS('createMeshBasicMaterial')
external JSObject _createMeshBasicMaterial(JSAny? parameters);

@JS('createPointsMaterial')
external JSObject _createPointsMaterial(JSAny? parameters);

@JS('createMesh')
external JSObject _createMesh(JSObject geometry, JSObject material);

@JS('createPoints')
external JSObject _createPoints(JSAny positionsArray, double size, JSAny color);

@JS('createAmbientLight')
external JSObject _createAmbientLight(JSAny? color, double? intensity);

@JS('createDirectionalLight')
external JSObject _createDirectionalLight(JSAny? color, double? intensity);

@JS('createFloat32BufferAttribute')
external JSObject _createFloat32BufferAttribute(JSAny array, int itemSize);

@JS('createClock')
external JSObject _createClock();

@JS('disposeObject')
external void _disposeObject(JSObject object);

@JS('loadGLTF')
external JSObject _loadGLTF(String url);

/// Ensure Three.js is loaded and ready
/// Returns a Future that resolves when THREE.js is available
/// Waits explicitly for ensureThree function to exist on window before calling it
Future<void> ensureThreeLoaded() async {
  const int maxAttempts = 20;
  const int delayMs = 250;
  
  // Wait for ensureThree function to exist on window
  for (int attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to access the function - if it doesn't exist, this will throw
      // We use a try-catch to handle the case where the function doesn't exist yet
      final isAvailable = _ensureThree();
      if (isAvailable) {
        print('✅ [DEBUG] THREE.js is loaded and ready (attempt $attempt/$maxAttempts)');
        print('   [DEBUG] Verifying bridge helper functions...');
        // Give a small delay to ensure all bridge functions are registered
        await Future.delayed(const Duration(milliseconds: 50));
        return;
      }
    } catch (e) {
      // Function doesn't exist yet or THREE.js not loaded
      if (attempt < maxAttempts) {
        print('⏳ [DEBUG] Waiting for Three.js bridge... attempt $attempt/$maxAttempts');
        await Future.delayed(Duration(milliseconds: delayMs));
        continue;
      } else {
        // Max attempts reached
        print('❌ [DEBUG] ensureThreeLoaded failed after $maxAttempts attempts: $e');
        throw Exception(
          'THREE.js failed to load. Make sure Three.js and three_bridge.js are loaded in index.html before Flutter bootstrap. Error: $e',
        );
      }
    }
  }
  
  throw Exception('THREE.js failed to load after $maxAttempts attempts');
}

// Scene
JSObject Scene() {
  return _createScene();
}

extension SceneExtension on JSObject {
  external JSObject add(JSObject object);
  external JSObject remove(JSObject object);
  external JSObject? get background;
  external set background(JSObject? value);
}

// Camera
JSObject PerspectiveCamera(double fov, double aspect, double near, double far) {
  return _createPerspectiveCamera(fov, aspect, near, far);
}

// Helper functions for camera properties - safe access via bridge
@JS('getCameraPosition')
external JSObject? _getCameraPosition(JSAny camera);

@JS('setCameraPosition')
external void _setCameraPosition(JSAny camera, double x, double y, double z);

@JS('getCameraAspect')
external double? _getCameraAspect(JSAny camera);

@JS('setCameraAspect')
external void _setCameraAspect(JSAny camera, double aspect);

@JS('cameraLookAt')
external void _cameraLookAt(JSAny camera, double x, double y, double z);

/// Get camera position safely using bridge helper
/// Returns null if camera or position is invalid
JSObject? getCameraPosition(JSAny camera) {
  try {
    return _getCameraPosition(camera);
  } catch (e) {
    print('❌ [DEBUG] Error getting camera position: $e');
    return null;
  }
}

/// Set camera position safely using bridge helper
void setCameraPosition(JSAny camera, double x, double y, double z) {
  try {
    // Verify function exists before calling
    _setCameraPosition(camera, x, y, z);
  } catch (e) {
    print('❌ [DEBUG] Error setting camera position: $e');
    print('   [DEBUG] This usually means setCameraPosition is not available on window');
    print('   [DEBUG] Make sure three_bridge.js is loaded before Flutter bootstrap');
    rethrow;
  }
}

/// Get camera aspect ratio safely using bridge helper
double? getCameraAspect(JSAny camera) {
  try {
    return _getCameraAspect(camera);
  } catch (e) {
    print('❌ [DEBUG] Error getting camera aspect: $e');
    return null;
  }
}

/// Set camera aspect ratio safely using bridge helper
void setCameraAspect(JSAny camera, double aspect) {
  try {
    _setCameraAspect(camera, aspect);
  } catch (e) {
    print('❌ [DEBUG] Error setting camera aspect: $e');
  }
}

/// Make camera look at a point safely using bridge helper
void cameraLookAt(JSAny camera, double x, double y, double z) {
  try {
    _cameraLookAt(camera, x, y, z);
  } catch (e) {
    print('❌ [DEBUG] Error calling camera lookAt: $e');
    print('   [DEBUG] This usually means cameraLookAt is not available on window');
    print('   [DEBUG] Make sure three_bridge.js is loaded before Flutter bootstrap');
    rethrow;
  }
}

// Helper functions for object position (lights, meshes, etc.)
@JS('getObjectPosition')
external JSObject? _getObjectPosition(JSAny obj);

@JS('setObjectPosition')
external void _setObjectPosition(JSAny obj, double x, double y, double z);

/// Get object position safely using bridge helper
/// Returns null if object or position is invalid
JSObject? getObjectPosition(JSAny obj) {
  try {
    return _getObjectPosition(obj);
  } catch (e) {
    print('❌ [DEBUG] Error getting object position: $e');
    return null;
  }
}

/// Set object position safely using bridge helper or fallback to direct access
/// Works for lights, meshes, and any Three.js object with position
void setObjectPosition(JSAny obj, double x, double y, double z) {
  try {
    // Try bridge helper first
    _setObjectPosition(obj, x, y, z);
  } catch (e) {
    // Fallback: use extension to access position and modify components directly
    try {
      final objAsJSObject = obj as JSObject;
      final position = MeshExtension(objAsJSObject).position;
      // position is a Vector3-like object, modify x, y, z directly
      Vector3Extension(position).x = x;
      Vector3Extension(position).y = y;
      Vector3Extension(position).z = z;
    } catch (e2) {
      // If both fail, try LightExtension for lights
      try {
        final objAsJSObject = obj as JSObject;
        final position = LightExtension(objAsJSObject).position;
        Vector3Extension(position).x = x;
        Vector3Extension(position).y = y;
        Vector3Extension(position).z = z;
      } catch (e3) {
        // If all fail, just log and continue
        print('⚠️ [DEBUG] Could not set position (all methods failed): $e3');
      }
    }
  }
}

// Helper functions for object rotation
@JS('getObjectRotation')
external JSObject? _getObjectRotation(JSAny obj);

@JS('setObjectRotation')
external void _setObjectRotation(JSAny obj, double x, double y, double z);

/// Get object rotation safely using bridge helper
JSObject? getObjectRotation(JSAny obj) {
  try {
    return _getObjectRotation(obj);
  } catch (e) {
    print('❌ [DEBUG] Error getting object rotation: $e');
    return null;
  }
}

/// Set object rotation safely using bridge helper or fallback to direct access
/// Works for meshes and any Three.js object with rotation
void setObjectRotation(JSAny obj, double x, double y, double z) {
  try {
    // Try bridge helper first
    _setObjectRotation(obj, x, y, z);
  } catch (e) {
    // Fallback: use extension to access rotation and modify components directly
    try {
      final objAsJSObject = obj as JSObject;
      final rotation = MeshExtension(objAsJSObject).rotation;
      // rotation is a Vector3-like object, modify x, y, z directly
      Vector3Extension(rotation).x = x;
      Vector3Extension(rotation).y = y;
      Vector3Extension(rotation).z = z;
    } catch (e2) {
      // If both fail, just log and continue - object will have default rotation
      print('⚠️ [DEBUG] Could not set rotation (both bridge and extension failed): $e2');
    }
  }
}

extension CameraExtension on JSObject {
  external JSObject get position;
  external set position(JSObject value);
  external JSObject lookAt(JSObject target);
  external double get aspect;
  external set aspect(double value);
}

// Vector3
JSObject Vector3([double? x, double? y, double? z]) {
  return _createVector3(x ?? 0.0, y ?? 0.0, z ?? 0.0);
}

extension Vector3Extension on JSObject {
  external double get x;
  external set x(double value);
  external double get y;
  external set y(double value);
  external double get z;
  external set z(double value);
  external JSObject set(double x, double y, double z);
  external JSObject normalize();
  external JSObject multiplyScalar(double scalar);
}

// Renderer
JSObject WebGLRenderer([JSObject? parameters]) {
  return _createWebGLRenderer(parameters);
}

/// Create WebGLRenderer with canvas element
/// Returns JSAny to avoid cast issues - caller should cast to JSObject when needed
JSAny WebGLRendererWithCanvas(html.CanvasElement canvas) {
  print('   [DEBUG] WebGLRendererWithCanvas called with canvas: ${canvas.runtimeType}');
  // Convert CanvasElement to JSAny for js_interop
  final canvasJs = canvas as JSAny;
  print('   [DEBUG] Canvas converted to JSAny, calling bridge...');
  // Use the dedicated function that accepts canvas directly
  // Function now returns JSAny (non-nullable) - bridge guarantees non-null
  final rendererJs = _createWebGLRendererWithCanvas(canvasJs);
  print('   [DEBUG] Bridge returned JSAny: ${rendererJs.runtimeType}');
  
  // Return directly - no null check, no cast
  return rendererJs;
}

// Helper functions to call renderer methods directly - avoid extension method cast issues
@JS('rendererSetPixelRatio')
external void _rendererSetPixelRatio(JSAny renderer, double ratio);

@JS('rendererSetSize')
external void _rendererSetSize(JSAny renderer, double width, double height);

@JS('rendererRender')
external void _rendererRender(JSAny renderer, JSAny scene, JSAny camera);

void rendererSetPixelRatio(JSAny renderer, double ratio) {
  _rendererSetPixelRatio(renderer, ratio);
}

void rendererSetSize(JSAny renderer, double width, double height) {
  _rendererSetSize(renderer, width, height);
}

void rendererRender(JSAny renderer, JSAny scene, JSAny camera) {
  _rendererRender(renderer, scene, camera);
}

extension RendererExtension on JSObject {
  external JSObject setSize(double width, double height);
  external JSObject setPixelRatio(double ratio);
  external JSObject render(JSObject scene, JSObject camera);
  external JSObject? domElement;
  external JSObject? shadowMap;
}

// Geometry
JSObject SphereGeometry(double radius, int widthSegments, int heightSegments) {
  return _createSphereGeometry(radius, widthSegments, heightSegments);
}

JSObject TorusGeometry(
  double radius,
  double tube,
  int radialSegments,
  int tubularSegments,
) {
  return _createTorusGeometry(radius, tube, radialSegments, tubularSegments);
}

JSObject PlaneGeometry(double width, double height) {
  return _createPlaneGeometry(width, height);
}

JSObject BoxGeometry(double width, double height, double depth) {
  return _createBoxGeometry(width, height, depth);
}

JSObject ConeGeometry(double radius, double height, int radialSegments) {
  return _createConeGeometry(radius, height, radialSegments);
}

JSObject BufferGeometry() {
  return _createBufferGeometry();
}

extension GeometryExtension on JSObject {
  external JSObject setAttribute(String name, JSObject attribute);
  external JSObject dispose();
}

// Material
// Note: parameters can be a Map<String, dynamic> which js_interop converts automatically
JSObject MeshStandardMaterial([JSAny? parameters]) {
  // js_interop automatically converts Dart Map to JS object when passed as JSAny
  return _createMeshStandardMaterial(parameters);
}

JSObject MeshBasicMaterial([JSAny? parameters]) {
  return _createMeshBasicMaterial(parameters);
}

JSObject PointsMaterial([JSAny? parameters]) {
  return _createPointsMaterial(parameters);
}

extension MaterialExtension on JSObject {
  external JSObject? get color;
  external set color(JSObject? value);
  external double? get opacity;
  external set opacity(double? value);
  external bool? get transparent;
  external set transparent(bool? value);
  external bool? get emissive;
  external JSObject? get emissiveColor;
  external set emissiveColor(JSObject? value);
}

// Color
JSObject Color([JSAny? color]) {
  return _createColor(color ?? 0x000000.toJS);
}

extension ColorExtension on JSObject {
  external JSObject setHex(int hex);
  external JSObject setRGB(double r, double g, double b);
  external JSObject setHSL(double h, double s, double l);
}

// Mesh
JSObject Mesh(JSObject geometry, JSObject material) {
  return _createMesh(geometry, material);
}

extension MeshExtension on JSObject {
  external JSObject get geometry;
  external set geometry(JSObject value);
  external JSObject get material;
  external set material(JSObject value);
  external JSObject get position;
  external set position(JSObject value);
  external JSObject get rotation;
  external set rotation(JSObject value);
  external JSObject get scale;
  external set scale(JSObject value);
}

// Points
JSObject Points(JSObject geometry, JSObject material) {
  return _createMesh(geometry, material); // Use mesh for now, bridge handles it
}

/// Create Points from positions array
JSObject PointsFromArray(List<double> positionsArray, double size, int color) {
  // js_interop automatically converts Dart lists to JS arrays when passed to external functions
  // Pass the list directly - it will be converted automatically
  return _createPoints(positionsArray as JSAny, size, color.toJS);
}

extension PointsExtension on JSObject {
  external JSObject get geometry;
  external set geometry(JSObject value);
  external JSObject get material;
  external set material(JSObject value);
  external JSObject get position;
  external set position(JSObject value);
  external JSObject get rotation;
  external set rotation(JSObject value);
}

// Light
JSObject AmbientLight([JSAny? color, double? intensity]) {
  return _createAmbientLight(color ?? 0xffffff.toJS, intensity ?? 1.0);
}

JSObject DirectionalLight([JSAny? color, double? intensity]) {
  return _createDirectionalLight(color ?? 0xffffff.toJS, intensity ?? 1.0);
}

extension LightExtension on JSObject {
  external JSObject get position;
  external set position(JSObject value);
  external double? get intensity;
  external set intensity(double? value);
}

// BufferAttribute
JSObject Float32BufferAttribute(JSAny array, int itemSize) {
  return _createFloat32BufferAttribute(array, itemSize);
}

// Clock
JSObject Clock() {
  return _createClock();
}

extension ClockExtension on JSObject {
  external double getElapsedTime();
  external double getDelta();
}

// Helper function to create JS object from Dart map
// Uses js_interop's automatic conversion - Map is converted to JS object automatically
JSObject jsObjectFromMap(Map<String, dynamic> map) {
  // js_interop automatically converts Dart Map to JS object when passed to external functions
  // We need to create a JS object manually. Use a workaround: create empty object and set properties
  // Actually, we can just pass the map directly as JSAny and it will be converted
  return map as JSObject;
}

/// Dispose a Three.js object recursively
void disposeObject(JSObject object) {
  _disposeObject(object);
}

/// Load GLTF model
Future<JSObject> loadGLTF(String url) async {
  final promise = _loadGLTF(url);
  // In Dart 3.x, JS promises can be awaited directly if properly handled
  // For now, return the promise as-is and let the caller handle it
  return promise;
}
