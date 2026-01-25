import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';

class QRCodeScreen extends StatefulWidget {
  @override
  _QRCodeScreenState createState() => _QRCodeScreenState();
}

class _QRCodeScreenState extends State<QRCodeScreen> {
  bool hasPermission = false;
  bool scanned = false;

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
  }

  Future<void> _requestCameraPermission() async {
    var status = await Permission.camera.request();
    setState(() {
      hasPermission = status.isGranted;
    });
  }

  void _handleBarcodeScanned(BarcodeCapture barcodeCapture) {
    final barcode = barcodeCapture.barcodes.first;
    setState(() {
      scanned = true;
    });
    context.go('/scanned-data', extra: {
      'type': barcode.format.toString(),
      'data': barcode.rawValue,
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!hasPermission) {
      return Scaffold(
        appBar: AppBar(title: Text("Scanner un QR Code")),
        body: Center(child: Text("Requesting for camera permission...")),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text("Scanner un QR Code")),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (barcodeCapture) => _handleBarcodeScanned(barcodeCapture),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (scanned)
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        scanned = false;
                      });
                    },
                    child: Text("Tap to Scan Again"),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
