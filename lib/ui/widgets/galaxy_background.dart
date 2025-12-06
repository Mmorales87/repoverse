import 'dart:html' as html;
import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Galaxy background widget with animated stars
/// Creates a canvas-based animated galaxy effect
class GalaxyBackground extends StatefulWidget {
  final Widget child;
  final double density;
  final double speed;
  final bool mouseInteraction;
  final bool mouseRepulsion;

  const GalaxyBackground({
    super.key,
    required this.child,
    this.density = 1.0,
    this.speed = 0.5,
    this.mouseInteraction = true,
    this.mouseRepulsion = true,
  });

  @override
  State<GalaxyBackground> createState() => _GalaxyBackgroundState();
}

class _GalaxyBackgroundState extends State<GalaxyBackground>
    with SingleTickerProviderStateMixin {
  html.CanvasElement? _canvas;
  html.CanvasRenderingContext2D? _ctx;
  int? _animationFrameId;
  late AnimationController _controller;
  double _time = 0.0;
  double _mouseX = 0.5; // Normalized mouse position (0-1)
  double _mouseY = 0.5;
  double _targetMouseX = 0.5;
  double _targetMouseY = 0.5;
  double _mouseActiveFactor = 0.0; // 0 = inactive, 1 = active

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 100), // Long duration for smooth loop
    )..repeat();
    _controller.addListener(_updateAnimation);
  }

  @override
  void dispose() {
    _controller.dispose();
    if (_animationFrameId != null) {
      html.window.cancelAnimationFrame(_animationFrameId!);
    }
    _canvas?.remove();
    super.dispose();
  }

  void _updateAnimation() {
    // Animation is handled by requestAnimationFrame now
    // This is kept for compatibility but may not be needed
  }

  void _initializeCanvas() {
    if (_canvas != null) return; // Already initialized
    
    final width = html.window.innerWidth ?? 800;
    final height = html.window.innerHeight ?? 600;

    _canvas = html.CanvasElement(width: width, height: height);
    _canvas!.id = 'galaxy-background-canvas';
    _canvas!.style.position = 'fixed';
    _canvas!.style.left = '0px';
    _canvas!.style.top = '0px';
    _canvas!.style.width = '100%';
    _canvas!.style.height = '100%';
    _canvas!.style.zIndex = '-999'; // Very far behind everything
    _canvas!.style.pointerEvents = 'none'; // Never block events - we listen on document instead
    _canvas!.style.display = 'block';
    _canvas!.style.backgroundColor = 'transparent';
    _canvas!.style.margin = '0';
    _canvas!.style.padding = '0';

    _ctx = _canvas!.context2D;
    
    // Remove existing canvas if any
    html.document.getElementById('galaxy-background-canvas')?.remove();
    
    // Add to body
    html.document.body!.append(_canvas!);
    
    print('✅ [GALAXY] Canvas initialized: ${_canvas!.width}x${_canvas!.height}, zIndex=${_canvas!.style.zIndex}');

    // Listen for window resize
    html.window.onResize.listen((_) {
      if (_canvas != null) {
        final newWidth = html.window.innerWidth ?? 800;
        final newHeight = html.window.innerHeight ?? 600;
        _canvas!.width = newWidth;
        _canvas!.height = newHeight;
        _drawGalaxy();
      }
    });

    // Listen for mouse events if interaction is enabled
    if (widget.mouseInteraction) {
      // Listen on document to catch all mouse movements
      html.document.onMouseMove.listen((e) {
        if (_canvas != null && mounted) {
          final rect = _canvas!.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            _targetMouseX = ((e.client.x - rect.left) / rect.width).clamp(0.0, 1.0);
            _targetMouseY = (1.0 - ((e.client.y - rect.top) / rect.height)).clamp(0.0, 1.0); // Flip Y
            _mouseActiveFactor = 1.0;
          }
        }
      });

      html.document.onMouseLeave.listen((_) {
        if (mounted) {
          _mouseActiveFactor = 0.0;
        }
      });
    }

    // Start drawing immediately
    _drawGalaxy();
    
    // Use requestAnimationFrame for smooth animation
    void animate(_) {
      if (_canvas != null && _ctx != null && mounted) {
        _time += 0.016 * widget.speed; // ~60fps
        
        // Smooth mouse position interpolation
        if (widget.mouseInteraction) {
          const lerpFactor = 0.1; // Faster interpolation for more responsive feel
          _mouseX += (_targetMouseX - _mouseX) * lerpFactor;
          _mouseY += (_targetMouseY - _mouseY) * lerpFactor;
          // Fade out mouse active factor when mouse leaves (slower fade)
          if (_mouseActiveFactor > 0) {
            _mouseActiveFactor = (_mouseActiveFactor - 0.02).clamp(0.0, 1.0);
          }
        }
        
        _drawGalaxy();
        _animationFrameId = html.window.requestAnimationFrame(animate);
      }
    }
    _animationFrameId = html.window.requestAnimationFrame(animate);
  }

  void _drawGalaxy() {
    if (_ctx == null || _canvas == null) {
      print('⚠️ [GALAXY] Cannot draw: ctx=${_ctx != null}, canvas=${_canvas != null}');
      return;
    }

    final width = _canvas!.width!;
    final height = _canvas!.height!;
    
    if (width == 0 || height == 0) {
      print('⚠️ [GALAXY] Canvas has zero size: ${width}x${height}');
      return;
    }

    // Fill with very dark blue-black background (almost black but with slight blue tint)
    _ctx!.fillStyle = '#000011';
    _ctx!.fillRect(0, 0, width, height);

    // Draw stars with twinkling effect - using user's density parameter
    final starCount = (500 * widget.density).toInt(); // Density 0.4 = ~200 stars
    
    // Mouse position in canvas coordinates
    final mouseCanvasX = _mouseX * width;
    final mouseCanvasY = _mouseY * height;
    final repulsionStrength = 3.0; // User's repulsion strength
    
    for (int i = 0; i < starCount; i++) {
      final seed = i * 137.5; // Golden angle for distribution
      var x = ((seed * 0.618) % width).abs();
      var y = ((seed * 0.382) % height).abs();
      
      // Apply mouse repulsion if enabled
      if (widget.mouseRepulsion && widget.mouseInteraction && _mouseActiveFactor > 0.1) {
        final dx = x - mouseCanvasX;
        final dy = y - mouseCanvasY;
        final dist = math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 300) { // Affect stars within 300px
          final repulsion = repulsionStrength / (dist + 0.1) * _mouseActiveFactor;
          // More visible repulsion effect
          x += (dx / dist) * repulsion * 0.1;
          y += (dy / dist) * repulsion * 0.1;
        }
      }
      
      // Create depth layers
      final depth = (seed * 0.5) % 1.0;
      final size = 0.5 + (1.0 - depth) * 2.0; // Visible stars
      
      // Twinkling effect - using user's twinkle intensity (0.7)
      final twinkle = (math.sin(_time * 0.2 * widget.speed + seed) * 0.5 + 0.5); // Star Speed 0.2
      final twinkleIntensity = 0.7; // User's twinkle intensity
      final baseOpacity = 0.5 + depth * 0.3; // More visible
      final opacity = baseOpacity + (twinkle * twinkleIntensity * 0.3);
      
      // Color variation - using user's hue shift (200°) and saturation (0.2)
      final hueShift = 200.0 / 360.0; // User's hue shift
      final saturation = 0.2; // User's saturation
      final hue = ((seed * 0.1) % 360) / 360.0;
      final colorValue = _hsvToRgb(
        (hue + hueShift + _time * 0.1 * widget.speed) % 1.0, // Rotation Speed 0.1
        saturation,
        0.6 + twinkle * 0.3, // Brightness
      );
      
      // Draw star with bright white/yellow color
      _ctx!.fillStyle = 'rgba(${colorValue[0]}, ${colorValue[1]}, ${colorValue[2]}, $opacity)';
      _ctx!.beginPath();
      _ctx!.arc(x, y, size, 0, 2 * 3.14159);
      _ctx!.fill();
      
      // Add glow for larger stars - using user's glow intensity (0.1)
      final glowIntensity = 0.1; // User's glow intensity
      if (size > 0.8 && glowIntensity > 0) {
        final glowSize = size * (2.0 + glowIntensity * 3.0);
        final gradient = _ctx!.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, 'rgba(${colorValue[0]}, ${colorValue[1]}, ${colorValue[2]}, ${opacity * glowIntensity})');
        gradient.addColorStop(1, 'rgba(${colorValue[0]}, ${colorValue[1]}, ${colorValue[2]}, 0)');
        _ctx!.fillStyle = gradient;
        _ctx!.beginPath();
        _ctx!.arc(x, y, glowSize, 0, 2 * 3.14159);
        _ctx!.fill();
      }
    }

    // Draw nebula-like clouds - subtle
    for (int i = 0; i < 3; i++) {
      final seed = i * 1000;
      final centerX = (seed * 0.3) % width;
      final centerY = (seed * 0.7) % height;
      final radius = 100 + (seed % 50);
      
      final nebulaOpacity = 0.05 + math.sin(_time * 0.1 * widget.speed + seed) * 0.02; // Subtle
      final gradient = _ctx!.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius,
      );
      
      final hueShift = 200.0 / 360.0;
      final hue = (hueShift + i * 0.1 + _time * 0.05 * widget.speed) % 1.0;
      final color = _hsvToRgb(hue, 0.2, 0.3); // Low saturation, subtle
      gradient.addColorStop(0, 'rgba(${color[0]}, ${color[1]}, ${color[2]}, $nebulaOpacity)');
      gradient.addColorStop(1, 'rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)');
      
      _ctx!.fillStyle = gradient;
      _ctx!.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }
  }

  List<int> _hsvToRgb(double h, double s, double v) {
    final c = v * s;
    final x = c * (1 - ((h * 6) % 2 - 1).abs());
    final m = v - c;

    double r, g, b;
    if (h < 1 / 6) {
      r = c; g = x; b = 0;
    } else if (h < 2 / 6) {
      r = x; g = c; b = 0;
    } else if (h < 3 / 6) {
      r = 0; g = c; b = x;
    } else if (h < 4 / 6) {
      r = 0; g = x; b = c;
    } else if (h < 5 / 6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return [
      ((r + m) * 255).round(),
      ((g + m) * 255).round(),
      ((b + m) * 255).round(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    // Initialize canvas immediately when widget is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_canvas == null) {
        _initializeCanvas();
      }
    });
    
    // Also try to initialize after a short delay to ensure DOM is ready
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_canvas == null && mounted) {
        _initializeCanvas();
      }
    });

    // Return child directly - canvas is added to DOM separately
    return widget.child;
  }
}

