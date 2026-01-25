import 'package:flutter/material.dart'; 
import 'package:provider/provider.dart';
import 'package:ionicons/ionicons.dart';
import 'package:dio/dio.dart';
import '../providers/agent_provider.dart';
import '../services/api.dart';
import '../providers/color_blind_provider.dart';

const String baseUrl = String.fromEnvironment('BASE_URL');

class FauteuilScreen extends StatefulWidget {
  @override
  _FauteuilScreenState createState() => _FauteuilScreenState();
}

class _FauteuilScreenState extends State<FauteuilScreen> {
  List<dynamic> pmrs = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    fetchPmrs();
  }

  Future<void> fetchPmrs() async {
    final agent = Provider.of<AgentProvider>(context, listen: false).agent;
    if (agent == null || agent['id_agent'] == null) {
      setState(() {
        error = "Agent non trouvé";
        loading = false;
      });
      return;
    }

    try {
      final data = await getPMRFromAgent(agent['id_agent'].toString()); // Assurer que c'est une string
      final uniquePmrs = data.where((pmr) => pmr['Nom'] != null && pmr['Prenom'] != null).toList();

      setState(() {
        pmrs = uniquePmrs.map((pmr) => {
          'Nom': pmr['Nom'],
          'Prenom': pmr['Prenom'],
          'PriseEnCharge': pmr['PriseEnCharge']?.toString() ?? '',
          'BagageCheck': pmr['BagageCheck'] == true || pmr['BagageCheck'] == 1,  // Convertir int en bool
          'isFauteuil': pmr['isFauteuil'] == true || pmr['isFauteuil'] == 1,  // Convertir int en bool
        }).toList();
        loading = false;
      });
    } catch (err) {
      setState(() {
        error = err.toString();
        loading = false;
      });
    }
  }

  Future<void> handleReserveFauteuil(String name, String surname, bool isFauteuil) async {
    try {
      await Dio().put(
        '$baseUrl/agent/checkPMRFauteuil/$name/$surname',
        data: {'isFauteuil': !isFauteuil},
      );

      setState(() {
        pmrs = pmrs.map((pmr) {
          if (pmr['Nom'] == name && pmr['Prenom'] == surname) {
            return {...pmr, 'isFauteuil': !isFauteuil};
          }
          return pmr;
        }).toList();
      });
    } catch (error) {
      setState(() {
        this.error = error.toString();
      });
    }
  }

  Future<bool> fetchFauteuilStatus(String name, String surname) async {
    try {
      final response = await Dio().get(
        '$baseUrl/agent/getFauteuilStatus/$name/$surname',
      );
      return response.data['isFauteuil'] == true || response.data['isFauteuil'] == 1;
    } catch (error) {
      setState(() {
        this.error = error.toString();
      });
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ColorBlindProvider>(context).colors;

    if (loading) {
      return Scaffold(
        appBar: AppBar(title: Text("Gestion des Fauteuils")),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(title: Text("Gestion des Fauteuils")),
        body: Center(child: Text("Erreur: $error")),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text("Gestion des Fauteuils")),
      body: ListView.builder(
        itemCount: pmrs.length,
        itemBuilder: (context, index) {
          final item = pmrs[index];

          return Card(
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              title: Text(
                "${item['Nom']} ${item['Prenom']}",
                style: TextStyle(color: colors['text']),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Prise en charge : ${item['PriseEnCharge'].isNotEmpty ? DateTime.tryParse(item['PriseEnCharge'])?.toLocal().toString() ?? 'Non défini' : 'Non défini'}"),
                  Text("Bagage Check : ${item['BagageCheck'] ? 'Oui' : 'Non'}"),
                ],
              ),
              trailing: ElevatedButton.icon(
                onPressed: () async {
                  final isFauteuil = await fetchFauteuilStatus(item['Nom'], item['Prenom']);
                  handleReserveFauteuil(item['Nom'], item['Prenom'], isFauteuil);
                },
                icon: Icon(
                  item['isFauteuil'] ? Ionicons.close_circle_outline : Ionicons.checkmark_circle_outline,
                  color: Colors.white,
                ),
                label: Text(
                  item['isFauteuil'] ? 'Annuler la réservation' : 'Réserver',
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors['primary'],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
