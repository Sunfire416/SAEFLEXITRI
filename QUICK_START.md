# 🚀 Guide de Démarrage Rapide - FlexiTrip PMR

## ⚡ Installation Express (5 minutes)

### 1️⃣ Prérequis
```bash
Node.js >= 16.x
MySQL >= 8.0
MongoDB >= 5.0
Redis >= 6.0
```

### 2️⃣ Cloner & Installer

```bash
# Cloner le repository
git clone [repo-url]
cd SAE501_PMR

# Backend
cd SAE501-API_Flexitrip
npm install
cp .env.example .env

# Frontend
cd ../SAE501-Web/flexitrip
npm install
cp .env.example .env
```

### 3️⃣ Configurer Google Maps API (200$/mois GRATUIT)

#### Google Maps API (REQUIS)
1. Aller sur https://console.cloud.google.com/
2. Créer un nouveau projet "FlexiTrip PMR"
3. Activer la facturation (carte requise - pas de débit automatique)
4. Activer les APIs :
   - **Directions API**
   - **Places API**
   - **Geocoding API**
5. Créer une clé API (Credentials > Create Credentials > API key)
6. Copier la clé dans `.env` :
   ```
   GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
   ```

**Note** : 200$ gratuit/mois = ~40,000 requêtes gratuites !

#### Aviationstack API (Optionnel - 100 req/mois gratuit)
1. Aller sur https://aviationstack.com/
2. S'inscrire au plan gratuit
3. Copier la clé dans `.env` :
   ```
   AVIATIONSTACK_API_KEY=votre_cle_ici
   ```

### 4️⃣ Démarrer l'application

**Terminal 1 - Backend avec Docker :**
```bash
cd SAE501-API_Flexitrip
docker compose up -d
```
➡️ API disponible sur http://localhost:17777  
➡️ Voir les logs : `docker compose logs -f`  
➡️ Arrêter : `docker compose down`

**Terminal 2 - Frontend :**
```bash
cd SAE501-Web/flexitrip
npm start
```
➡️ App disponible sur http://localhost:3000

### 5️⃣ Documentation API
Ouvrir http://localhost:17777/docs pour voir Swagger

---

## 🧪 Test rapide des nouvelles fonctionnalités

### Test 1 : Recherche multimodale
```bash
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris",
    "destination": "Lyon",
    "date": "2026-01-20T08:00:00Z",
    "pmr_needs": {
      "mobility_aid": "wheelchair",
      "wheelchair_type": "manual"
    }
  }'
```

### Test 2 : Validation deadline assistance
```bash
curl -X POST http://localhost:17777/api/search/validate-booking-deadlines \
  -H "Content-Type: application/json" \
  -d '{
    "voyage": {
      "segments": [{
        "operator": "SNCF",
        "mode": "train",
        "departure_time": "2026-01-25T10:00:00Z"
      }]
    }
  }'
```

### Test 3 : Profil PMR
Ouvrir http://localhost:3000/user/pmr-profile

### Test 4 : Dashboard Admin
Ouvrir http://localhost:3000/admin/dashboard

---

## 🎯 Comptes de test par défaut

### Utilisateur PMR
- **Email** : pmr@flexitrip.com
- **Mot de passe** : pmr123

### Agent PMR
- **Email** : agent@flexitrip.com
- **Mot de passe** : agent123

### Administrateur
- **Email** : admin@flexitrip.com
- **Mot de passe** : admin123

---

## 📂 Structure du projet

```
SAE501_PMR/
├── SAE501-API_Flexitrip/          # Backend Node.js
│   ├── services/
│   │   ├── searchService.js       # ✨ Recherche multimodale
│   │   ├── workflowService.js     # ✨ Workflows par transport
│   │   ├── assistanceCoordinationService.js  # ✨ Coordination
│   │   ├── perturbationService.js # ✨ Gestion retards
│   │   └── assistanceBookingService.js       # ✨ Réservations
│   ├── controllers/
│   │   ├── searchControllerV2.js  # ✨ Controller recherche
│   │   └── assistanceController.js # ✨ Controller assistance
│   └── routes/
│       ├── searchRoutesV2.js      # ✨ Routes recherche
│       └── assistanceRoutes.js    # ✨ Routes assistance
│
└── SAE501-Web/flexitrip/          # Frontend React
    └── src/
        └── components/
            ├── PMR/
            │   └── PMRProfileForm.js   # ✨ Formulaire profil PMR
            └── Admin/
                └── AdminDashboard.js   # ✨ Dashboard admin

✨ = Nouveaux fichiers créés
```

---

## 🔌 Endpoints principaux

### Recherche & Planification
- `POST /api/search/multimodal` - Recherche itinéraires
- `POST /api/search/validate-booking-deadlines` - Valider délais
- `POST /api/search/define-workflow` - Définir workflow voyage

### Assistance & Coordination
- `POST /api/assistance/book` - Réserver assistance segment
- `POST /api/assistance/book-voyage` - Réserver assistance voyage complet
- `POST /api/assistance/plan-transfer` - Planifier transfert
- `POST /api/assistance/monitor-voyage` - Monitoring temps réel
- `POST /api/assistance/handle-delay` - Gérer retard
- `POST /api/assistance/suggest-alternatives` - Proposer alternatives

### Notifications (existant)
- `GET /notifications?user_id=X` - Liste notifications
- `PATCH /notifications/:id/read` - Marquer lu

### Voyages (existant)
- `GET /voyages/history?user_id=X` - Historique
- `GET /voyages/:id/qr` - QR code voyage

---

## 🎨 Composants Frontend

### Pages accessibles
- `/` - Accueil
- `/login` - Connexion
- `/signup` - Inscription
- `/user/home` - Dashboard utilisateur
- `/user/pmr-profile` - ✨ Profil PMR détaillé
- `/user/notifications` - Centre notifications
- `/user/voyages` - Historique voyages
- `/admin/dashboard` - ✨ Dashboard admin
- `/search` - Recherche (à améliorer avec nouveaux filtres)

---

## 🐛 Débogage

### Problème : Google Maps API ne répond pas
**Solution :** Vérifier que la clé API est valide et que les APIs sont activées
```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Paris&key=VOTRE_CLE"
```

**Vérifier aussi :**
- APIs activées : Directions, Places, Geocoding
- Facturation configurée dans Google Cloud Console
- Attendre 5-10 min après création de la clé

### Problème : MongoDB connexion refusée
**Solution :** Vérifier que MongoDB est démarré
```bash
sudo systemctl start mongod
# ou
brew services start mongodb-community
```

### Problème : CORS error
**Solution :** Vérifier `.env` backend :
```
CORS_ORIGIN=http://localhost:3000
```

### Logs backend
```bash
cd SAE501-API_Flexitrip
tail -f logs/app.log
```

---

## 📊 Vérifier que tout fonctionne

### ✅ Checklist santé application

**Backend :**
- [ ] API démarre sur port 17777
- [ ] Swagger accessible http://localhost:17777/docs
- [ ] MySQL connecté (voir logs)
- [ ] MongoDB connecté (voir logs)
- [ ] Redis connecté (voir logs)

**Frontend :**
- [ ] App démarre sur port 3000
- [ ] Login fonctionne
- [ ] Notifications s'affichent
- [ ] Formulaire PMR profile accessible

**Nouveaux services :**
- [ ] Recherche multimodale retourne résultats
- [ ] Validation deadlines fonctionne
- [ ] Dashboard admin affiche agents
- [ ] Profil PMR se sauvegarde

---

## 🚦 Prochaines étapes

1. **Tester les workflows complets**
   - Créer un voyage multimodal
   - Vérifier assignation agents
   - Tester notifications

2. **Personnaliser le profil PMR**
   - Remplir tous les champs
   - Tester impact sur recherche

3. **Explorer le dashboard admin**
   - Voir missions du jour
   - Réassigner agents
   - Consulter timeline

4. **Intégrer APIs compagnies** (Phase 2)
   - Air France
   - FlixBus
   - Autres opérateurs

---

## 💡 Astuces

### Rechargement automatique backend
```bash
npm install -g nodemon
nodemon app.js
```

### Reset base de données
```bash
npm run db:reset
```

### Générer données de test
```bash
npm run seed:test-data
```

### Activer mode debug
Dans `.env` :
```
LOG_LEVEL=debug
```

---

## 📞 Besoin d'aide ?

- **Documentation complète** : [README_PMR_MULTIMODAL.md](README_PMR_MULTIMODAL.md)
- **API Docs** : http://localhost:17777/docs
- **Issues GitHub** : [Créer une issue](repo/issues)

---

**Bon développement ! 🦽✈️🚆**
