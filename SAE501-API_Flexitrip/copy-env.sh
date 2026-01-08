#!/bin/bash
# ==============================================================================
# SCRIPT BASH: Copier le fichier .env local vers .env
# ==============================================================================
# Ce script permet de copier facilement votre fichier de configuration personnelle
# (.env.local.dev1 ou .env.local.dev2) vers le fichier .env qui est utilisé par
# l'application.
#
# UTILISATION:
#   ./copy-env.sh dev1    (pour le développeur 1)
#   ./copy-env.sh dev2    (pour le développeur 2 / binôme)
#
# AVANT DE LANCER DOCKER:
# Toujours exécuter ce script pour copier votre configuration avant de lancer
# docker-compose up -d
# ==============================================================================

# Vérifier que le paramètre est fourni
if [ -z "$1" ]; then
    echo ""
    echo "============================================================"
    echo "  Configuration de l'environnement pour le développeur"
    echo "============================================================"
    echo ""
    echo "✗ ERREUR: Paramètre manquant !"
    echo ""
    echo "Usage: ./copy-env.sh [dev1|dev2]"
    echo ""
    echo "  dev1  - Pour le développeur 1"
    echo "  dev2  - Pour le développeur 2 (binôme)"
    echo ""
    exit 1
fi

DEV=$1

# Vérifier que le paramètre est valide
if [ "$DEV" != "dev1" ] && [ "$DEV" != "dev2" ]; then
    echo ""
    echo "✗ ERREUR: Paramètre invalide '$DEV'"
    echo ""
    echo "Le paramètre doit être 'dev1' ou 'dev2'"
    echo ""
    exit 1
fi

# Construire le nom du fichier source
ENV_FILE=".env.local.$DEV"
DESTINATION_FILE=".env"

echo "============================================================"
echo "  Configuration de l'environnement pour le développeur"
echo "============================================================"
echo ""

# Vérifier si le fichier source existe
if [ ! -f "$ENV_FILE" ]; then
    echo "✗ ERREUR: Le fichier '$ENV_FILE' n'existe pas !"
    echo ""
    echo "Pour créer ce fichier:"
    echo "  1. Copiez le fichier .env.example"
    echo "  2. Renommez-le en '$ENV_FILE'"
    echo "  3. Personnalisez les valeurs selon vos besoins"
    echo ""
    exit 1
fi

# Copier le fichier
cp "$ENV_FILE" "$DESTINATION_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Succès ! Fichier .env créé depuis $ENV_FILE"
    echo ""
    echo "Configuration active: Développeur $DEV"
    echo ""
    echo "Vous pouvez maintenant lancer Docker:"
    echo "  docker-compose up -d"
    echo ""
else
    echo "✗ ERREUR lors de la copie du fichier"
    echo ""
    exit 1
fi

