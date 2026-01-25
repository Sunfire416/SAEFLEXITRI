import 'package:flutter/material.dart'; 
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import '../providers/agent_provider.dart';

class MainNavigator extends StatelessWidget {
  MainNavigator({Key? key}) : super(key: key);

  final List<Map<String, dynamic>> tasks = [
    {'id': '1', 'title': 'Confirmer bagages du PAX', 'icon': Ionicons.briefcase_outline, 'screen': '/agent/bagage'},
    {'id': '2', 'title': 'Scanner QR Code PAX', 'icon': Ionicons.qr_code_outline, 'screen': '/agent/qrcode'},
    {'id': '3', 'title': 'Authentifier PAX (Reconnaissance Faciale)', 'icon': Ionicons.person_circle_outline, 'screen': '/agent/face-auth'},
    {'id': '4', 'title': 'Filtrage du PAX', 'icon': Ionicons.pause_circle_outline, 'screen': '/agent/filtrage'},
    {'id': '5', 'title': 'Exception', 'icon': Ionicons.warning_outline, 'screen': '/agent/exception'},
    {'id': '6', 'title': 'Confirmer le dépôt du PMR', 'icon': Ionicons.checkmark_circle_outline, 'screen': '/agent/embarquement'},
    {'id': '7', 'title': 'Gestion des Fauteuils', 'icon': MaterialCommunityIcons.chair_rolling, 'screen': '/agent/fauteuil'},
  ];

  @override
  Widget build(BuildContext context) {
    final agent = Provider.of<AgentProvider>(context).agent;
    final agentName = agent?['name'] ?? 'Agent';

    return Scaffold(
      appBar: AppBar(
        title: Text("Bonjour, $agentName 👋"),
        actions: [
          IconButton(
            icon: const Icon(Ionicons.newspaper_outline, color: Colors.lightBlue),
            onPressed: () => context.go('/agent/event-logs'),
          ),
          IconButton(
            icon: const Icon(Ionicons.person_circle_outline, color: Colors.lightBlue),
            onPressed: () => context.go('/agent/profil'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Sélectionnez une tâche :",
              style: TextStyle(fontSize: 20),
            ),
            const SizedBox(height: 15),
            Expanded(
              child: ListView.builder(
                itemCount: tasks.length,
                itemBuilder: (context, index) {
                  final task = tasks[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8.0),
                    child: ListTile(
                      leading: Icon(task['icon'], size: 30, color: Colors.lightBlue),
                      title: Text(task['title']),
                      onTap: () => context.go(task['screen']),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
