# 🦽 FLEXITRIP PMR - Plateforme d'Assistance Multimodale

## 📋 Vue d'ensemble

**FlexiTrip PMR** est une plateforme unifiée pour l'assistance aux Personnes à Mobilité Réduite (PMR) dans les transports multimodaux (train, bus, avion). Elle résout le problème majeur de **fragmentation des services d'assistance** entre opérateurs en offrant :

✅ **Réservation multimodale en une fois**  
✅ **Assistance PMR coordonnée** à chaque étape  
✅ **Notifications temps réel**  
✅ **Agents dédiés** à chaque point de correspondance  
✅ **Workflow biométrique optionnel** (enrollment → check-in → boarding)

---

## 🎯 Problème résolu

### Situation actuelle (fragmentation)
- SNCF : assistance à réserver 48h avant (Accès Plus)
- Compagnies aériennes : procédures différentes par aéroport
- Bus : règles non uniformisées, délais variables (24-72h)
- **Ruptures** dans le parcours entre modes de transport
- **Stress et insécurité** pour les voyageurs PMR

### Solution FlexiTrip
- **Une seule réservation** pour tout le trajet
- **Coordination automatique** des agents aux correspondances
- **Monitoring temps réel** des retards avec propositions d'alternatives
- **Profil PMR personnalisé** pour assistance adaptée
- **Notifications proactives** à chaque étape

---

## 🏗️ Architecture technique

### Backend (Node.js/Express)
- **MySQL** : utilisateurs, réservations, agents
- **MongoDB** : notifications, voyages, historiques
- **Redis** : sessions, cache
- **Kafka** : messaging asynchrone

### Frontend (React)
- **Context API** : gestion état global
- **Polling 10s** : notifications temps réel
- **Responsive design** : mobile-first

### APIs externes
- **Google Maps Directions API** : itinéraires multimodaux (transit)
- **Google Maps Places API** : recherche aéroports/gares
- **Google Maps Geocoding API** : géolocalisation
- **Aviationstack API** (optionnel) : vols en temps réel

---

## 📦 Nouveaux services créés

### 1. `searchService.js` - Recherche multimodale
- Intégration Google Maps APIs (Directions, Places, Geocoding)
- Recherche intelligente transit + avion si nécessaire
- Détection aéroport le plus proche
- Filtrage selon besoins PMR
- Calcul temps de correspondance
- Score d'accessibilité

**Fonctions principales :**
```javascript
searchMultimodalRoute(origin, destination, date, pmrNeeds)
filterAccessibleOptions(routes, pmrRequirements)
calculateTotalDuration(segments)
identifyTransferPoints(route)
```

### 2. `workflowService.js` - Workflows par transport
- Workflows différenciés (avion, train, bus)
- Gestion des deadlines
- Validation des étapes

**Workflows :**
- **Avion** : Enrollment (J-7) → Check-in (J-1) → Boarding (H-30min) → Assistance
- **Train** : Réservation assistance (48h) → Assistance montée → Correspondance → Assistance descente
- **Bus** : Réservation (72h) → Assistance montée → Correspondance → Assistance descente

### 3. `assistanceCoordinationService.js` - Coordination correspondances
- Planification assistance transferts
- Assignation 2 agents par correspondance
- Notifications synchronisées
- Gestion retards impactant correspondances

**Fonctions clés :**
```javascript
planTransferAssistance(segment1, segment2, location, passengerProfile)
notifyAgentsTransfer(transferPoint, arrivalTime, passenger)
handleTransferDelay(segmentId, newTime, voyage)
identifyTransferPoints(voyage)
```

### 4. `perturbationService.js` - Gestion retards
- Monitoring temps réel via Google Maps (traffic model)
- Détection retards avec impact correspondances
- Proposition alternatives accessibles PMR
- Notifications passagers + agents

**Fonctions :**
```javascript
monitorRealTimeData(voyage)
handleDelay(voyageId, segmentId, newTime, delayMinutes)
suggestAlternatives(missedConnection)
rebookAlternative(voyageId, alternativeId)
```

### 5. `assistanceBookingService.js` - Réservation assistance
- Délais minimum par opérateur (SNCF 48h, bus 72h, avion 48h)
- Validation deadlines
- Statuts : confirmée, en attente, délai court, trop tard
- Rappels J-1

**Délais par opérateur :**
- **SNCF/TER/TGV** : 48h semaine / 72h weekend
- **FlixBus/BlaBlaBus** : 36h semaine / 48h weekend
- **Eurolines** : 72h
- **Air France/Transavia/EasyJet** : 48h

---

## 🚀 Nouvelles API endpoints

### Recherche multimodale
```http
POST /api/search/multimodal
Body: {
  "origin": "Paris",
  "destination": "Lyon",
  "date": "2026-01-15T08:00:00Z",
  "pmr_needs": {
    "mobility_aid": "wheelchair",
    "wheelchair_type": "electric",
    "visual_impairment": false,
    "hearing_impairment": false
  }
}
```

### Validation deadlines
```http
POST /api/search/validate-booking-deadlines
Body: {
  "voyage": {
    "segments": [...]
  }
}
```

### Réservation assistance
```http
POST /api/assistance/book-voyage
Body: {
  "voyage": {...},
  "pmr_needs": {...}
}
```

### Planification transfert
```http
POST /api/assistance/plan-transfer
Body: {
  "segment1": {...},
  "segment2": {...},
  "location": "Gare de Lyon",
  "passenger_profile": {...}
}
```

### Monitoring temps réel
```http
POST /api/assistance/monitor-voyage
Body: {
  "voyage": {
    "voyage_id": "123",
    "segments": [...]
  }
}
```

### Gestion retard
```http
POST /api/assistance/handle-delay
Body: {
  "voyage_id": "123",
  "segment_id": "seg_456",
  "new_time": "2026-01-15T10:30:00Z",
  "delay_minutes": 25
}
```

---

## 👥 Modèle User étendu

### Nouveau champ `pmr_profile` (JSON)
```json
{
  "mobility_aid": "wheelchair|cane|walker|none",
  "wheelchair_type": "manual|electric|null",
  "visual_impairment": false,
  "hearing_impairment": false,
  "cognitive_assistance_needed": false,
  "service_dog": false,
  "preferred_seat": "aisle|window|first_row",
  "assistance_level": "full|partial|minimal",
  "language_preference": "fr|en|es",
  "emergency_contact": {
    "name": "Contact Name",
    "phone": "+33 6 12 34 56 78",
    "relationship": "Conjoint"
  },
  "medical_info": "Allergies, médications...",
  "special_equipment_needed": ["rampe", "fauteuil_transfert", "oxygen"]
}
```

---

## 🖥️ Nouveaux composants Frontend

### 1. `PMRProfileForm.js`
Formulaire complet de configuration du profil PMR :
- Aide à la mobilité (fauteuil, canne, déambulateur)
- Déficiences sensorielles
- Préférences (siège, langue, niveau d'assistance)
- Équipements spéciaux nécessaires
- Contact d'urgence
- Informations médicales

**Route :** `/user/pmr-profile`

### 2. `AdminDashboard.js`
Dashboard administrateur pour gestion des agents :
- **Stats temps réel** : passagers PMR du jour, missions actives
- **Tab "Aujourd'hui"** : liste missions avec réassignation agents
- **Tab "Agents"** : statut agents (disponible, occupé, surchargé)
- **Tab "Timeline"** : chronologie des arrivées/départs
- Filtrage par localisation
- Refresh auto toutes les 30s

**Route :** `/admin/dashboard`

---

## 📊 Workflow complet d'un voyage PMR

### 1. Recherche itinéraire
```
Utilisateur saisit → Origine, Destination, Date
                  → Profil PMR utilisé pour filtrage
                  ↓
Google Maps APIs → Itinéraires multimodaux (transit/avion)
                  ↓
Filtrage accessibilité → Score PMR > 0.7
                  ↓
Affichage résultats → Avec points de correspondance
```

### 2. Réservation
```
Sélection itinéraire → Validation deadlines
                  ↓
Si délai OK → Réservation segments + assistance
         ↓
Si délai NOK → Warning ou blocage + alternatives
                  ↓
Assignation agents → 1 agent par segment
                   → 2 agents par correspondance
                  ↓
Notifications créées → Passager + Agents
```

### 3. Monitoring temps réel
```
J-7 → Enrollment biométrique (avion)
J-1 → Check-in + rappel assistance
Jour J → Monitoring temps réel activé
      ↓
Si retard détecté → Calcul impact correspondances
                 ↓
Si correspondance OK → Notification simple
Si correspondance à risque → Agents alertés (priorité haute)
Si correspondance perdue → Proposition alternatives + rebooking 1-click
```

### 4. Assistance coordonnée
```
Segment 1 → Agent A accompagne jusqu'à correspondance
         ↓
Correspondance → Agent A transmet à Agent B
              → 15-20min minimum de transfert PMR
         ↓
Segment 2 → Agent B prend le relais
```

---

## 🔧 Installation & Configuration

### 1. Cloner le repository
```bash
git clone [repo-url]
cd SAE501_PMR
```

### 2. Backend setup
```bash
cd SAE501-API_Flexitrip
npm install

# Créer .env avec :
GOOGLE_MAPS_API_KEY=votre_cle_google_maps
AVIATIONSTACK_API_KEY=optionnel
MONGODB_URI=mongodb://localhost:27017/flexitrip
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=flexitrip
REDIS_URL=redis://localhost:6379

# Démarrer
npm start
```

### 3. Frontend setup
```bash
cd SAE501-Web/flexitrip
npm install

# Créer .env avec :
REACT_APP_API_URL=http://localhost:3000

# Démarrer
npm start
```

### 4. Obtenir clé Google Maps API

#### Google Maps API (200$/mois GRATUIT)
1. Aller sur https://console.cloud.google.com/
2. Créer un projet "FlexiTrip PMR"
3. Activer la facturation (carte requise, pas de débit auto)
4. Activer APIs : Directions, Places, Geocoding
5. Créer une clé API (Credentials)
6. Copier la clé dans `.env`

**Voir guide détaillé :** [MIGRATION_GOOGLE_MAPS.md](MIGRATION_GOOGLE_MAPS.md)

---

## 📈 Métriques & KPIs

### Objectifs mesurables
- **Taux de satisfaction PMR** : > 85%
- **Temps de coordination** : < 2 minutes entre modes
- **Taux de correspondances réussies** : > 95%
- **Délai moyen de notification retard** : < 5 minutes
- **Taux de rebooking réussi** : > 90%

### Données collectées
- Nombre de voyages multimodaux PMR/jour
- Temps moyen d'assistance par segment
- Nombre de retards gérés avec succès
- Score d'accessibilité moyen des itinéraires
- Taux d'utilisation par type de handicap

---

## 🎨 Design System

### Couleurs principales
- **Primary** : #667eea (bleu-violet)
- **Secondary** : #764ba2 (violet)
- **Success** : #27ae60 (vert)
- **Warning** : #f39c12 (orange)
- **Danger** : #e74c3c (rouge)
- **Info** : #3498db (bleu)

### Icônes utilisées
- 🦽 Profil PMR
- 📍 Localisation
- 🕐 Horaires
- 🚆 Transport train
- ✈️ Transport avion
- 🚌 Transport bus
- 👮 Agents
- 🔔 Notifications
- ⚠️ Alertes
- ✅ Validé

---

## 🚧 Roadmap future

### Phase 1 (Actuelle) ✅
- ✅ Recherche multimodale
- ✅ Profil PMR détaillé
- ✅ Workflows par transport
- ✅ Coordination correspondances
- ✅ Gestion retards
- ✅ Réservation assistance

### Phase 2 (Q2 2026)
- [ ] App mobile agents (React Native)
- [ ] Chat temps réel agent↔passager
- [ ] Géolocalisation en direct
- [ ] Intégration APIs compagnies (Air France, FlixBus)
- [ ] Paiement intégré

### Phase 3 (Q3 2026)
- [ ] IA prédictive retards
- [ ] Recommandations itinéraires personnalisées
- [ ] Accessibilité vocale (commandes vocales)
- [ ] Support réalité augmentée (guidage en gare)
- [ ] Blockchain pour traçabilité assistance

---

## 👨‍💻 Équipe & Contributions

### Développeurs
- Backend : Services PMR, APIs, intégrations
- Frontend : Interface utilisateur, dashboard admin
- DevOps : CI/CD, monitoring

### Contributions
Les contributions sont bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 Licence

MIT License - voir [LICENSE](LICENSE)

---

## 📞 Support

- **Email** : support@flexitrip-pmr.fr
- **Documentation** : https://docs.flexitrip-pmr.fr
- **API Docs** : https://api.flexitrip-pmr.fr/docs (Swagger)

---

**FlexiTrip PMR** - *Voyagez en toute sérénité* 🦽✈️🚆
