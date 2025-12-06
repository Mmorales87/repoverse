import 'dart:async';
import 'dart:html' as html;
import 'package:flutter/material.dart';

/// Flutter widget that embeds a WebGL canvas for Three.js rendering
class WebGLCanvas extends StatefulWidget {
  final void Function(html.CanvasElement canvas)? onCanvasReady;
  final Widget? child;

  const WebGLCanvas({super.key, this.onCanvasReady, this.child});

  @override
  State<WebGLCanvas> createState() => _WebGLCanvasState();
}

class _WebGLCanvasState extends State<WebGLCanvas> {
  final GlobalKey _key = GlobalKey();
  html.CanvasElement? _canvas;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeCanvas();
    });
  }

  void _initializeCanvas() {
    // Use viewport size for fixed positioning - ensure valid values
    final width = (html.window.innerWidth ?? 800).clamp(100, 10000);
    final height = (html.window.innerHeight ?? 600).clamp(100, 10000);

    // Create or get canvas element with explicit size
    _canvas = html.CanvasElement(
      width: width,
      height: height,
    );

    // Set explicit pixel dimensions (not percentage)
    _canvas!.style.width = '${width}px';
    _canvas!.style.height = '${height}px';
    _canvas!.style.position = 'fixed';
    _canvas!.style.left = '0px';
    _canvas!.style.top = '0px';
    _canvas!.style.pointerEvents = 'auto'; // Canvas must receive mouse events for controls
    _canvas!.style.zIndex = '-999'; // Very low z-index to ensure it's behind everything
    _canvas!.style.touchAction = 'none'; // Prevent default touch actions
    _canvas!.style.display = 'block'; // Ensure it's visible
    _canvas!.style.backgroundColor = 'transparent'; // Transparent background
    _canvas!.style.margin = '0';
    _canvas!.style.padding = '0';
    
    print('✅ [CANVAS] Canvas initialized: ${_canvas!.width}x${_canvas!.height}, style: ${_canvas!.style.width}x${_canvas!.style.height}, zIndex=${_canvas!.style.zIndex}');

    // Remove any existing canvas with same ID to prevent duplicates
    final existingCanvas = html.document.querySelector('canvas[data-repoverse]');
    existingCanvas?.remove();
    
    // Add identifier to canvas
    _canvas!.setAttribute('data-repoverse', 'true');
    
    // Add canvas to document body
    html.document.body!.append(_canvas!);
    
    // Force a layout recalculation to ensure canvas is properly sized
    // This is critical for WebGL context initialization
    _canvas!.offsetHeight; // Force layout calculation
    
    // Small delay to ensure DOM is updated
    Future.delayed(const Duration(milliseconds: 50), () {
      // Notify that canvas is ready
      widget.onCanvasReady?.call(_canvas!);
    });

    // Listen for window resize
    html.window.onResize.listen((_) {
      _updateCanvasSize();
    });
  }

  void _updateCanvasSize() {
    if (_canvas != null) {
      // Use viewport size for fixed positioning - ensure valid values
      final width = (html.window.innerWidth ?? 800).clamp(100, 10000);
      final height = (html.window.innerHeight ?? 600).clamp(100, 10000);

      // Only update if size actually changed to prevent unnecessary updates
      if (_canvas!.width != width || _canvas!.height != height) {
        _canvas!.width = width;
        _canvas!.height = height;
        _canvas!.style.width = '${width}px';
        _canvas!.style.height = '${height}px';
        _canvas!.style.left = '0px';
        _canvas!.style.top = '0px';
        
        print('   [CANVAS] Size updated: ${width}x${height}');
      }
    }
  }

  @override
  void dispose() {
    // Clean up canvas element
    _canvas?.remove();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Don't update canvas size on every build - only on window resize
    // This prevents the canvas from being resized incorrectly
    return RepaintBoundary(
      key: _key,
      child: widget.child ?? const SizedBox.expand(),
    );
  }
}
