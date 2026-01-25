import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

// Providers (Équivalent des Context Providers en React)
import 'providers/agent_provider.dart';
import 'providers/color_blind_provider.dart'; // Décommentez si nécessaire

// Écrans
import 'screens/login_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/assistance_screen.dart';
import 'screens/bagage_screen.dart';
import 'screens/filtrage_screen.dart';
import 'screens/embarquement_screen.dart';
import 'screens/qrcode_screen.dart';
import 'screens/scanned_data_screen.dart';
import 'screens/qrbagage_scanned_screen.dart';
import 'screens/face_auth_screen.dart';
import 'screens/event_log_screen.dart';
import 'screens/qrbagage_screen.dart';
import 'screens/exception_screen.dart';
import 'screens/fauteuil_screen.dart';

// Navigation principale (équivalent de MainNavigator.js)
import 'navigation/main_navigator.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AgentProvider()),
        ChangeNotifierProvider(create: (context) => ColorBlindProvider()), // Décommentez si nécessaire
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Agent PMR',
      theme: ThemeData(
        primarySwatch: Colors.blueGrey,
      ),
      routerConfig: _router,
    );
  }
}

// Configuration de la navigation avec GoRouter
final GoRouter _router = GoRouter(
  initialLocation: '/login', // Assurez-vous que la page de connexion est l'initiale
  routes: [
    GoRoute(path: '/login', builder: (context, state) => LoginScreen()),
    GoRoute(
      path: '/agent',
      builder: (context, state) => MainNavigator(),
      routes: [
        GoRoute(path: 'settings', builder: (context, state) => SettingsScreen()),
        GoRoute(path: 'profil', builder: (context, state) => ProfileScreen()),
        GoRoute(path: 'assistance', builder: (context, state) => AssistanceScreen()),
        GoRoute(path: 'bagage', builder: (context, state) => BagageScreen()),
        GoRoute(path: 'filtrage', builder: (context, state) => FiltrageScreen()),
        GoRoute(path: 'embarquement', builder: (context, state) => EmbarquementScreen()),
        GoRoute(path: 'exception', builder: (context, state) => ExceptionScreen()),
        GoRoute(path: 'qrcode', builder: (context, state) => QRCodeScreen()),
        GoRoute(path: 'qrbagage', builder: (context, state) => QRBagageScreen(bagageData: {})),
        GoRoute(path: 'fauteuil', builder: (context, state) => FauteuilScreen()),
        GoRoute(path: 'scanned-data', builder: (context, state) => ScannedDataScreen(scannedData: '')),
        GoRoute(path: 'qrbagage_scanned', builder: (context, state) => QRBagageScannedScreen(scannedCodes: [], bagage: {})),
        GoRoute(path: 'face-auth', builder: (context, state) => FaceAuthScreen()),
        GoRoute(path: 'event-logs', builder: (context, state) => EventLogScreen()),
      ],
    ),
    // Route de secours pour les erreurs de navigation
    GoRoute(
      path: '/error',
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(title: Text('Erreur')),
          body: Center(child: Text('Page non trouvée')),
        );
      },
    ),
  ],
  // Cette configuration permet de gérer les erreurs de route
  errorBuilder: (context, state) {
    return Scaffold(
      appBar: AppBar(title: Text('Erreur')),
      body: Center(child: Text('Page non trouvée')),
    );
  },
);
