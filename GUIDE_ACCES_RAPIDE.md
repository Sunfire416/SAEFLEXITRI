# 🎉 FlexiTrip PMR - Accès Rapide & Tests

## 🌐 URLs Frontend - Accès Direct

### **🏠 Pages Publiques**
```
✅ http://localhost:3000/
   → Accueil du site

✅ http://localhost:3000/login
   → Connexion (Email: admin@flexitrip.com | Pass: admin123)

✅ http://localhost:3000/register
   → Inscription nouveau compte

✅ http://localhost:3000/search
   → Recherche de trajets multimodaux
```

### **👤 Espace Utilisateur Connecté**
```
✅ http://localhost:3000/user/profile
   → Profil utilisateur

✅ http://localhost:3000/user/voyages
   → Mes Voyages (AMÉLIORÉ : dates + transport + QR)

✅ http://localhost:3000/user/wallet
   → Portefeuille (solde, transactions)

🆕 http://localhost:3000/user/checkin/:reservationId
   → Check-in manuel (remplacer :reservationId par un ID réel)
   Exemple: http://localhost:3000/user/checkin/1
```

---

## 🧪 Parcours de Test Recommandé

### **🎯 Test Complet (15 minutes)**

#### **Étape 1 : Connexion**
1. Allez sur `http://localhost:3000/login`
2. Credentials:
   - **Email** : `admin@flexitrip.com`
   - **Password** : `admin123`
3. ✅ Vérifiez : Redirection vers dashboard

#### **Étape 2 : Recherche & Réservation**
1. Allez sur `http://localhost:3000/search`
2. Recherche : **Paris → Lyon** (voyage simple)
3. Cliquez sur "Réserver" sur un résultat
4. ✅ Vérifiez :
   - Workflow déterminé (MINIMAL ou LIGHT)
   - Prix calculé
   - Confirmation réservation
   - Redirection vers résultat

#### **Étape 3 : Mes Voyages - Nouvelles Features**
1. Allez sur `http://localhost:3000/user/voyages`
2. ✅ **NOUVEAU** : Vérifiez affichage :
   - **Date de début** : Affichée dans la carte
   - **Date de fin** : Affichée dans la carte
   - **Badge transport** : 🚌 bus, 🚄 train, ✈️ avion
3. Cliquez sur "Voir QR"
4. ✅ Vérifiez :
   - QR code s'affiche dans modal
   - Informations réservation visibles

#### **Étape 4 : Check-in Manuel**
1. Dans "Mes Voyages", notez un `reservation_id` (ex: 1, 2, 3...)
2. Allez sur `http://localhost:3000/user/checkin/1` (remplacez 1)
3. ✅ Vérifiez affichage :
   - Informations voyage (départ, arrivée, date)
   - Statut check-in
   - Bouton "Effectuer le check-in"
4. Cliquez "Effectuer le check-in"
5. ✅ Vérifiez génération :
   - **Boarding Pass** : Numéro, porte, siège
   - **Heure embarquement**
   - **QR Code** d'embarquement
6. (Optionnel) Cliquez "Annuler check-in"
7. ✅ Vérifiez : Retour état initial

#### **Étape 5 : Voyage Multimodal**
1. Retour sur `http://localhost:3000/search`
2. Recherche : **Paris → Milan** (> 500 km avec vol)
3. Réservez un itinéraire multimodal
4. ✅ Vérifiez :
   - Type transport = "multimodal"
   - Prix environ 200€
   - Wallet déduit
5. Dans "Mes Voyages" :
   - ✅ Badge "🔀 multimodal"
   - ✅ QR code contient segments

#### **Étape 6 : Vérification Notifications**
1. Ouvrez **Console Navigateur** (F12 → Console)
2. Observez les appels réseau
3. ✅ Vérifiez :
   - **Avant correction** : ❌ Erreur 500 "findByPk is not a function"
   - **Après correction** : ✅ Appels `/notification/count` réussis

---

## 🔧 URLs Backend API (Port 17777)

### **Endpoints Principaux**
```
POST   http://localhost:17777/auth/login
POST   http://localhost:17777/auth/register
GET    http://localhost:17777/voyages/history?user_id=6
GET    http://localhost:17777/voyages/:id/qr?user_id=6
POST   http://localhost:17777/api/booking/create
POST   http://localhost:17777/api/booking/workflow-preview

🆕 POST   http://localhost:17777/checkin/manual
🆕 GET    http://localhost:17777/checkin/status/:reservation_id
```

### **Test API avec cURL**
```bash
# Login
curl -X POST http://localhost:17777/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flexitrip.com","password":"admin123"}'

# Récupérer voyages
curl -X GET "http://localhost:17777/voyages/history?user_id=6"

# Check-in status
curl -X GET "http://localhost:17777/checkin/status/1"
```

---

## 📊 Données de Test

### **Compte Admin**
- **Email** : `admin@flexitrip.com`
- **Password** : `admin123`
- **User ID** : `6`
- **Solde initial** : `1000€`

### **Exemples de Recherche**
| De      | À       | Distance | Workflow | Prix Estimé |
|---------|---------|----------|----------|-------------|
| Paris   | Lyon    | ~400 km  | LIGHT    | ~50€        |
| Paris   | Marseille | ~700 km | MODERATE | ~80€        |
| Paris   | Milan   | ~850 km  | MODERATE | ~200€       |
| Paris   | New York | 5800 km | FULL     | ~500€       |

---

## ✅ Checklist Fonctionnalités

### **Corrections Critiques**
- [x] ✅ Système notifications corrigé (MongoDB)
- [x] ✅ QR codes affichés dans Mes Voyages
- [x] ✅ Dates début/fin affichées
- [x] ✅ Nom transport affiché avec icône
- [x] ✅ Support multimodal complet

### **Nouvelles Interfaces**
- [x] ✅ Interface check-in manuel créée
- [x] ✅ CSS responsive ajouté
- [ ] ⚠️ Suivi temps réel (backend ready, UI manquante)
- [ ] ⚠️ Historique wallet (backend ready, UI manquante)
- [ ] ⚠️ Interface agent PMR (à créer)
- [ ] ⚠️ Système feedback (à créer)

### **Backend Ready**
- [x] ✅ API booking adaptative
- [x] ✅ 4 workflows (MINIMAL, LIGHT, MODERATE, FULL)
- [x] ✅ Calcul prix automatique
- [x] ✅ Déduction wallet
- [x] ✅ Génération QR à la création
- [x] ✅ Check-in endpoints
- [x] ✅ WebSocket configuré
- [x] ✅ Kafka producteur/consommateur

---

## 🐛 Débogage Rapide

### **Backend ne répond pas**
```bash
cd SAE501-API_Flexitrip
docker-compose ps
docker logs flexitrip_api --tail 50
```
✅ Vérifier : "Server is running on port 17777"

### **Frontend erreur au démarrage**
```bash
cd SAE501-Web/flexitrip
npm install
npm start
```
✅ Vérifier : Port 3000 libre

### **QR codes ne s'affichent pas**
1. Vérifier en base :
   ```sql
   SELECT reservation_id, qr_code_data FROM reservations WHERE user_id=6;
   ```
2. Si NULL → Réservez un nouveau voyage
3. Si présent → Vérifier console navigateur (F12)

### **Erreur "Cannot connect to API"**
1. Vérifier `.env` frontend :
   ```
   REACT_APP_API_URL=http://localhost:17777
   ```
2. Redémarrer frontend :
   ```bash
   npm start
   ```

---

## 📚 Documentation Complète

### **Fichiers de Référence**
- 📄 `README_TESTS.md` : Guide complet de test
- 📄 `RAPPORT_IMPLEMENTATION.md` : Détails techniques
- 📄 Ce fichier : Accès rapide

### **Architecture**
```
SAE501-API_Flexitrip/           (Backend - Port 17777)
├── controllers/
│   ├── bookingController.js    ✅ Réservation adaptative
│   ├── notificationController.js ✅ CORRIGÉ - MongoDB
│   └── checkinController.js    ✅ Check-in manuel
├── services/
│   ├── bookingService.js       ✅ QR génération + workflows
│   └── workflowDecisionService.js ✅ 4 workflows
└── models/
    ├── Reservations.js         ✅ ENUM étendu + qr_code_data
    └── Notification.js         ✅ MongoDB model

SAE501-Web/flexitrip/           (Frontend - Port 3000)
├── src/components/
│   ├── Voyages/
│   │   ├── VoyageHistory.js    ✅ Liste voyages
│   │   ├── VoyageCard.js       ✅ AMÉLIORÉ - Dates + transport
│   │   └── VoyageQRModal.js    ✅ Affichage QR
│   └── CheckIn/
│       ├── CheckInInterface.js 🆕 CRÉÉ - Interface check-in
│       └── CheckInInterface.css 🆕 CRÉÉ - Styles
```

---

## 🚀 Quick Start

### **1 minute - Démarrage Rapide**
```bash
# Terminal 1 - Backend
cd SAE501-API_Flexitrip
docker-compose up -d

# Terminal 2 - Frontend
cd SAE501-Web/flexitrip
npm start

# Navigateur
# → Ouverture automatique sur http://localhost:3000
```

### **Test Express (2 minutes)**
1. Login : `admin@flexitrip.com` / `admin123`
2. Search : Paris → Lyon
3. Réserver
4. Mes Voyages → **Vérifier dates + transport**
5. Voir QR → **Vérifier affichage**

---

## 📞 Support

**Problèmes fréquents** :
- **Port occupé** : Changer dans `docker-compose.yml`
- **CORS error** : Vérifier `REACT_APP_API_URL`
- **JWT expired** : Se reconnecter

**Logs** :
```bash
docker logs flexitrip_api -f       # Backend
docker logs flexitrip_mysql -f     # Base de données
# Console navigateur (F12)          # Frontend
```

---

**🎉 Tout est prêt ! Bonne exploration !**

**Questions ?** Consultez `README_TESTS.md` pour plus de détails.
