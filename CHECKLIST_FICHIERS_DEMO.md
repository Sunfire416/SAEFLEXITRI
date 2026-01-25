# 📝 CHECKLIST DÉTAILLÉE - FICHIERS À CRÉER/MODIFIER

## FICHIERS À CRÉER (12 fichiers)

### Backend API

```
✅ SAE501-API_Flexitrip/scripts/seed-neo4j-demo.js
   └─ Création 5 stations + 8 routes Neo4j
   └─ Commande : node scripts/seed-neo4j-demo.js
   └─ Durée : 20 min (copy-paste code)

✅ SAE501-API_Flexitrip/package.json - modifier scripts
   └─ Ajouter : "seed:neo4j": "node scripts/seed-neo4j-demo.js"
```

### Frontend Web - Data

```
✅ SAE501-Web/flexitrip/src/data/mock/reservations.json
   └─ 3 itinéraires multimodaux pré-remplies
   └─ Structure : { results: { total, itineraries: [...] } }
   └─ Durée : 15 min

✅ SAE501-Web/flexitrip/src/data/mock/agents.json
   └─ 3 agents de démo
   └─ Structure : { agents: [...] }
   └─ Durée : 10 min

✅ SAE501-Web/flexitrip/src/data/mock/stations.json
   └─ 5 stations (Paris, Lyon×2, Marseille×2)
   └─ Durée : 10 min
```

### Frontend Web - Pages

```
✅ SAE501-Web/flexitrip/src/pages/CheckInHome.js
   └─ Formulaire PMR : adresse, CNI, type mobilité, contact
   └─ State : { address, cni_photo, mobility_type, assistance_needed, contact_number }
   └─ Submit : navigate to /trip-tracking
   └─ Durée : 1h

✅ SAE501-Web/flexitrip/src/pages/AgentMissionDashboard.js
   └─ Liste missions + détail sélectionnée
   └─ Affiche QR code mission (JSON: { mission_id, pmr_id, leg })
   └─ Bouton "Embarqué"
   └─ Durée : 1h
```

### Frontend Web - Components

```
✅ SAE501-Web/flexitrip/src/components/shared/JourneyTimeline.jsx
   └─ Affiche timeline des segments (cercles + lignes)
   └─ Props : { segments, currentLeg }
   └─ Durée : 30 min

✅ SAE501-Web/flexitrip/src/components/shared/RouteMapSVG.jsx
   └─ Affiche carte SVG simple
   └─ Props : { segments }
   └─ Durée : 30 min

✅ SAE501-Web/flexitrip/src/services/localChatService.js
   └─ sendChatMessage() → simule réponse agent après 1s
   └─ getChatHistory() → retourne messages localStorage
   └─ Durée : 30 min

✅ SAE501-Web/flexitrip/src/services/mockTransportService.js
   └─ searchTrains(), searchBuses(), searchFlights()
   └─ Filtre sur from/to/date dans JSON mock
   └─ Durée : 30 min
```

---

## FICHIERS À MODIFIER (8 fichiers)

### Frontend Web - Routes

```
⚙️ SAE501-Web/flexitrip/src/App.js
   └─ Ajouter route :
   
   <Route path="/check-in-home" element={<CheckInHome />} />
   <Route path="/agent/missions" element={<AgentMissionDashboard />} />
   
   └─ Durée : 5 min
```

### Frontend Web - Components

```
⚙️ SAE501-Web/flexitrip/src/components/SearchEngine/SearchEngine.js
   Ligne ~50 : Ajouter fallback mode démo
   
   AVANT :
   ```javascript
   const response = await axios.get(`${API_BASE_URL}/search/multimodal?...`);
   ```
   
   APRÈS :
   ```javascript
   try {
     const response = await axios.get(
       `${API_BASE_URL}/search/multimodal?...`,
       { timeout: 5000 }
     );
     setResults(response.data);
   } catch (err) {
     const mockData = await import('../../data/mock/reservations.json');
     setResults(mockData.default.results);
     setDemoMode(true);
   }
   ```
   
   └─ Durée : 15 min

⚙️ SAE501-Web/flexitrip/src/components/Tracking/VoyageTracking.js
   Ligne ~84 : Remplacer Google Maps par RouteMapSVG
   
   AVANT :
   ```javascript
   // const map = new google.maps.Map(mapRef.current, ...);
   ```
   
   APRÈS :
   ```javascript
   import { RouteMapSVG } from '../shared/RouteMapSVG';
   // Dans JSX : <RouteMapSVG segments={segments} />
   ```
   
   └─ Durée : 10 min

⚙️ SAE501-Web/flexitrip/src/pages/ChatPage.js
   Ligne ~85 : Remplacer appel API par localStorage
   
   AVANT :
   ```javascript
   const res = await axios.get(`${API_BASE_URL}/chat/messages/...`);
   ```
   
   APRÈS :
   ```javascript
   import { getChatHistory } from '../services/localChatService';
   const messages = getChatHistory(conversationId);
   ```
   
   └─ Durée : 10 min

⚙️ SAE501-Web/flexitrip/src/pages/ChatPage.js - handleSendMessage
   
   AVANT :
   ```javascript
   const msgRes = await axios.post(`${API_BASE_URL}/chat/send`, ...);
   ```
   
   APRÈS :
   ```javascript
   import { sendChatMessage } from '../services/localChatService';
   await sendChatMessage(conversationId, messageText);
   ```
   
   └─ Durée : 5 min

⚙️ SAE501-Web/flexitrip/src/pages/BookingResult.js
   Ligne ~303 : Importer et afficher JourneyTimeline
   
   AJOUTER (après import) :
   ```javascript
   import { JourneyTimeline } from '../components/shared/JourneyTimeline';
   ```
   
   DANS JSX :
   ```javascript
   <JourneyTimeline segments={itinerary.segments} currentLeg={1} />
   ```
   
   └─ Durée : 10 min

⚙️ SAE501-Web/flexitrip/src/pages/BoardingGatePage.js
   Améliorer interface embarquement
   
   AJOUTER :
   - Import JourneyTimeline
   - État boarded (useState)
   - Bouton "Confirmer Embarquement" qui change le state
   - Afficher message de succès + timeline quand boarded = true
   
   └─ Durée : 30 min

⚙️ SAE501-Web/flexitrip/src/components/PriseEnCharge/PriseEnChargeValidation.js
   Ligne ~27 : Ajouter fallback mode démo
   
   Similar à SearchEngine.js, catch erreur + fallback
   
   └─ Durée : 10 min
```

### Frontend Web - Context

```
⚙️ SAE501-Web/flexitrip/src/context/AuthContext.js
   Ligne ~143-158 : Déjà modifié pour Kafka suppression
   
   Vérifier que le TODO est là :
   ```javascript
   // TODO DEMO: Kafka supprimé - Utiliser Supabase Realtime à la place
   const startKafkaConsumer = async () => {
     console.warn('TODO DEMO: Kafka supprimé');
   };
   ```
   
   ✅ DÉJÀ OK - Pas de modification nécessaire
```

---

## FICHIERS SANS MODIFICATION (VÉRIFIER SEULEMENT)

```
✓ SAE501-API_Flexitrip/package.json
  └─ Vérifier : kafkajs, ioredis, redis supprimés ✅
  └─ Vérifier : neo4j-driver présent ✅

✓ SAE501-API_Flexitrip/docker-compose.yml
  └─ Vérifier : redis, kafka, zookeeper supprimés ✅
  └─ Vérifier : neo4j, api, web présents ✅

✓ SAE501-API_Flexitrip/.env.example
  └─ Vérifier : SUPABASE_URL, NEO4J_URL présents ✅

✓ SAE501-Web/flexitrip/package.json
  └─ Vérifier : mongodb supprimé ✅

✓ SAE501-API_Flexitrip/DEMO_SETUP.md
  └─ ✅ Créé et complet

✓ SAE501-API_Flexitrip/ANALYSE_WEB_DEMO.md (ROOT)
  └─ ✅ Créé et complet

✓ SAE501-API_Flexitrip/PLAN_ACTION_EXPRESS_DEMO.md (ROOT)
  └─ ✅ Créé et complet
```

---

## RÉSUMÉ PAR DURÉE

### Fichiers à Créer (Nouveaux Code)
```
Tier 1 (OBLIGATOIRE) :
  ✅ seed-neo4j-demo.js              20 min
  ✅ reservations.json               15 min
  ✅ CheckInHome.js                  60 min
  ✅ AgentMissionDashboard.js         60 min
  ✅ localChatService.js             30 min
  Sous-total : 185 min (3h05)

Tier 2 (RECOMMANDÉ) :
  ✅ JourneyTimeline.jsx             30 min
  ✅ RouteMapSVG.jsx                 30 min
  Sous-total : 60 min (1h)

Tier 3 (OPTIONNEL) :
  ✅ mockTransportService.js         30 min
  ✅ agents.json                     10 min
  ✅ stations.json                   10 min
  Sous-total : 50 min (50 min)
```

### Fichiers à Modifier (Adaptations)
```
Tier 1 (OBLIGATOIRE) :
  ⚙️ SearchEngine.js                 15 min
  ⚙️ ChatPage.js (2 modifications)   15 min
  ⚙️ App.js                          5 min
  Sous-total : 35 min

Tier 2 (RECOMMANDÉ) :
  ⚙️ BookingResult.js                10 min
  ⚙️ VoyageTracking.js               10 min
  ⚙️ BoardingGatePage.js             30 min
  Sous-total : 50 min

Tier 3 (OPTIONNEL) :
  ⚙️ PriseEnChargeValidation.js       10 min
```

---

## TOTAL PAR JOUR

### Lundi 27 Janvier
```
Matin (3h) :
  - seed-neo4j-demo.js (20 min) ← Database
  - reservations.json (15 min) ← Data
  - SearchEngine.js modify (15 min) ← Fallback
  - CheckInHome.js (60 min) ← Core feature
  Total : 110 min

Après-midi (2.5h) :
  - AgentMissionDashboard.js (60 min) ← Core feature
  - ChatPage.js modify (15 min) ← Fix chat
  - localChatService.js (30 min) ← Service
  - BookingResult.js modify (10 min) ← Timeline integration
  - JourneyTimeline.jsx (30 min) ← Component
  Total : 145 min

Evening (1h) :
  - VoyageTracking.js modify (10 min)
  - App.js modify (5 min)
  - Test scénario complet (45 min)
  Total : 60 min

JOUR TOTAL : ~6h réaliste
```

### Mardi 28 Janvier
```
Matin (2h30) :
  - BoardingGatePage.js modify (30 min)
  - RouteMapSVG.jsx (30 min)
  - agents.json (10 min)
  - stations.json (10 min)
  - PriseEnChargeValidation.js modify (10 min)
  - mockTransportService.js (30 min)
  Total : 150 min

Après-midi (2h30) :
  - Full QA scénario (60 min)
  - Bugfix + perf (60 min)
  - Préparation slides démo (30 min)
  Total : 150 min

JOUR TOTAL : ~5h réaliste
```

---

## ORDRE RECOMMANDÉ D'EXÉCUTION

### Lundi 09:00

```
1. seed-neo4j-demo.js          [20 min] ← START
2. reservations.json           [15 min]
3. SearchEngine.js modify      [15 min] ← Permet démo en fallback
4. App.js modify               [5 min]  ← Route CheckInHome
5. CheckInHome.js              [60 min] ← First page NEW

☕ BREAK (30 min)

6. AgentMissionDashboard.js    [60 min] ← Second page NEW
7. ChatPage.js modify          [15 min]
8. localChatService.js         [30 min]

🍽️ LUNCH (60 min)

9. JourneyTimeline.jsx         [30 min]
10. BookingResult.js modify    [10 min]
11. VoyageTracking.js modify   [10 min]
12. Test scenario complet      [45 min]

📊 COMMIT
```

### Mardi 10:00

```
1. RouteMapSVG.jsx             [30 min]
2. BoardingGatePage.js modify  [30 min]
3. mockTransportService.js     [30 min]
4. agents.json + stations.json [20 min]
5. PriseEnChargeValidation.js  [10 min]

☕ BREAK (30 min)

6. Full QA scenario            [60 min] ← Critical
7. Bugfix                      [60 min]

🍽️ LUNCH (60 min)

8. Perf optimization           [30 min]
9. Slides démo                 [30 min]
10. Final checks               [30 min]

📊 COMMIT + GIT PUSH
```

---

## COMMANDES GIT

```bash
# Lundi 09:00
git checkout -b feat/demo-wednesday
git pull

# Lundi 18:00
git add .
git commit -m "feat(demo): add neo4j seed, check-in, agent dashboard, chat, timeline"
# NE PAS PUSH

# Mardi 18:00
git add .
git commit -m "fix(demo): add boarding, route map, full qa, final touches"
git push origin feat/demo-wednesday

# Créer PR (optionnel)
# Merge vers main après démo validée
```

---

## RESSOURCES REQUISES

- 📱 Un navigateur (Chrome, Firefox)
- 🖥️ VS Code avec extensions ES6, React
- 🗄️ Neo4j running (docker-compose up)
- 🚀 API running sur localhost:17777
- ⚡ node_modules installés (npm install déjà fait)

---

## VALIDATION CHECKLIST

Avant de dire "c'est fini" :

```
✓ Tous fichiers créés sans erreur syntax
✓ Tous imports dans App.js
✓ npm start lance sans erreur
✓ Scénario complet testable :
  ✓ Login
  ✓ Search (API ou demo fallback)
  ✓ Booking
  ✓ CheckInHome
  ✓ Tracking + Timeline visible
  ✓ Agent Dashboard accessible
  ✓ Chat fonctionne
  ✓ QR codes générés
  ✓ Boarding gate fonctionnel
✓ Pas d'erreur console (warnings OK)
✓ Responsive mobile testée
✓ Badge "DEMO MODE" visible
✓ Performance < 2s page load
✓ Git histoire clean
```

---

**PLAN VALIDÉ ✅**  
**À COMMENCER LUNDI 09:00**  
**DÉMO MERCREDI 14:00**
