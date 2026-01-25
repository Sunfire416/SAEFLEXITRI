import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Paramètres")),
      body: Center(child: Text("Gérer les paramètres de l'application.")),
    );
  }
}
