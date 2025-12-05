import 'dart:html' as html;
import 'dart:js_interop';
import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../engine/webgl_canvas.dart';
import '../../engine/renderer.dart';
import '../../engine/scene_manager.dart';
import '../../engine/camera_controller.dart';
import '../../engine/generators/starfield_generator.dart';
import '../../engine/generators/planet_generator.dart';
import '../../engine/generators/orbit_generator.dart';
// import '../../engine/generators/nebula_generator.dart'; // Disabled - looked like white squares
import '../../engine/generators/misc_objects_generator.dart';
import '../../engine/effects/star_flicker.dart';
import '../../engine/effects/particle_drift.dart';
import '../../core/models/repository_data.dart';
import '../widgets/hud_overlay.dart';
import '../../engine/three_js_bindings.dart';

/// Main 3D universe screen
class UniverseScreen extends StatefulWidget {
  final List<RepositoryData> repositories;
  final Map<String, dynamic> stats;

  const UniverseScreen({
    super.key,
    required this.repositories,
    required this.stats,
  });

  @override
  State<UniverseScreen> createState() => _UniverseScreenState();
}

class _UniverseScreenState extends State<UniverseScreen> {
  final ThreeJSRenderer _renderer = ThreeJSRenderer();
  final SceneManager _sceneManager = SceneManager();
  final CameraController _cameraController = CameraController();
  final StarFlicker _starFlicker = StarFlicker();
  final ParticleDrift _particleDrift = ParticleDrift();

  final List<JSObject> _planets = [];
  final List<JSObject> _orbits = [];
  JSObject? _starfield;
  JSObject? _easterEgg;

  bool _isInitialized = false;
  bool _threeJsError = false;
  String? _errorMessage;
  int? _animationFrameId;
  final Clock _clock = Clock();
  Timer? _easterEggTimer;
  double _easterEggX = -100.0; // Start off-screen
  bool _easterEggActive = false;
  int _threeJsRetryCount = 0;
  static const int _maxThreeJsRetries = 5;

  @override
  void initState() {
    super.initState();
    _initializeScene();
  }

  void _initializeScene() {
    // This will be called when canvas is ready
  }

  void _onCanvasReady(html.CanvasElement canvas) async {
    print('🎨 [DEBUG] Canvas ready, checking THREE.js...');
    
    // Try to ensure Three.js is loaded with retry limit
    try {
      await ensureThreeLoaded();
      print('✅ [DEBUG] THREE.js is available, initializing scene...');
      _threeJsRetryCount = 0; // Reset retry count on success
    } catch (e) {
      _threeJsRetryCount++;
      print('   [DEBUG] ❌ ensureThreeLoaded failed (attempt $_threeJsRetryCount/$_maxThreeJsRetries): $e');
      
      if (_threeJsRetryCount >= _maxThreeJsRetries) {
        print('   [DEBUG] ❌ Max retries reached. Showing error UI.');
        if (mounted) {
          setState(() {
            _threeJsError = true;
            _errorMessage = 'Three.js failed to load after $_maxThreeJsRetries attempts. '
                'Please refresh the page or check your browser console.';
          });
        }
        return;
      }
      
      // Retry after a delay
      print('   [DEBUG] ⚠️  Retrying in 500ms...');
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _onCanvasReady(canvas);
        }
      });
      return;
    }

    // Initialize Three.js components
    try {
      print('   [DEBUG] Initializing scene manager...');
      await _sceneManager.initialize();
      print('   [DEBUG] Initializing renderer...');
      await _renderer.initialize(canvas);
      print('   [DEBUG] Initializing camera controller...');
      await _cameraController.initialize(canvas);
      print('✅ [DEBUG] All Three.js components initialized');
    } catch (e, stackTrace) {
      print('❌ [DEBUG] Error initializing Three.js components: $e');
      print('   [DEBUG] Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _threeJsError = true;
          _errorMessage = 'Failed to initialize 3D scene: $e';
        });
      }
      return;
    }

    // Set up scene
    _renderer.setScene(_sceneManager.scene!);
    _renderer.setCamera(_cameraController.camera!);

    // Generate starfield
    final starfieldGen = StarfieldGenerator();
    _starfield = starfieldGen.generate();
    _sceneManager.addObject(_starfield!);
    _starFlicker.initialize(_starfield!);
    _particleDrift.initialize(_starfield!);

    // Add lighting - improved for better color visibility
    final ambientLight = AmbientLight(0xffffff.toJS, 0.6); // Increased ambient
    _sceneManager.addLight(ambientLight);

    final directionalLight = DirectionalLight(0xffffff.toJS, 1.2); // Brighter directional
    // Use bridge helper to set position (position is read-only in Three.js)
    setObjectPosition(directionalLight as JSAny, 50.0, 50.0, 50.0);
    _sceneManager.addLight(directionalLight);

    // Generate planets and orbits
    final planetGen = PlanetGenerator();
    final orbitGen = OrbitGenerator();

    for (int i = 0; i < widget.repositories.length; i++) {
      final repo = widget.repositories[i];

      // Generate orbit
      final orbit = orbitGen.generateOrbit(i);
      _orbits.add(orbit);
      _sceneManager.addObject(orbit);

      // Generate planet
      final planet = planetGen.generatePlanet(repo);
      final angle = (i / widget.repositories.length) * 2 * 3.14159;
      final planetPos = OrbitGenerator.calculatePlanetPosition(i, angle);
      // Use bridge helper to set position (position is read-only in Three.js)
      final posX = Vector3Extension(planetPos).x;
      final posY = Vector3Extension(planetPos).y;
      final posZ = Vector3Extension(planetPos).z;
      setObjectPosition(planet as JSAny, posX, posY, posZ);
      _planets.add(planet);
      _sceneManager.addObject(planet);
    }

    // Generate nebulas - DISABLED for now (they look like white squares)
    // TODO: Make nebulas more subtle or use particles instead
    // final nebulaGen = NebulaGenerator();
    // final nebulas = nebulaGen.generateNebulasForLanguages(widget.repositories);
    // for (final nebula in nebulas) {
    //   _nebulas.add(nebula);
    //   _sceneManager.addObject(nebula);
    // }

    // Start rendering
    _renderer.startRendering();
    _startAnimationLoop();
    _startEasterEggTimer();

    setState(() {
      _isInitialized = true;
    });
  }

  void _startEasterEggTimer() {
    // Random spawn between 30-60 seconds
    final random = math.Random();
    final delay = 30 + random.nextDouble() * 30; // 30-60 seconds

    _easterEggTimer = Timer(Duration(seconds: delay.toInt()), () {
      _spawnEasterEgg();
      // Schedule next spawn
      _startEasterEggTimer();
    });
  }

  void _spawnEasterEgg() {
    if (!mounted || _sceneManager.scene == null) return;

    // Remove existing easter egg if any
    if (_easterEgg != null) {
      _sceneManager.removeObject(_easterEgg!);
      _easterEgg = null;
    }

    // Generate random easter egg (rocket or UFO)
    final miscGen = MiscObjectsGenerator();
    _easterEgg = miscGen.generateRandomObject();

    // Position off-screen to the left
    _easterEggX = -150.0;
    // Use bridge helper to set position (position is read-only in Three.js)
    setObjectPosition(_easterEgg! as JSAny, _easterEggX, 20.0, 0.0);

    _sceneManager.addObject(_easterEgg!);
    _easterEggActive = true;
  }

  void _startAnimationLoop() {
    void animate() {
      if (!mounted) return;

      final deltaTime = _clock.getDelta();

      // Update effects
      _starFlicker.update(deltaTime);
      _particleDrift.update(deltaTime);

      // Animate planets (slow rotation)
      // Note: Animation will be handled by Three.js directly in full implementation
      // For now, we skip direct rotation updates due to JS interop complexity

      // Animate orbits (slow revolution)
      // Note: Animation will be handled by Three.js directly in full implementation
      // For now, we skip direct rotation updates due to JS interop complexity

      // Animate planets on orbits
      for (
        int i = 0;
        i < _planets.length && i < widget.repositories.length;
        i++
      ) {
        final planet = _planets[i];
        final time = DateTime.now().millisecondsSinceEpoch / 10000.0;
        final angle =
            (i / widget.repositories.length) * 2 * 3.14159 + time * 0.1;
        final planetPos = OrbitGenerator.calculatePlanetPosition(i, angle);
        // Use bridge helper to set position (position is read-only in Three.js)
        final posX = Vector3Extension(planetPos).x;
        final posY = Vector3Extension(planetPos).y;
        final posZ = Vector3Extension(planetPos).z;
        setObjectPosition(planet as JSAny, posX, posY, posZ);
      }

      // Animate easter egg (rocket/UFO crossing scene)
      if (_easterEggActive && _easterEgg != null) {
        _easterEggX += 0.5 * deltaTime * 60; // Move right across scene
        // Use bridge helper to set position (position is read-only in Three.js)
        setObjectPosition(_easterEgg! as JSAny, _easterEggX, 20.0, 0.0);

        // Remove when off-screen to the right
        if (_easterEggX > 150.0) {
          _sceneManager.removeObject(_easterEgg!);
          _easterEgg = null;
          _easterEggActive = false;
        }
      }

      _animationFrameId = html.window.requestAnimationFrame((_) {
        animate();
      });
    }

    animate();
  }

  void _resetCamera() {
    _cameraController.reset();
  }

  @override
  void dispose() {
    _easterEggTimer?.cancel();
    if (_animationFrameId != null) {
      html.window.cancelAnimationFrame(_animationFrameId!);
    }
    if (_easterEgg != null) {
      _sceneManager.removeObject(_easterEgg!);
    }
    _renderer.dispose();
    _sceneManager.dispose();
    _cameraController.dispose();
    _starFlicker.dispose();
    _particleDrift.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 3D Canvas
          WebGLCanvas(
            onCanvasReady: _onCanvasReady,
            child: const SizedBox.expand(),
          ),
          // Error overlay if Three.js failed
          if (_threeJsError)
            Container(
              color: Colors.black87,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: Colors.orange,
                        size: 64,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        '3D Scene Error',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage ?? 'Unknown error',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          // Reload the page
                          html.window.location.reload();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Reload Page'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _threeJsError = false;
                            _errorMessage = null;
                            _threeJsRetryCount = 0;
                          });
                        },
                        child: const Text('Dismiss'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          // HUD Overlay - Show immediately, don't wait for full initialization
          if (!_threeJsError)
            HUDOverlay(
              stats: widget.stats,
              repositories: widget.repositories,
              onResetCamera: _resetCamera,
            ),
        ],
      ),
    );
  }
}

// Placeholder Clock class - would use Three.js Clock in full implementation
class Clock {
  double _startTime = DateTime.now().millisecondsSinceEpoch / 1000.0;
  double _oldTime = DateTime.now().millisecondsSinceEpoch / 1000.0;

  double getDelta() {
    final newTime = DateTime.now().millisecondsSinceEpoch / 1000.0;
    final delta = newTime - _oldTime;
    _oldTime = newTime;
    return delta;
  }

  double getElapsedTime() {
    return DateTime.now().millisecondsSinceEpoch / 1000.0 - _startTime;
  }
}
