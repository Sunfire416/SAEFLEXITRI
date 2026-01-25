import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';

class EmbarquementScreen extends StatelessWidget {
  void handleScan(BuildContext context) {
    // Logique pour scanner un QR code
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Scanner'),
        content: Text('Scan en cours...'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Embarquement des Passagers")),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: Column(
                children: [
                  Icon(Ionicons.airplane, size: 60, color: Colors.blue),
                  SizedBox(height: 10),
                  Text(
                    "Embarquement des Passagers",
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            Text(
              "Scannez les billets ou vérifiez les documents des passagers PMR.",
              style: TextStyle(fontSize: 16, color: Colors.grey[700]),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 30),
            ElevatedButton.icon(
              onPressed: () => handleScan(context),
              icon: Icon(Ionicons.scan_outline, size: 20, color: Colors.white),
              label: Text("Scanner un billet", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 3,
                shadowColor: Colors.black.withOpacity(0.2),
              ),
            ).animate().fadeIn(duration: 500.ms),
          ],
        ),
      ),
    );
  }
}
