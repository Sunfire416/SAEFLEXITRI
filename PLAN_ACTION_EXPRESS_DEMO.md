# ⚡ PLAN D'ACTION EXPRESS - 48h AVANT DÉMO

**Objectif :** Démonstrateur fonctionnel jeudi 29 janvier  
**Timing :** Lundi 27 + Mardi 28 (10h de travail effectif)  
**Équipe :** 1 dev (toi)  
**Budget Scope :** Minimal viable, démo-ready, pas production

---

## 🎯 PRIORITÉ 1 : LE CHEMIN CRITIQUE (5h)

Ces 5 tâches DOIVENT être complétées pour que la démo fonctionne.

### T1.1 : Seed Data Neo4j (45 min)

**Fichier :** `SAE501-API_Flexitrip/scripts/seed-neo4j-demo.js`

```javascript
const neo4j = require('neo4j-driver');

const stations = [
  { name: 'Paris Gare de Lyon', city: 'Paris', lat: 48.8433, lng: 2.3737, type: 'TRAIN' },
  { name: 'Lyon Part-Dieu', city: 'Lyon', lat: 45.7640, lng: 4.8357, type: 'TRAIN' },
  { name: 'Lyon Gare Routière', city: 'Lyon', lat: 45.7600, lng: 4.8300, type: 'BUS' },
  { name: 'Marseille Gare', city: 'Marseille', lat: 43.3029, lng: 5.3808, type: 'TRAIN' },
  { name: 'Marseille Provence', city: 'Marseille', lat: 43.4397, lng: 5.2152, type: 'FLIGHT' }
];

const routes = [
  { from: 'Paris Gare de Lyon', to: 'Lyon Part-Dieu', transport: 'TRAIN', duration: 120, price: 50 },
  { from: 'Lyon Part-Dieu', to: 'Lyon Gare Routière', transport: 'WALK', duration: 45, price: 0 },
  { from: 'Lyon Gare Routière', to: 'Marseille Gare', transport: 'BUS', duration: 180, price: 25 },
  { from: 'Marseille Gare', to: 'Marseille Provence', transport: 'TRAIN', duration: 30, price: 20 },
];

// Éxecuter : node scripts/seed-neo4j-demo.js
```

**Action :** Copier-coller + `npm run seed:neo4j` (ajouter dans package.json)

---

### T1.2 : Mock Reservations.json (45 min)

**Fichier :** `SAE501-Web/flexitrip/src/data/mock/reservations.json`

```json
{
  "results": {
    "total": 3,
    "itineraries": [
      {
        "id": "itinerary-1",
        "departure": "Paris Gare de Lyon",
        "destination": "Marseille Gare",
        "date": "2026-01-29",
        "total_duration": 330,
        "total_price": 95,
        "segments": [
          {
            "id": "seg-1",
            "order": 1,
            "transport": "TRAIN",
            "departure_time": "08:00",
            "arrival_time": "10:00",
            "duration": 120,
            "operator": "SNCF",
            "reference": "SNCF-001",
            "price": 50
          },
          {
            "id": "seg-2",
            "order": 2,
            "transport": "BUS",
            "departure_time": "11:00",
            "arrival_time": "14:30",
            "duration": 210,
            "operator": "FlixBus",
            "reference": "FLIXBUS-001",
            "price": 45
          }
        ],
        "accessibility_features": ["wheelchair_accessible", "priority_boarding"]
      },
      {
        "id": "itinerary-2",
        "departure": "Paris",
        "destination": "Lyon",
        "date": "2026-01-29",
        "total_duration": 120,
        "total_price": 50,
        "segments": [
          {
            "id": "seg-3",
            "order": 1,
            "transport": "TRAIN",
            "departure_time": "09:00",
            "arrival_time": "11:00",
            "duration": 120,
            "operator": "SNCF",
            "reference": "SNCF-002",
            "price": 50
          }
        ]
      }
    ]
  }
}
```

---

### T1.3 : Adapter SearchEngine pour mode démo (1h)

**Fichier :** Modifier `SAE501-Web/flexitrip/src/components/SearchEngine/SearchEngine.js`

```javascript
// Autour de handleSearch()

const handleSearch = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  setDemoMode(false);

  try {
    // 1. Essayer API réelle
    const response = await axios.get(
      `${API_BASE_URL}/search/multimodal?...`,
      { timeout: 5000 }  // Timeout court pour démo
    );
    setResults(response.data);
    
  } catch (err) {
    console.warn('API indisponible, chargeant données démo...');
    
    // 2. Fallback mode démo
    try {
      const mockData = await import('../../data/mock/reservations.json');
      setResults(mockData.default.results);
      setDemoMode(true);  // Badge visible
    } catch (e) {
      setError('Erreur: données démo non trouvées');
    }
  } finally {
    setLoading(false);
  }
};

// Dans le JSX
{demoMode && (
  <div style={{ backgroundColor: '#fff3cd', padding: '10px', margin: '10px 0' }}>
    ⚠️ MODE DÉMO - Données locales chargées
  </div>
)}
```

---

### T1.4 : Créer CheckInHome page (1.5h)

**Fichier :** `SAE501-Web/flexitrip/src/pages/CheckInHome.js`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckInHome = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    cni_photo: null,
    mobility_type: '',
    assistance_needed: false,
    contact_number: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/voyages/{id}/check-in
    navigate('/trip-tracking', { state: { checkInComplete: true } });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>🏠 Pré Check-in Départ</h1>
      <p>Confirmez vos informations de départ</p>
      
      <form onSubmit={handleSubmit}>
        <label>Adresse de départ</label>
        <input
          type="text"
          placeholder="123 Rue de Paris, 75000 Paris"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />

        <label>Type de mobilité</label>
        <select
          value={formData.mobility_type}
          onChange={(e) => setFormData({ ...formData, mobility_type: e.target.value })}
          required
        >
          <option>-- Sélectionner --</option>
          <option value="wheelchair">Fauteuil roulant électrique</option>
          <option value="wheelchair-manual">Fauteuil roulant manuel</option>
          <option value="crutches">Béquilles</option>
          <option value="blind">Malvoyant/Aveugle</option>
          <option value="none">Aucun besoin spécifique</option>
        </select>

        <label>Upload CNI/Passeport</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({ ...formData, cni_photo: e.target.files[0] })}
        />

        <label>
          <input
            type="checkbox"
            checked={formData.assistance_needed}
            onChange={(e) => setFormData({ ...formData, assistance_needed: e.target.checked })}
          />
          J'ai besoin d'une assistance
        </label>

        <label>Téléphone de contact</label>
        <input
          type="tel"
          placeholder="+33 6 00 00 00 00"
          value={formData.contact_number}
          onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
          required
        />

        <button type="submit" style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
          ✅ Confirmer le départ
        </button>
      </form>
    </div>
  );
};

export default CheckInHome;
```

**Ajouter dans App.js :**
```javascript
import CheckInHome from './pages/CheckInHome';
// Dans <Routes>:
<Route path="/check-in-home" element={<CheckInHome />} />
```

---

### T1.5 : Créer AgentMissionDashboard (1h)

**Fichier :** `SAE501-Web/flexitrip/src/pages/AgentMissionDashboard.js`

```javascript
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const AgentMissionDashboard = () => {
  const [missions, setMissions] = useState([
    {
      id: 'mission-1',
      pmr_name: 'Pauline Dupont',
      journey: 'Paris → Lyon → Marseille',
      current_leg: 2,
      pmr_phone: '+33 6 12 34 56 78',
      status: 'IN_PROGRESS',
      pickup_time: '11:00',
      eta_station: '14:00'
    },
    {
      id: 'mission-2',
      pmr_name: 'Jean Martin',
      journey: 'Paris → Nice',
      current_leg: 1,
      pmr_phone: '+33 6 87 65 43 21',
      status: 'AWAITING_PICKUP',
      pickup_time: '08:00',
      eta_station: '10:00'
    }
  ]);

  const [selectedMission, setSelectedMission] = useState(missions[0]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      {/* Liste missions */}
      <div>
        <h2>📋 Mes Missions (Aujourd'hui)</h2>
        {missions.map(mission => (
          <div
            key={mission.id}
            onClick={() => setSelectedMission(mission)}
            style={{
              padding: '15px',
              border: selectedMission?.id === mission.id ? '2px solid #2563eb' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
              backgroundColor: selectedMission?.id === mission.id ? '#eff6ff' : '#f9fafb'
            }}
          >
            <h4>{mission.pmr_name}</h4>
            <p>📍 {mission.journey}</p>
            <p>⏰ Départ {mission.pickup_time} → Arrivée {mission.eta_station}</p>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: mission.status === 'IN_PROGRESS' ? '#dcfce7' : '#fef3c7'
            }}>
              {mission.status === 'IN_PROGRESS' ? '🔄 En cours' : '⏳ En attente'}
            </span>
          </div>
        ))}
      </div>

      {/* Détail mission + QR */}
      {selectedMission && (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>{selectedMission.pmr_name}</h3>
          <p><strong>Trajet :</strong> {selectedMission.journey}</p>
          <p><strong>Étape :</strong> {selectedMission.current_leg}/4</p>
          <p><strong>Téléphone :</strong> {selectedMission.pmr_phone}</p>

          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <h4>📱 QR Code Mission</h4>
            <QRCodeSVG
              value={JSON.stringify({
                mission_id: selectedMission.id,
                pmr_id: 'pmr-1',
                leg: selectedMission.current_leg
              })}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            ✅ PMR Embarqué
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentMissionDashboard;
```

---

## 🟡 PRIORITÉ 2 : AMÉLIORATION (3h)

Ces améliorations rendent la démo plus polished.

### T2.1 : Créer composant JourneyTimeline (1h)

**Fichier :** `SAE501-Web/flexitrip/src/components/shared/JourneyTimeline.jsx`

```javascript
import React from 'react';

export const JourneyTimeline = ({ segments, currentLeg }) => {
  return (
    <div style={{ position: 'relative', padding: '20px 0' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ display: 'flex', marginBottom: '20px' }}>
          {/* Cercle étape */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: i < currentLeg ? '#10b981' : i === currentLeg ? '#2563eb' : '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: i <= currentLeg ? 'white' : '#666',
            fontWeight: 'bold',
            marginRight: '15px',
            flexShrink: 0
          }}>
            {i + 1}
          </div>

          {/* Détail étape */}
          <div>
            <h4>{seg.transport} : {seg.departure} → {seg.destination}</h4>
            <p>{seg.departure_time} - {seg.arrival_time} ({seg.duration} min)</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              {i < currentLeg && '✅ Complété'}
              {i === currentLeg && '🔄 En cours'}
              {i > currentLeg && '⏳ Upcoming'}
            </p>
          </div>

          {/* Ligne verticale */}
          {i < segments.length - 1 && (
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '40px',
              width: '2px',
              height: '20px',
              backgroundColor: i < currentLeg ? '#10b981' : '#e5e7eb'
            }} />
          )}
        </div>
      ))}
    </div>
  );
};
```

### T2.2 : Améliorer BoardingGatePage (1h)

```javascript
// SAE501-Web/flexitrip/src/pages/BoardingGatePage.js

const BoardingGatePage = () => {
  const [boarded, setBoarded] = useState(false);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto' }}>
      <h1>✈️ Porte d'Embarquement</h1>

      {!boarded ? (
        <div style={{ border: '2px solid #2563eb', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Prêt à embarquer ?</h3>
          <p>Veuillez scanner ou appuyer sur le bouton ci-dessous</p>
          <button
            onClick={() => setBoarded(true)}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ✅ Confirmer Embarquement
          </button>
        </div>
      ) : (
        <div style={{
          border: '2px solid #10b981',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: '#f0fdf4'
        }}>
          <h2 style={{ color: '#10b981' }}>✅ Embarquement Confirmé !</h2>
          <p>Bon voyage à toi Pauline ! 🎉</p>
          <JourneyTimeline segments={segments} currentLeg={4} />
        </div>
      )}
    </div>
  );
};
```

### T2.3 : Implémenter Chat localStorage (1h)

```javascript
// SAE501-Web/flexitrip/src/services/localChatService.js

const AGENT_RESPONSES = [
  'D\'accord, j\'arrive !',
  'Sans problème, 5 minutes.',
  'Confirmé, j\'suis en route.',
  'Pas de souci, j\'peux aider.',
  'C\'est enregistré !'
];

export const sendChatMessage = async (conversationId, message) => {
  const msgs = JSON.parse(localStorage.getItem(`chat_${conversationId}`) || '[]');
  
  msgs.push({
    id: Date.now(),
    text: message,
    sender: 'user',
    timestamp: new Date().toISOString()
  });

  setTimeout(() => {
    const agentReply = AGENT_RESPONSES[Math.floor(Math.random() * AGENT_RESPONSES.length)];
    msgs.push({
      id: Date.now() + 1,
      text: agentReply,
      sender: 'agent',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(`chat_${conversationId}`, JSON.stringify(msgs));
  }, 1000);

  localStorage.setItem(`chat_${conversationId}`, JSON.stringify(msgs));
  return msgs;
};

export const getChatHistory = (conversationId) => {
  return JSON.parse(localStorage.getItem(`chat_${conversationId}`) || '[]');
};
```

---

## 🟢 PRIORITÉ 3 : OPTIONNEL (2h)

À faire si du temps reste.

### T3.1 : Créer RouteMap SVG simple (1h)

```javascript
// SAE501-Web/flexitrip/src/components/shared/RouteMapSVG.jsx

export const RouteMapSVG = ({ segments }) => {
  const stationPositions = {
    'Paris Gare de Lyon': { x: 100, y: 50 },
    'Lyon Part-Dieu': { x: 300, y: 150 },
    'Lyon Gare Routière': { x: 320, y: 150 },
    'Marseille Gare': { x: 500, y: 300 },
    'Marseille Provence': { x: 530, y: 320 }
  };

  const getTransportColor = (transport) => {
    const colors = { TRAIN: '#2563eb', BUS: '#f59e0b', FLIGHT: '#ef4444' };
    return colors[transport] || '#666';
  };

  return (
    <svg width="600" height="400" style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
      {/* Lignes routes */}
      {segments.map((seg, i) => {
        const from = stationPositions[seg.departure];
        const to = stationPositions[seg.destination];
        if (!from || !to) return null;

        return (
          <line
            key={`line-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={getTransportColor(seg.transport)}
            strokeWidth="3"
          />
        );
      })}

      {/* Stations */}
      {Object.entries(stationPositions).map(([name, { x, y }]) => (
        <g key={name}>
          <circle cx={x} cy={y} r="8" fill="#2563eb" />
          <text x={x} y={y + 25} fontSize="12" textAnchor="middle">
            {name.split(' ')[0]}
          </text>
        </g>
      ))}
    </svg>
  );
};
```

### T3.2 : Améliorer CSS (1h)

Ajouter animations, responsive, dark mode, etc.

---

## 📋 EXÉCUTION PAR JOUR

### **LUNDI 27 (9:00-18:00)**

```
09:00-09:45  → T1.1: Seed Neo4j
09:45-10:30  → T1.2: reservations.json
10:30-11:30  → T1.3: SearchEngine fallback
11:30-13:00  → DÉJEUNER
13:00-14:30  → T1.4: CheckInHome page
14:30-15:30  → T1.5: AgentMissionDashboard
15:30-16:30  → T2.1: JourneyTimeline
16:30-17:30  → T2.2: BoardingGatePage
17:30-18:00  → Commit + test scénario complet
```

### **MARDI 28 (10:00-18:00)**

```
10:00-11:00  → T2.3: Chat localStorage
11:00-12:00  → T3.1: RouteMapSVG
12:00-13:00  → DÉJEUNER
13:00-15:00  → QA full scenario
15:00-17:00  → Bug fixes + perf
17:00-18:00  → Préparation démo (slides, démo script, backups)
```

---

## ✅ CHECKLIST FINAL

- [ ] Neo4j a 5 stations
- [ ] SearchEngine marche en mode démo
- [ ] CheckInHome créé et fonctionnel
- [ ] AgentMissionDashboard affiche missions + QR
- [ ] Chat fonctionne (localStorage)
- [ ] Scénario complet testable (login → booking → tracking)
- [ ] Pas d'erreurs console
- [ ] Responsive mobile
- [ ] Badge "DEMO MODE" visible partout
- [ ] QR codes affichés en 2+ endroits
- [ ] Timeline visible à chaque étape

---

## 🎯 COMMANDES GIT

```bash
git checkout -b feat/demo-wednesday

# Lundi fin de journée
git add .
git commit -m "feat(demo): add neo4j seed, check-in, agent dashboard, fallback search"

# Mardi fin de journée
git commit -m "fix(demo): chat, boarding, timeline, qa bugfixes"

git push origin feat/demo-wednesday
```

---

**TIME ESTIMATE :** 10 heures de travail  
**RISK :** FAIBLE (tout est scope-limité, pas de dépendances externes)  
**SUCCESS RATE :** 95% si on suit le plan  

🚀 **GO !**
