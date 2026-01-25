import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:ionicons/ionicons.dart';
import 'dart:convert';

const String baseUrl = String.fromEnvironment('BASE_URL');

class EventLogScreen extends StatefulWidget {
  @override
  _EventLogScreenState createState() => _EventLogScreenState();
}

class _EventLogScreenState extends State<EventLogScreen> {
  List<dynamic> notifications = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    consumeMessages();
    // Optionally refresh messages periodically
    // final interval = Timer.periodic(Duration(seconds: 10), (timer) => consumeMessages());
    // return () => interval.cancel();
  }

  Future<void> consumeMessages() async {
    try {
      final response = await Dio().get('$baseUrl/kafka/messages');
      if (response.statusCode == 200) {
        setState(() {
          notifications = response.data;
          loading = false;
        });
      } else {
        print('Erreur lors de la consommation des messages: ${response.statusMessage}');
      }
    } catch (error) {
      print('Erreur réseau: $error');
      setState(() {
        loading = false;
      });
    }
  }

  Widget renderNotification(Map<String, dynamic> item) {
    final notification = jsonDecode(item['value']);
    final isUrgent = notification['isUrgent'] ?? false;
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: isUrgent ? Colors.red[50] : Colors.white,
      child: ListTile(
        title: Text(
          "Event: ${notification['event']} - Status: ${notification['status']} - PMR ID: ${notification['pmrId']} - Timestamp: ${DateTime.parse(notification['timestamp']).toLocal()}",
          style: TextStyle(
            color: isUrgent ? Colors.red : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: Icon(Ionicons.checkmark_circle, color: Colors.green),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Journal des évènements")),
      body: loading
          ? Center(child: CircularProgressIndicator())
          : notifications.isEmpty
              ? Center(child: Text("Aucune notification pour l'instant."))
              : ListView.builder(
                  itemCount: notifications.length,
                  itemBuilder: (context, index) {
                    return renderNotification(notifications[index]);
                  },
                ),
    );
  }
}
