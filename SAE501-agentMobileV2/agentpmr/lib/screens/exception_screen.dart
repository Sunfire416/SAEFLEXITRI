import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/color_blind_provider.dart';

class ExceptionScreen extends StatefulWidget {
  @override
  _ExceptionScreenState createState() => _ExceptionScreenState();
}

class _ExceptionScreenState extends State<ExceptionScreen> {
  String? selectedOption;
  String description = '';

  void handleSubmit() {
    // Logique pour envoyer une exception
    print('Exception soumise pour $selectedOption: $description');
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ColorBlindProvider>(context).colors;

    return Scaffold(
      appBar: AppBar(title: Text("Signalement d'Exception")),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Text(
              "Signalement d'Exception",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: colors['text']),
            ),
            SizedBox(height: 15),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selectedOption == 'toilettes' ? colors['danger'] : colors['primary'],
                      padding: EdgeInsets.all(15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => setState(() => selectedOption = 'toilettes'),
                    child: Text("Toilettes", style: TextStyle(color: colors['headerText'], fontSize: 16)),
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selectedOption == 'dutyFree' ? colors['danger'] : colors['primary'],
                      padding: EdgeInsets.all(15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => setState(() => selectedOption = 'dutyFree'),
                    child: Text("Duty Free", style: TextStyle(color: colors['headerText'], fontSize: 16)),
                  ),
                ),
              ],
            ),
            if (selectedOption != null) ...[
              SizedBox(height: 20),
              TextField(
                style: TextStyle(color: colors['text']),
                decoration: InputDecoration(
                  hintText: "Décrivez l'exception pour $selectedOption...",
                  hintStyle: TextStyle(color: colors['subHeaderText']),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(5)),
                  contentPadding: EdgeInsets.all(10),
                ),
                maxLines: 5,
                onChanged: (value) => setState(() => description = value),
              ),
              SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors['danger'],
                  padding: EdgeInsets.all(15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: handleSubmit,
                child: Text("Soumettre", style: TextStyle(color: colors['headerText'], fontSize: 16)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
