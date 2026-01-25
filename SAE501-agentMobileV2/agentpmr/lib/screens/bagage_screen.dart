import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api.dart'; // Ensure this import is correct
import '../providers/agent_provider.dart';
import 'qrbagage_screen.dart';

class BagageScreen extends StatefulWidget {
  @override
  _BagageScreenState createState() => _BagageScreenState();
}

class _BagageScreenState extends State<BagageScreen> {
  List<dynamic> bagages = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    fetchBagages();
  }

  Future<void> fetchBagages() async {
    final agent = Provider.of<AgentProvider>(context, listen: false).agent;
    print(agent);
    if (agent == null) {
      setState(() {
        error = "Agent non trouvé";
        loading = false;
      });
      return;
    }

    try {
      final data = await getPMRFromAgent(agent.idAgent.toString());
      setState(() {
        bagages = data;
        loading = false;
      });
    } catch (err) {
      setState(() {
        error = err.toString();
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: Text("Gestion des Bagages")),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(title: Text("Gestion des Bagages")),
        body: Center(child: Text("Erreur: $error")),
      );
    }

    final bagagesNonVerifies = bagages.where((item) => item['BagageCheck'] != true).toList();

    return Scaffold(
      appBar: AppBar(title: Text("Gestion des Bagages")),
      body: ListView.builder(
        itemCount: bagagesNonVerifies.length,
        itemBuilder: (context, index) {
          final item = bagagesNonVerifies[index];
          return Card(
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              title: Text("${item['Nom']} ${item['Prenom']}"),
              subtitle: Text("État: ${item['BagageCheck'] == true ? 'Vérifié' : 'En attente'}"),
              trailing: item['BagageCheck'] != true
                  ? IconButton(
                      icon: Icon(Icons.check_circle_outline),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => QRBagageScreen(bagageData: item),
                          ),
                        );
                      },
                    )
                  : null,
            ),
          );
        },
      ),
    );
  }
}

extension on Map<String, dynamic>? {
  int? get idAgent => this?['id_agent'];
}
