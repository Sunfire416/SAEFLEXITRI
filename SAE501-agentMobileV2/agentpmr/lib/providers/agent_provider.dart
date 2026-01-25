import 'package:flutter/material.dart';

/// Classe pour gérer l'état de l'agent dans l'application.
/// Utilise `ChangeNotifier` pour notifier les changements.
class AgentProvider extends ChangeNotifier {
  Map<String, dynamic>? _agent;

  /// Obtient les informations de l'agent.
  Map<String, dynamic>? get agent => _agent;

  /// Définit les informations de l'agent et notifie les auditeurs.
  void setAgent(Map<String, dynamic>? newAgent) {
    _agent = newAgent;
    notifyListeners();
  }
}