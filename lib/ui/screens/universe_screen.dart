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
import '../../engine/generators/moon_generator.dart';
import '../../engine/generators/ring_generator.dart';
import '../../engine/generators/sun_generator.dart';
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
  final List<JSObject> _orbits = []; // Orbit rings (very subtle)
  final List<List<JSObject>> _moons = []; // Moons for each planet (forks)
  final List<List<JSObject>> _rings = []; // Rings for each planet (branches)
  // Store planet animation data (rotation speed, translation speed)
  final Map<int, _PlanetAnimationData> _planetAnimations = {};
  JSObject? _starfield;
  JSObject? _easterEgg;
  JSObject? _sun; // Sun at center
  JSObject? _sunHalo; // Halo around sun
  List<JSObject> _sunParticles = []; // Particles radiating from sun
  double _sunPulsePhase = 0.0; // For pulse animation

  bool _threeJsError = false;
  bool _isInitialized = false;
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
      // Calculate system size for camera initialization
      final maxOrbitRadius = OrbitGenerator.calculateOrbitRadius(widget.repositories.length - 1);
      final maxPlanetRadius = 15.0; // Maximum planet radius from PlanetGenerator
      final systemSize = maxOrbitRadius + maxPlanetRadius + 20.0; // Add margin
      
      print('   [DEBUG] Initializing camera controller...');
      print('   [DEBUG] System size for camera: $systemSize (maxOrbit: $maxOrbitRadius, maxPlanet: $maxPlanetRadius)');
      await _cameraController.initialize(canvas, systemSize: systemSize);
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

    // NO LIGHTING - Testing if white color issue is caused by lighting
    // All materials use MeshBasicMaterial which doesn't require lighting
    // This will help us see if the white color problem is due to lighting
    // Commented out all lights to test without any lighting effects
    // final ambientLight = AmbientLight(0xffffff.toJS, 0.0); // DISABLED
    // _sceneManager.addLight(ambientLight);
    // final directionalLight = DirectionalLight(0xffffff.toJS, 0.0); // DISABLED
    // setObjectPosition(directionalLight as JSAny, 100.0, 100.0, 100.0);
    // _sceneManager.addLight(directionalLight);
    // final directionalLight2 = DirectionalLight(0xffffff.toJS, 0.0); // DISABLED
    // setObjectPosition(directionalLight2 as JSAny, -100.0, 80.0, -100.0);
    // _sceneManager.addLight(directionalLight2);

    // Generate Sun at center (user/organization)
    final sunGen = SunGenerator();
    _sun = sunGen.generateSun();
    _sceneManager.addObject(_sun!);
    
    // Generate sun halo
    _sunHalo = sunGen.generateHalo();
    _sceneManager.addObject(_sunHalo!);
    
    // Generate sun particles
    _sunParticles = sunGen.generateParticles(count: 30);
    for (final particle in _sunParticles) {
      _sceneManager.addObject(particle);
    }

    // Generate orbits (very subtle)
    final orbitGen = OrbitGenerator();
    for (int i = 0; i < widget.repositories.length; i++) {
      final orbit = orbitGen.generateOrbit(i);
      _orbits.add(orbit);
      _sceneManager.addObject(orbit);
    }

    // Generate planets, moons, and rings
    final planetGen = PlanetGenerator();
    final moonGen = MoonGenerator();
    final ringGen = RingGenerator();

    for (int i = 0; i < widget.repositories.length; i++) {
      final repo = widget.repositories[i];

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
      
      // Generate rings (branches) - attach to planet
      final rings = ringGen.generateRings(repo);
      _rings.add(rings);
      for (final ring in rings) {
        // Position ring at planet location (will follow planet)
        setObjectPosition(ring as JSAny, posX, posY, posZ);
        _sceneManager.addObject(ring);
      }
      
      // Generate moons (forks) - orbit around planet
      final moons = moonGen.generateMoons(repo, planet);
      _moons.add(moons);
      for (final moon in moons) {
        // Initial position relative to planet (will be updated in animation)
        setObjectPosition(moon as JSAny, posX, posY, posZ);
        _sceneManager.addObject(moon);
      }
      
      // Initialize animation data for this planet with unique speeds
      final random = math.Random(i); // Use index as seed for consistency
      _planetAnimations[i] = _PlanetAnimationData(
        rotationSpeedX: 0.2 + random.nextDouble() * 0.3, // 0.2-0.5 rad/s
        rotationSpeedY: 0.1 + random.nextDouble() * 0.2, // 0.1-0.3 rad/s
        rotationSpeedZ: 0.15 + random.nextDouble() * 0.25, // 0.15-0.4 rad/s
        translationSpeed: 0.05 + random.nextDouble() * 0.15, // 0.05-0.2 (different orbit speeds)
        initialAngle: angle,
      );
    }

    // Generate nebulas - DISABLED for now (they look like white squares)
    // TODO: Make nebulas more subtle or use particles instead
    // final nebulaGen = NebulaGenerator();
    // final nebulas = nebulaGen.generateNebulasForLanguages(widget.repositories);
    // for (final nebula in nebulas) {
    //   _nebulas.add(nebula);
    //   _sceneManager.addObject(nebula);
    // }

    // Camera is already positioned correctly during initialization
    // No need to reposition here
    
    // Force canvas size update before starting renderer
    // This ensures the canvas has the correct size before rendering starts
    final canvasWidth = (canvas.width ?? 800).clamp(100, 10000);
    final canvasHeight = (canvas.height ?? 600).clamp(100, 10000);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = '${canvasWidth}px';
    canvas.style.height = '${canvasHeight}px';
    print('   [DEBUG] Canvas size forced: ${canvasWidth}x${canvasHeight}');
    
    // Force renderer to update size immediately
    _renderer.setScene(_sceneManager.scene!);
    _renderer.setCamera(_cameraController.camera!);
    
    // Small delay to ensure canvas is ready, then start rendering
    await Future.delayed(const Duration(milliseconds: 100));
    
    // Start rendering
    print('🎬 [DEBUG] Starting renderer and animation loop...');
    _renderer.startRendering();
    
    // Force an initial render to ensure everything is visible
    _renderer.renderFrame();
    
    _startAnimationLoop();
    print('✅ [DEBUG] Renderer and animation loop started');
    _startEasterEggTimer();
    
    // Mark as initialized
    if (mounted) {
      print('✅ [HUD DEBUG] Setting _isInitialized = true');
      setState(() {
        _isInitialized = true;
      });
      print('✅ [HUD DEBUG] setState completed, _isInitialized should now be: true');
      
      // Force another render after setState to ensure visibility
      Future.delayed(const Duration(milliseconds: 50), () {
        if (mounted) {
          _renderer.renderFrame();
        }
      });
    } else {
      print('⚠️ [HUD DEBUG] Widget not mounted, cannot set _isInitialized');
    }
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

      // Animate Sun
      if (_sun != null) {
        // Rotate sun slowly
        try {
          final rotation = MeshExtension(_sun!).rotation;
          final currentRotY = Vector3Extension(rotation).y;
          Vector3Extension(rotation).y = currentRotY + 0.05 * deltaTime; // Slow rotation
        } catch (e) {
          // Fallback
          final currentRotation = getObjectRotation(_sun! as JSAny);
          if (currentRotation != null) {
            final rotY = Vector3Extension(currentRotation).y + 0.05 * deltaTime;
            setObjectRotation(_sun! as JSAny, 0, rotY, 0);
          }
        }
      }

      // Animate sun halo pulse
      if (_sunHalo != null) {
        _sunPulsePhase += deltaTime * 0.5; // Pulse speed
        final pulseIntensity = 0.3 + (math.sin(_sunPulsePhase) * 0.2); // Pulse between 0.3 and 0.5
        try {
          final material = MeshExtension(_sunHalo!).material;
          MaterialExtension(material).opacity = pulseIntensity;
        } catch (e) {
          print('   [DEBUG] Error updating sun halo opacity: $e');
        }
      }

      // Animate sun particles (rotate around sun)
      for (final particle in _sunParticles) {
        try {
          final rotation = PointsExtension(particle).rotation;
          final currentRotY = Vector3Extension(rotation).y;
          Vector3Extension(rotation).y = currentRotY + 0.1 * deltaTime; // Rotate particles
        } catch (e) {
          // Ignore errors
        }
      }

      // Animate planets with individual rotation and translation speeds
      final elapsedTime = _clock.getElapsedTime();
      
      for (
        int i = 0;
        i < _planets.length && i < widget.repositories.length;
        i++
      ) {
        final planet = _planets[i];
        final animData = _planetAnimations[i];
        
        if (animData != null) {
          // Rotate planet around its own axis (different speeds for each)
          // Access rotation directly via extension
          try {
            final rotation = MeshExtension(planet).rotation;
            final currentRotX = Vector3Extension(rotation).x;
            final currentRotY = Vector3Extension(rotation).y;
            final currentRotZ = Vector3Extension(rotation).z;
            
            // Update rotation
            Vector3Extension(rotation).x = currentRotX + animData.rotationSpeedX * deltaTime;
            Vector3Extension(rotation).y = currentRotY + animData.rotationSpeedY * deltaTime;
            Vector3Extension(rotation).z = currentRotZ + animData.rotationSpeedZ * deltaTime;
          } catch (e) {
            // Fallback: use helper function
            final currentRotation = getObjectRotation(planet as JSAny);
            if (currentRotation != null) {
              final rotX = Vector3Extension(currentRotation).x + animData.rotationSpeedX * deltaTime;
              final rotY = Vector3Extension(currentRotation).y + animData.rotationSpeedY * deltaTime;
              final rotZ = Vector3Extension(currentRotation).z + animData.rotationSpeedZ * deltaTime;
              setObjectRotation(planet as JSAny, rotX, rotY, rotZ);
            }
          }
          
          // Translate planet on orbit (different speeds for each)
          final angle = animData.initialAngle + elapsedTime * animData.translationSpeed;
          final planetPos = OrbitGenerator.calculatePlanetPosition(i, angle);
          final posX = Vector3Extension(planetPos).x;
          final posY = Vector3Extension(planetPos).y;
          final posZ = Vector3Extension(planetPos).z;
          setObjectPosition(planet as JSAny, posX, posY, posZ);
          
          // Update rings position (follow planet)
          if (i < _rings.length) {
            for (final ring in _rings[i]) {
              setObjectPosition(ring as JSAny, posX, posY, posZ);
            }
          }
          
          // Update moons position (orbit around planet)
          if (i < _moons.length) {
            final moons = _moons[i];
            for (int moonIndex = 0; moonIndex < moons.length; moonIndex++) {
              final moon = moons[moonIndex];
              // Calculate moon orbit (circular around planet)
              final moonOrbitRadius = 2.0 + (moonIndex * 0.5); // Different radius for each moon
              final moonAngle = elapsedTime * 0.5 + (moonIndex * 2 * math.pi / moons.length); // Different phase
              final moonX = posX + moonOrbitRadius * math.cos(moonAngle);
              final moonY = posY + moonOrbitRadius * math.sin(moonAngle);
              final moonZ = posZ + moonOrbitRadius * 0.3 * math.sin(moonAngle * 0.7); // Slight 3D variation
              setObjectPosition(moon as JSAny, moonX, moonY, moonZ);
            }
          }
        }
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
    print('🔄 [HUD DEBUG] build() called - _isInitialized: $_isInitialized, _threeJsError: $_threeJsError');
    return Scaffold(
      backgroundColor: Colors.transparent, // Transparent so canvas shows through
      body: Stack(
        fit: StackFit.expand, // Ensure stack fills entire screen
        clipBehavior: Clip.none, // Allow widgets to overflow if needed
        children: [
          // 3D Canvas - Behind everything
          // Canvas is added directly to document.body with z-index 0
          // This widget is just a placeholder to trigger initialization
          Positioned.fill(
            child: IgnorePointer(
              ignoring: true, // Canvas handles its own pointer events
              child: WebGLCanvas(
                onCanvasReady: _onCanvasReady,
                child: const SizedBox.expand(),
              ),
            ),
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
          // HUD Overlay - ALWAYS visible, positioned on top
          // Use Material with high elevation to ensure it's above canvas
          // Flutter widgets are rendered in a separate layer, but Material elevation helps
          Positioned.fill(
            child: Material(
              type: MaterialType.transparency,
              elevation: 1000, // Very high elevation
              child: IgnorePointer(
                ignoring: false, // Allow interaction with HUD buttons
                child: _isInitialized && !_threeJsError
                    ? HUDOverlay(
                        stats: widget.stats,
                        repositories: widget.repositories,
                        onResetCamera: _resetCamera,
                      )
                    : Container(
                        // Show loading indicator while initializing
                        color: Colors.black.withOpacity(0.3),
                        child: const Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        ),
                      ),
              ),
            ),
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

// Planet animation data - stores individual rotation and translation speeds
class _PlanetAnimationData {
  final double rotationSpeedX;
  final double rotationSpeedY;
  final double rotationSpeedZ;
  final double translationSpeed;
  final double initialAngle;

  _PlanetAnimationData({
    required this.rotationSpeedX,
    required this.rotationSpeedY,
    required this.rotationSpeedZ,
    required this.translationSpeed,
    required this.initialAngle,
  });
}
