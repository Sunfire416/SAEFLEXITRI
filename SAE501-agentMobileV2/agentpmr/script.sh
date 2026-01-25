#!/bin/bash

# Définition du dossier racine
ROOT_DIR="lib"

# Création des dossiers
mkdir -p $ROOT_DIR/{screens,navigation,providers,widgets,constants}

# Création des fichiers dans lib/
echo "// Point d'entrée de l'application" > $ROOT_DIR/main.dart

# Création des fichiers dans screens/
SCREENS=("assistance" "bagage" "embarquement" "event_log" "exception" "face_auth" "fauteuil" "filtrage" "home" "login" "overlay" "profile")
for screen in "${SCREENS[@]}"; do
  echo "// Écran ${screen^}" > $ROOT_DIR/screens/${screen}_screen.dart
done

# Création des fichiers dans navigation/
echo "// Configuration de la navigation" > $ROOT_DIR/navigation/main_navigator.dart

# Création des fichiers dans providers/
echo "// Gestion de l'état des agents" > $ROOT_DIR/providers/agent_provider.dart
echo "// Gestion des préférences d'accessibilité (daltonisme...)" > $ROOT_DIR/providers/color_blind_provider.dart

# Création des fichiers dans widgets/
echo "// Composant pour les options d'accessibilité" > $ROOT_DIR/widgets/color_blind_widget.dart

# Création des fichiers dans constants/
echo "// Définition des styles et couleurs" > $ROOT_DIR/constants/styles.dart

echo "✅ Structure du projet Flutter créée avec succès !"
