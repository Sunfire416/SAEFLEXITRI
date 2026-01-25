import 'dart:convert';
import 'package:http/http.dart' as http;

// Définir la variable d'environnement lue par Flutter
// Le code utilisera la valeur passée par --dart-define.
// Nous mettons "http://" comme valeur par défaut, mais ce sera écrasé au lancement.
const String baseUrl = String.fromEnvironment(
  'BASE_URL', 
  defaultValue: 'http://', // Valeur par défaut pour éviter un crash si l'app est lancée sans argument
);

Future<List<dynamic>> getPMRFromAgent(String idAgent) async {
  final response = await http.get(Uri.parse('$baseUrl/agent/getPMRAssociateToAgent/$idAgent'));

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to load PMR data. Status: ${response.statusCode}');
  }
}