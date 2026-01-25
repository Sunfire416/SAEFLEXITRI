import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../providers/agent_provider.dart';

const String baseUrl = String.fromEnvironment('BASE_URL');

class FaceAuthScreen extends StatefulWidget {
  @override
  _FaceAuthScreenState createState() => _FaceAuthScreenState();
}

class _FaceAuthScreenState extends State<FaceAuthScreen> {
  CameraController? _cameraController;
  bool isLoading = false;
  bool hasPermission = false;

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
  }

  Future<void> _requestCameraPermission() async {
    var status = await Permission.camera.request();
    if (status.isGranted) {
      _initializeCamera();
    } else {
      setState(() {
        hasPermission = false;
      });
    }
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    final backCamera = cameras.firstWhere((camera) => camera.lensDirection == CameraLensDirection.back);
    _cameraController = CameraController(backCamera, ResolutionPreset.medium);
    await _cameraController?.initialize();
    setState(() {
      hasPermission = true;
    });
  }

  Future<void> _handleImageCapture() async {
    if (_cameraController != null && _cameraController!.value.isInitialized) {
      setState(() {
        isLoading = true;
      });
      try {
        final image = await _cameraController!.takePicture();
        final imageBytes = await image.readAsBytes();
        final base64Image = base64Encode(imageBytes);
        final agentProvider = Provider.of<AgentProvider>(context, listen: false);
        final userId = agentProvider.agent?['id_agent'].toString();
        await _sendImageToServer(base64Image, userId!);
      } catch (error) {
        print('Error capturing image: $error');
        _showAlert('Error', 'Unable to capture the image.');
      } finally {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<void> _sendImageToServer(String base64Image, String userId) async {
    try {
      if (userId.isEmpty || base64Image.isEmpty) {
        throw Exception('User ID and image are required.');
      }

      final response = await Dio().post('$baseUrl/biometric/recognize', data: {
        'userId': userId,
        'image': base64Image,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final kafkaResponse = await Dio().post('$baseUrl/kafka/reconnaissance-faciale', data: {
          'agentId': userId,
          'pmrId': 1,
          'success': true,
          'confidence': 98.5,
        });

        print('Kafka Response: ${kafkaResponse.data}');
        _showAlert('Succès', 'Image envoyée avec succès au serveur.');
      } else {
        _showAlert('Erreur', 'La réponse du serveur est inattendue.');
      }
    } catch (error) {
      print('Erreur lors de l\'envoi de l\'image au serveur : $error');
      _showAlert('Erreur', error.toString());
    }
  }

  void _showAlert(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!hasPermission) {
      return Scaffold(
        appBar: AppBar(title: Text("Authentification Faciale")),
        body: Center(child: Text("Requesting for camera permission...")),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text("Authentification Faciale")),
      body: Stack(
        children: [
          if (_cameraController != null && _cameraController!.value.isInitialized)
            CameraPreview(_cameraController!),
          if (isLoading)
            Center(child: CircularProgressIndicator()),
          if (!isLoading)
            Center(
              child: ElevatedButton(
                onPressed: _handleImageCapture,
                child: Text("Take a Photo"),
              ),
            ),
        ],
      ),
    );
  }
}
