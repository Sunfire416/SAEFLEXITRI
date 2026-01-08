# 🎯 Guide de Test - Système de Réservation Adaptatif

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Démarrage du système](#démarrage-du-système)
3. [Étapes de test](#étapes-de-test)
4. [URLs et Pages](#urls-et-pages)
5. [Workflows disponibles](#workflows-disponibles)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

### Backend
- Docker Desktop installé et lancé
- Tous les conteneurs en cours d'exécution :
  ```bash
  mysql_db       - Port 3306
  mongodb        - Port 27017
  redis          - Port 6379
  zookeeper      - Port 2181
  kafka          - Port 9092
  ```

### Frontend
- Node.js v18+
- Navigateur moderne (Chrome, Firefox, Edge)

---

## 🚀 Démarrage du système

### 1. Démarrer le backend (API)
```bash
cd SAE501-API_Flexitrip
docker-compose up -d
```

Vérifiez que le backend fonctionne :
- API: http://localhost:17777
- Swagger: http://localhost:17777/api-docs

### 2. Démarrer le frontend
```bash
cd SAE501-Web/flexitrip
npm install
npm start
```

Le frontend devrait s'ouvrir automatiquement sur :
- Frontend: http://localhost:3000

---

## 🧪 Étapes de test

### Étape 1 : Connexion
1. Accédez à http://localhost:3000/login
2. Connectez-vous avec vos identifiants
3. Vous serez redirigé vers http://localhost:3000/user/home

### Étape 2 : Recherche de trajet
1. Accédez à **http://localhost:3000/user/search**
2. Remplissez le formulaire :
   - **Départ** : Paris (ou autre ville)
   - **Arrivée** : Lyon (ou autre destination)
   - **Date** : Date future
   - **Type** : Bus / Train / Avion

3. Cliquez sur "🔍 Rechercher"
4. Attendez les résultats (5-10 secondes)

### Étape 3 : Réservation
1. Vous verrez plusieurs trajets proposés
2. Chaque trajet affiche :
   - Prix
   - Durée
   - Distance
   - Itinéraire détaillé
   - **Bouton "🎫 Réserver ce trajet"**

3. Cliquez sur "🎫 Réserver ce trajet"
4. Une fenêtre de confirmation s'affiche avec :
   - Type de workflow (MINIMAL/LIGHT/MODERATE/FULL)
   - Étapes requises
   - Temps estimé

5. Cliquez sur "Confirmer la réservation"

### Étape 4 : Résultat de réservation
Vous serez automatiquement redirigé vers **http://localhost:3000/user/booking-result**

Cette page affiche :
- ✅ Confirmation de réservation
- 📋 Référence de réservation
- 🏢 Opérateur
- 💰 Prix et solde
- 📱 QR Code de voyage
- 🔐 Code de validation
- ⏱️ Timeline des étapes effectuées
- 💳 Transaction blockchain
- 🚀 Prochaines étapes

---

## 🌐 URLs et Pages

### Pages Publiques
| URL | Description |
|-----|-------------|
| http://localhost:3000/ | Page d'accueil |
| http://localhost:3000/login | Connexion |
| http://localhost:3000/signup | Inscription |
| http://localhost:3000/search | Recherche publique |

### Pages Protégées (Utilisateur connecté)
| URL | Description |
|-----|-------------|
| http://localhost:3000/user/home | Dashboard utilisateur |
| http://localhost:3000/user/search | 🆕 Recherche de trajet |
| http://localhost:3000/user/booking-result | 🆕 Résultat de réservation |
| http://localhost:3000/user/voyages | Historique des voyages |
| http://localhost:3000/user/notifications | Centre de notifications |
| http://localhost:3000/user/profile | Profil utilisateur |
| http://localhost:3000/user/ewallet | Portefeuille électronique |

### API Endpoints (Backend)
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| http://localhost:17777/api/booking/create | POST | 🆕 Créer une réservation |
| http://localhost:17777/api/booking/workflow-preview | POST | 🆕 Prévisualiser le workflow |
| http://localhost:17777/api/booking/:id | GET | 🆕 Récupérer une réservation |
| http://localhost:17777/api/search/multimodal | POST | Recherche multimodale |
| http://localhost:17777/api-docs | GET | Documentation Swagger |

---

## 🔄 Workflows disponibles

### 1. MINIMAL (Trajet < 100km, Bus)
**Étapes automatiques :**
- ✅ Wallet check (500ms)
- ✅ Réservation opérateur (2-3s)
- ✅ Génération QR code

**Exemple de test :**
- Paris → Versailles (20km)
- Paris → Fontainebleau (60km)

---

### 2. LIGHT (Trajet 100-500km, Train)
**Étapes automatiques :**
- ✅ Wallet check (500ms)
- ✅ Réservation opérateur (2-3s)
- ✅ Assistance PMR booking (si nécessaire)
- ✅ Génération QR code

**Exemple de test :**
- Paris → Lyon (465km)
- Paris → Bordeaux (500km)

---

### 3. MODERATE (Trajet > 500km, Vol national)
**Étapes automatiques :**
- ✅ Wallet check (500ms)
- ✅ Réservation opérateur (2-3s)
- ✅ Assistance PMR booking
- ✅ Check-in automatique
- ✅ Carte d'embarquement
- ✅ Génération QR code

**Exemple de test :**
- Paris → Marseille (660km)
- Paris → Nice (690km)

---

### 4. FULL (Vol international)
**Étapes automatiques :**
- ✅ Vérification passeport OCR (1.5s)
- ✅ Face matching biométrique (1s)
- ✅ Wallet check (500ms)
- ✅ Réservation opérateur (2-3s)
- ✅ Assistance PMR booking
- ✅ Check-in automatique
- ✅ Carte d'embarquement
- ✅ Génération QR code

**Exemple de test :**
- Paris → Londres
- Paris → New York

---

## 🐛 Troubleshooting

### Problème : "Aucun résultat trouvé"
**Solution :**
- Vérifiez que le backend est en cours d'exécution
- Testez l'API sur Swagger : http://localhost:17777/api-docs
- Consultez les logs Docker : `docker-compose logs -f`

### Problème : "Authentification requise"
**Solution :**
- Vous devez être connecté pour réserver
- Accédez à http://localhost:3000/login
- Vérifiez que votre token JWT est valide

### Problème : "Solde insuffisant"
**Solution :**
- Vérifiez votre solde wallet dans la DB :
  ```sql
  SELECT user_id, wallet_balance FROM Users WHERE user_id = YOUR_ID;
  ```
- Ajoutez du crédit manuellement si nécessaire :
  ```sql
  UPDATE Users SET wallet_balance = 500 WHERE user_id = YOUR_ID;
  ```

### Problème : Navigation ne fonctionne pas
**Solution :**
- Vérifiez que toutes les routes sont bien définies dans App.js
- Rechargez la page avec Ctrl+Shift+R (hard refresh)
- Videz le cache du navigateur

### Problème : QR Code ne s'affiche pas
**Solution :**
- Vérifiez que `qrcode.react` est installé :
  ```bash
  npm install qrcode.react
  ```
- Rechargez le frontend

### Problème : Erreur CORS
**Solution :**
- Vérifiez la configuration CORS dans `app.js` backend
- Le frontend doit être sur http://localhost:3000
- Le backend doit accepter cette origine

---

## 📊 Données de Test

### Utilisateur de test
```sql
-- Créer un utilisateur avec solde wallet
INSERT INTO Users (username, email, password, wallet_balance, is_pmr) 
VALUES ('test_user', 'test@flexitrip.com', 'hashed_password', 500.00, TRUE);
```

### Trajets recommandés pour tester chaque workflow
| Workflow | Départ | Arrivée | Distance | Type |
|----------|--------|---------|----------|------|
| MINIMAL | Paris | Versailles | ~20km | Bus |
| LIGHT | Paris | Lyon | ~465km | Train |
| MODERATE | Paris | Marseille | ~660km | Avion |
| FULL | Paris | Londres | ~340km | Avion International |

---

## 📝 Checklist de Test

- [ ] Backend démarré (docker-compose up)
- [ ] Frontend démarré (npm start)
- [ ] Connexion réussie
- [ ] Recherche fonctionne (résultats affichés)
- [ ] Bouton "Réserver" visible
- [ ] Workflow preview s'affiche
- [ ] Réservation créée avec succès
- [ ] Redirection vers /user/booking-result
- [ ] QR Code affiché correctement
- [ ] Code de validation visible
- [ ] Timeline des étapes affichée
- [ ] Transaction blockchain enregistrée
- [ ] Bouton "Voir mes voyages" fonctionne
- [ ] Bouton "Nouvelle recherche" fonctionne

---

## 🎉 Test Réussi !

Si tous les points de la checklist sont validés, votre système de réservation adaptatif fonctionne parfaitement !

Vous pouvez maintenant :
1. Tester différents types de trajets
2. Vérifier l'historique dans `/user/voyages`
3. Consulter les notifications dans `/user/notifications`
4. Gérer votre portefeuille dans `/user/ewallet`

---

## 📞 Support

En cas de problème, consultez :
- **Logs Backend** : `docker-compose logs -f`
- **Console Frontend** : F12 dans le navigateur
- **Documentation API** : http://localhost:17777/api-docs
- **Fichiers de documentation** :
  - `ADAPTIVE_BOOKING_SYSTEM.md` : Détails techniques
  - `QUICK_START_BOOKING.md` : Guide rapide
  - `RECAPITULATIF_BOOKING.md` : Récapitulatif complet

---

## 🔥 Prochaines Fonctionnalités

- [ ] Annulation de réservation
- [ ] Modification de réservation
- [ ] Partage de trajet
- [ ] Notifications temps réel
- [ ] Chat avec agent PMR
- [ ] Historique détaillé avec filtres
- [ ] Export PDF de la réservation
- [ ] Intégration Apple/Google Wallet

---

**Développé avec ❤️ pour FlexiTrip - Système PMR Multimodal**
