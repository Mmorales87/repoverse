/**
 * Three.js Bridge for Flutter Web - Complete Implementation
 * Exposes all necessary Three.js functions for Dart js_interop
 * MUST load after Three.js but BEFORE Flutter bootstrap
 */

(function() {
  'use strict';

  // Ensure Three.js is loaded - synchronous check
  // Returns true if THREE is available, throws error if not
  window.ensureThree = function() {
    if (typeof THREE !== 'undefined') {
      console.log('[BRIDGE] THREE.js is available.');
      return true;
    }
    throw new Error('THREE.js is not loaded. Make sure Three.js is loaded before three_bridge.js');
  };

  // Scene
  window.createScene = function() {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded. Make sure it is included before three_bridge.js');
    }
    return new THREE.Scene();
  };

  // Perspective Camera
  window.createPerspectiveCamera = function(fov, aspect, near, far) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.PerspectiveCamera(fov, aspect, near, far);
  };

  // WebGL Renderer
  window.createWebGLRenderer = function(opts) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    var options = opts || {};
    if (options.canvas) {
      return new THREE.WebGLRenderer({ canvas: options.canvas });
    }
    return new THREE.WebGLRenderer();
  };

  // WebGL Renderer with Canvas (dedicated function)
  window.createWebGLRendererWithCanvas = function(canvas) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    console.log('[BRIDGE] createWebGLRendererWithCanvas called with:', canvas);
    if (canvas) {
      console.log('[BRIDGE] Creating renderer with canvas');
      try {
        var renderer = new THREE.WebGLRenderer({ canvas: canvas });
        console.log('[BRIDGE] Renderer created successfully:', renderer);
        return renderer;
      } catch (e) {
        console.error('[BRIDGE] Error creating renderer with canvas:', e);
        throw new Error('Failed to create WebGLRenderer with canvas: ' + e.message);
      }
    } else {
      console.log('[BRIDGE] No canvas provided, creating renderer without canvas');
      try {
        var renderer = new THREE.WebGLRenderer();
        console.log('[BRIDGE] Renderer created successfully (no canvas):', renderer);
        return renderer;
      } catch (e) {
        console.error('[BRIDGE] Error creating renderer:', e);
        throw new Error('Failed to create WebGLRenderer: ' + e.message);
      }
    }
  };

  // OrbitControls (if available)
  window.createOrbitControls = function(camera, domElement) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    if (typeof THREE.OrbitControls === 'undefined') {
      console.warn('OrbitControls not available. Make sure to load OrbitControls.js');
      return null;
    }
    return new THREE.OrbitControls(camera, domElement);
  };

  // Vector3
  window.createVector3 = function(x, y, z) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.Vector3(x, y, z);
  };

  // Color
  window.createColor = function(color) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.Color(color);
  };

  // Sphere Geometry
  window.createSphereGeometry = function(radius, widthSegments, heightSegments) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  };

  // Sphere Mesh
  window.createSphereMesh = function(radius, widthSegments, heightSegments, materialOpts) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var material = new THREE.MeshStandardMaterial(materialOpts || {});
    return new THREE.Mesh(geometry, material);
  };

  // Torus Geometry
  window.createTorusGeometry = function(radius, tube, radialSegments, tubularSegments) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  };

  // Torus Mesh
  window.createTorusMesh = function(radius, tube, radialSegments, tubularSegments, materialOpts) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    var material = new THREE.MeshStandardMaterial(materialOpts || {});
    return new THREE.Mesh(geometry, material);
  };

  // Plane Geometry
  window.createPlaneGeometry = function(width, height) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.PlaneGeometry(width, height);
  };

  // Box Geometry
  window.createBoxGeometry = function(width, height, depth) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.BoxGeometry(width, height, depth);
  };

  // Cone Geometry
  window.createConeGeometry = function(radius, height, radialSegments) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.ConeGeometry(radius, height, radialSegments);
  };

  // Buffer Geometry
  window.createBufferGeometry = function() {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.BufferGeometry();
  };

  // Mesh Standard Material - accepts object with properties or individual parameters
  window.createMeshStandardMaterial = function(parameters) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    // If parameters is null/undefined, return material with defaults
    if (!parameters) {
      return new THREE.MeshStandardMaterial();
    }
    // Convert parameters object to proper Three.js material options
    var opts = {};
    // Handle both JS objects and Dart Maps (which come as objects)
    // Color can be a number (hex) - Three.js accepts it directly
    if (parameters.color !== undefined) {
      opts.color = parameters.color;
      console.log('[BRIDGE] Material color set to:', parameters.color, 'type:', typeof parameters.color);
    }
    if (parameters.emissive !== undefined) {
      opts.emissive = parameters.emissive;
      console.log('[BRIDGE] Material emissive set to:', parameters.emissive);
    }
    if (parameters.emissiveIntensity !== undefined) opts.emissiveIntensity = parameters.emissiveIntensity;
    if (parameters.roughness !== undefined) opts.roughness = parameters.roughness;
    if (parameters.metalness !== undefined) opts.metalness = parameters.metalness;
    if (parameters.transparent !== undefined) opts.transparent = parameters.transparent;
    if (parameters.opacity !== undefined) opts.opacity = parameters.opacity;
    if (parameters.side !== undefined) opts.side = parameters.side;
    console.log('[BRIDGE] Creating MeshStandardMaterial with options:', opts);
    var material = new THREE.MeshStandardMaterial(opts);
    console.log('[BRIDGE] Material created, color:', material.color.getHexString());
    return material;
  };

  // Mesh Basic Material - accepts object with properties
  window.createMeshBasicMaterial = function(parameters) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    // Convert parameters object to proper Three.js material options
    var opts = {};
    if (parameters) {
      if (parameters.color !== undefined) {
        opts.color = parameters.color;
        console.log('[BRIDGE] BasicMaterial color set to:', parameters.color);
      }
      if (parameters.transparent !== undefined) opts.transparent = parameters.transparent;
      if (parameters.opacity !== undefined) opts.opacity = parameters.opacity;
      if (parameters.side !== undefined) opts.side = parameters.side;
    }
    var material = new THREE.MeshBasicMaterial(opts);
    if (parameters && parameters.color !== undefined) {
      console.log('[BRIDGE] BasicMaterial created, color:', material.color.getHexString());
    }
    return material;
  };

  // Points Material - accepts object with properties
  window.createPointsMaterial = function(parameters) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    // Convert parameters object to proper Three.js material options
    var opts = {};
    if (parameters) {
      if (parameters.size !== undefined) opts.size = parameters.size;
      if (parameters.color !== undefined) opts.color = parameters.color;
      if (parameters.vertexColors !== undefined) opts.vertexColors = parameters.vertexColors;
      if (parameters.transparent !== undefined) opts.transparent = parameters.transparent;
      if (parameters.opacity !== undefined) opts.opacity = parameters.opacity;
    }
    return new THREE.PointsMaterial(opts);
  };

  // Mesh
  window.createMesh = function(geometry, material) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.Mesh(geometry, material);
  };

  // Points
  window.createPoints = function(positionsArray, size, color) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));
    var material = new THREE.PointsMaterial({ size: size, color: color });
    return new THREE.Points(geometry, material);
  };

  // Ambient Light
  window.createAmbientLight = function(color, intensity) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.AmbientLight(color, intensity);
  };

  // Directional Light
  window.createDirectionalLight = function(color, intensity) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.DirectionalLight(color, intensity);
  };

  // Float32BufferAttribute
  window.createFloat32BufferAttribute = function(array, itemSize) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.Float32BufferAttribute(array, itemSize);
  };

  // Clock
  window.createClock = function() {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    return new THREE.Clock();
  };

  // Dispose Object
  window.disposeObject = function(obj) {
    if (!obj) return;
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      // Dispose of textures if present
      if (Array.isArray(obj.material)) {
        for (var i = 0; i < obj.material.length; i++) {
          if (obj.material[i].map) obj.material[i].map.dispose();
          obj.material[i].dispose();
        }
      } else {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    }
    if (obj.parent) {
      obj.parent.remove(obj);
    }
  };

  // Load GLTF
  window.loadGLTF = function(url) {
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js is not loaded.');
    }
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('GLTFLoader not available. Make sure to load GLTFLoader.js');
      return Promise.reject(new Error('GLTFLoader not available'));
    }
    var loader = new THREE.GLTFLoader();
    return new Promise(function(resolve, reject) {
      loader.load(url,
        function(gltf) { resolve(gltf.scene); },
        undefined,
        function(error) { reject(error); }
      );
    });
  };

  // Helper functions for renderer methods - avoid extension method issues
  window.rendererSetPixelRatio = function(renderer, ratio) {
    if (renderer && typeof renderer.setPixelRatio === 'function') {
      renderer.setPixelRatio(ratio);
    }
  };

  window.rendererSetSize = function(renderer, width, height) {
    if (renderer && typeof renderer.setSize === 'function') {
      renderer.setSize(width, height);
    }
  };

  window.rendererRender = function(renderer, scene, camera) {
    if (renderer && typeof renderer.render === 'function') {
      renderer.render(scene, camera);
    }
  };

  // Helper functions for camera properties - safe access to avoid JSObject null errors
  window.getCameraPosition = function(camera) {
    if (!camera) {
      console.error('[BRIDGE] getCameraPosition: camera is null or undefined');
      return null;
    }
    if (!camera.position) {
      console.error('[BRIDGE] getCameraPosition: camera.position is null or undefined');
      return null;
    }
    return camera.position;
  };

  window.setCameraPosition = function(camera, x, y, z) {
    if (!camera) {
      console.error('[BRIDGE] setCameraPosition: camera is null or undefined');
      return;
    }
    if (!camera.position) {
      console.error('[BRIDGE] setCameraPosition: camera.position is null or undefined');
      return;
    }
    camera.position.set(x, y, z);
  };

  window.getCameraAspect = function(camera) {
    if (!camera) {
      console.error('[BRIDGE] getCameraAspect: camera is null or undefined');
      return null;
    }
    return camera.aspect;
  };

  window.setCameraAspect = function(camera, aspect) {
    if (!camera) {
      console.error('[BRIDGE] setCameraAspect: camera is null or undefined');
      return;
    }
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  };

  window.cameraLookAt = function(camera, x, y, z) {
    if (!camera) {
      console.error('[BRIDGE] cameraLookAt: camera is null or undefined');
      return;
    }
    if (typeof camera.lookAt === 'function') {
      // Three.js lookAt accepts a Vector3, so create one from x, y, z
      var target = new THREE.Vector3(x, y, z);
      camera.lookAt(target);
    } else {
      console.error('[BRIDGE] cameraLookAt: camera.lookAt is not a function');
    }
  };

  // Helper functions for object position (lights, meshes, etc.) - position is read-only, use set()
  window.setObjectPosition = function(obj, x, y, z) {
    if (!obj) {
      console.error('[BRIDGE] setObjectPosition: object is null or undefined');
      return;
    }
    if (!obj.position) {
      console.error('[BRIDGE] setObjectPosition: object.position is null or undefined');
      return;
    }
    // Three.js position is read-only, but we can modify x, y, z directly
    if (typeof obj.position.set === 'function') {
      obj.position.set(x, y, z);
    } else {
      // Fallback: set individual components
      obj.position.x = x;
      obj.position.y = y;
      obj.position.z = z;
    }
  };

  window.getObjectPosition = function(obj) {
    if (!obj) {
      console.error('[BRIDGE] getObjectPosition: object is null or undefined');
      return null;
    }
    if (!obj.position) {
      console.error('[BRIDGE] getObjectPosition: object.position is null or undefined');
      return null;
    }
    return obj.position;
  };

  // Helper functions for object rotation - rotation is also read-only, use set()
  window.setObjectRotation = function(obj, x, y, z) {
    if (!obj) {
      console.error('[BRIDGE] setObjectRotation: object is null or undefined');
      return;
    }
    if (!obj.rotation) {
      console.error('[BRIDGE] setObjectRotation: object.rotation is null or undefined');
      return;
    }
    // Three.js rotation is read-only, but we can modify x, y, z directly
    if (typeof obj.rotation.set === 'function') {
      obj.rotation.set(x, y, z);
    } else {
      // Fallback: set individual components
      obj.rotation.x = x;
      obj.rotation.y = y;
      obj.rotation.z = z;
    }
  };

  window.getObjectRotation = function(obj) {
    if (!obj) {
      console.error('[BRIDGE] getObjectRotation: object is null or undefined');
      return null;
    }
    if (!obj.rotation) {
      console.error('[BRIDGE] getObjectRotation: object.rotation is null or undefined');
      return null;
    }
    return obj.rotation;
  };

  // Verify Three.js is loaded before exposing functions
  function verifyThreeJs() {
    if (typeof THREE === 'undefined') {
      console.error('[BRIDGE] CRITICAL: THREE.js is not loaded!');
      return false;
    }
    return true;
  }

  // Ensure all functions are properly registered
  function registerBridgeFunctions() {
    if (!verifyThreeJs()) {
      console.error('[BRIDGE] Cannot register functions - THREE.js not available');
      return false;
    }

    // Verify critical functions exist
    var criticalFunctions = [
      'ensureThree',
      'createScene',
      'createPerspectiveCamera',
      'createWebGLRendererWithCanvas',
      'getCameraPosition',
      'setCameraPosition',
      'getCameraAspect',
      'setCameraAspect',
      'cameraLookAt',
      'setObjectPosition',
      'getObjectPosition',
      'setObjectRotation',
      'getObjectRotation'
    ];

    var allPresent = true;
    for (var i = 0; i < criticalFunctions.length; i++) {
      var funcName = criticalFunctions[i];
      if (typeof window[funcName] !== 'function') {
        console.error('[BRIDGE] CRITICAL: Function ' + funcName + ' is not available on window!');
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log('✅ [BRIDGE] All critical functions verified and available');
    } else {
      console.error('❌ [BRIDGE] Some critical functions are missing!');
    }

    return allPresent;
  }

  // Register functions immediately
  var bridgeReady = registerBridgeFunctions();

  // Explicitly verify helper functions are on window for Dart
  console.log('✅ [BRIDGE] Three.js bridge loaded - all functions exposed on window');
  console.log('[BRIDGE] Verifying helper functions for Dart:');
  console.log('  - setCameraPosition:', typeof window.setCameraPosition);
  console.log('  - getCameraPosition:', typeof window.getCameraPosition);
  console.log('  - cameraLookAt:', typeof window.cameraLookAt);
  console.log('  - setObjectPosition:', typeof window.setObjectPosition);
  console.log('  - getObjectPosition:', typeof window.getObjectPosition);
  console.log('  - setObjectRotation:', typeof window.setObjectRotation);
  console.log('  - getObjectRotation:', typeof window.getObjectRotation);
  
  if (bridgeReady) {
    console.log('✅ [BRIDGE] Bridge initialization successful');
  } else {
    console.warn('⚠️ [BRIDGE] Bridge initialization had issues - some functions may not be available');
  }
  
  // Force registration on window after load event
  if (document.readyState === 'loading') {
    window.addEventListener('load', function() {
      console.log('✅ [BRIDGE] Window loaded - verifying bridge functions...');
      registerBridgeFunctions();
      if (typeof window.ensureThree === 'function') {
        console.log('✅ [BRIDGE] ensureThree function verified on window');
      } else {
        console.error('❌ [BRIDGE] ensureThree function NOT found on window after load!');
      }
    });
  } else {
    // Already loaded
    console.log('✅ [BRIDGE] Document already loaded - bridge ready');
    registerBridgeFunctions();
    if (typeof window.ensureThree === 'function') {
      console.log('✅ [BRIDGE] ensureThree function verified on window');
    } else {
      console.error('❌ [BRIDGE] ensureThree function NOT found on window!');
    }
  }
})();
