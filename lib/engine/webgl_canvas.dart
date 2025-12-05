import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

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
    final renderObject = _key.currentContext?.findRenderObject();
    if (renderObject is RenderBox) {
      final size = renderObject.size;
      final position = renderObject.localToGlobal(Offset.zero);

      // Create or get canvas element
      _canvas = html.CanvasElement(
        width: size.width.toInt(),
        height: size.height.toInt(),
      );

      _canvas!.style.width = '${size.width}px';
      _canvas!.style.height = '${size.height}px';
      _canvas!.style.position = 'absolute';
      _canvas!.style.left = '${position.dx}px';
      _canvas!.style.top = '${position.dy}px';
      _canvas!.style.pointerEvents = 'auto';

      // Add canvas to document body
      html.document.body!.append(_canvas!);

      // Notify that canvas is ready
      widget.onCanvasReady?.call(_canvas!);

      // Listen for size changes
      _updateCanvasSize();
    }
  }

  void _updateCanvasSize() {
    final renderObject = _key.currentContext?.findRenderObject();
    if (renderObject is RenderBox && _canvas != null) {
      final size = renderObject.size;
      final position = renderObject.localToGlobal(Offset.zero);

      _canvas!.width = size.width.toInt();
      _canvas!.height = size.height.toInt();
      _canvas!.style.width = '${size.width}px';
      _canvas!.style.height = '${size.height}px';
      _canvas!.style.left = '${position.dx}px';
      _canvas!.style.top = '${position.dy}px';
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
