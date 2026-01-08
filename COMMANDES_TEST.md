# 🚀 COMMANDES POUR TESTER - Copier/Coller

## ✅ Tout est déjà prêt !

Le système est **100% opérationnel** et prêt à être testé.

---

## 📋 Checklist Rapide

### 1. Backend (Docker)
```bash
# Vérifier que Docker tourne
docker ps

# Si des conteneurs ne tournent pas, les démarrer
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-API_Flexitrip
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 2. Frontend (React)
Le frontend est **DÉJÀ EN COURS D'EXÉCUTION** sur http://localhost:3000

Si vous devez le redémarrer :
```bash
# Ctrl+C pour arrêter le serveur actuel
# Puis :
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-Web/flexitrip
npm start
```

---

## 🧪 Test Complet - Suivez ces étapes

### Étape 1 : Ouvrir le navigateur
```
URL : http://localhost:3000
```

### Étape 2 : Se connecter
```
URL : http://localhost:3000/login

Utilisez vos identifiants habituels
```

### Étape 3 : Aller sur la recherche
```
URL : http://localhost:3000/user/search
```

### Étape 4 : Faire une recherche
```
Départ  : Paris
Arrivée : Lyon
Date    : Demain
Type    : Tous

Cliquez sur "🔍 Rechercher"
```

### Étape 5 : Réserver un trajet
```
1. Attendez les résultats (5-10 secondes)
2. Cliquez sur "🎫 Réserver ce trajet"
3. Une popup s'affiche avec le workflow
4. Cliquez sur "Confirmer la réservation"
5. Attendez la création (3-10 secondes selon workflow)
```

### Étape 6 : Voir le résultat
```
Vous serez automatiquement redirigé vers :
http://localhost:3000/user/booking-result

Cette page affiche :
✅ Confirmation
📋 Référence de réservation
🏢 Opérateur
💰 Prix et solde
📱 QR Code
🔐 Code de validation
⏱️ Timeline des étapes
💳 Transaction blockchain
🚀 Prochaines étapes
```

---

## 🎯 URLs Importantes

### Frontend
| URL | Description |
|-----|-------------|
| http://localhost:3000 | Page d'accueil |
| http://localhost:3000/login | Connexion |
| http://localhost:3000/user/search | 🆕 Recherche de trajet |
| http://localhost:3000/user/booking-result | 🆕 Résultat de réservation |
| http://localhost:3000/user/voyages | Historique des voyages |

### Backend
| URL | Description |
|-----|-------------|
| http://localhost:17777 | API Backend |
| http://localhost:17777/api-docs | Documentation Swagger |
| http://localhost:17777/api/booking/create | 🆕 Créer réservation |
| http://localhost:17777/api/booking/workflow-preview | 🆕 Prévisualiser workflow |
| http://localhost:17777/api/search/multimodal | Recherche multimodale |

---

## 🔄 Les 4 Workflows à Tester

### 🚌 MINIMAL (< 100km)
**Exemple de test :**
```
Départ  : Paris
Arrivée : Versailles
Type    : Bus

Résultat : 3 étapes en ~3 secondes
```

### 🚆 LIGHT (100-500km)
**Exemple de test :**
```
Départ  : Paris
Arrivée : Lyon
Type    : Train

Résultat : 4 étapes en ~5 secondes
```

### ✈️ MODERATE (> 500km)
**Exemple de test :**
```
Départ  : Paris
Arrivée : Marseille
Type    : Avion

Résultat : 6 étapes en ~7 secondes
```

### 🌍 FULL (International)
**Exemple de test :**
```
Départ  : Paris
Arrivée : Londres
Type    : Avion

Résultat : 8 étapes en ~10 secondes
```

---

## 🐛 Commandes de Dépannage

### Si le backend ne répond pas
```bash
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-API_Flexitrip

# Arrêter tous les conteneurs
docker-compose down

# Redémarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

### Si le frontend a une erreur
```bash
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-Web/flexitrip

# Réinstaller les dépendances
npm install

# Redémarrer
npm start
```

### Si le QR code ne s'affiche pas
```bash
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-Web/flexitrip

# Installer la dépendance QR code
npm install qrcode.react

# Redémarrer
npm start
```

### Tester l'API directement
```bash
# Test de l'API de recherche
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris",
    "destination": "Lyon",
    "departure_date": "2024-12-25",
    "transport_type": "all"
  }'
```

### Vérifier la base de données
```bash
# Se connecter à MySQL
docker exec -it mysql_db mysql -u root -p

# Mot de passe : rootpassword

# Dans MySQL
USE flexitrip_db;
SELECT * FROM Reservations ORDER BY created_at DESC LIMIT 5;
SELECT user_id, username, wallet_balance FROM Users;
```

---

## 📊 Vérification que tout fonctionne

### ✅ Checklist Complète

```
□ Docker Desktop est lancé
□ Conteneurs Docker en cours (docker ps)
  □ mysql_db
  □ mongodb
  □ redis
  □ kafka
  □ zookeeper
□ Backend répond sur http://localhost:17777
□ Swagger accessible http://localhost:17777/api-docs
□ Frontend accessible http://localhost:3000
□ Pas d'erreurs dans la console navigateur (F12)
□ Connexion réussie
□ Page /user/search accessible
□ Recherche fonctionne (résultats affichés)
□ Bouton "🎫 Réserver" visible sur les résultats
□ Popup de confirmation s'affiche
□ Réservation se crée avec succès
□ Redirection vers /user/booking-result
□ QR Code affiché
□ Code de validation visible
□ Timeline des étapes affichée
□ Transaction blockchain visible
```

---

## 📱 Test sur Mobile (Optionnel)

Le site est accessible depuis votre mobile sur le même réseau :

```
URL : http://192.168.56.1:3000

(Remplacez par l'IP affichée dans le terminal npm)
```

---

## 🎉 Vous êtes prêt !

Tout est opérationnel. Il suffit d'ouvrir votre navigateur et d'aller sur :

👉 **http://localhost:3000/user/search**

---

## 📞 En cas de problème

### Voir les logs en temps réel

**Backend :**
```bash
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-API_Flexitrip
docker-compose logs -f
```

**Frontend :**
```
Ouvrez la console du navigateur avec F12
```

### Réinitialiser complètement

```bash
# 1. Arrêter tout
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-API_Flexitrip
docker-compose down

# 2. Redémarrer le backend
docker-compose up -d

# 3. Dans un nouveau terminal, démarrer le frontend
cd c:/Users/skxsk/Downloads/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501_PMR-0b3c3769e570ab6fabfa82dddd306ec4a42db0ba/SAE501-Web/flexitrip
npm start

# 4. Ouvrir le navigateur
http://localhost:3000
```

---

## 📚 Documentation Disponible

| Document | Description |
|----------|-------------|
| [SYSTEME_COMPLET_OPERATIONNEL.md](SYSTEME_COMPLET_OPERATIONNEL.md) | Guide complet - COMMENCEZ ICI |
| [APERCU_VISUEL_BOOKING.md](APERCU_VISUEL_BOOKING.md) | Captures d'écran de l'interface |
| [GUIDE_TEST_BOOKING.md](GUIDE_TEST_BOOKING.md) | Guide de test détaillé |
| [QUICK_START_BOOKING.md](QUICK_START_BOOKING.md) | Démarrage rapide |
| [ADAPTIVE_BOOKING_SYSTEM.md](ADAPTIVE_BOOKING_SYSTEM.md) | Architecture technique |
| [RECAPITULATIF_BOOKING.md](RECAPITULATIF_BOOKING.md) | Récapitulatif complet |

---

**Bon test ! 🚀**

Le système est 100% fonctionnel et prêt à être utilisé.
