import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/color_blind_provider.dart';

class FiltrageScreen extends StatefulWidget {
  @override
  _FiltrageScreenState createState() => _FiltrageScreenState();
}

class _FiltrageScreenState extends State<FiltrageScreen> {
  List<Map<String, dynamic>> questions = [
    {'id': 1, 'question': 'Avez-vous des documents d\'identité valides ?', 'checked': false},
    {'id': 2, 'question': 'Êtes-vous autorisé à voyager en transport PMR ?', 'checked': false},
    {'id': 3, 'question': 'Avez-vous besoin d\'une assistance particulière ?', 'checked': false},
    {'id': 4, 'question': 'Transportez-vous des objets interdits ?', 'checked': false},
    {'id': 5, 'question': 'Êtes-vous en bonne santé pour voyager ?', 'checked': false},
    {'id': 6, 'question': 'Vos bagages respectent-ils les normes de sécurité ?', 'checked': false},
    {'id': 7, 'question': 'Avez-vous suivi les consignes de sécurité émises ?', 'checked': false},
  ];

  void handleCheck(int id) {
    setState(() {
      questions = questions.map((q) {
        if (q['id'] == id) {
          q['checked'] = !q['checked'];
        }
        return q;
      }).toList();
    });
  }

  void handleSubmit() {
    final allChecked = questions.every((q) => q['checked']);
    if (allChecked) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Filtrage réussi'),
          content: Text('Toutes les questions ont été validées.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    } else {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Filtrage incomplet'),
          content: Text('Veuillez répondre à toutes les questions.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ColorBlindProvider>(context).colors;

    return Scaffold(
      appBar: AppBar(title: Text("Questionnaire de Sécurité")),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Text(
              "Veuillez répondre aux questions suivantes pour vérifier vos documents et autorisations.",
              style: TextStyle(fontSize: 17, color: colors['subHeaderText']),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: questions.length,
                itemBuilder: (context, index) {
                  final q = questions[index];
                  return Animate(
                    effects: [SlideEffect(duration: 300.ms, delay: (index * 100).ms)],
                    child: Card(
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: Checkbox(
                          value: q['checked'],
                          onChanged: (value) => handleCheck(q['id']),
                          activeColor: colors['primary'],
                        ),
                        title: Text(q['question'], style: TextStyle(fontSize: 16, color: colors['text'])),
                      ),
                    ),
                  );
                },
              ),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: colors['primary'],
                padding: EdgeInsets.symmetric(vertical: 15, horizontal: 30),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Animate(
                effects: [FadeEffect(duration: 1000.ms)],
                child: Text("Envoyer", style: TextStyle(color: colors['headerText'], fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
