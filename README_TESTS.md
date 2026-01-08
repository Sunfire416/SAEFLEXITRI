# 🚀 FlexiTrip PMR - Guide de Test Complet

## ✅ Corrections Appliquées

### 🔴 **Problèmes Critiques Résolus**

1. **✅ Système de notifications corrigé**
   - Correction de `notificationController.js` pour utiliser MongoDB correctement
   - Remplacement de `findByPk()` par `findById()`
   - Plus d'erreur 500 sur `/notification/count`

2. **✅ Affichage QR Codes amélioré**
   - QR codes générés et stockés en base lors de la création
   - Affichage dans "Mes Voyages" via `qr_code_data`

3. **✅ Dates de début/fin ajoutées**
   - `VoyageCard.js` affiche maintenant `Date_depart` et `Date_arrivee`
   - Format français : "07 janv. 2026, 14:30"

4. **✅ Nom du transport affiché**
   - Badge de transport dans la carte voyage
   - Icônes : 🚌 bus, 🚄 train, ✈️ avion, 🚕 taxi, multimodal

5. **✅ Support multimodal complet**
   - ENUM `Type_Transport` étendu : 'bus', 'train', 'avion', 'taxi', 'multimodal'
   - Fonction `normalizeTransportType()` pour mapping
   - Détection automatique dans workflow MODERATE

6. **✅ Interface Check-in créée**
   - Nouveau composant `CheckInInterface.js`
   - Endpoints backend `/api/checkin/:reservationId`
   - Génération boarding pass avec porte, siège, heure

---

## 🌐 URLs de Test - Frontend

### **🏠 Pages Principales**
```
http://localhost:3000/                    - Accueil
http://localhost:3000/login               - Connexion
http://localhost:3000/register            - Inscription
http://localhost:3000/search              - Recherche de trajets
```

### **👤 Espace Utilisateur**
```
http://localhost:3000/user/voyages        - Mes Voyages (dates + transport)
http://localhost:3000/user/profile        - Profil
http://localhost:3000/user/wallet         - Portefeuille
```

### **🆕 Nouvelles Fonctionnalités**
```
http://localhost:3000/user/checkin/:id    - Check-in manuel
http://localhost:3000/user/voyages        - QR codes affichés
```

---

## 🧪 Scénarios de Test

### **Test 1 : Voyage Simple (Bus/Train)**
1. Connectez-vous : `admin@flexitrip.com` / `admin123`
2. Allez sur `/search`
3. Recherche : Paris → Lyon (< 500 km)
4. Cliquez "Réserver" sur un résultat
5. **Vérifiez** :
   - ✅ Réservation créée
   - ✅ Wallet déduit
   - ✅ Redirection vers résultat avec QR
6. Allez sur `/user/voyages`
7. **Vérifiez** :
   - ✅ Voyage affiché avec dates début/fin
   - ✅ Badge transport (🚌 ou 🚄)
   - ✅ Bouton "Voir QR"
   - ✅ QR code s'affiche dans la modal

### **Test 2 : Voyage Multimodal**
1. Recherche : Paris → Milan (> 500 km)
2. Sélectionnez un itinéraire avec vol
3. Cliquez "Réserver"
4. **Vérifiez** :
   - ✅ Type_Transport = "multimodal"
   - ✅ QR contient liste des segments
   - ✅ Prix calculé (environ 200€)
5. Dans "Mes Voyages" :
   - ✅ Badge "multimodal"
   - ✅ Dates correctes
   - ✅ QR code fonctionnel

### **Test 3 : Check-in Manuel**
1. Dans "Mes Voyages", cliquez sur un voyage
2. Cliquez "Check-in" (si disponible)
3. OU allez sur `/user/checkin/:reservationId`
4. **Vérifiez** :
   - ✅ Informations voyage affichées
   - ✅ Bouton "Effectuer le check-in"
5. Cliquez sur le bouton
6. **Vérifiez** :
   - ✅ Boarding pass généré
   - ✅ Porte, siège, heure affichés
   - ✅ QR code d'embarquement
7. Testez "Annuler check-in"
8. **Vérifiez** :
   - ✅ Boarding pass supprimé
   - ✅ Retour à l'état initial

### **Test 4 : Notifications**
1. Ouvrez la console navigateur (F12)
2. Vérifiez qu'il n'y a plus d'erreur :
   - ❌ ~~"Notification.findByPk is not a function"~~
   - ✅ Appels `/notification/count` réussis (ou 404 si pas de notifications)

---

## 🔧 Configuration

### **Variables d'environnement Backend**
```env
PORT=17777
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=flexitrip_secret_key_2024
MONGO_URI=mongodb://flexitrip_mongodb:27017/flexitrip
REDIS_URL=redis://flexitrip_redis:6379
```

### **Variables d'environnement Frontend**
```env
REACT_APP_API_URL=http://localhost:17777
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

---

## 📊 État des Fonctionnalités

| Fonctionnalité | Status | URL Test |
|----------------|--------|----------|
| ✅ Recherche multimodale | FONCTIONNEL | `/search` |
| ✅ Réservation adaptative | FONCTIONNEL | `/search` → Réserver |
| ✅ QR Codes | FONCTIONNEL | `/user/voyages` |
| ✅ Dates début/fin | FONCTIONNEL | `/user/voyages` |
| ✅ Badge transport | FONCTIONNEL | `/user/voyages` |
| ✅ Check-in manuel | FONCTIONNEL | `/user/checkin/:id` |
| ✅ Notifications (backend) | CORRIGÉ | API fonctionnelle |
| ✅ Wallet/déduction | FONCTIONNEL | Automatique |
| ⚠️ Suivi temps réel | PARTIEL | Backend ready, UI à compléter |
| ⚠️ Historique wallet | BACKEND READY | UI à créer |
| ⚠️ Interface agent PMR | BACKEND READY | UI à créer |
| ⚠️ Système feedback | À IMPL ÉMENTER | - |
| ⚠️ Gestion incidents | À IMPLÉMENTER | - |

---

## 🐛 Débogage

### **Backend ne démarre pas**
```bash
cd SAE501-API_Flexitrip
docker-compose logs api
# Vérifier : MySQL, MongoDB, Redis connectés
```

### **Frontend erreur 404**
```bash
cd SAE501-Web/flexitrip
npm start
# Vérifier port 3000 libre
```

### **QR codes vides**
1. Vérifier en base :
   ```sql
   SELECT reservation_id, qr_code_data FROM reservations WHERE user_id=6 LIMIT 1;
   ```
2. Si NULL → Bug création, vérifier `bookingService.js`
3. Si présent → Bug frontend, vérifier `VoyageQRModal.js`

### **Notifications 500**
- **Avant correction** : `Notification.findByPk is not a function`
- **Après correction** : Appels réussis
- Si persiste : vérifier `models/Notification.js` est bien MongoDB

---

## 🚀 Démarrage Rapide

### **1. Backend**
```bash
cd SAE501-API_Flexitrip
docker-compose up -d
# Attendre 30 secondes pour l'initialisation
docker logs flexitrip_api
# Vérifier : "Server is running on port 17777"
```

### **2. Frontend**
```bash
cd SAE501-Web/flexitrip
npm install
npm start
# Ouvre automatiquement http://localhost:3000
```

### **3. Test Utilisateur**
- **Email** : `admin@flexitrip.com`
- **Mot de passe** : `admin123`
- **Solde initial** : 1000€

---

## 📈 Prochaines Étapes

### **Phase 1 - Complétions UI (Priorité Haute)**
1. **Historique Wallet**
   - Endpoint backend déjà prêt
   - Créer `WalletHistory.js`
   - Afficher liste transactions + solde

2. **Suivi Temps Réel**
   - Backend WebSocket en place
   - Créer `VoyageTracking.js`
   - Carte interactive avec position

3. **Interface Agent PMR**
   - Backend agents fonctionnel
   - Créer `AgentDashboard.js`
   - Liste missions + navigation

### **Phase 2 - Nouvelles Features (Priorité Moyenne)**
4. **Système Feedback**
   - Backend review controller
   - UI notation étoiles
   - Commentaires accessibilité

5. **Gestion Incidents**
   - Service alertes en temps réel
   - UI proposition réacheminement
   - Notifications push

### **Phase 3 - Optimisations (Priorité Basse)**
6. **Mode Hors Ligne**
   - Service Worker
   - Cache QR codes
   - Sync différée

7. **Export Calendrier**
   - Génération fichiers .ics
   - Intégration Google Calendar

---

## ❓ Support

**Problèmes courants** :
- Port 17777 occupé → Changer dans `docker-compose.yml` et `.env`
- CORS errors → Vérifier `REACT_APP_API_URL`
- JWT expired → Se reconnecter

**Logs utiles** :
```bash
# Backend
docker logs flexitrip_api -f

# Frontend
# Console navigateur (F12)

# Base de données
docker exec flexitrip_mysql mysql -u root -proot SAE_Multi
```

---

## 📝 Notes de Version

### **v1.5.0 - 07/01/2026**
- ✅ Correction système notifications
- ✅ Ajout dates début/fin dans Mes Voyages
- ✅ Affichage nom transport
- ✅ Support multimodal complet
- ✅ Interface check-in manuel
- ✅ QR codes fonctionnels

### **v1.4.0**
- Migration Google Maps API
- Booking adaptatif (4 workflows)
- Calcul prix + déduction wallet

---

**Bon test ! 🎉**
