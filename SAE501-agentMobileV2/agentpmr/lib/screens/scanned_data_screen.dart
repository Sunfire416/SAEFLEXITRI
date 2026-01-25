import 'package:flutter/material.dart';

class ScannedDataScreen extends StatelessWidget {
  final String scannedData;

  ScannedDataScreen({required this.scannedData});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Données Scannées")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.data_usage, size: 100, color: Colors.blueGrey),
            SizedBox(height: 20),
            Text(
              "Données récupérées :",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(scannedData, style: TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
