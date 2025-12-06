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
    // Use viewport size for fixed positioning
    final width = html.window.innerWidth ?? 800;
    final height = html.window.innerHeight ?? 600;

    // Create or get canvas element
    _canvas = html.CanvasElement(
      width: width,
      height: height,
    );

    _canvas!.style.width = '100%';
    _canvas!.style.height = '100%';
    _canvas!.style.position = 'fixed';
    _canvas!.style.left = '0px';
    _canvas!.style.top = '0px';
    _canvas!.style.pointerEvents = 'auto';
      _canvas!.style.zIndex = '-1'; // Behind UI elements
    _canvas!.style.display = 'block'; // Ensure it's visible

    // Add canvas to document body
    html.document.body!.append(_canvas!);

    // Notify that canvas is ready
    widget.onCanvasReady?.call(_canvas!);

    // Listen for size changes
    _updateCanvasSize();
  }

  void _updateCanvasSize() {
    if (_canvas != null) {
      // Use viewport size for fixed positioning
      final width = html.window.innerWidth ?? 800;
      final height = html.window.innerHeight ?? 600;

      _canvas!.width = width;
      _canvas!.height = height;
      _canvas!.style.width = '100%';
      _canvas!.style.height = '100%';
      _canvas!.style.left = '0px';
      _canvas!.style.top = '0px';
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateCanvasSize();
    });

    return RepaintBoundary(
      key: _key,
      child: widget.child ?? const SizedBox.expand(),
    );
  }
}
