import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/agent_provider.dart';
import '../providers/color_blind_provider.dart';

class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final agentProvider = Provider.of<AgentProvider>(context);
    final colorBlindProvider = Provider.of<ColorBlindProvider>(context);
    final agent = agentProvider.agent;
    final colors = colorBlindProvider.colors;

    void handleLogout() {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text('Déconnexion'),
            content: Text('Êtes-vous sûr de vouloir vous déconnecter ?'),
            actions: <Widget>[
              TextButton(
                child: Text('Annuler'),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
              TextButton(
                child: Text('Déconnexion'),
                onPressed: () {
                  context.go('/login');
                },
              ),
            ],
          );
        },
      );
    }

    void handleColorBlindChange(String type) {
      colorBlindProvider.setColorBlindType(type);
    }

    return Scaffold(
      appBar: AppBar(title: Text("Profil")),
      body: agent != null
          ? SingleChildScrollView(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors['primary'],
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          offset: Offset(0, 2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: colors['cardBackground'],
                          child: Text(
                            '${agent['name'][0]}${agent['surname'][0]}',
                            style: TextStyle(fontSize: 40, color: colors['headerText']),
                          ),
                        ),
                        SizedBox(height: 20, width: double.infinity),
                        Text(
                          '${agent['name']} ${agent['surname']}',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: colors['headerText'],
                          ),
                        ),
                        Text(
                          agent['email'],
                          style: TextStyle(
                            fontSize: 16,
                            color: colors['subHeaderText'],
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 20, width: double.infinity),
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors['cardBackground'],
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          offset: Offset(0, 4),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Informations de contact',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: colors['text'],
                          ),
                        ),
                        SizedBox(height: 10),
                        Row(
                          children: [
                            Icon(Icons.email, color: colors['primary']),
                            SizedBox(width: 10),
                            Text(
                              agent['email'],
                              style: TextStyle(fontSize: 16, color: colors['text']),
                            ),
                          ],
                        ),
                        SizedBox(height: 15),
                        Row(
                          children: [
                            Icon(Icons.phone, color: colors['primary']),
                            SizedBox(width: 10),
                            Text(
                              agent['phone'],
                              style: TextStyle(fontSize: 16, color: colors['text']),
                            ),
                          ],
                        ),
                        SizedBox(height: 15),
                        Row(
                          children: [
                            Icon(Icons.business, color: colors['primary']),
                            SizedBox(width: 10),
                            Text(
                              'Entreprise : ${agent['entreprise']}',
                              style: TextStyle(fontSize: 16, color: colors['text']),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 20, width: double.infinity),
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors['cardBackground'],
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          offset: Offset(0, 2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mode daltonien',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: colors['text'],
                          ),
                        ),
                        SizedBox(height: 10, width: double.infinity),
                        Column(
                          children: ['normal', 'protanopia', 'deuteranopia', 'tritanopia']
                              .map((type) => Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 5),
                                    child: ElevatedButton(
                                      onPressed: () => handleColorBlindChange(type),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: colorBlindProvider.colorBlindType == type
                                            ? colors['primary']
                                            : colors['cardBackground'],
                                      ),
                                      child: Text(type, style: TextStyle(color: colors['headerText'])),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: handleLogout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors['danger'],
                      padding: EdgeInsets.symmetric(vertical: 15, horizontal: 30),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      'Se déconnecter',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: colors['headerText'],
                      ),
                    ),
                  ),
                ],
              ),
            )
          : Center(child: Text("Aucune information disponible")),
    );
  }
}
