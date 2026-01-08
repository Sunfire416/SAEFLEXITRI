# 🦽 FLEXITRIP PMR - Assistance Multimodale Unifiée

**Version 2.1.0** | **Production Ready** | **6 janvier 2026**

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-APIs-red.svg)](https://maps.google.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 En bref

**FlexiTrip PMR** résout le problème de **fragmentation des services d'assistance** pour les Personnes à Mobilité Réduite dans les transports multimodaux (train, bus, avion).

### Problème
- SNCF : assistance 48h à l'avance
- Avion : procédures par aéroport
- Bus : règles non uniformisées
- ❌ **Ruptures aux correspondances**

### Solution
✅ **Une seule réservation** pour tout le trajet  
✅ **Coordination automatique** des agents  
✅ **Monitoring temps réel** (Google Maps)  
✅ **Alternatives** si retard  
✅ **Profil PMR personnalisé**

---

## 🚀 Démarrage rapide (5 minutes)

### 1. Installer
```bash
# Backend
cd SAE501-API_Flexitrip
npm install
cp .env.example .env

# Frontend
cd ../SAE501-Web/flexitrip
npm install
```

### 2. Configurer Google Maps API
1. Créer compte sur https://console.cloud.google.com/
2. Activer APIs : Directions, Places, Geocoding
3. Copier clé dans `.env` : `GOOGLE_MAPS_API_KEY=xxx`

### 3. Lancer
```bash
# Terminal 1 - Backend
cd SAE501-API_Flexitrip
npm start  # http://localhost:17777

# Terminal 2 - Frontend
cd SAE501-Web/flexitrip
npm start  # http://localhost:3000
```

### 4. Tester
```bash
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{"origin":"Paris","destination":"Lyon","pmr_needs":{"mobility_aid":"wheelchair"}}'
```

**➡️ Guide détaillé** : [QUICK_START.md](QUICK_START.md)

---

## 📚 Documentation

| Document | Description | Lecture |
|----------|-------------|---------|
| **[INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)** | 🗺️ Navigation dans la doc | 5 min |
| **[PROJET_COMPLET.md](PROJET_COMPLET.md)** | ⭐ Vue d'ensemble complète | 15 min |
| **[QUICK_START.md](QUICK_START.md)** | 🚀 Installation rapide | 10 min |
| **[README_PMR_MULTIMODAL.md](README_PMR_MULTIMODAL.md)** | 📖 Documentation technique | 30 min |
| **[MIGRATION_GOOGLE_MAPS.md](MIGRATION_GOOGLE_MAPS.md)** | 🔄 Guide Google Maps | 20 min |
| **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** | 📋 Liste modifications | 10 min |
| **[MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)** | ✅ Résumé migration | 10 min |

**🎯 Par où commencer ?**
1. Nouveau → [PROJET_COMPLET.md](PROJET_COMPLET.md)
2. Installation → [QUICK_START.md](QUICK_START.md)
3. Configuration API → [MIGRATION_GOOGLE_MAPS.md](MIGRATION_GOOGLE_MAPS.md)

---

## 🏗️ Architecture

### Backend (Node.js/Express)
- **MySQL** : utilisateurs, réservations, agents
- **MongoDB** : notifications, voyages
- **Redis** : sessions, cache
- **Google Maps APIs** : itinéraires, géolocalisation, traffic

### Frontend (React)
- Context API pour état global
- Polling 10s notifications temps réel
- Responsive mobile-first

### 5 Services principaux
1. **searchService** - Recherche multimodale (Google Maps)
2. **workflowService** - Workflows par transport
3. **assistanceCoordinationService** - Coordination correspondances
4. **perturbationService** - Monitoring temps réel
5. **assistanceBookingService** - Réservation avec délais

**➡️ Détails** : [README_PMR_MULTIMODAL.md](README_PMR_MULTIMODAL.md)

---

## ✨ Fonctionnalités clés

### Recherche multimodale
- Transit (train/bus/métro) via Google Maps
- Détection aéroport proche si distance > 300km
- Filtrage accessibilité PMR (fauteuil roulant)
- Score d'accessibilité par itinéraire

### Coordination assistance
- 2 agents assignés par correspondance
- Notifications synchronisées
- Calcul temps transfert PMR

### Monitoring temps réel
- Traffic Google Maps
- Détection retards automatique
- Proposition alternatives accessibles
- Rebooking 1-click

### Profil PMR personnalisé
- Aide mobilité (fauteuil manuel/électrique, canne)
- Déficiences sensorielles (visuelle, auditive)
- Préférences et contact urgence

**➡️ Liste complète** : [PROJET_COMPLET.md](PROJET_COMPLET.md)

---

## 📊 Ce qui a été créé

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| **Services backend** | 5 | searchService, workflowService, etc. |
| **Controllers** | 2 | searchControllerV2, assistanceController |
| **Routes API** | 2 | 13 nouveaux endpoints |
| **Composants React** | 4 | PMRProfileForm, AdminDashboard |
| **Fichiers modifiés** | 3 | User.js, app.js, .env.example |
| **Documentation** | 7 | 2,318 lignes |
| **Code total** | ~6,900 lignes | Backend + Frontend |

**➡️ Détails** : [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)

---

## 🔧 Prérequis

### Logiciels
- Node.js >= 16.x
- MySQL >= 8.0
- MongoDB >= 5.0
- Redis >= 6.0

### APIs externes
- ✅ **Google Maps API** (200$/mois gratuit)
  - Directions API
  - Places API
  - Geocoding API
- ⚪ Aviationstack API (optionnel, 100 req/mois gratuit)

---

## 💰 Coûts

| Usage | Google Maps/mois | Statut |
|-------|------------------|--------|
| 10 utilisateurs/jour | ~15$ | ✅ Gratuit |
| 50 utilisateurs/jour | ~75$ | ✅ Gratuit |
| 100 utilisateurs/jour | ~150$ | ✅ Gratuit |

**200$/mois gratuit** avec crédit Google Cloud !

**➡️ Détails** : [MIGRATION_GOOGLE_MAPS.md](MIGRATION_GOOGLE_MAPS.md) - Section "Coûts"

---

## 🧪 Tests

### Backend API
```bash
# Recherche multimodale
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris",
    "destination": "Lyon",
    "pmr_needs": {"mobility_aid": "wheelchair"}
  }'

# Validation deadline
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

### Frontend
- `/user/pmr-profile` - Profil PMR détaillé
- `/admin/dashboard` - Dashboard administrateur

### Documentation API
http://localhost:17777/docs (Swagger)

**➡️ Plus de tests** : [QUICK_START.md](QUICK_START.md) - Section "Tests"

---

## 📈 Résultats attendus

### Pour voyageurs PMR
- ⏱️ **-70%** temps planification
- 😊 **+50%** satisfaction
- ✅ **95%** correspondances réussies

### Pour opérateurs
- 📊 Optimisation agents
- 📈 **-40%** retards assistance
- 💰 Économies gestion incidents

---

## 🗺️ Roadmap

### ✅ Phase 1 - Complétée
- Recherche multimodale
- Coordination assistance
- Monitoring temps réel
- Profil PMR
- Dashboard admin

### 🔜 Phase 2 (Q2 2026)
- App mobile agents (React Native)
- Chat temps réel agent↔passager
- Géolocalisation temps réel
- Intégration APIs compagnies

### 🔮 Phase 3 (Q3 2026)
- IA prédictive retards
- Recommandations ML
- Accessibilité vocale
- Réalité augmentée (guidage)

---

## 🤝 Contribution

Ce projet a été développé dans le cadre de **SAE5.01** - Gestion et assistance des PMR.

### Équipe
- Architecture backend : Services multimodaux
- Integration APIs : Google Maps
- Frontend React : Profils PMR & dashboards
- Documentation : Guides complets

---

## 📧 Support

**Installation ?** → [QUICK_START.md](QUICK_START.md)  
**Google Maps ?** → [MIGRATION_GOOGLE_MAPS.md](MIGRATION_GOOGLE_MAPS.md)  
**Architecture ?** → [README_PMR_MULTIMODAL.md](README_PMR_MULTIMODAL.md)  
**Navigation ?** → [INDEX_DOCUMENTATION.md](INDEX_DOCUMENTATION.md)

---

## 📜 Licence

MIT License - Voir fichier LICENSE

---

## 🎯 Commencer maintenant

**Étapes simples** :
1. 📖 Lire [PROJET_COMPLET.md](PROJET_COMPLET.md) (15 min)
2. 🚀 Suivre [QUICK_START.md](QUICK_START.md) (10 min)
3. 🔑 Configurer Google Maps API (5 min)
4. ✅ Tester l'application

**🎉 Prêt en 30 minutes !**

---

🦽 **FlexiTrip PMR - L'assistance multimodale unifiée** ✈️🚆🚌

*Résoudre la fragmentation, unifier l'assistance, faciliter la mobilité.*
