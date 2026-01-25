import 'package:flutter/material.dart';

// Gestion des préférences d'accessibilité (daltonisme...)
class ColorBlindProvider with ChangeNotifier {
  String _colorBlindType = 'normal';

  Map<String, Map<String, Color>> _colorSchemes = {
    'normal': {
      'background': Colors.white,
      'primary': Colors.blue,
      'cardBackground': Colors.grey[200]!,
      'headerText': Colors.black,
      'subHeaderText': Colors.black54,
      'text': Colors.black,
      'danger': Colors.red,
    },
    'protanopia': {
      'background': Colors.white,
      'primary': Colors.red,
      'cardBackground': Colors.grey[200]!,
      'headerText': Colors.black,
      'subHeaderText': Colors.black54,
      'text': Colors.black,
      'danger': Colors.red,
    },
    'deuteranopia': {
      'background': Colors.white,
      'primary': Colors.green,
      'cardBackground': Colors.grey[200]!,
      'headerText': Colors.black,
      'subHeaderText': Colors.black54,
      'text': Colors.black,
      'danger': Colors.red,
    },
    'tritanopia': {
      'background': Colors.white,
      'primary': Colors.blue,
      'cardBackground': Colors.grey[200]!,
      'headerText': Colors.black,
      'subHeaderText': Colors.black54,
      'text': Colors.black,
      'danger': Colors.red,
    },
  };

  String get colorBlindType => _colorBlindType;

  Map<String, Color> get colors => _colorSchemes[_colorBlindType]!;

  void setColorBlindType(String type) {
    _colorBlindType = type;
    notifyListeners();
  }
}
