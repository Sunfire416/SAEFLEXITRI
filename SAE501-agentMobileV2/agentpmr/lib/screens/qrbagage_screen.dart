import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'qrbagage_scanned_screen.dart';

class QRBagageScreen extends StatefulWidget {
  final Map<String, dynamic> bagageData;

  const QRBagageScreen({required this.bagageData});

  @override
  _QRBagageScreenState createState() => _QRBagageScreenState();
}

class _QRBagageScreenState extends State<QRBagageScreen> {
  bool hasPermission = false;
  bool scanned = false;
  List<Map<String, dynamic>> scannedCodes = [];

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
    if (!scanned) {
      final newScannedCode = {
        'type': barcode.format.toString(),
        'data': barcode.rawValue,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };
      setState(() {
        scannedCodes.add(newScannedCode);
        scanned = true;
      });
    }
  }

  void _handleSendScannedCodes() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QRBagageScannedScreen(
          scannedCodes: scannedCodes,
          bagage: widget.bagageData,
        ),
      ),
    );
    setState(() {
      scannedCodes.clear();
      scanned = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!hasPermission) {
      return Scaffold(
        appBar: AppBar(title: Text("Scanner QR Bagage")),
        body: Center(child: Text("Requesting for camera permission...")),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text("Scanner QR Bagage")),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (barcodeCapture) => _handleBarcodeScanned(barcodeCapture),
          ),
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Card(
              color: Colors.white.withOpacity(0.9),
              elevation: 5,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              child: Padding(
                padding: EdgeInsets.all(10),
                child: Column(
                  children: [
                    Text(
                      "Profil PMR",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 10),
                    Text("Nom : ${widget.bagageData['Nom']}"),
                    Text("Prénom : ${widget.bagageData['Prenom']}"),
                    Text("ID de réservation : ${widget.bagageData['id_reservation_vol']}"),
                    
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code_scanner, size: 100, color: Colors.blueGrey),
                SizedBox(height: 20),
                Text("Scannez le QR code de votre bagage."),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      scanned = false;
                    });
                  },
                  child: Text("Scanner"),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                if (scanned)
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        scanned = false;
                      });
                    },
                    child: Text("Scan Again"),
                  ),
                if (scannedCodes.isNotEmpty)
                  ElevatedButton(
                    onPressed: _handleSendScannedCodes,
                    child: Text("Send Scanned Codes"),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
