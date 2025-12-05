import 'dart:js_interop';
import 'three_js_bindings.dart';

/// Manages the Three.js scene and object lifecycle
class SceneManager {
  JSObject? _scene;
  final List<JSObject> _objects = [];
  final List<JSObject> _lights = [];

  /// Initialize the scene
  /// Ensures Three.js is loaded before creating the scene
  Future<void> initialize() async {
    await ensureThreeLoaded();
    _scene = Scene();
    _scene!.background = Color(0x000000.toJS); // Black space
  }

  /// Add an object to the scene
  void addObject(JSObject object) {
    if (_scene == null) return;
    _scene!.add(object);
    _objects.add(object);
  }

  /// Remove an object from the scene
  void removeObject(JSObject object) {
    if (_scene == null) return;
    _scene!.remove(object);
    _objects.remove(object);
  }

  /// Add a light to the scene
  void addLight(JSObject light) {
    if (_scene == null) return;
    _scene!.add(light);
    _lights.add(light);
  }

  /// Remove a light from the scene
  void removeLight(JSObject light) {
    if (_scene == null) return;
    _scene!.remove(light);
    _lights.remove(light);
  }

  /// Clear all objects from the scene
  void clearObjects() {
    for (final obj in _objects) {
      if (_scene != null) {
        _scene!.remove(obj);
      }
    }
    _objects.clear();
  }

  /// Clear all lights from the scene
  void clearLights() {
    for (final light in _lights) {
      if (_scene != null) {
        _scene!.remove(light);
      }
    }
    _lights.clear();
  }

  /// Get the scene JS object
  JSObject? get scene => _scene;

  /// Dispose of the scene and all objects
  void dispose() {
    clearObjects();
    clearLights();
    _scene = null;
  }
}
