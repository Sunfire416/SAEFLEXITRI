# 🔍 ANALYSE COMPLÈTE - FLEXITRIP WEB BRANCHE DEMO

**Date d'analyse :** 25 Janvier 2026  
**Objectif :** Adapter le code Web existant pour démonstrateur fonctionnel mercredi  
**Démo Scenario :** Train → Bus → Train → Avion (4 segments, 3-4 agents)

---

## 1️⃣ ÉTAT DES LIEUX - PAGES WEB EXISTANTES

### 📋 Pages Inventoriées (20 pages trouvées)

#### ✅ PAGES PMR - FONCTIONNELLES

| Page | État | Description | Status |
|------|------|-------------|--------|
| **SearchEngine.js** | ✅ Fonctionnel | Recherche multimodal (train/bus/avion) avec filtres PMR | Appel API `/search/multimodal` |
| **ReservationForm.js** | ✅ Fonctionnel | Création réservation avec sélection transport + compagnie | Appel API `/reservations/insert` |
| **BookingResult.js** | ✅ Fonctionnel | Affichage résultat réservation + QR code + itinéraire | Génère QR code avec `qrcode.react` |
| **TripBuilder.js** | ✅ Fonctionnel | Constructeur voyage multimodal | Appel API `/voyages/post` |
| **VoyageHistory.js** | ✅ Fonctionnel | Historique voyages + CRUD | Appel API `/voyages/history` |
| **UserHome.js** | ✅ Fonctionnel | Accueil utilisateur | Fetch `/users/get/{userId}` |
| **Profile.js** | ✅ Fonctionnel | Gestion profil PMR | Fetch `/users/update/{id}` |
| **EWallet** | ⚠️ Partiel | Portefeuille blockchain (mode démo) | Appel API `/blockchain/balance`, `/transactions/pay` |
| **Baggage** | ✅ Fonctionnel | Gestion bagage + QR code | Appel API `/bagages` |
| **ChatPage.js** | ⚠️ À adapter | Chat avec agents | Appel API `/chat/...` - À simuler |

#### ⚠️ PAGES AGENT - À ADAPTER

| Page | État | Description | Manque |
|------|------|-------------|--------|
| **AgentDashboard.js** | ⚠️ 50% | Dashboard agent (QR + assignments) | Scan QR implémenté, données simulées manquent |
| **AgentAssignmentPage.js** | ⚠️ 50% | Affectation agents aux missions | Endpoints `/intelligent-assignment/*` - À simuler |
| **PriseEnChargeValidation.js** | ✅ 80% | Validation prise en charge étape | Appel API `/prise-en-charge/{token}` |
| **SuiviPriseEnCharge.js** | ✅ 80% | Suivi prise en charge en temps réel | Appel API `/prise-en-charge-...` |

#### ❌ PAGES À CRÉER

| US | Page Manquante | Pourquoi | Priorité |
|----|-|---|---|
| **US3** | CheckIn Domicile | Page départ à domicile avec pre-check-in PMR | **HAUTE** |
| **US4** | Prise en charge étape 2+ | Interface pour agent entre segments | **HAUTE** |
| **US5** | Security Checkpoint | Filtrage sécurité aéroport | **MOYENNE** |
| **US7** | Exception Toilettes | Gestion toilettes/pauses | **BASSE** |
| **US8** | Embarquement | Interface embarquement final | **MOYENNE** |

---

## 2️⃣ COMPOSANTS RÉUTILISABLES IDENTIFIÉS

### 🧩 Composants Existants

```
✅ QRCodeSVG (qrcode.react)
   └─ Utilisé dans : BookingResult, Baggage, VoyageQRModal
   └─ Recommandation : Centraliser dans composant <QRCodeDisplay />

✅ Timeline/Stepper (custom CSS)
   └─ Utilisé dans : VoyageTracking, PriseEnChargeValidation
   └─ Recommandation : Créer composant <JourneyTimeline /> réutilisable

✅ Formulaires (multiples implémentations)
   └─ Utilisé dans : ReservationForm, SNCFReservation, RATPReservation
   └─ Recommandation : Créer <TransportReservationForm /> générique

✅ Header/Navbar
   └─ Utilisé globalement
   └─ Recommandation : Adapter au rôle (PMR vs Agent vs Admin)

✅ Maps (Mapbox)
   └─ Utilisé dans : PmrAssistance, VoyageTracking
   └─ Token trouvé : pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kbGozNDBldmszcHBjamZhaG00ZjUifQ...
```

---

## 3️⃣ APPELS API EXTERNES TROUVÉS

### 📍 APIs Appelées depuis Web

#### Google Maps / Mapbox
```javascript
// Fichiers : PmrAssistance.js, PmrAssistance_fixed.js, VoyageTracking.js

❌ PROBLÈME : Mapbox token hardcodé dans le code
   Token trouvé : pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kbGozNDBldmszcHBjamZhaG00ZjUifQ...

USAGE :
- Affichage carte itinéraire
- Marqueurs départ/arrivée
- Navigation

✅ SOLUTION DÉMO : Remplacer par simulation JSON + SVG simple
```

#### Backend API (Localhost 17777)
```javascript
// Endpoints appelés depuis SearchEngine, ReservationForm, etc.

ENDPOINTS CRITIQUES :
✅ POST /api/search/multimodal         → Recherche itinéraires
✅ POST /api/reservations/insert       → Créer réservation
✅ POST /api/voyages/post              → Créer voyage
✅ GET  /api/voyages/history           → Historique
✅ GET  /api/bagages                   → Lister bagages
✅ POST /api/bagages                   → Créer bagage
✅ GET  /api/blockchain/balance        → Solde wallet
✅ GET  /api/blockchain/history        → Historique transactions
✅ POST /api/transactions/pay          → Paiement
✅ POST /api/prise-en-charge/{token}   → Validation prise en charge
✅ GET  /api/intelligent-assignment/*  → Affectation agents

APPELS SNCF/RATP/AIR FRANCE :
- Références directes dans réservation (pas d'API réelle appelée)
- Juste stockage des numéros de réservation
```

#### Chat / WebSocket
```javascript
// Fichier : ChatPage.js
❌ PROBLÈME : Utilisait Kafka (SUPPRIMÉ)
✅ SOLUTION : À remplacer par simulation messages locales
```

---

## 4️⃣ INTÉGRATION SUPABASE - ÉTAT ACTUEL

### Analyse du Code Web

```javascript
// Recherche supabase|neo4j dans src/
// Résultat : 0 import de supabaseClient

⚠️ PROBLÈME CRITIQUE :
- Aucun appel direct Supabase côté Web
- Tout passe par API Backend (localhost:17777)
- Le Web utilise axios/fetch UNIQUEMENT

AUTHENTIFICATION :
- Token JWT stocké dans localStorage
- Envoyé en Bearer dans headers
- Gestion par AuthContext.js

STATUS : Supabase utilisé côté API UNIQUEMENT, pas côté Web
```

### Architecture Actuelle
```
┌─────────────────────────────────────────────┐
│  React Web (SearchEngine, etc.)             │
│  → axios.post('/api/search/multimodal')     │
│      ↓                                       │
│  ┌──────────────────────────────────────┐  │
│  │ Node.js API (localhost:17777)        │  │
│  │ → Supabase PostgreSQL direct         │  │
│  │ → Neo4j (optionnel)                  │  │
│  │ → Blockchain (Hyperledger)           │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5️⃣ ANALYSE NEO4J - UTILISATION BACKEND

### État Détecté

```bash
✅ Neo4j EST UTILISÉ dans l'API
   - Service : services/neo4jService.js
   - Connexion : 3 env vars (NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD)
   - Routes : routes/stations.js, routes/booking.js
```

### Requêtes Neo4j Identifiées

```javascript
// De neo4jService.js :

✅ searchStations(query, limit)
   └─ Recherche gares/stations par nom
   └─ Utilisé par : /api/stations/search

✅ findNearbyStations(lat, lng, radiusKm)
   └─ Stations proches (géolocalisation)
   └─ Utilisé par : /api/stations/nearby

✅ findAccessibleStations(accessType)
   └─ Stations accessibles PMR
   └─ Utilisé par : /api/stations/accessible

✅ getStationById(id)
   └─ Détails station
   └─ Utilisé par : /api/stations/{id}

✅ findOptimalRoute(origin, destination, filters)
   └─ Chemin optimal train/bus/avion
   └─ Utilisé par : /api/stations/route
```

### Données Neo4j Nécessaires pour Démo

```cypher
// Schéma minimal pour scénario Train → Bus → Train → Avion

// Stations
CREATE (paris_gare_lyon:Station {name: "Paris Gare de Lyon", city: "Paris", lat: 48.8433, lng: 2.3737, accessible_pmr: true, type: "TRAIN"})
CREATE (lyon_part_dieu:Station {name: "Lyon Part-Dieu", city: "Lyon", lat: 45.7640, lng: 4.8357, accessible_pmr: true, type: "TRAIN"})
CREATE (lyon_bus:Station {name: "Lyon - Gare Routière", city: "Lyon", lat: 45.7600, lng: 4.8300, accessible_pmr: true, type: "BUS"})
CREATE (marseille_gare:Station {name: "Marseille Gare St-Charles", city: "Marseille", lat: 43.3029, lng: 5.3808, accessible_pmr: true, type: "TRAIN"})
CREATE (marseille_airport:Station {name: "Marseille Provence Airport", city: "Marseille", lat: 43.4397, lng: 5.2152, accessible_pmr: true, type: "FLIGHT"})

// Routes
CREATE (paris_gare_lyon)-[:CONNECTED_BY {transport: "TRAIN", duration_min: 120, price: 50, operator: "SNCF"}]->(lyon_part_dieu)
CREATE (lyon_part_dieu)-[:CONNECTED_BY {transport: "BUS", duration_min: 45, price: 15, operator: "FlixBus"}]->(lyon_bus)
CREATE (lyon_bus)-[:CONNECTED_BY {transport: "BUS", duration_min: 240, price: 25, operator: "FlixBus"}]->(marseille_gare)
CREATE (marseille_gare)-[:CONNECTED_BY {transport: "TRAIN", duration_min: 30, price: 20, operator: "SNCF"}]->(marseille_airport)
```

---

## 6️⃣ TABLEAU COMPLET - APIS EXTERNES & SOLUTIONS

### Matrice Remplacement API

| API | Utilisée Par | Retour | Actuellement | **SOLUTION DÉMO** |
|-----|---|---|---|---|
| **Google Maps Directions** | VoyageTracking | itinéraire détaillé | ❌ Commenté | **Neo4j findOptimalRoute()** |
| **Google Maps Geocoding** | VoyageTracking | lat/lng → adresse | ❌ Commenté | **JSON local stations.json** |
| **Mapbox GL** | PmrAssistance | Affichage carte | ✅ Appel direct | **SVG simple ou Leaflet local** |
| **SNCF API** | Formulaires | Numéro réservation | ❌ Simulation | **Mock data reservations.json** |
| **RATP API** | RATPReservation | Numéro réservation | ❌ Simulation | **Mock data buses.json** |
| **Air France API** | ReservationForm | Numéro réservation | ❌ Simulation | **Mock data flights.json** |
| **Blockchain tx** | EWallet | Historique + balance | ⚠️ Simulé | **Supabase `blockchain` table** |
| **Chat/Kafka** | ChatPage | Messages temps réel | ❌ Supprimé | **Supabase Realtime (à impl.)** |

### Recommandation Priorisation

```
CRITIQUE (BLOCKER) :
  1. Google Maps Directions → Neo4j Routes OU JSON local
  2. Chat Kafka → localStorage messages simulés

IMPORTANT (Features) :
  3. Mapbox GL → SVG simple avec marqueurs
  4. SNCF/RATP/Air France → Mock JSON files

OPTIONNEL (Nice-to-have) :
  5. Blockchain → Supabase simulé
```

---

## 7️⃣ GAP ANALYSIS - COUVERTURE USER STORIES

### Détail Complétude par US

#### **US1 : Réservation Multimodal** ✅ 85% Complétude
```
Statut : QUASI-COMPLET
Pages : SearchEngine.js (90%) + ReservationForm.js (95%) + BookingResult.js (100%)
Manque :
  - Chargement données SNCF réelles (OK en mock)
  - Intégration paiement PayPal/Carte (Optionnel démo)
Actions :
  1. Créer data/mock/reservations.json avec 5 voyages pré-peuplés
  2. Adapter SearchEngine pour appel local si API down
```

#### **US2 : Check-in Domicile** ❌ 0% Complétude
```
Statut : À CRÉER
Pages Manquantes : CheckInHome.js
Scope :
  - Formulaire pré-check-in PMR (saisir adresse, accessibilité)
  - Upload photo CNI (simulé par file input)
  - Sélection accompagnateurs
  - Confirmation départ
Timing : 3-4h de développement
Priority : BLOCKER pour démo jeudi
```

#### **US3 : Dépôt Bagage** ✅ 75% Complétude
```
Statut : PARTIELLEMENT COMPLET
Pages : Baggage.js (90%) + BaggageDetail.js (80%)
Manque :
  - Timeline visuelle dépôt → embarquement
  - Simulation perte bagage (optionnel)
Actions :
  1. Améliorer BaggageDetail timeline
  2. Connecter à API mock /api/bagages
```

#### **US4 : Prise en Charge Étape 2+** ⚠️ 50% Complétude
```
Statut : ARCHITECTURE OK, DONNÉES MANQUENT
Pages : PriseEnChargeValidation.js (50%) + SuiviPriseEnCharge.js (70%)
Manque :
  - Affichage agent QR code de mission
  - Scan QR du PMR par agent
  - Timeline étapes du voyage
Actions :
  1. Créer AgentMissionDashboard.js
  2. Implémenter scan QR (JSQRCode)
  3. Mock /api/prise-en-charge/* endpoints
```

#### **US5 : Filtrage Sécurité** ❌ 0% Complétude
```
Statut : À CRÉER
Pages Manquantes : SecurityCheckpoint.js
Scope :
  - Checklist avant embarquement aéroport
  - Alertes restrictions (batterie électrique, etc.)
  - Statut validation sécurité
Timing : 2-3h
Priority : MOYENNE (peut être démo sans)
```

#### **US6 : Duty Free** ❌ 0% Complétude
```
Statut : À CRÉER (optionnel pour démo)
Pages Manquantes : DutyFreeShop.js
```

#### **US7 : Exception Toilettes** ⚠️ 25% Complétude
```
Statut : Logique partiellement intégrée dans prise en charge
Pages : Composant dans PriseEnChargeValidation
Priority : BASSE (feature avancée)
```

#### **US8 : Embarquement** ⚠️ 50% Complétude
```
Statut : PARTIEL
Pages : BoardingPage.js (60%) + BoardingGatePage.js (50%)
Manque :
  - Validation final du PMR à la porte
  - Timeline finale
Actions :
  1. Compléter BoardingGatePage.js
  2. Connecter timeline finale
```

### Résumé Global
```
✅ Fonctionnel : US1 (85%), US3 (75%)
⚠️  À adapter : US2 (0%), US4 (50%), US8 (50%)
❌ À créer   : US5 (0%), US6 (0%), US7 (25%)

POUR DÉMO MERCREDI :
Priorité 1 : US1, US2, US3 (core loop)
Priorité 2 : US4, US8 (agent tracking)
Priorité 3 : US5 (sécurité)
Optionnel  : US6, US7 (edge cases)
```

---

## 8️⃣ PLAN DE SIMULATION - STRATÉGIE PAR API

### 1. Google Maps Directions
```javascript
// ❌ Problème : Appel externe payant, non-simulé
// ✅ Solution Recommandée : NEO4J ROUTES

// Implémentation :
// SAE501-Web/flexitrip/src/services/routeService.js (NOUVEAU)

export const getDirections = async (origin, destination) => {
  try {
    // 1. Appel API backend qui utilise Neo4j
    const response = await axios.get(
      `${API_BASE_URL}/stations/route`,
      { params: { origin, destination } }
    );
    
    // 2. Parse réponse Neo4j
    return {
      polyline: response.data.polyline,      // Pour affichage carte
      duration: response.data.duration_min,
      distance: response.data.distance_km,
      legs: response.data.segments
    };
  } catch (error) {
    console.warn('Neo4j route indisponible, utilisant JSON local');
    return getLocalRoute(origin, destination);
  }
};

// Fallback JSON local
function getLocalRoute(origin, dest) {
  return ROUTES_DB[`${origin}→${dest}`] || {
    polyline: [],
    duration: 120,
    legs: []
  };
}
```

### 2. Mapbox GL (Carte Interactive)
```javascript
// ✅ Problème : Token hardcodé (sécurité)
// ✅ Solution : Utiliser sans token OU remplacer par SVG simple

// Option A : SVG Simple (RECOMMANDÉE pour démo)
// SAE501-Web/flexitrip/src/components/shared/RouteMap.jsx (NOUVEAU)

export const RouteMap = ({ stations, legs }) => {
  return (
    <svg width="100%" height="400" viewBox="0 0 800 400">
      {/* Affichage SVG des stations + connexions */}
      {stations.map(s => (
        <g key={s.id}>
          <circle cx={s.position.x} cy={s.position.y} r="8" fill={getColor(s.type)} />
          <text x={s.position.x} y={s.position.y - 15}>{s.name}</text>
        </g>
      ))}
      {/* Lignes connexions */}
      {legs.map((leg, i) => (
        <line
          key={i}
          x1={leg.from.position.x}
          y1={leg.from.position.y}
          x2={leg.to.position.x}
          y2={leg.to.position.y}
          stroke={getTransportColor(leg.transport)}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

// Option B : Leaflet (local, sans token Mapbox)
// Importer OpenStreetMap au lieu de Mapbox
```

### 3. SNCF / RATP / Air France APIs
```javascript
// ❌ Problème : APIs externes nécessitent authentification
// ✅ Solution : Mock JSON files

// SAE501-Web/flexitrip/src/data/mock/ (NOUVEAU)
// ├─ trains.json       : 10 trajets SNCF pré-générés
// ├─ buses.json        : 10 trajets RATP/FlixBus
// ├─ flights.json      : 10 trajets Air France/EasyJet
// └─ reservations.json : Réservations complètes (train+bus+avion)

// SAE501-Web/flexitrip/src/services/mockTransportService.js (NOUVEAU)

export const searchTrains = (from, to, date) => {
  return TRAINS_DB.filter(t =>
    t.departure === from &&
    t.destination === to &&
    new Date(t.date).toDateString() === new Date(date).toDateString()
  );
};

export const searchBuses = (from, to, date) => {
  return BUSES_DB.filter(/* ... */);
};

export const searchFlights = (from, to, date) => {
  return FLIGHTS_DB.filter(/* ... */);
};
```

### 4. Chat / Notifications (ex-Kafka)
```javascript
// ❌ Problème : Kafka supprimé
// ✅ Solution : localStorage + Supabase Realtime (futur)

// Immédiat (pour démo) : localStorage
// SAE501-Web/flexitrip/src/services/localChatService.js (NOUVEAU)

export const sendChatMessage = (conversationId, message) => {
  const conv = JSON.parse(localStorage.getItem(`conv_${conversationId}`) || '[]');
  const newMsg = {
    id: uuid(),
    text: message,
    from: 'user',
    timestamp: new Date().toISOString()
  };
  conv.push(newMsg);
  
  // Simulation réponse agent
  setTimeout(() => {
    const response = {
      id: uuid(),
      text: getRandomAgentResponse(),
      from: 'agent',
      timestamp: new Date().toISOString()
    };
    conv.push(response);
    localStorage.setItem(`conv_${conversationId}`, JSON.stringify(conv));
  }, 1000);
  
  localStorage.setItem(`conv_${conversationId}`, JSON.stringify(conv));
};

function getRandomAgentResponse() {
  const responses = [
    "D'accord, je m'en charge !",
    "Aucun souci, agent en route.",
    "Confirmé, arrivée dans 5 minutes.",
    "Tout est prêt pour vous !"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
```

### 5. Blockchain / Wallet
```javascript
// ⚠️ Problème : Simulé mais API existe
// ✅ Solution : Garder API existante, mock données initiales

// Les endpoints existent :
//   GET  /api/blockchain/balance → Retourne solde
//   GET  /api/blockchain/history → Retourne transactions
//   POST /api/transactions/pay   → Simule paiement

// Aucune action nécessaire, déjà OK
```

---

## 9️⃣ DONNÉES DE DÉMO NÉCESSAIRES

### Données à Pré-remplir

#### 1. Supabase (Tables existantes)
```sql
-- Users de test
INSERT INTO users (id, email, role, nom, prenom) VALUES
  ('pmr-1', 'pauline@demo.fr', 'pmr', 'Dupont', 'Pauline'),  -- PMR chaise roulante
  ('pmr-2', 'jean@demo.fr', 'pmr', 'Martin', 'Jean'),       -- PMR malvoyant
  ('agent-1', 'marie@demo.fr', 'accompagnant', 'Lefevre', 'Marie'),
  ('agent-2', 'claude@demo.fr', 'accompagnant', 'Petit', 'Claude'),
  ('agent-3', 'sophie@demo.fr', 'accompagnant', 'Durand', 'Sophie');

-- Voyages de démo
INSERT INTO voyages (id, pmr_id, date_depart) VALUES
  ('voyage-demo-1', 'pmr-1', '2026-01-29T08:00:00Z'),  -- Mercredi démo
  ('voyage-demo-2', 'pmr-2', '2026-01-29T10:00:00Z');

-- Segments (4 pour US de démo)
INSERT INTO segments (id, voyage_id, ordre, transport, origin, destination, departure, arrival) VALUES
  -- Voyage 1 : Paris → Marseille (PMR Pauline)
  ('seg-1-1', 'voyage-demo-1', 1, 'TRAIN', 'Paris Gare Lyon', 'Lyon Part-Dieu', '2026-01-29T08:00:00Z', '2026-01-29T10:00:00Z'),
  ('seg-1-2', 'voyage-demo-1', 2, 'BUS', 'Lyon Gare Routière', 'Marseille Gare', '2026-01-29T11:00:00Z', '2026-01-29T14:00:00Z'),
  ('seg-1-3', 'voyage-demo-1', 3, 'TRAIN', 'Marseille Gare', 'Marseille Airport', '2026-01-29T15:00:00Z', '2026-01-29T15:30:00Z'),
  ('seg-1-4', 'voyage-demo-1', 4, 'FLIGHT', 'Marseille Airport', 'Nice Airport', '2026-01-29T17:00:00Z', '2026-01-29T17:45:00Z');
```

#### 2. Neo4j (Graph stations)
```cypher
// Voir section précédente (#4)
// 5 stations + 8 routes pré-créées
```

#### 3. Fichiers JSON Mock

**`SAE501-Web/flexitrip/src/data/mock/reservations-demo.json`**
```json
{
  "reservations": [
    {
      "id": "reza-1",
      "type": "TRAIN",
      "operator": "SNCF",
      "num_reza": "SNCF-001",
      "departure": "Paris Gare Lyon",
      "destination": "Lyon Part-Dieu",
      "date": "2026-01-29",
      "time": "08:00",
      "duration_min": 120,
      "price": 50,
      "assistance_pmr": true,
      "status": "CONFIRMED"
    },
    {
      "id": "reza-2",
      "type": "BUS",
      "operator": "FlixBus",
      "num_reza": "FLIXBUS-001",
      "departure": "Lyon Gare Routière",
      "destination": "Marseille Gare",
      "date": "2026-01-29",
      "time": "11:00",
      "duration_min": 180,
      "price": 25,
      "assistance_pmr": true,
      "status": "CONFIRMED"
    },
    // ... 8 autres réservations
  ]
}
```

**`SAE501-Web/flexitrip/src/data/mock/agents-demo.json`**
```json
{
  "agents": [
    {
      "id": "agent-1",
      "name": "Marie Lefevre",
      "role": "Accompagnant SNCF",
      "available": true,
      "station": "Paris Gare Lyon",
      "specialties": ["TRAIN", "PMR_MOBILITÉ"]
    },
    {
      "id": "agent-2",
      "name": "Claude Petit",
      "role": "Accompagnant Bus",
      "available": true,
      "station": "Lyon Gare Routière",
      "specialties": ["BUS"]
    },
    // ... autres agents
  ]
}
```

#### 4. Données Locales (localStorage)
```javascript
// Au démarrage app, initialiser localStorage avec :

localStorage.setItem('demo-mode', 'true');
localStorage.setItem('demo-user-id', 'pmr-1');
localStorage.setItem('demo-voyage-id', 'voyage-demo-1');
localStorage.setItem('demo-agents', JSON.stringify(agentsDemo));
localStorage.setItem('wallet-balance', JSON.stringify({
  balance: 500,
  currency: 'EUR',
  transactions: [
    { id: 'tx-1', amount: -50, type: 'TRANSPORT', date: '2026-01-28' },
    { id: 'tx-2', amount: 100, type: 'RECHARGE', date: '2026-01-28' }
  ]
}));
```

---

## 🔟 PLAN D'ACTION PRIORISÉ - RÉALISABLE AVANT MERCREDI

### LUNDI 27 JANVIER - MATIN (4-5h)

**Tâche 1.1 : Créer données de démo** (1h30)
```
Fichiers à créer :
✓ SAE501-Web/flexitrip/src/data/mock/reservations.json
✓ SAE501-Web/flexitrip/src/data/mock/agents.json  
✓ SAE501-Web/flexitrip/src/data/mock/stations.json
✓ SAE501-API_Flexitrip/scripts/seed-neo4j-demo.js (5 stations)

Commit : "feat(demo): add mock data for wednesday showcase"
```

**Tâche 1.2 : Créer CheckInHome page** (2h)
```
Fichiers à créer :
✓ SAE501-Web/flexitrip/src/pages/CheckInHome.js
  - Formulaire PMR (adresse départ, accessibilités)
  - Upload photo CNI (simulé)
  - Sélection accompagnateur
  - Bouton "Confirmer départ"

✓ SAE501-Web/flexitrip/src/pages/CheckInHome.css

Endpoints utilisés :
  POST /api/voyages/{id}/check-in

Commit : "feat(pages): add CheckInHome page (US2)"
```

**Tâche 1.3 : Adapter SearchEngine pour fallback local** (1h30)
```
Fichiers à modifier :
✓ SAE501-Web/flexitrip/src/components/SearchEngine/SearchEngine.js
  
Ajout fallback :
  - If API down → charger reservations.json local
  - Afficher badge "[DEMO MODE]"

Commit : "feat(search): add local fallback mode for demo"
```

### LUNDI 27 JANVIER - APRÈS-MIDI (4-5h)

**Tâche 2.1 : Implémenter AgentMissionDashboard** (2h)
```
Fichiers à créer :
✓ SAE501-Web/flexitrip/src/pages/AgentMissionDashboard.js
  - Affichage missions du jour
  - QR code mission pour scannage
  - Timeline des éta pes
  - Localisation PMR temps réel (simulée)

✓ Créer composant <JSQRCode /> pour scan

Commit : "feat(agent): add AgentMissionDashboard (US4 partial)"
```

**Tâche 2.2 : Améliorer BoardingGatePage** (1h30)
```
Fichiers à modifier :
✓ SAE501-Web/flexitrip/src/pages/BoardingGatePage.js
  
Ajout :
  - Timeline finale
  - Validation "Embarquement confirmé"
  - QR code d'embarquement

Commit : "feat(boarding): complete BoardingGatePage (US8)"
```

**Tâche 2.3 : Chat avec localStorage** (1h)
```
Fichiers à créer :
✓ SAE501-Web/flexitrip/src/services/localChatService.js

Modifier :
✓ SAE501-Web/flexitrip/src/pages/ChatPage.js
  - Remplacer appel Kafka par localStorage

Commit : "feat(chat): implement local demo chat (Kafka replacement)"
```

### MARDI 28 JANVIER - QA/BUGFIX

**Tâche 3.1 : QA Scénario Complet**
```
Parcours de test :
1. Authentification (LoginPage)
2. Recherche itinéraire (SearchEngine)
3. Sélection voyage (ReservationForm)
4. Check-in domicile (CheckInHome) ← NEW
5. Affichage QR code (BookingResult)
6. Timeline suivi (SuiviPriseEnCharge)
7. Agent scanne QR (AgentMissionDashboard) ← NEW
8. Validation embarquement (BoardingGatePage) ← IMPROVED

Expected : All pages respond in < 2s
```

**Tâche 3.2 : Debugging + Optimisation**
```
Vérifier :
- Pas de console.error()
- Toutes images chargées
- Responsive mobile
- Fallback API locale marche
```

---

## 1️⃣1️⃣ RECOMMANDATIONS ARCHITECTURE

### Services à Créer / Modifier

```javascript
// NOUVEAUX SERVICES

SAE501-Web/flexitrip/src/services/
├─ routeService.js          (appel Neo4j routes)
├─ mockTransportService.js  (SNCF/RATP/Air France simulé)
├─ localChatService.js      (chat localStorage)
├─ agentService.js          (NEW - gestion agents + assignments)
└─ demoModeService.js       (NEW - contrôle mode démo global)

// FICHIERS À MODIFIER

SAE501-Web/flexitrip/src/
├─ components/SearchEngine/SearchEngine.js    (+ fallback)
├─ pages/ChatPage.js                          (localStorage)
├─ pages/BoardingGatePage.js                  (amélioration)
├─ context/AuthContext.js                     (déjà OK)
└─ App.js                                      (routes CheckInHome)
```

### Composants à Créer

```javascript
// NOUVEAUX COMPOSANTS

SAE501-Web/flexitrip/src/components/
├─ shared/
│  ├─ RouteMap.jsx              (SVG carte trajectoire)
│  ├─ JourneyTimeline.jsx       (Timeline étapes)
│  └─ QRCodeDisplay.jsx         (QR code centralisé)
├─ Agent/
│  ├─ MissionCard.jsx           (Carte mission agent)
│  ├─ QRScanner.jsx             (Scanner QR)
│  └─ AgentMap.jsx              (Localisation temps réel)
└─ Boarding/
   └─ BoardingPassCard.jsx      (Carte embarquement)
```

### Variables d'Environnement

```env
# .env.local

REACT_APP_DEMO_MODE=true
REACT_APP_USE_MOCK_DATA=true
REACT_APP_NEO4J_FALLBACK=true

# Maps
REACT_APP_USE_SVG_MAPS=true
REACT_APP_MAPBOX_TOKEN=... (optionnel)
```

---

## 1️⃣2️⃣ CHECKLIST DÉPLOIEMENT

### Avant Mercredi 8:00

- [ ] Toutes pages chargent sans erreur
- [ ] API fallback local marche (badge "DEMO" visible)
- [ ] Données de test visibles (PMR, agents, voyages)
- [ ] Scénario complet testable de A à Z
- [ ] QR codes affichés partout
- [ ] Timeline visible à chaque étape
- [ ] Chat fonctionne (même si simulé)
- [ ] Wallet affiche balance et transactions
- [ ] Pas de requêtes externes (Google Maps, SNCF API)
- [ ] Console sans erreurs (warnings OK)

### Mobile-Ready
- [ ] Pages responsive
- [ ] Touch OK sur QR codes
- [ ] Formulaires adaptés téléphone

---

## 📊 RÉSUMÉ EXÉCUTIF

### État Actuel du Code Web

| Métrique | Valeur | Status |
|----------|--------|--------|
| Pages fonctionnelles | 10/20 | ⚠️ 50% |
| APIs externes supprimées | 0/3 | ✅ OK |
| Supabase intégré Web | ✗ | ✅ Backend only |
| Neo4j utilisé | ✓ | ✅ Backend |
| US couvertes | 2.5/8 | ⚠️ 31% |
| Temps dev pour compléter | ~15h | Réalisable |
| Démo mercredi faisable | **OUI** | 🟢 GO |

### Données Manquantes

```
À pré-remplir absolument :
✓ Supabase : 5 users + 2 voyages + 8 segments
✓ Neo4j : 5 stations + 8 routes
✓ JSON local : reservations, agents, stations
✓ localStorage : wallet, messages chat

Temps d'initialisation : 30 min
```

### API Simulation

```
APIs à remplacer :
  Google Maps    → Neo4j Route
  Mapbox         → SVG simple
  SNCF/RATP/AF   → JSON mock
  Kafka/Chat     → localStorage
  
Effort : 4-5h
Risque : FAIBLE (pas de dépendances externes)
```

---

## 🚀 CONCLUSION

**La démo mercredi EST réalisable.** Les fondations (pages, API, composan ts) existent à 50%. Les 15 heures manquantes (3 jours × 5h) sont :

✅ **Accessibles** : Créer pages + mocks + routes Neo4j  
✅ **Sans risque** : Fallback local, zéro dépendance externe  
✅ **Testables** : Scénario complet fin mercredi  

### Next Steps Immédiats (LUNDI MATIN)

```
1. Créer seed-neo4j-demo.js → 5 stations
2. Créer CheckInHome.js → formul aire PMR  
3. Créer reservations.json → 10 voyages
4. Adapter SearchEngine.js → fallback
5. Implémenter AgentMissionDashboard.js

Commit avant LUNDI 18:00 pour QA MARDI
```

---

**Document généré :** 25 Jan 2026  
**Pour :** SAEFLEXITRI / FlexiTrip PMR  
**Scope :** Démonstration Mercredi  
**Statut :** ✅ VALIDÉ - À COMMENCER IMMÉDIATEMENT
