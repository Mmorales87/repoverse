import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import '../../core/models/repository_data.dart';
import '../widgets/share_card_widget.dart';

/// Service for exporting share card widget as PNG image
class ShareCardService {
  /// Export share card widget as PNG
  Future<void> exportShareCard(
    BuildContext context,
    Map<String, dynamic> stats,
    List<RepositoryData> repositories,
  ) async {
    try {
      // Create a GlobalKey for the widget
      final key = GlobalKey();

      // Build the widget in an offscreen context
      ShareCardWidget(
        key: key,
        stats: stats,
        repositories: repositories,
        onExport: () {}, // Empty callback for export
      );

      // Render the widget
      final renderObject = key.currentContext?.findRenderObject();
      if (renderObject is RenderRepaintBoundary) {
        final image = await renderObject.toImage(pixelRatio: 2.0);
        final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
        final bytes = byteData?.buffer.asUint8List();

        if (bytes != null) {
          // Create download link
          final blob = html.Blob([bytes]);
          final url = html.Url.createObjectUrlFromBlob(blob);
          html.AnchorElement(href: url)
            ..setAttribute('download', 'repoverse-share-card.png')
            ..click();
          html.Url.revokeObjectUrl(url);
        }
      }
    } catch (e) {
      // Show error message
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error exporting share card: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
