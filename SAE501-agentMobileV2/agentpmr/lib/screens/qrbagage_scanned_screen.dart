import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/agent_provider.dart';

// Définit la constante baseUrl en lisant la variable passée via --dart-define
const String baseUrl = String.fromEnvironment('BASE_URL');

class QRBagageScannedScreen extends StatefulWidget {
  final List<Map<String, dynamic>> scannedCodes;
  final Map<String, dynamic> bagage;

  QRBagageScannedScreen({required this.scannedCodes, required this.bagage});

  @override
  _QRBagageScannedScreenState createState() => _QRBagageScannedScreenState();
}

class _QRBagageScannedScreenState extends State<QRBagageScannedScreen> {
  bool isVerifying = false;

  Future<void> handleVerifyBaggage() async {
    final agentProvider = Provider.of<AgentProvider>(context, listen: false);
    final reservationId = widget.bagage['id_reservation_vol']?.toString() ?? widget.bagage['id_reservation_trajet']?.toString() ?? 'test';
    final entreprise = agentProvider.agent?['entreprise'];
    final agentId = agentProvider.agent?['id_agent'];

    // Debug prints to verify values
    print('Entreprise: $entreprise');
    print('Agent ID: $agentId');

    if (reservationId == null) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Erreur'),
          content: Text('Aucun identifiant de réservation trouvé'),
          actions: [
            TextButton(
              onPressed: () => context.pop(),
              child: Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    setState(() {
      isVerifying = true;
    });

    try {
      final response = await http.put(
        Uri.parse('$baseUrl/agent/baggage-verification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'statusBagage': true,
          'id_reservation': reservationId,
          'entreprise': entreprise,
        }),
      );

      if (response.statusCode == 200) {
        final kafkaResponse = await http.post(
          Uri.parse('$baseUrl/kafka/bagage-verification'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'agentId': agentId,
            'pmrId': reservationId,
            'status': 'Bagage vérifié',
          }),
        );

        if (kafkaResponse.statusCode == 200) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: Text('Succès'),
              content: Text('Vérification des bagages effectuée'),
              actions: [
                TextButton(
                  onPressed: () {
                    context.pop();
                    context.pop();
                  },
                  child: Text('OK'),
                ),
              ],
            ),
          );
        }
      } else {
        throw Exception('Failed to verify baggage');
      }
    } catch (error) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Erreur'),
          content: Text('La vérification des bagages a échoué'),
          actions: [
            TextButton(
              onPressed: () => context.pop(),
              child: Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      setState(() {
        isVerifying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Bagage Verification'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.all(16),
                itemCount: widget.scannedCodes.length,
                itemBuilder: (context, index) {
                  final code = widget.scannedCodes[index];
                  return Card(
                    margin: EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Scan ${index + 1}', style: TextStyle(fontSize: 14, color: Colors.grey)),
                          SizedBox(height: 4),
                          Text(code['type'], style: TextStyle(fontSize: 12, color: Colors.grey)),
                          SizedBox(height: 8),
                          Text(code['data'], style: TextStyle(fontSize: 15, color: Colors.black)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: isVerifying ? null : handleVerifyBaggage,
                child: isVerifying
                    ? CircularProgressIndicator(color: Colors.white)
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check),
                          SizedBox(width: 8),
                          Text('Verify Bagage'),
                        ],
                      ),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(16),
              child: Text('Bagage Data: ${widget.bagage.toString()}'),
            ),
          ],
        ),
      ),
    );
  }
}